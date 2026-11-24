(() => {
'use strict';
const Core = window.CanvasCore;
const $ = id => document.getElementById(id);
const DB_NAME = 'OpportunityCanvasDB', STORE = 'boards';
let T = {}, lang = localStorage.getItem('lang') || localStorage.getItem('language') || 'fa';
if (lang !== 'en') lang = 'fa';
const st = { boards: [], current: null, drag: null, undo: null, focusAfter: null, volatile: false };
let toastTimer = null;

const lookup = (o, path) => { const v = path.split('.').reduce((x, k) => (x && typeof x === 'object' ? x[k] : undefined), o); return typeof v === 'string' ? v : undefined; };
const t = (k, v) => {
  let s = lookup(T[lang], k) ?? lookup(T.fa, k) ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b);
  return s;
};

function applyTheme(th) {
  const v = th === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', v); document.body.setAttribute('data-theme', v);
}
function applyI18n() {
  const r = document.documentElement; r.lang = lang; r.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(e => { const s = t(e.dataset.i18nTitle); e.title = s; e.setAttribute('aria-label', s); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(e => { e.placeholder = t(e.dataset.i18nPlaceholder); });
  document.title = t('app.title');
}
const boardName = b => b.name || t('board.untitled');

/* ---------- storage (IndexedDB with in-memory fallback) ---------- */
const store = {
  db: null, mem: new Map(),
  async init() {
    try {
      this.db = await new Promise((res, rej) => {
        const r = indexedDB.open(DB_NAME, 1);
        r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
        r.onsuccess = () => res(r.result);
        r.onupgradeneeded = e => { const d = e.target.result; if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: 'id' }); };
      });
    } catch (e) { console.error('IndexedDB unavailable', e); this.db = null; st.volatile = true; }
  },
  req(mode, fn) {
    return new Promise((res, rej) => { const tx = this.db.transaction(STORE, mode), r = fn(tx.objectStore(STORE)); tx.oncomplete = () => res(r && r.result); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error); });
  },
  async all() { return this.db ? this.req('readonly', s => s.getAll()) : [...this.mem.values()]; },
  async put(b) { const o = Core.serialize(b); if (!this.db) { this.mem.set(o.id, JSON.parse(JSON.stringify(o))); return; } await this.req('readwrite', s => s.put(JSON.parse(JSON.stringify(o)))); },
  async del(id) { if (!this.db) { this.mem.delete(id); return; } await this.req('readwrite', s => s.delete(id)); }
};
async function persist(board) {
  try { await store.put(board); return true; } catch (e) { console.error(e); toast(t('app.saveError'), 'error'); return false; }
}

/* ---------- toast & dialogs ---------- */
function toast(msg, type, action) {
  const el = $('toast'), b = $('toastAction');
  $('toastMsg').textContent = msg; el.className = 'toast show ' + (type || '');
  b.hidden = !action; b.onclick = null;
  if (action) { b.textContent = action.label; b.onclick = () => { el.classList.remove('show'); action.fn(); }; }
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), action ? 7000 : 3000);
}
function openForm(dlg, fill, read) {
  return new Promise(resolve => {
    const form = dlg.querySelector('form'), err = dlg.querySelector('.dlg-error');
    let settled = false;
    if (err) err.hidden = true;
    const finish = v => { if (settled) return; settled = true; form.removeEventListener('submit', onSubmit); dlg.removeEventListener('close', onClose); dlg.removeEventListener('click', onBackdrop); dlg.querySelectorAll('[data-close]').forEach(b => b.removeEventListener('click', onCancel)); resolve(v); };
    const onSubmit = e => {
      e.preventDefault();
      const r = read();
      if (r && r.error) { err.textContent = t(r.error); err.hidden = false; return; }
      finish(r ? r.value : true); dlg.close();
    };
    const onCancel = () => dlg.close();
    const onClose = () => finish(null);
    const onBackdrop = e => { if (e.target === dlg) dlg.close(); };
    form.addEventListener('submit', onSubmit); dlg.addEventListener('close', onClose); dlg.addEventListener('click', onBackdrop);
    dlg.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', onCancel));
    fill(); dlg.showModal();
  });
}
const askConfirm = msg => openForm($('confirmDialog'), () => { $('confirmMessage').textContent = msg; }, () => ({ value: true })).then(v => v === true);
function askName(title, initial) {
  const input = $('nameInput');
  return openForm($('nameDialog'), () => { $('nameTitle').textContent = title; input.value = initial || ''; input.select(); },
    () => { const v = Core.clean(input.value, Core.LIMITS.name); return v ? { value: v } : { error: 'board.nameRequired' }; });
}
function askItem(title, text, section) {
  const ta = $('itemText'), sel = $('itemSection');
  return openForm($('itemDialog'), () => {
    $('itemTitle').textContent = title; ta.value = text || '';
    sel.replaceChildren(); Core.SECTIONS.forEach(k => { const o = document.createElement('option'); o.value = k; o.textContent = t('canvas.' + k); sel.append(o); });
    sel.value = section; setTimeout(() => ta.focus(), 0);
  }, () => { const v = Core.clean(ta.value, Core.LIMITS.text); return v ? { value: { text: v, section: sel.value } } : { error: 'item.required' }; });
}

/* ---------- rendering ---------- */
function renderSelector() {
  const sel = $('boardSelector'); sel.replaceChildren();
  const ph = document.createElement('option'); ph.value = ''; ph.textContent = t('board.selectBoard'); sel.append(ph);
  st.boards.forEach(b => { const o = document.createElement('option'); o.value = b.id; o.textContent = boardName(b); sel.append(o); });
  sel.value = st.current ? st.current.id : '';
  ['renameBoardBtn', 'deleteBoardBtn', 'exportBtn', 'clearBoardBtn'].forEach(id => { $(id).disabled = !st.current; });
}
function renderCanvas() {
  for (const k of Core.SECTIONS) {
    const box = document.querySelector('.items-container[data-section="' + k + '"]');
    const items = st.current ? st.current.sections[k] : [];
    box.replaceChildren();
    items.forEach((it, i) => box.append(itemEl(it, k, i, items.length)));
    document.querySelector('[data-count="' + k + '"]').textContent = items.length ? '(' + new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(items.length) + ')' : '';
    document.querySelector('[data-empty="' + k + '"]').hidden = items.length > 0;
    const add = document.querySelector('.add-item-btn[data-section="' + k + '"]');
    add.disabled = !st.current; add.setAttribute('aria-label', t('canvas.addTo', { name: t('canvas.' + k) })); add.title = add.getAttribute('aria-label');
  }
  if (st.focusAfter) {
    const f = st.focusAfter; st.focusAfter = null;
    const el = document.querySelector('.canvas-item[data-item-id="' + CSS.escape(f.id) + '"] [data-act="' + f.act + '"]');
    const fallback = document.querySelector('.canvas-item[data-item-id="' + CSS.escape(f.id) + '"] [data-act]:not(:disabled)');
    (el && !el.disabled ? el : fallback)?.focus();
  }
}
function renderAll() { renderSelector(); renderCanvas(); }

function iconBtn(act, icon, label, fn, disabled) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'item-action-btn ' + act; b.dataset.act = act;
  b.textContent = icon; b.title = label; b.setAttribute('aria-label', label); b.disabled = !!disabled;
  b.addEventListener('click', fn); return b;
}
function itemEl(item, section, index, total) {
  const el = document.createElement('div');
  el.className = 'canvas-item'; el.draggable = true; el.dataset.itemId = item.id; el.dataset.section = section;
  const c = document.createElement('div'); c.className = 'item-content'; c.textContent = item.text;
  const a = document.createElement('div'); a.className = 'item-actions';
  const snippet = item.text.length > 40 ? item.text.slice(0, 40) + '…' : item.text;
  a.append(
    iconBtn('up', '▲', t('item.moveUp') + ': ' + snippet, () => shift(item.id, -1), index === 0),
    iconBtn('down', '▼', t('item.moveDown') + ': ' + snippet, () => shift(item.id, 1), index === total - 1),
    iconBtn('edit', '✎', t('item.edit') + ': ' + snippet, () => editItem(item.id)),
    iconBtn('delete', '🗑', t('item.delete') + ': ' + snippet, () => removeItem(item.id)));
  el.append(c, a); setupDrag(el); return el;
}

/* ---------- drag & drop (mouse); buttons/dialog cover keyboard & touch ---------- */
function clearDrop() { document.querySelectorAll('.drop-before,.drop-after,.drag-over').forEach(e => e.classList.remove('drop-before', 'drop-after', 'drag-over')); }
function setupDrag(el) {
  el.addEventListener('dragstart', e => {
    st.drag = { id: el.dataset.itemId }; el.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', el.dataset.itemId); } catch {}
  });
  el.addEventListener('dragend', () => { st.drag = null; el.classList.remove('dragging'); clearDrop(); });
  el.addEventListener('dragover', e => {
    if (!st.drag || st.drag.id === el.dataset.itemId) return;
    e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move';
    const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
    clearDrop(); el.classList.add(after ? 'drop-after' : 'drop-before');
  });
  el.addEventListener('drop', e => {
    if (!st.drag || st.drag.id === el.dataset.itemId) return;
    e.preventDefault(); e.stopPropagation();
    const r = el.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
    const box = el.parentElement, drag = st.drag.id;
    const ids = [...box.querySelectorAll('.canvas-item')].map(x => x.dataset.itemId).filter(x => x !== drag);
    dropAt(drag, el.dataset.section, ids.indexOf(el.dataset.itemId) + (after ? 1 : 0));
  });
}
function setupContainers() {
  document.querySelectorAll('.items-container').forEach(box => {
    box.addEventListener('dragover', e => { if (!st.drag) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; box.classList.add('drag-over'); });
    box.addEventListener('dragleave', e => { if (!box.contains(e.relatedTarget)) box.classList.remove('drag-over'); });
    box.addEventListener('drop', e => {
      if (!st.drag) return; e.preventDefault();
      const drag = st.drag.id, n = [...box.querySelectorAll('.canvas-item')].filter(x => x.dataset.itemId !== drag).length;
      dropAt(drag, box.dataset.section, n);
    });
  });
}
async function dropAt(id, section, index) {
  clearDrop();
  const r = Core.moveItem(st.current, id, section, index);
  if (!r.ok) { if (r.error === 'limit') toast(t('item.limit'), 'warning'); return; }
  st.focusAfter = null; renderCanvas();
  if (await persist(st.current) && r.crossed) toast(t('item.moved'), 'success');
}

/* ---------- item actions ---------- */
function needBoard() { if (st.current) return true; toast(t('board.selectFirst'), 'warning'); return false; }
const ERR = { limit: 'item.limit', empty: 'item.required' };
async function addItem(section) {
  if (!needBoard()) return;
  const r = await askItem(t('item.add'), '', section); if (!r) return;
  const res = Core.addItem(st.current, r.section, r.text);
  if (!res.ok) return toast(t(ERR[res.error] || 'app.saveError'), 'warning');
  renderAll(); if (await persist(st.current)) toast(t('item.added'), 'success');
}
async function editItem(id) {
  const f = Core.findItem(st.current, id); if (!f) return;
  const r = await askItem(t('item.edit'), f.item.text, f.section); if (!r) return;
  const res = Core.updateItem(st.current, id, r.text, r.section);
  if (!res.ok) return toast(t(ERR[res.error] || 'app.saveError'), 'warning');
  st.focusAfter = { id, act: 'edit' }; renderAll(); if (await persist(st.current)) toast(t('item.updated'), 'success');
}
async function removeItem(id) {
  const board = st.current, d = Core.deleteItem(board, id); if (!d) return;
  st.undo = { boardId: board.id, ...d }; renderCanvas();
  if (await persist(board)) toast(t('item.deleted'), 'success', { label: t('item.undo'), fn: undoDelete });
}
async function undoDelete() {
  const u = st.undo; st.undo = null;
  const board = u && st.boards.find(b => b.id === u.boardId); if (!board) return;
  if (!Core.restoreItem(board, u.section, u.item, u.index)) return toast(t('item.limit'), 'warning');
  if (board === st.current) st.focusAfter = { id: u.item.id, act: 'edit' };
  renderAll(); if (await persist(board)) toast(t('item.restored'), 'success');
}
async function shift(id, delta) {
  if (!Core.shiftItem(st.current, id, delta)) return;
  st.focusAfter = { id, act: delta < 0 ? 'up' : 'down' }; renderCanvas(); await persist(st.current);
}

/* ---------- boards ---------- */
function sortBoards() { st.boards.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
function setCurrent(b) { st.current = b || null; if (b) localStorage.setItem('currentBoardId', b.id); else localStorage.removeItem('currentBoardId'); st.undo = null; renderAll(); }
async function newBoard() {
  if (st.boards.length >= Core.LIMITS.boards) return toast(t('board.limit'), 'warning');
  const name = await askName(t('board.newTitle'), ''); if (!name) return;
  const b = Core.createBoard(name); st.boards.unshift(b); setCurrent(b);
  if (await persist(b)) toast(t('board.created'), 'success');
}
async function renameBoard() {
  if (!needBoard()) return;
  const name = await askName(t('board.renameTitle'), st.current.name); if (!name) return;
  st.current.name = name; st.current.updatedAt = new Date().toISOString(); renderSelector();
  if (await persist(st.current)) toast(t('board.renamed'), 'success');
}
async function deleteBoard() {
  if (!needBoard() || !await askConfirm(t('board.deleteConfirm'))) return;
  const id = st.current.id; st.boards = st.boards.filter(b => b.id !== id); setCurrent(st.boards[0] || null);
  try { await store.del(id); toast(t('board.deleted'), 'success'); } catch { toast(t('app.saveError'), 'error'); }
}
async function clearBoard() {
  if (!needBoard() || !await askConfirm(t('board.clearConfirm'))) return;
  Core.clearBoard(st.current); renderAll(); if (await persist(st.current)) toast(t('board.cleared'), 'success');
}
function exportBoard() {
  if (!needBoard()) return;
  const blob = new Blob([JSON.stringify(Core.exportBoard(st.current), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  const safe = boardName(st.current).replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-').trim().slice(0, 60) || 'board';
  a.href = url; a.download = safe + '_' + new Date().toISOString().split('T')[0] + '.json'; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  toast(t('board.exported'), 'success');
}
async function importBoard(file) {
  if (file.size > 2 * 1024 * 1024) return toast(t('board.importTooBig'), 'error');
  let res;
  try { res = Core.sanitizeImport(JSON.parse(await file.text())); } catch { return toast(t('board.importError'), 'error'); }
  if (!res.boards.length) return toast(t('board.importError'), 'error');
  const room = Core.LIMITS.boards - st.boards.length;
  if (room <= 0) return toast(t('board.limit'), 'warning');
  const added = [];
  for (const b of res.boards.slice(0, room)) {
    if (st.boards.some(x => x.id === b.id)) { b.id = Core.newId(); b.name = (b.name || t('board.untitled')) + ' (' + t('board.copy') + ')'; }
    b.updatedAt = new Date().toISOString(); st.boards.unshift(b); added.push(b);
  }
  setCurrent(added[0]);
  let ok = true; for (const b of added) ok = (await persist(b)) && ok;
  if (ok) toast(t('board.imported'), 'success');
}

function bind() {
  $('newBoardBtn').addEventListener('click', newBoard);
  $('renameBoardBtn').addEventListener('click', renameBoard);
  $('deleteBoardBtn').addEventListener('click', deleteBoard);
  $('clearBoardBtn').addEventListener('click', clearBoard);
  $('exportBtn').addEventListener('click', exportBoard);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) importBoard(f); e.target.value = ''; });
  $('boardSelector').addEventListener('change', e => setCurrent(st.boards.find(b => b.id === e.target.value)));
  document.querySelectorAll('.add-item-btn').forEach(b => b.addEventListener('click', () => addItem(b.dataset.section)));
  $('itemText').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); $('itemDialog').querySelector('form').requestSubmit(); } });
  setupContainers();
  window.addEventListener('themeChanged', e => applyTheme(e.detail));
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); renderAll(); });
}

async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n(); bind();
  await store.init();
  if (st.volatile) toast(t('app.volatile'), 'warning');
  let raw = []; try { raw = await store.all(); } catch (e) { console.error(e); toast(t('app.loadError'), 'error'); }
  const changed = [];
  st.boards = raw.map(r => { const b = Core.normalizeBoard(r); if (b && JSON.stringify(Core.serialize(b)) !== JSON.stringify(r)) changed.push(b); return b; }).filter(Boolean);
  sortBoards();
  for (const b of changed) await persist(b);
  const cur = localStorage.getItem('currentBoardId');
  st.current = st.boards.find(b => b.id === cur) || st.boards[0] || null;
  if (!st.current) { const b = Core.createBoard(t('board.defaultName')); st.boards.push(b); st.current = b; await persist(b); }
  setCurrent(st.current);
}
init().catch(e => { console.error('init failed', e); toast(t('app.loadError'), 'error'); });
})();
