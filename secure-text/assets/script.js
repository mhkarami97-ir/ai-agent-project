(() => {
'use strict';
const LS = { vault:'secureNotes.vault', lock:'secureNotes.autoLock', legacyHash:'appPassHash', legacyNotes:'encryptedNotes', legacyLock:'autoLockTime' };
const ITER = 250000, MIN_PW = 8, AUTOSAVE_MS = 1200;
const $ = id => document.getElementById(id);
const enc = new TextEncoder(), dec = new TextDecoder();
let T = {}, lang = localStorage.getItem('lang') || 'fa';
const st = { key:null, salt:null, iter:ITER, notes:[], currentId:null, query:'', dirty:false, last:Date.now(), lockMin:5, locking:false };
let saveChain = Promise.resolve(), saveTimer = null;

const t = (k, v) => {
  let s = (T[lang] && T[lang][k]) ?? (T.fa && T.fa[k]) ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.replace('{' + a + '}', b);
  return s;
};
const locale = () => lang === 'fa' ? 'fa-IR' : 'en-US';
const num = n => Number(n).toLocaleString(locale());
const fmtDate = (iso, o) => new Date(iso).toLocaleString(locale(), o || { year:'numeric', month:'long', day:'numeric', hour:'2-digit', minute:'2-digit' });

function applyTheme(th) {
  const v = th === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', v);
  document.body.setAttribute('data-theme', v);
}
function applyI18n() {
  const r = document.documentElement;
  r.lang = lang; r.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
  document.querySelectorAll('[data-i18n-title]').forEach(e => { e.title = t(e.dataset.i18nTitle); });
  document.title = t('title');
  buildLockOptions(); updateStrength(); updateTimer();
  if (st.key) { renderList(); refreshEditorMeta(); }
}

const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

async function deriveKey(pw, salt, iter) {
  const base = await crypto.subtle.importKey('raw', enc.encode(pw.normalize('NFKC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name:'PBKDF2', salt, iterations:iter, hash:'SHA-256' }, base, { name:'AES-GCM', length:256 }, false, ['encrypt', 'decrypt']);
}
async function encryptNotes(key, notes) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, enc.encode(JSON.stringify(notes)));
  return { iv:b64(iv), data:b64(new Uint8Array(ct)) };
}
async function decryptNotes(key, iv, data) {
  const pt = await crypto.subtle.decrypt({ name:'AES-GCM', iv:unb64(iv) }, key, unb64(data));
  const notes = JSON.parse(dec.decode(pt));
  if (!Array.isArray(notes)) throw new Error('bad');
  return notes;
}
function readVault() {
  const raw = localStorage.getItem(LS.vault);
  if (!raw) return null;
  const v = JSON.parse(raw);
  if (v.v !== 2 || !v.salt || !v.iv || !v.data || !Number.isInteger(v.iter)) throw new Error('bad');
  return v;
}
function persist() {
  saveChain = saveChain.catch(() => {}).then(async () => {
    if (!st.key) return;
    const e = await encryptNotes(st.key, st.notes);
    localStorage.setItem(LS.vault, JSON.stringify({ v:2, iter:st.iter, salt:b64(st.salt), iv:e.iv, data:e.data }));
  });
  return saveChain;
}

const sha256hex = async s => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)))).map(b => b.toString(16).padStart(2, '0')).join('');
function legacyDecrypt(b, pw) {
  const e = unb64(b), k = enc.encode(pw);
  return new TextDecoder('utf-8', { fatal:true }).decode(e.map((x, i) => x ^ k[i % k.length]));
}
const hasVault = () => !!localStorage.getItem(LS.vault);
const hasLegacy = () => !hasVault() && !!localStorage.getItem(LS.legacyHash);

function showError(m) { const e = $('errorMsg'); e.textContent = m; e.hidden = false; }
function hideError() { $('errorMsg').hidden = true; }
function showLogin() {
  $('appScreen').hidden = true; $('loginScreen').hidden = false;
  const setup = !hasVault() && !hasLegacy();
  $('setupForm').hidden = !setup; $('loginForm').hidden = setup;
  $('legacyNote').hidden = !hasLegacy();
  ['setupPassword', 'confirmPassword', 'loginPassword'].forEach(id => { $(id).value = ''; $(id).type = 'password'; });
  document.querySelectorAll('.toggle-pw').forEach(b => { b.setAttribute('aria-pressed', 'false'); b.textContent = '👁️'; });
  updateStrength();
  (setup ? $('setupPassword') : $('loginPassword')).focus();
}
function setBusy(b) { ['setupBtn', 'loginBtn', 'changePasswordBtn'].forEach(id => { $(id).disabled = b; }); }

function strengthLevel(pw) {
  let pool = 0;
  if (/[a-z]/.test(pw)) pool += 26; if (/[A-Z]/.test(pw)) pool += 26; if (/\d/.test(pw)) pool += 10; if (/[^A-Za-z0-9]/.test(pw)) pool += 33;
  const bits = pw.length * Math.log2(pool || 1);
  return bits < 40 ? 0 : bits < 60 ? 1 : bits < 80 ? 2 : 3;
}
function updateStrength() {
  const pw = $('setupPassword').value, box = $('strength');
  if (!pw) { box.dataset.level = '-1'; $('strengthText').textContent = ''; return; }
  const l = strengthLevel(pw);
  box.dataset.level = String(l);
  $('strengthText').textContent = t('strengthLabel') + ' ' + t('strength' + l);
}

async function enter(key, salt, iter, notes) {
  Object.assign(st, { key, salt, iter, notes, currentId:null, dirty:false, last:Date.now(), query:'' });
  $('searchInput').value = '';
  hideError();
  $('loginScreen').hidden = true; $('appScreen').hidden = false;
  clearEditor(); renderList(); updateTimer();
}

async function onSetup(e) {
  e.preventDefault(); hideError();
  const pw = $('setupPassword').value;
  if (pw.length < MIN_PW) return showError(t('errMinLen'));
  if (pw !== $('confirmPassword').value) return showError(t('errMismatch'));
  setBusy(true);
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(pw, salt, ITER);
    st.key = key; st.salt = salt; st.iter = ITER; st.notes = [];
    await persist();
    await enter(key, salt, ITER, []);
  } catch (err) { st.key = null; showError(t('saveFailed')); } finally { setBusy(false); }
}

async function onLogin(e) {
  e.preventDefault(); hideError();
  const pw = $('loginPassword').value;
  if (!pw) return showError(t('errEnterPw'));
  setBusy(true);
  try {
    if (hasVault()) {
      let v;
      try { v = readVault(); } catch { return showError(t('errCorrupt')); }
      const salt = unb64(v.salt);
      const key = await deriveKey(pw, salt, v.iter);
      let notes;
      try { notes = await decryptNotes(key, v.iv, v.data); } catch { return showError(t('errWrongPw')); }
      await enter(key, salt, v.iter, notes);
    } else if (hasLegacy()) {
      if (await sha256hex(pw) !== localStorage.getItem(LS.legacyHash)) return showError(t('errWrongPw'));
      let notes = [];
      const old = localStorage.getItem(LS.legacyNotes);
      if (old) { try { notes = JSON.parse(legacyDecrypt(old, pw)); if (!Array.isArray(notes)) notes = []; } catch { return showError(t('errCorrupt')); } }
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const key = await deriveKey(pw, salt, ITER);
      st.key = key; st.salt = salt; st.iter = ITER; st.notes = notes;
      await persist();
      localStorage.removeItem(LS.legacyHash); localStorage.removeItem(LS.legacyNotes);
      await enter(key, salt, ITER, notes);
    }
  } catch (err) { showError(t('errCorrupt')); } finally { setBusy(false); $('loginPassword').value = ''; }
}

async function lock() {
  if (!st.key || st.locking) return;
  st.locking = true;
  clearTimeout(saveTimer);
  try { commitEditor(); await saveChain; } catch {}
  Object.assign(st, { key:null, salt:null, notes:[], currentId:null, dirty:false, query:'' });
  clearEditor();
  $('notesList').replaceChildren(); $('searchInput').value = '';
  ['settingsModal', 'confirmModal'].forEach(id => { if ($(id).open) $(id).close(); });
  ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach(id => { $(id).value = ''; });
  st.locking = false;
  showLogin();
}

function newId() { return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2); }
function getNote(id) { return st.notes.find(n => n.id === id); }
function setSaveStatus(msg, isErr) { const s = $('saveStatus'); s.textContent = msg; s.style.color = isErr ? 'var(--danger)' : ''; }

function renderList() {
  const list = $('notesList'); list.replaceChildren();
  const q = st.query.trim().toLowerCase();
  const items = st.notes.filter(n => !q || (n.title + '\n' + n.content).toLowerCase().includes(q)).sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
  if (!items.length) {
    const d = document.createElement('div'); d.className = 'list-empty';
    d.textContent = st.notes.length ? t('noMatch') : t('noNotes'); list.append(d);
  }
  for (const n of items) {
    const b = document.createElement('button'); b.type = 'button';
    b.className = 'note-item' + (n.id === st.currentId ? ' active' : ''); b.dataset.id = n.id;
    const a = document.createElement('div'); a.className = 't'; a.textContent = n.title || t('untitled');
    const p = document.createElement('div'); p.className = 'p'; p.textContent = n.content.slice(0, 60);
    const d = document.createElement('div'); d.className = 'd'; d.textContent = fmtDate(n.modifiedAt, { year:'numeric', month:'short', day:'numeric' });
    b.append(a, p, d);
    b.addEventListener('click', () => openNote(n.id));
    list.append(b);
  }
  $('notesCount').textContent = t('notesCount', { n:num(st.notes.length) });
}
function refreshEditorMeta() {
  const n = getNote(st.currentId);
  if (!n) return;
  $('lastModified').textContent = t('lastModified', { d:fmtDate(n.modifiedAt) });
  $('charCount').textContent = t('chars', { n:num($('noteContent').value.length) });
}
function clearEditor() {
  $('emptyState').hidden = false; $('editorContainer').hidden = true;
  $('noteTitle').value = ''; $('noteContent').value = ''; setSaveStatus('');
  $('lastModified').textContent = ''; $('charCount').textContent = '';
  st.currentId = null; st.dirty = false;
}
function commitEditor() {
  clearTimeout(saveTimer);
  if (!st.key || !st.currentId || !st.dirty) return;
  const n = getNote(st.currentId); if (!n) return;
  n.title = $('noteTitle').value.trim();
  n.content = $('noteContent').value;
  n.modifiedAt = new Date().toISOString();
  st.dirty = false;
  persist().then(() => setSaveStatus(t('saved'))).catch(() => setSaveStatus(t('saveFailed'), true));
  renderList(); refreshEditorMeta();
}
function openNote(id) {
  commitEditor();
  const n = getNote(id); if (!n) return;
  st.currentId = id;
  $('emptyState').hidden = true; $('editorContainer').hidden = false;
  $('noteTitle').value = n.title; $('noteContent').value = n.content;
  setSaveStatus(''); refreshEditorMeta(); renderList();
}
function createNote() {
  commitEditor();
  const now = new Date().toISOString();
  const n = { id:newId(), title:'', content:'', createdAt:now, modifiedAt:now };
  st.notes.unshift(n);
  persist().catch(() => setSaveStatus(t('saveFailed'), true));
  openNote(n.id); $('noteTitle').focus();
}
function onEditorInput() {
  st.dirty = true; setSaveStatus(t('unsaved'));
  $('charCount').textContent = t('chars', { n:num($('noteContent').value.length) });
  clearTimeout(saveTimer); saveTimer = setTimeout(commitEditor, AUTOSAVE_MS);
}
function askConfirm(title, msg) {
  return new Promise(res => {
    const d = $('confirmModal'); $('confirmTitle').textContent = title; $('confirmMessage').textContent = msg;
    const done = v => { $('confirmYes').onclick = null; $('confirmNo').onclick = null; d.onclose = null; if (d.open) d.close(); res(v); };
    $('confirmYes').onclick = () => done(true); $('confirmNo').onclick = () => done(false); d.onclose = () => done(false);
    d.showModal();
  });
}
async function deleteCurrent() {
  const id = st.currentId; if (!id) return;
  if (!await askConfirm(t('delNoteTitle'), t('delNoteMsg'))) return;
  clearTimeout(saveTimer); st.dirty = false;
  st.notes = st.notes.filter(n => n.id !== id);
  clearEditor(); renderList();
  persist().catch(() => showError(t('saveFailed')));
}

function buildLockOptions() {
  const sel = $('autoLockTime'); sel.replaceChildren();
  for (const m of [1, 2, 5, 10, 15, 30, 60, 0]) {
    const o = document.createElement('option'); o.value = String(m);
    o.textContent = m ? t('minutes', { n:num(m) }) : t('disabled'); sel.append(o);
  }
  sel.value = String(st.lockMin);
}
function loadLockMin() {
  const raw = localStorage.getItem(LS.lock) ?? localStorage.getItem(LS.legacyLock);
  const n = parseInt(raw, 10);
  st.lockMin = [0, 1, 2, 5, 10, 15, 30, 60].includes(n) ? n : 5;
}
function updateTimer() {
  const el = $('lockTimer'); if (!el) return;
  if (!st.lockMin) { el.textContent = t('lockOff'); return; }
  const rem = Math.max(0, st.lockMin * 60000 - (Date.now() - st.last));
  el.textContent = Math.floor(rem / 60000) + ':' + String(Math.floor(rem % 60000 / 1000)).padStart(2, '0');
}
function tick() {
  if (!st.key) return;
  if (st.lockMin && Date.now() - st.last >= st.lockMin * 60000) { lock(); return; }
  updateTimer();
}

function settingsMsg(msg, cls) { const m = $('settingsMsg'); m.textContent = msg; m.className = 'notice ' + cls; m.hidden = !msg; }
async function changePassword(e) {
  e.preventDefault(); settingsMsg('', '');
  const cur = $('currentPassword').value, nw = $('newPassword').value, cf = $('confirmNewPassword').value;
  if (!cur || !nw || !cf) return settingsMsg(t('errFillAll'), 'error');
  if (nw.length < MIN_PW) return settingsMsg(t('errMinLen'), 'error');
  if (nw !== cf) return settingsMsg(t('errMismatch'), 'error');
  if (nw === cur) return settingsMsg(t('errSame'), 'error');
  setBusy(true);
  try {
    commitEditor(); await saveChain.catch(() => {});
    const v = readVault();
    try { await decryptNotes(await deriveKey(cur, unb64(v.salt), v.iter), v.iv, v.data); } catch { return settingsMsg(t('errWrongPw'), 'error'); }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await deriveKey(nw, salt, ITER);
    const prev = { key:st.key, salt:st.salt, iter:st.iter };
    Object.assign(st, { key, salt, iter:ITER });
    try { await persist(); } catch (err) { Object.assign(st, prev); throw err; }
    ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach(id => { $(id).value = ''; });
    settingsMsg(t('pwChanged'), 'ok');
  } catch (err) { settingsMsg(t('saveFailed'), 'error'); } finally { setBusy(false); }
}
async function resetApp() {
  if (!await askConfirm(t('resetTitle'), t('resetMsg'))) return;
  [LS.vault, LS.lock, LS.legacyHash, LS.legacyNotes, LS.legacyLock].forEach(k => localStorage.removeItem(k));
  location.reload();
}

function bind() {
  $('setupForm').addEventListener('submit', onSetup);
  $('loginForm').addEventListener('submit', onLogin);
  $('setupPassword').addEventListener('input', updateStrength);
  document.querySelectorAll('.toggle-pw').forEach(b => b.addEventListener('click', () => {
    const i = $(b.dataset.target), show = i.type === 'password';
    i.type = show ? 'text' : 'password'; b.textContent = show ? '🙈' : '👁️';
    b.setAttribute('aria-pressed', String(show)); b.setAttribute('aria-label', t(show ? 'hidePassword' : 'showPassword'));
  }));
  $('newNoteBtn').addEventListener('click', createNote);
  $('saveNoteBtn').addEventListener('click', () => { st.dirty = true; commitEditor(); });
  $('deleteNoteBtn').addEventListener('click', deleteCurrent);
  $('lockBtn').addEventListener('click', lock);
  $('searchInput').addEventListener('input', e => { st.query = e.target.value; renderList(); });
  $('noteTitle').addEventListener('input', onEditorInput);
  $('noteContent').addEventListener('input', onEditorInput);
  $('settingsBtn').addEventListener('click', () => { settingsMsg('', ''); $('autoLockTime').value = String(st.lockMin); $('settingsModal').showModal(); });
  $('closeSettingsBtn').addEventListener('click', () => $('settingsModal').close());
  $('settingsModal').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  $('settingsModal').addEventListener('close', () => ['currentPassword', 'newPassword', 'confirmNewPassword'].forEach(id => { $(id).value = ''; }));
  $('autoLockTime').addEventListener('change', e => { st.lockMin = parseInt(e.target.value, 10); localStorage.setItem(LS.lock, String(st.lockMin)); st.last = Date.now(); updateTimer(); });
  $('changePwForm').addEventListener('submit', changePassword);
  $('resetAppBtn').addEventListener('click', resetApp);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && st.key && st.currentId) { e.preventDefault(); st.dirty = true; commitEditor(); }
  });
  ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { if (st.key) st.last = Date.now(); }, { passive:true, capture:true }));
  setInterval(tick, 1000);
  window.addEventListener('themeChanged', e => applyTheme(e.detail));
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); });
}

async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  loadLockMin(); applyI18n(); bind();
  if (!(window.crypto && crypto.subtle)) {
    $('setupForm').hidden = true; $('loginForm').hidden = true; showError(t('errNoCrypto')); return;
  }
  showLogin();
}
init();
})();
