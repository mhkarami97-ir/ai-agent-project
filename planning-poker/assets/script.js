(() => {
'use strict';
const P = window.PokerCore;
const $ = id => document.getElementById(id);
const DB_NAME = 'PlanningPokerDB', DB_VERSION = 2, STORE = 'rooms', SESSION_KEY = 'pp.session';
let T = {}, lang = localStorage.getItem('lang') || localStorage.getItem('language') || 'fa';
if (lang !== 'en') lang = 'fa';
const st = { me: null, room: null, sig: '', storyDirty: false, hbTimer: null, pollTimer: null, toastTimer: null, bc: null };

const lookup = (o, path) => { const v = path.split('.').reduce((x, k) => (x && typeof x === 'object' ? x[k] : undefined), o); return typeof v === 'string' ? v : undefined; };
const t = (k, v) => {
  let s = lookup(T[lang], k) ?? lookup(T.fa, k) ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b);
  return s;
};
const locale = () => lang === 'fa' ? 'fa-IR' : 'en-US';
const num = n => new Intl.NumberFormat(locale(), { maximumFractionDigits: 1 }).format(n);
const cardLabel = v => (/^\d+$/.test(v) ? num(Number(v)) : v);

function applyTheme(th) {
  const v = th === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', v); document.body.setAttribute('data-theme', v);
}
function applyI18n() {
  const r = document.documentElement; r.lang = lang; r.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(e => { e.placeholder = t(e.dataset.i18nPlaceholder); });
  document.querySelectorAll('[data-i18n-title]').forEach(e => { const s = t(e.dataset.i18nTitle); e.title = s; e.setAttribute('aria-label', s); });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
  document.title = t('app.title');
  $('roomIdDisplay').dir = 'ltr';
}
function toast(msg, type) {
  const el = $('toast'); el.textContent = msg; el.className = 'toast show ' + (type || '');
  clearTimeout(st.toastTimer); st.toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
function askConfirm(msg) {
  return new Promise(res => {
    const d = $('confirmDialog'), f = d.querySelector('form'); $('confirmMessage').textContent = msg;
    let done = false;
    const fin = v => { if (done) return; done = true; f.removeEventListener('submit', onSub); d.removeEventListener('close', onClose); d.removeEventListener('click', onBg); d.querySelector('[data-close]').removeEventListener('click', onNo); res(v); };
    const onSub = e => { e.preventDefault(); fin(true); d.close(); };
    const onNo = () => d.close(), onClose = () => fin(false), onBg = e => { if (e.target === d) d.close(); };
    f.addEventListener('submit', onSub); d.addEventListener('close', onClose); d.addEventListener('click', onBg); d.querySelector('[data-close]').addEventListener('click', onNo);
    d.showModal();
  });
}

/* ---------- storage: one atomic document per room ---------- */
const store = {
  db: null, mem: new Map(), volatile: false,
  async init() {
    try {
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open(DB_NAME, DB_VERSION);
        r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked')); r.onsuccess = () => res(r.result);
        r.onupgradeneeded = e => {
          const d = e.target.result;
          ['participants', 'votes'].forEach(n => { if (d.objectStoreNames.contains(n)) d.deleteObjectStore(n); });
          if (d.objectStoreNames.contains(STORE) && e.oldVersion < 2) d.deleteObjectStore(STORE);
          if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' });
        };
      });
    } catch (e) { console.error('IndexedDB unavailable', e); this.db = null; this.volatile = true; }
    await this.cleanup();
  },
  _tx(mode, fn) {
    return new Promise((res, rej) => { const tx = this.db.transaction(STORE, mode); let out; out = fn(tx.objectStore(STORE), v => { out = v; }); tx.oncomplete = () => res(typeof out === 'object' && out && 'result' in out && out instanceof IDBRequest ? out.result : out); tx.onerror = tx.onabort = () => rej(tx.error); });
  },
  async get(id) {
    const raw = this.db ? await new Promise((res, rej) => { const r = this.db.transaction(STORE).objectStore(STORE).get(id); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }) : this.mem.get(id);
    return P.normalizeRoom(raw, Date.now());
  },
  async create(room) {
    if (!this.db) { if (this.mem.has(room.id)) return false; this.mem.set(room.id, JSON.parse(JSON.stringify(room))); return true; }
    return new Promise((res, rej) => { const tx = this.db.transaction(STORE, 'readwrite'); const r = tx.objectStore(STORE).add(room); let ok = true; r.onerror = e => { ok = false; e.preventDefault(); }; tx.oncomplete = () => res(ok); tx.onerror = tx.onabort = () => rej(tx.error); });
  },
  mutate(id, fn) {
    const now = Date.now();
    const apply = raw => {
      const room = P.normalizeRoom(raw, now); if (!room) return { out: { ok: false, error: 'not_found' } };
      const r = fn(room, now) || { ok: true }; return { out: { ...r, room }, write: r.ok };
    };
    if (!this.db) return Promise.resolve().then(() => {
      const a = apply(this.mem.get(id));
      if (a.write) { a.out.room.updatedAt = now; if (a.out.empty) this.mem.delete(id); else this.mem.set(id, JSON.parse(JSON.stringify(a.out.room))); }
      return a.out;
    });
    return new Promise((res, rej) => {
      const tx = this.db.transaction(STORE, 'readwrite'), s = tx.objectStore(STORE); let out;
      const g = s.get(id);
      g.onsuccess = () => { const a = apply(g.result); out = a.out; if (a.write) { a.out.room.updatedAt = now; if (a.out.empty) s.delete(id); else s.put(a.out.room); } };
      tx.oncomplete = () => res(out); tx.onerror = tx.onabort = () => rej(tx.error);
    });
  },
  async cleanup() {
    const now = Date.now();
    if (!this.db) return;
    const all = await new Promise((res, rej) => { const r = this.db.transaction(STORE).objectStore(STORE).getAll(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }).catch(() => []);
    const ids = P.staleRoomIds(all, now);
    if (ids.length) await new Promise(res => { const tx = this.db.transaction(STORE, 'readwrite'); ids.forEach(i => tx.objectStore(STORE).delete(i)); tx.oncomplete = res; tx.onerror = res; });
  }
};

/* ---------- session & sync ---------- */
const getSession = () => { try { const s = JSON.parse(sessionStorage.getItem(SESSION_KEY)); return s && typeof s.userId === 'string' ? s : null; } catch { return null; } };
const setSession = s => { try { s ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)) : sessionStorage.removeItem(SESSION_KEY); } catch {} };
const newUserId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
function broadcast() { try { st.bc && st.bc.postMessage({ roomId: st.me && st.me.roomId }); } catch {} }

const ERR = { not_found: 'toast.roomNotFound', name_taken: 'toast.nameTaken', full: 'toast.roomFull', name: 'toast.nameRequired', revealed: 'toast.alreadyRevealed', not_host: 'toast.notHost', no_votes: 'toast.noVotes', host_active: 'toast.hostActive', not_member: 'toast.notMember', invalid: 'toast.error' };
const errKey = e => ERR[e] || 'toast.error';

async function act(fn, okMsg) {
  if (!st.me) return null;
  let r; try { r = await store.mutate(st.me.roomId, fn); } catch (e) { console.error(e); toast(t('toast.error'), 'error'); return null; }
  if (!r.ok) { toast(t(errKey(r.error)), 'error'); if (r.error === 'not_found' || r.error === 'not_member') exitRoom(false); return r; }
  if (okMsg) toast(t(okMsg), 'success');
  broadcast(); apply(r.room); return r;
}

/* ---------- screens ---------- */
function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
const showHome = () => showScreen('homeScreen');
function showError(id, key) { const e = $(id); e.textContent = t(key); e.hidden = false; }

async function onCreate(ev) {
  ev.preventDefault(); $('createError').hidden = true;
  const name = P.clean($('hostName').value, 30), room = P.clean($('roomName').value, 60);
  if (!name) return showError('createError', 'toast.nameRequired');
  if (!room) return showError('createError', 'toast.roomNameRequired');
  const userId = newUserId(); let doc = null;
  for (let i = 0; i < 8 && !doc; i++) {
    const cand = P.createRoom({ id: P.genRoomId(), name: room, hostId: userId, hostName: name, deck: $('deckSelect').value }, Date.now());
    if (await store.create(cand).catch(() => false)) doc = cand;
  }
  if (!doc) return showError('createError', 'toast.error');
  enterRoom({ id: userId, name, roomId: doc.id }, doc); toast(t('toast.roomCreated'), 'success');
}
async function onJoin(ev) {
  ev.preventDefault(); $('joinError').hidden = true;
  const name = P.clean($('participantName').value, 30), code = P.normalizeCode($('roomId').value);
  if (!name) return showError('joinError', 'toast.nameRequired');
  if (code.length !== 6) return showError('joinError', 'toast.roomNotFound');
  const prev = getSession(), userId = prev && prev.roomId === code ? prev.userId : newUserId();
  let r; try { r = await store.mutate(code, (room, now) => P.join(room, userId, name, now)); } catch { return showError('joinError', 'toast.error'); }
  if (!r.ok) return showError('joinError', errKey(r.error));
  enterRoom({ id: userId, name, roomId: code }, r.room); broadcast(); toast(t('toast.joinedRoom'), 'success');
}
function enterRoom(me, room) {
  st.me = me; setSession({ userId: me.id, roomId: me.roomId, name: me.name }); st.sig = ''; st.storyDirty = false;
  $('storyInput').value = '';
  showScreen('roomScreen'); apply(room); startTimers();
}
function exitRoom(announce) {
  stopTimers(); st.me = null; st.room = null; st.sig = ''; setSession(null);
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  showHome(); if (announce) toast(t('toast.leftRoom'), 'success');
}
async function leave() {
  if (!await askConfirm(t('room.leaveConfirm'))) return;
  const me = st.me; if (!me) return;
  try { await store.mutate(me.roomId, (room, now) => P.leave(room, me.id, now)); broadcast(); } catch (e) { console.error(e); }
  exitRoom(true);
}

/* ---------- render room ---------- */
function signature(room, now) {
  return JSON.stringify([room.name, room.deck, room.hostId, room.story, room.revealed, room.round, room.votes, room.history.length,
    Object.keys(room.participants).sort().map(i => [i, room.participants[i].name, P.isActive(room.participants[i], now)])]);
}
function apply(room) {
  if (!room || !st.me) return;
  if (!Object.prototype.hasOwnProperty.call(room.participants, st.me.id)) { toast(t('toast.removed'), 'error'); return exitRoom(false); }
  const now = Date.now(), sig = signature(room, now);
  st.room = room; if (sig === st.sig) return; st.sig = sig; render();
}
function render() {
  const room = st.room, me = st.me; if (!room || !me) return;
  const now = Date.now(), isHost = room.hostId === me.id;
  $('roomTitle').textContent = room.name; $('roomIdDisplay').textContent = room.id;
  $('hostControls').hidden = !isHost;
  $('updateStoryBtn').hidden = !isHost;
  const input = $('storyInput'); input.disabled = !isHost;
  if (!isHost || !st.storyDirty) { if (document.activeElement !== input || !isHost) input.value = room.story; }
  $('revealBtn').disabled = room.revealed; 
  const host = room.participants[room.hostId];
  $('hostOfflineNotice').hidden = isHost || !host || P.isActive(host, now);

  const pr = P.progress(room, now);
  $('voteCount').textContent = num(pr.voted) + '/' + num(pr.total);
  $('votingLabel').textContent = t(room.revealed ? 'room.votesRevealedLabel' : 'room.votingInProgress');

  const box = $('cardsContainer'); box.replaceChildren();
  const mine = room.votes[me.id];
  P.DECKS[room.deck].forEach(v => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'card' + (mine === v ? ' selected' : '');
    b.textContent = cardLabel(v); b.dataset.value = v; b.disabled = room.revealed; b.setAttribute('aria-pressed', String(mine === v));
    b.setAttribute('aria-label', t('room.cardLabel', { v: cardLabel(v) }));
    b.addEventListener('click', () => vote(v)); box.append(b);
  });

  const list = $('participantsList'); list.replaceChildren();
  Object.keys(room.participants).sort((a, b) => room.participants[a].joinedAt - room.participants[b].joinedAt).forEach(id => {
    const p = room.participants[id], active = P.isActive(p, now), has = Object.prototype.hasOwnProperty.call(room.votes, id);
    const card = document.createElement('div'); card.className = 'participant-card' + (active ? '' : ' offline');
    const info = document.createElement('div'); info.className = 'participant-info';
    const nm = document.createElement('div'); nm.className = 'participant-name'; nm.textContent = p.name + (id === me.id ? ' ' + t('room.you') : '');
    const role = document.createElement('div'); role.className = 'participant-role'; role.textContent = (id === room.hostId ? t('room.host') : t('room.participant')) + (active ? '' : ' · ' + t('room.offline'));
    info.append(nm, role);
    const status = document.createElement('div'); status.className = 'participant-status';
    if (room.revealed) { status.classList.add(has ? 'revealed' : 'not-voted'); status.textContent = has ? cardLabel(room.votes[id]) : '—'; status.setAttribute('aria-label', has ? t('room.votedWith', { v: cardLabel(room.votes[id]) }) : t('room.notVoted')); }
    else if (has) { status.classList.add('voted'); status.textContent = '✓'; status.setAttribute('aria-label', t('room.voted')); }
    else { status.classList.add('not-voted'); status.textContent = '○'; status.setAttribute('aria-label', t('room.notVoted')); }
    card.append(info, status); list.append(card);
  });

  renderResults(room); renderHistory(room);
}
function row(label, value) {
  const r = document.createElement('div'); r.className = 'stat-row';
  const a = document.createElement('span'); a.className = 'stat-label'; a.textContent = label;
  const b = document.createElement('span'); b.className = 'stat-value'; b.textContent = value; r.append(a, b); return r;
}
function renderResults(room) {
  $('resultsSection').hidden = !room.revealed;
  if (!room.revealed) return;
  const rc = $('resultsContent'); rc.replaceChildren();
  P.groups(room).forEach(g => {
    const c = document.createElement('div'); c.className = 'result-card';
    const v = document.createElement('div'); v.className = 'result-vote'; v.textContent = cardLabel(g.value);
    const n = document.createElement('div'); n.className = 'result-names'; n.textContent = g.names.join('، ');
    c.append(v, n); rc.append(c);
  });
  const s = P.stats(room), sc = $('statisticsContent'); sc.replaceChildren();
  if (s.average !== null) { sc.append(row(t('room.average'), num(s.average)), row(t('room.median'), num(s.median)), row(t('room.range'), num(s.min) + ' – ' + num(s.max))); }
  sc.append(row(t('room.mode'), s.mode.map(cardLabel).join('، ') || '—'), row(t('room.consensus'), t(s.consensus ? 'room.yes' : 'room.no')));
}
function renderHistory(room) {
  $('historySection').hidden = !room.history.length;
  const ol = $('historyList'); ol.replaceChildren();
  room.history.slice().reverse().forEach(h => {
    const li = document.createElement('li');
    const parts = [h.average !== null ? t('room.average') + ' ' + num(h.average) : null, h.median !== null ? t('room.median') + ' ' + num(h.median) : null, h.mode.length ? t('room.mode') + ' ' + h.mode.map(cardLabel).join('، ') : null, h.consensus ? '✓ ' + t('room.consensus') : null].filter(Boolean);
    const title = document.createElement('strong'); title.textContent = t('room.roundN', { n: num(h.round) }) + ' — ' + (h.story || t('room.noStory'));
    const sub = document.createElement('div'); sub.className = 'history-sub'; sub.textContent = parts.join(' · ');
    li.append(title, sub); ol.append(li);
  });
}

/* ---------- actions ---------- */
const vote = v => act((room, now) => P.castVote(room, st.me.id, v, now), 'toast.voteCast');
const updateStory = () => act(room => P.setStory(room, st.me.id, $('storyInput').value), 'toast.storyUpdated').then(r => { if (r && r.ok) st.storyDirty = false; });
const reveal = () => act(room => P.reveal(room, st.me.id), 'toast.votesRevealed');
const claimHost = () => act((room, now) => P.claimHost(room, st.me.id, now), 'toast.hostClaimed');
async function revote() { if (await askConfirm(t('room.revoteConfirm'))) act(room => P.revote(room, st.me.id), 'toast.votingReset'); }
async function nextStory() { if (await askConfirm(t('room.nextConfirm'))) { st.storyDirty = false; act((room, now) => P.nextRound(room, st.me.id, now), 'toast.nextStory'); } }
async function copy(text) { try { await navigator.clipboard.writeText(text); toast(t('toast.copied'), 'success'); } catch { toast(t('toast.copyFailed'), 'error'); } }

/* ---------- timers ---------- */
async function refresh() {
  if (!st.me) return;
  let room; try { room = await store.get(st.me.roomId); } catch { return; }
  if (!room) { toast(t('toast.roomClosed'), 'error'); return exitRoom(false); }
  apply(room);
}
function startTimers() {
  stopTimers();
  const beat = () => { if (st.me) store.mutate(st.me.roomId, (room, now) => P.heartbeat(room, st.me.id, now)).then(r => { if (r && !r.ok && (r.error === 'not_found' || r.error === 'not_member')) refresh(); }).catch(() => {}); };
  st.hbTimer = setInterval(beat, 5000); st.pollTimer = setInterval(refresh, 3000);
}
function stopTimers() { clearInterval(st.hbTimer); clearInterval(st.pollTimer); st.hbTimer = st.pollTimer = null; }

function bind() {
  $('createRoomBtn').addEventListener('click', () => { $('createError').hidden = true; showScreen('createRoomScreen'); $('hostName').focus(); });
  $('joinRoomBtn').addEventListener('click', () => { $('joinError').hidden = true; showScreen('joinRoomScreen'); $('participantName').focus(); });
  $('cancelCreate').addEventListener('click', showHome); $('cancelJoin').addEventListener('click', showHome);
  $('createRoomForm').addEventListener('submit', onCreate); $('joinRoomForm').addEventListener('submit', onJoin);
  $('leaveRoomBtn').addEventListener('click', leave);
  $('copyRoomId').addEventListener('click', () => st.room && copy(st.room.id));
  $('copyRoomLink').addEventListener('click', () => st.room && copy(location.href.split('#')[0] + '#join=' + st.room.id));
  $('updateStoryBtn').addEventListener('click', updateStory);
  $('storyInput').addEventListener('input', () => { st.storyDirty = true; });
  $('storyInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); updateStory(); } });
  $('revealBtn').addEventListener('click', reveal); $('revoteBtn').addEventListener('click', revote); $('nextBtn').addEventListener('click', nextStory);
  $('claimHostBtn').addEventListener('click', claimHost);
  $('roomId').addEventListener('input', e => { e.target.value = e.target.value.toUpperCase(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && st.me) refresh(); });
  window.addEventListener('themeChanged', e => applyTheme(e.detail));
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); st.sig = ''; if (st.room) { render(); } });
  if ('BroadcastChannel' in window) { st.bc = new BroadcastChannel('planning-poker'); st.bc.onmessage = e => { if (st.me && e.data && e.data.roomId === st.me.roomId) refresh(); }; }
}

async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n(); bind();
  await store.init();
  $('volatileNotice').hidden = !store.volatile;
  const m = /^#join=([A-Za-z0-9]{6})$/.exec(location.hash);
  const s = getSession();
  if (s && s.roomId) {
    const room = await store.get(s.roomId).catch(() => null);
    if (room && Object.prototype.hasOwnProperty.call(room.participants, s.userId)) {
      const r = await store.mutate(s.roomId, (rm, now) => P.heartbeat(rm, s.userId, now)).catch(() => null);
      enterRoom({ id: s.userId, name: room.participants[s.userId].name, roomId: s.roomId }, (r && r.room) || room); return;
    }
    setSession(null);
  }
  if (m) { $('roomId').value = m[1].toUpperCase(); showScreen('joinRoomScreen'); $('participantName').focus(); }
}
init().catch(e => { console.error('init failed', e); toast(t('toast.error'), 'error'); });
})();
