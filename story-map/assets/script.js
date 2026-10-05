(() => {
'use strict';
const S = window.StoryCore;
const $ = id => document.getElementById(id);
const DB_NAME = 'StoryMapDB', STORE = 'boards';
const STATUS_KEY = { pending: 'statusPending', 'in-progress': 'statusInProgress', completed: 'statusCompleted', rejected: 'statusRejected' };
const STATUS_ICON = { pending: '⏳', 'in-progress': '🔄', completed: '✅', rejected: '❌' };
let T = {}, lang = localStorage.getItem('lang') || localStorage.getItem('language') || 'fa';
if (lang !== 'en') lang = 'fa';
const st = { boards: [], current: null, view: localStorage.getItem('viewMode') === 'roadmap' ? 'roadmap' : 'storymap', drag: null, undo: null, focusAfter: null };
let toastTimer = null;

const t = (k, v) => { let s = (T[lang] && T[lang][k]) ?? (T.fa && T.fa[k]) ?? k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const locale = () => lang === 'fa' ? 'fa-IR' : 'en-US';
const num = n => new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(n);
const pctText = x => new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 0 }).format(x);
const boardName = b => b.name || t('untitledBoard');
const colTitle = c => c.title || t('untitledColumn');

function applyTheme(th) { const v = th === 'dark' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', v); document.body.setAttribute('data-theme', v); }
function applyI18n() {
  const r = document.documentElement; r.lang = lang; r.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(e => { e.placeholder = t(e.dataset.i18nPlaceholder); });
  document.title = t('appTitle');
}

/* ---------- storage ---------- */
const store = {
  db: null, mem: new Map(), volatile: false,
  async init() {
    try {
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open(DB_NAME, 1);
        r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked')); r.onsuccess = () => res(r.result);
        r.onupgradeneeded = e => { const d = e.target.result; if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' }).createIndex('name', 'name', { unique: false }); };
      });
    } catch (e) { console.error('IndexedDB unavailable', e); this.db = null; this.volatile = true; }
  },
  run(mode, fn) { return new Promise((res, rej) => { const tx = this.db.transaction(STORE, mode), r = fn(tx.objectStore(STORE)); tx.oncomplete = () => res(r && r.result); tx.onerror = tx.onabort = () => rej(tx.error); }); },
  async all() { return this.db ? this.run('readonly', s => s.getAll()) : [...this.mem.values()]; },
  async put(b) { const o = JSON.parse(JSON.stringify(S.serialize(b))); if (!this.db) { this.mem.set(o.id, o); return; } await this.run('readwrite', s => s.put(o)); },
  async del(id) { if (!this.db) { this.mem.delete(id); return; } await this.run('readwrite', s => s.delete(id)); }
};
async function persist(b) { try { await store.put(b); return true; } catch (e) { console.error(e); toast(t('saveError'), 'error'); return false; } }

/* ---------- toast & dialogs ---------- */
function toast(msg, type, action) {
  const el = $('toast'), b = $('toastAction'); $('toastMsg').textContent = msg; el.className = 'toast show ' + (type || '');
  b.hidden = !action; b.onclick = null;
  if (action) { b.textContent = action.label; b.onclick = () => { el.classList.remove('show'); action.fn(); }; }
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), action ? 7000 : 3000);
}
function openForm(dlg, fill, read) {
  return new Promise(resolve => {
    const form = dlg.querySelector('form'), err = dlg.querySelector('.dlg-error'); let settled = false;
    if (err) err.hidden = true;
    const finish = v => { if (settled) return; settled = true; form.removeEventListener('submit', onSubmit); dlg.removeEventListener('close', onClose); dlg.removeEventListener('click', onBg); dlg.querySelectorAll('[data-close]').forEach(b => b.removeEventListener('click', onCancel)); resolve(v); };
    const onSubmit = e => { e.preventDefault(); const r = read(); if (r && r.error) { err.textContent = t(r.error); err.hidden = false; return; } finish(r ? r.value : true); dlg.close(); };
    const onCancel = () => dlg.close(), onClose = () => finish(null), onBg = e => { if (e.target === dlg) dlg.close(); };
    form.addEventListener('submit', onSubmit); dlg.addEventListener('close', onClose); dlg.addEventListener('click', onBg);
    dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', onCancel));
    fill(); dlg.showModal();
  });
}
const askConfirm = msg => openForm($('confirmDialog'), () => { $('confirmMessage').textContent = msg; }, () => ({ value: true })).then(v => v === true);
function askName(title, label, initial, max, ph) {
  const input = $('nameInput');
  return openForm($('nameDialog'), () => { $('nameTitle').textContent = title; $('nameLabel').textContent = label; input.maxLength = max; input.placeholder = ph || ''; input.value = initial || ''; setTimeout(() => { input.focus(); input.select(); }, 0); },
    () => { const v = S.cleanLine(input.value, max); return v ? { value: v } : { error: 'nameRequired' }; });
}
function askStory(title, story, columnId) {
  const ti = $('storyTitleInput'), de = $('storyDescInput'), po = $('storyPointsInput'), cs = $('storyColumnSelect'), sg = $('storyStatusGroup');
  return openForm($('storyDialog'), () => {
    $('storyDlgTitle').textContent = title; ti.value = story ? story.title : ''; de.value = story ? story.description : ''; po.value = story ? story.points : 0;
    cs.replaceChildren(); st.current.columns.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = colTitle(c); cs.append(o); }); cs.value = columnId;
    sg.replaceChildren();
    S.STATUSES.forEach(s => {
      const l = document.createElement('label'); l.className = 'form-radio-label';
      const i = document.createElement('input'); i.type = 'radio'; i.name = 'storyStatus'; i.value = s; i.checked = (story ? story.status : 'pending') === s;
      const sp = document.createElement('span'); sp.textContent = STATUS_ICON[s] + ' ' + t(STATUS_KEY[s]); l.append(i, sp); sg.append(l);
    });
    setTimeout(() => ti.focus(), 0);
  }, () => {
    const d = { title: S.cleanLine(ti.value, S.LIMITS.title), description: S.cleanText(de.value, S.LIMITS.desc), points: S.toPoints(po.value), status: (sg.querySelector('input:checked') || {}).value || 'pending' };
    return d.title ? { value: { ...d, columnId: cs.value } } : { error: 'titleRequired' };
  });
}

/* ---------- rendering ---------- */
function renderSelector() {
  const sel = $('boardSelector'); sel.replaceChildren();
  const ph = document.createElement('option'); ph.value = ''; ph.textContent = t('selectBoard'); sel.append(ph);
  st.boards.forEach(b => { const o = document.createElement('option'); o.value = b.id; o.textContent = boardName(b); sel.append(o); });
  sel.value = st.current ? st.current.id : '';
  ['renameBoardBtn', 'duplicateBoardBtn', 'deleteBoardBtn', 'exportBtn', 'clearBoardBtn'].forEach(id => { $(id).disabled = !st.current; });
  $('viewModeSelector').value = st.view;
}
function renderStats() {
  const bar = $('statsBar'); bar.hidden = !st.current || !st.current.columns.length;
  if (bar.hidden) return;
  const s = S.stats(st.current), p = Math.round(s.progress * 100);
  $('statsText').textContent = t('statsText', { s: num(s.total), d: num(s.done), pd: num(s.donePoints), p: num(s.points), pr: pctText(s.progress) });
  const pg = $('statsProgress'); pg.setAttribute('aria-valuenow', String(p)); pg.setAttribute('aria-label', t('progressLabel')); $('statsFill').style.width = p + '%';
}
function emptyState(icon, title, text) {
  const d = document.createElement('div'); d.className = 'empty-state';
  const i = document.createElement('div'); i.className = 'empty-icon'; i.textContent = icon; i.setAttribute('aria-hidden', 'true');
  const h = document.createElement('h2'); h.textContent = title; const p = document.createElement('p'); p.textContent = text; d.append(i, h, p); return d;
}
function renderBoard() {
  const box = $('boardContainer'); box.replaceChildren();
  box.className = 'board-container' + (st.view === 'roadmap' ? ' roadmap-view' : '');
  $('addColumnBtn').hidden = !st.current;
  if (!st.current) { box.append(emptyState('📋', t('emptyStateTitle'), t('emptyStateText'))); return; }
  const stats = S.stats(st.current), n = st.current.columns.length;
  if (!n) { box.append(emptyState('📝', t('emptyColumnsTitle'), t('emptyColumnsText'))); return; }
  st.current.columns.forEach((c, i) => box.append(columnEl(c, i, n, stats.columns[i])));
  if (st.focusAfter) {
    const f = st.focusAfter; st.focusAfter = null;
    const root = document.querySelector(f.kind === 'story' ? '[data-story-id="' + CSS.escape(f.id) + '"]' : '[data-column-id="' + CSS.escape(f.id) + '"].column');
    const el = root && (root.querySelector('[data-act="' + f.act + '"]:not(:disabled)') || root.querySelector('[data-act]:not(:disabled)'));
    el && el.focus();
  }
}
const renderAll = () => { renderSelector(); renderStats(); renderBoard(); };

function btn(cls, text, label, fn, act, disabled) {
  const b = document.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text; b.title = label; b.setAttribute('aria-label', label);
  if (act) b.dataset.act = act; b.disabled = !!disabled; b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b;
}
function columnEl(col, i, n, cs) {
  const compact = st.view === 'roadmap', title = colTitle(col);
  const el = document.createElement('section'); el.className = 'column' + (compact ? ' compact' : ''); el.dataset.columnId = col.id; el.setAttribute('aria-label', title);
  const head = document.createElement('div'); head.className = 'column-header';
  const handle = document.createElement('span'); handle.className = 'drag-handle'; handle.textContent = '⠿'; handle.draggable = true; handle.title = t('dragColumn'); handle.setAttribute('aria-hidden', 'true');
  handle.addEventListener('dragstart', e => { st.drag = { type: 'column', id: col.id }; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', col.id); e.dataTransfer.setDragImage(el, 20, 20); } catch {} });
  handle.addEventListener('dragend', () => { st.drag = null; el.classList.remove('dragging'); clearDrop(); });
  const ttl = document.createElement('button'); ttl.type = 'button'; ttl.className = 'column-title'; ttl.textContent = title; ttl.title = t('editColumn'); ttl.dataset.act = 'rename'; ttl.addEventListener('click', () => renameColumn(col.id));
  const acts = document.createElement('div'); acts.className = 'column-actions';
  const rtl = lang === 'fa';
  acts.append(btn('icon-btn', rtl ? '▶' : '◀', t('moveColumnPrev'), () => shiftColumn(col.id, -1), 'prev', i === 0), btn('icon-btn', rtl ? '◀' : '▶', t('moveColumnNext'), () => shiftColumn(col.id, 1), 'next', i === n - 1), btn('icon-btn', '🗑️', t('deleteColumn'), () => removeColumn(col.id), 'delete'));
  head.append(handle, ttl, acts);
  const sum = document.createElement('div'); sum.className = 'column-summary'; sum.textContent = t('columnSummary', { n: num(cs.total), p: num(cs.points) }) + (cs.rejected ? ' · ' + t('rejectedCount', { n: num(cs.rejected) }) : '');
  el.append(head, sum);
  if (compact) {
    const pg = document.createElement('div'); pg.className = 'progress'; pg.setAttribute('role', 'progressbar'); pg.setAttribute('aria-valuemin', '0'); pg.setAttribute('aria-valuemax', '100'); pg.setAttribute('aria-valuenow', String(Math.round(cs.progress * 100))); pg.setAttribute('aria-label', t('progressLabel') + ': ' + title);
    const f = document.createElement('span'); f.className = 'progress-fill'; f.style.width = Math.round(cs.progress * 100) + '%'; pg.append(f);
    const pt = document.createElement('div'); pt.className = 'progress-text'; pt.textContent = pctText(cs.progress); el.append(pg, pt);
  }
  el.addEventListener('dragover', e => {
    if (!st.drag || st.drag.type !== 'column' || st.drag.id === col.id) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'; clearDrop(); el.classList.add(isBefore(e, el) ? 'drop-before' : 'drop-after');
  });
  el.addEventListener('drop', e => {
    if (!st.drag || st.drag.type !== 'column' || st.drag.id === col.id) return;
    e.preventDefault(); const drag = st.drag.id, before = isBefore(e, el);
    const ids = st.current.columns.map(c => c.id).filter(x => x !== drag); dropColumn(drag, ids.indexOf(col.id) + (before ? 0 : 1));
  });
  const box = document.createElement('div'); box.className = 'stories-container'; box.dataset.columnId = col.id;
  col.stories.forEach((s, si) => box.append(storyEl(col, s, si, col.stories.length, compact)));
  box.addEventListener('dragover', e => { if (!st.drag || st.drag.type !== 'story') return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; box.classList.add('drag-over'); });
  box.addEventListener('dragleave', e => { if (!box.contains(e.relatedTarget)) box.classList.remove('drag-over'); });
  box.addEventListener('drop', e => { if (!st.drag || st.drag.type !== 'story') return; e.preventDefault(); const drag = st.drag.id; dropStory(drag, col.id, [...box.querySelectorAll('.story-card')].filter(x => x.dataset.storyId !== drag).length); });
  const add = document.createElement('button'); add.type = 'button'; add.className = 'add-story-btn'; add.textContent = t('addStory'); add.addEventListener('click', () => addStory(col.id));
  el.append(box, add); return el;
}
function storyEl(col, s, i, n, compact) {
  const el = document.createElement('div'); el.className = 'story-card ' + s.status; el.dataset.storyId = s.id; el.draggable = true;
  el.addEventListener('dragstart', e => { e.stopPropagation(); st.drag = { type: 'story', id: s.id }; el.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', s.id); } catch {} });
  el.addEventListener('dragend', () => { st.drag = null; el.classList.remove('dragging'); clearDrop(); });
  el.addEventListener('dragover', e => { if (!st.drag || st.drag.type !== 'story' || st.drag.id === s.id) return; e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; const r = el.getBoundingClientRect(); clearDrop(); el.classList.add(e.clientY > r.top + r.height / 2 ? 'drop-after' : 'drop-before'); });
  el.addEventListener('drop', e => {
    if (!st.drag || st.drag.type !== 'story' || st.drag.id === s.id) return; e.preventDefault(); e.stopPropagation();
    const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2, drag = st.drag.id;
    const ids = [...el.parentElement.querySelectorAll('.story-card')].map(x => x.dataset.storyId).filter(x => x !== drag); dropStory(drag, col.id, ids.indexOf(s.id) + (after ? 1 : 0));
  });
  const head = document.createElement('div'); head.className = 'story-header';
  const status = btn('story-status-btn', STATUS_ICON[s.status], t('cycleStatus', { s: t(STATUS_KEY[s.status]) }), () => cycle(s.id), 'status');
  const ttl = document.createElement('div'); ttl.className = 'story-title'; ttl.textContent = s.title;
  const snip = s.title.length > 30 ? s.title.slice(0, 30) + '…' : s.title;
  const acts = document.createElement('div'); acts.className = 'story-actions';
  acts.append(btn('icon-btn', '▲', t('moveUp') + ': ' + snip, () => shiftStory(s.id, -1), 'up', i === 0), btn('icon-btn', '▼', t('moveDown') + ': ' + snip, () => shiftStory(s.id, 1), 'down', i === n - 1), btn('icon-btn', '✏️', t('editStory') + ': ' + snip, () => editStory(s.id), 'edit'), btn('icon-btn', '🗑️', t('deleteStory') + ': ' + snip, () => removeStory(s.id), 'delete'));
  head.append(status, ttl, acts); el.append(head);
  if (!compact && s.description) { const d = document.createElement('div'); d.className = 'story-description'; d.textContent = s.description; el.append(d); }
  const meta = document.createElement('div'); meta.className = 'story-meta';
  const sp = document.createElement('span'); sp.className = 'story-status ' + s.status; sp.textContent = t(STATUS_KEY[s.status]);
  const pt = document.createElement('span'); pt.className = 'story-points'; pt.textContent = num(s.points) + ' ' + t('points'); meta.append(sp, pt); el.append(meta);
  return el;
}
function clearDrop() { document.querySelectorAll('.drop-before,.drop-after,.drag-over').forEach(e => e.classList.remove('drop-before', 'drop-after', 'drag-over')); }
function isBefore(e, el) { const r = el.getBoundingClientRect(), mid = r.left + r.width / 2; return document.documentElement.dir === 'rtl' ? e.clientX > mid : e.clientX < mid; }

/* ---------- actions ---------- */
const need = () => { if (st.current) return true; toast(t('selectBoardFirst'), 'warning'); return false; };
const LIM = { limit: 'limitReached', empty: 'titleRequired', column: 'error', notfound: 'error' };
async function commit(msg, focus) { if (focus) st.focusAfter = focus; renderAll(); if (await persist(st.current) && msg) toast(t(msg), 'success'); }

async function newBoard() {
  if (st.boards.length >= S.LIMITS.boards) return toast(t('limitBoards'), 'warning');
  const name = await askName(t('createBoard'), t('boardName'), '', S.LIMITS.name, t('boardNamePlaceholder')); if (!name) return;
  const b = S.createBoard(name); st.boards.unshift(b); setCurrent(b); if (await persist(b)) toast(t('boardCreated'), 'success');
}
async function renameBoard() { if (!need()) return; const n = await askName(t('renameBoard'), t('boardName'), st.current.name, S.LIMITS.name, t('boardNamePlaceholder')); if (!n) return; st.current.name = n; st.current.updatedAt = new Date().toISOString(); await commit('boardRenamed'); }
async function duplicateBoard() {
  if (!need()) return; if (st.boards.length >= S.LIMITS.boards) return toast(t('limitBoards'), 'warning');
  const b = S.duplicateBoard(st.current, t('copy')); st.boards.unshift(b); setCurrent(b); if (await persist(b)) toast(t('boardDuplicated'), 'success');
}
async function deleteBoard() {
  if (!need() || !await askConfirm(t('deleteBoardConfirm'))) return;
  const id = st.current.id; st.boards = st.boards.filter(b => b.id !== id); setCurrent(st.boards[0] || null);
  try { await store.del(id); toast(t('boardDeleted'), 'success'); } catch { toast(t('saveError'), 'error'); }
}
async function clearBoard() { if (!need() || !await askConfirm(t('clearBoardConfirm'))) return; S.clearBoard(st.current); st.undo = null; await commit('boardCleared'); }
function exportBoard() {
  if (!need()) return;
  const blob = new Blob([JSON.stringify(S.exportBoard(st.current), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  const safe = boardName(st.current).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').trim().slice(0, 60) || 'board';
  a.href = url; a.download = safe + '_' + new Date().toISOString().split('T')[0] + '.json'; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast(t('exportSuccess'), 'success');
}
async function importFile(file) {
  if (file.size > 2 * 1024 * 1024) return toast(t('importTooBig'), 'error');
  let res; try { res = S.sanitizeImport(JSON.parse(await file.text())); } catch { return toast(t('importError'), 'error'); }
  if (!res.boards.length) return toast(t('importError'), 'error');
  const room = S.LIMITS.boards - st.boards.length; if (room <= 0) return toast(t('limitBoards'), 'warning');
  const added = [];
  for (const b of res.boards.slice(0, room)) {
    if (st.boards.some(x => x.id === b.id)) b.id = S.newId();
    b.name = S.cleanLine((b.name || t('untitledBoard')) + ' (' + t('imported') + ')', S.LIMITS.name); b.updatedAt = new Date().toISOString(); st.boards.unshift(b); added.push(b);
  }
  setCurrent(added[0]); let ok = true; for (const b of added) ok = (await persist(b)) && ok; if (ok) toast(t('importSuccess'), 'success');
}
function setCurrent(b) { st.current = b || null; st.undo = null; if (b) localStorage.setItem('currentBoardId', b.id); else localStorage.removeItem('currentBoardId'); renderAll(); }

async function addColumn() {
  if (!need()) return; const n = await askName(t('createColumn'), t('columnName'), '', S.LIMITS.colTitle, t('columnNamePlaceholder')); if (!n) return;
  const r = S.addColumn(st.current, n); if (!r.ok) return toast(t(r.error === 'limit' ? 'limitColumns' : 'error'), 'warning'); await commit('columnCreated');
}
async function renameColumn(id) {
  const f = S.findColumn(st.current, id); if (!f) return; const n = await askName(t('editColumn'), t('columnName'), f.column.title, S.LIMITS.colTitle, t('columnNamePlaceholder')); if (!n) return;
  S.renameColumn(st.current, id, n); await commit(null, { kind: 'column', id, act: 'rename' });
}
async function removeColumn(id) {
  const f = S.findColumn(st.current, id); if (!f) return;
  if (f.column.stories.length && !await askConfirm(t('deleteColumnConfirm'))) return;
  const board = st.current, d = S.deleteColumn(board, id); st.undo = { type: 'column', boardId: board.id, ...d }; renderAll();
  if (await persist(board)) toast(t('columnDeleted'), 'success', { label: t('undo'), fn: undoDelete });
}
async function shiftColumn(id, delta) { if (S.shiftColumn(st.current, id, delta)) await commit(null, { kind: 'column', id, act: delta < 0 ? 'prev' : 'next' }); }
async function dropColumn(id, index) { clearDrop(); const r = S.moveColumn(st.current, id, index); if (r.ok && r.changed) await commit(); else renderBoard(); }

async function addStory(colId) {
  const d = await askStory(t('createStory'), null, colId); if (!d) return;
  const r = S.addStory(st.current, d.columnId, d); if (!r.ok) return toast(t(LIM[r.error] === 'limitReached' ? 'limitStories' : LIM[r.error] || 'error'), 'warning'); await commit('storyAdded', { kind: 'story', id: r.story.id, act: 'edit' });
}
async function editStory(id) {
  const f = S.findStory(st.current, id); if (!f) return; const d = await askStory(t('editStory'), f.story, f.column.id); if (!d) return;
  const r = S.updateStory(st.current, id, d, d.columnId); if (!r.ok) return toast(t(r.error === 'limit' ? 'limitStories' : 'error'), 'warning'); await commit('storyUpdated', { kind: 'story', id, act: 'edit' });
}
async function removeStory(id) {
  const board = st.current, d = S.deleteStory(board, id); if (!d) return; st.undo = { type: 'story', boardId: board.id, ...d }; renderAll();
  if (await persist(board)) toast(t('storyDeleted'), 'success', { label: t('undo'), fn: undoDelete });
}
async function undoDelete() {
  const u = st.undo; st.undo = null; const board = u && st.boards.find(b => b.id === u.boardId); if (!board) return;
  const ok = u.type === 'story' ? S.restoreStory(board, u.colId, u.story, u.index) : S.restoreColumn(board, u.column, u.index);
  if (!ok) return toast(t('limitReached'), 'warning');
  renderAll(); if (await persist(board)) toast(t('restored'), 'success');
}
async function shiftStory(id, delta) { if (S.shiftStory(st.current, id, delta)) await commit(null, { kind: 'story', id, act: delta < 0 ? 'up' : 'down' }); }
async function cycle(id) { if (S.cycleStatus(st.current, id)) await commit(null, { kind: 'story', id, act: 'status' }); }
async function dropStory(id, colId, index) {
  clearDrop(); const r = S.moveStory(st.current, id, colId, index);
  if (!r.ok) { if (r.error === 'limit') toast(t('limitStories'), 'warning'); return; }
  if (r.changed) await commit(r.crossed ? 'storyMoved' : null); else renderBoard();
}

function bind() {
  $('newBoardBtn').addEventListener('click', newBoard); $('renameBoardBtn').addEventListener('click', renameBoard); $('duplicateBoardBtn').addEventListener('click', duplicateBoard);
  $('deleteBoardBtn').addEventListener('click', deleteBoard); $('clearBoardBtn').addEventListener('click', clearBoard); $('exportBtn').addEventListener('click', exportBoard);
  $('importBtn').addEventListener('click', () => $('fileInput').click()); $('fileInput').addEventListener('change', e => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; });
  $('addColumnBtn').querySelector('button').addEventListener('click', addColumn);
  $('boardSelector').addEventListener('change', e => setCurrent(st.boards.find(b => b.id === e.target.value)));
  $('viewModeSelector').addEventListener('change', e => { st.view = e.target.value === 'roadmap' ? 'roadmap' : 'storymap'; localStorage.setItem('viewMode', st.view); renderBoard(); });
  window.addEventListener('themeChanged', e => applyTheme(e.detail));
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); renderAll(); });
}

async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n(); bind(); await store.init();
  if (store.volatile) toast(t('volatile'), 'warning');
  let raw = []; try { raw = await store.all(); } catch (e) { console.error(e); toast(t('loadError'), 'error'); }
  const changed = [];
  st.boards = raw.map(r => { const b = S.normalizeBoard(r); if (b && JSON.stringify(S.serialize(b)) !== JSON.stringify(r)) changed.push(b); return b; }).filter(Boolean);
  st.boards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const b of changed) await persist(b);
  const cur = localStorage.getItem('currentBoardId');
  st.current = st.boards.find(b => b.id === cur) || null;
  renderAll();
}
init().catch(e => { console.error('init failed', e); toast(t('loadError'), 'error'); });
})();
