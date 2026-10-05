(() => {
'use strict';
const M = window.MindCore;
const $ = id => document.getElementById(id);
const KEY = 'mindMapData', SVGNS = 'http://www.w3.org/2000/svg';
let T = {}, lang = localStorage.getItem('lang') || 'fa';
if (lang !== 'en') lang = 'fa';
const st = { map: M.emptyMap(), sel: null, connectMode: false, first: null, undo: null, sizes: {}, editingId: null, saveTimer: null, toastTimer: null, panned: false };

const t = (k, v) => { let s = (T[lang] && T[lang][k]) ?? (T.fa && T.fa[k]) ?? k; if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b); return s; };
const svgEl = (name, attrs) => { const e = document.createElementNS(SVGNS, name); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
const nodeTitle = n => n.title || t('untitledNode');

function applyTheme(th) { const v = th === 'dark' ? 'dark' : 'light'; document.documentElement.setAttribute('data-theme', v); document.body.setAttribute('data-theme', v); }
function applyI18n() {
  const r = document.documentElement; r.lang = lang; r.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(e => { const s = t(e.dataset.i18nTitle); e.title = s; e.setAttribute('aria-label', s); });
  document.title = t('title'); $('modeLabel').textContent = t(st.connectMode ? 'connectActive' : 'connect');
}
function toast(msg, type, action) {
  const el = $('toast'), b = $('toastAction'); $('toastMsg').textContent = msg; el.className = 'toast show ' + (type || 'info');
  b.hidden = !action; b.onclick = null;
  if (action) { b.textContent = action.label; b.onclick = () => { el.classList.remove('show'); action.fn(); }; }
  clearTimeout(st.toastTimer); st.toastTimer = setTimeout(() => el.classList.remove('show'), action ? 7000 : 3000);
}
function openForm(dlg, fill, read) {
  return new Promise(resolve => {
    const form = dlg.querySelector('form'), err = dlg.querySelector('.form-error'); let settled = false;
    if (err) err.hidden = true;
    const finish = v => { if (settled) return; settled = true; form.removeEventListener('submit', onSubmit); dlg.removeEventListener('close', onClose); dlg.removeEventListener('click', onBg); dlg.querySelectorAll('[data-close],#cancelBtn').forEach(b => b.removeEventListener('click', onCancel)); resolve(v); };
    const onSubmit = e => { e.preventDefault(); const r = read(); if (r && r.error) { err.textContent = t(r.error); err.hidden = false; return; } finish(r ? r.value : true); dlg.close(); };
    const onCancel = () => dlg.close(), onClose = () => finish(null), onBg = e => { if (e.target === dlg) dlg.close(); };
    form.addEventListener('submit', onSubmit); dlg.addEventListener('close', onClose); dlg.addEventListener('click', onBg);
    dlg.querySelectorAll('[data-close],#cancelBtn').forEach(b => b.addEventListener('click', onCancel));
    fill(); dlg.showModal();
  });
}
const askConfirm = msg => openForm($('confirmDialog'), () => { $('confirmMessage').textContent = msg; }, () => ({ value: true })).then(v => v === true);

/* ---------- persistence ---------- */
function setStatus(msg, err) { const s = $('saveStatus'); s.textContent = msg; s.classList.toggle('err', !!err); }
function saveNow() {
  clearTimeout(st.saveTimer); st.saveTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(M.serialize(st.map))); setStatus(t('saved')); } catch (e) { console.error(e); setStatus(t('saveError'), true); toast(t('saveError'), 'error'); }
}
function scheduleSave() { setStatus(t('saving')); clearTimeout(st.saveTimer); st.saveTimer = setTimeout(saveNow, 400); }

/* ---------- view ---------- */
const viewport = () => { const r = $('canvas').getBoundingClientRect(); return { w: r.width, h: r.height, left: r.left, top: r.top }; };
function applyView() { const v = st.map.view; $('world').style.transform = 'translate(' + v.x + 'px,' + v.y + 'px) scale(' + v.scale + ')'; }
function measure() {
  st.sizes = {};
  document.querySelectorAll('.node').forEach(el => { st.sizes[el.dataset.id] = { w: el.offsetWidth, h: el.offsetHeight }; });
}
const rectOf = n => { const s = st.sizes[n.id] || M.DEFAULT_SIZE; return { x: n.x, y: n.y, w: s.w, h: s.h }; };
function fit() {
  const vp = viewport(); st.map.view = M.fitView(st.map.nodes.map(rectOf), vp.w, vp.h, 50); applyView(); scheduleSave();
}
function zoom(factor) { const vp = viewport(); st.map.view = M.zoomAt(st.map.view, factor, vp.w / 2, vp.h / 2); applyView(); scheduleSave(); }

/* ---------- rendering ---------- */
function renderEdges() {
  const svg = $('edges'); svg.replaceChildren();
  const defs = svgEl('defs', {});
  [['arrow', 'edge-arrow'], ['arrow-sel', 'edge-arrow sel']].forEach(([id, cls]) => {
    const mk = svgEl('marker', { id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '8', markerHeight: '8', orient: 'auto-start-reverse', markerUnits: 'userSpaceOnUse' });
    mk.append(svgEl('path', { d: 'M0,0 L10,5 L0,10 z', class: cls })); defs.append(mk);
  });
  svg.append(defs);
  st.map.connections.forEach(c => {
    const a = M.findNode(st.map, c.from), b = M.findNode(st.map, c.to); if (!a || !b) return;
    const g = M.edgeGeometry(rectOf(a), rectOf(b)); if (!g) return;
    const sel = st.sel && st.sel.type === 'edge' && st.sel.id === c.id;
    const grp = svgEl('g', { class: 'edge' + (sel ? ' selected' : ''), 'data-id': c.id, role: 'button', tabindex: '0', 'aria-label': t('edgeLabel', { a: nodeTitle(a), b: nodeTitle(b) }), 'aria-pressed': String(!!sel) });
    const d = 'M' + g.x1 + ',' + g.y1 + ' L' + g.x2 + ',' + g.y2;
    grp.append(svgEl('path', { d, class: 'edge-hit' }), svgEl('path', { d, class: 'edge-line', 'marker-end': 'url(#' + (sel ? 'arrow-sel' : 'arrow') + ')' }));
    grp.addEventListener('pointerdown', e => e.stopPropagation());
    grp.addEventListener('click', e => { e.stopPropagation(); select({ type: 'edge', id: c.id }); });
    grp.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select({ type: 'edge', id: c.id }); } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeEdge(c.id); } });
    svg.append(grp);
    if (sel) {
      const mx = (g.x1 + g.x2) / 2, my = (g.y1 + g.y2) / 2, del = svgEl('g', { class: 'edge-del', role: 'button', tabindex: '0', 'aria-label': t('deleteEdge') });
      del.append(svgEl('circle', { cx: mx, cy: my, r: '12' }), svgEl('text', { x: mx, y: my + 5, 'text-anchor': 'middle' }));
      del.lastChild.textContent = '✕';
      del.addEventListener('pointerdown', e => e.stopPropagation()); del.addEventListener('click', e => { e.stopPropagation(); removeEdge(c.id); });
      svg.append(del);
    }
  });
}
function renderNodes() {
  const box = $('nodesContainer'); box.replaceChildren();
  st.map.nodes.forEach(n => box.append(nodeEl(n)));
  $('emptyHint').hidden = st.map.nodes.length > 0;
  requestAnimationFrame(() => { measure(); renderEdges(); });
}
function nodeEl(n) {
  const el = document.createElement('div'); el.className = 'node' + (st.sel && st.sel.type === 'node' && st.sel.id === n.id ? ' selected' : '') + (st.first === n.id ? ' connect-source' : '');
  el.dataset.id = n.id; el.tabIndex = 0; el.setAttribute('role', 'group'); el.setAttribute('aria-label', nodeTitle(n));
  el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; el.style.setProperty('--node-color', n.color);
  const head = document.createElement('div'); head.className = 'node-header';
  const ttl = document.createElement('div'); ttl.className = 'node-title'; ttl.dir = 'auto'; ttl.textContent = nodeTitle(n);
  const acts = document.createElement('div'); acts.className = 'node-actions';
  const mk = (cls, txt, key, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'node-btn ' + cls; b.textContent = txt; b.title = t(key); b.setAttribute('aria-label', t(key) + ': ' + nodeTitle(n)); b.addEventListener('pointerdown', e => e.stopPropagation()); b.addEventListener('click', e => { e.stopPropagation(); fn(); }); return b; };
  acts.append(mk('child-btn', '＋', 'addChild', () => addChild(n.id)), mk('edit-btn', '✏️', 'editNode', () => editNode(n.id)), mk('delete-btn', '✖️', 'deleteNode', () => removeNode(n.id)));
  head.append(ttl, acts); el.append(head);
  if (n.description) { const d = document.createElement('div'); d.className = 'node-description'; d.dir = 'auto'; d.textContent = n.description; el.append(d); }
  el.addEventListener('pointerdown', e => onNodePointerDown(e, n, el));
  el.addEventListener('keydown', e => onNodeKey(e, n));
  if (window.ResizeObserver) new ResizeObserver(() => { const s = st.sizes[n.id]; if (s && (s.w !== el.offsetWidth || s.h !== el.offsetHeight)) { s.w = el.offsetWidth; s.h = el.offsetHeight; renderEdges(); } }).observe(el);
  return el;
}
function select(sel) {
  st.sel = sel;
  document.querySelectorAll('.node.selected').forEach(e => e.classList.remove('selected'));
  if (sel && sel.type === 'node') { const el = document.querySelector('.node[data-id="' + CSS.escape(sel.id) + '"]'); el && el.classList.add('selected'); }
  $('deleteEdgeBtn').disabled = !(sel && sel.type === 'edge'); renderEdges();
}

/* ---------- interaction ---------- */
function onNodePointerDown(e, node, el) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (e.target.closest('button')) return;
  e.stopPropagation(); try { el.setPointerCapture(e.pointerId); } catch {}
  const start = { px: e.clientX, py: e.clientY, x: node.x, y: node.y }; let moved = false;
  const move = ev => {
    if (!moved && Math.hypot(ev.clientX - start.px, ev.clientY - start.py) < 4) return;
    moved = true; el.classList.add('dragging');
    const s = st.map.view.scale; M.moveNode(st.map, node.id, start.x + (ev.clientX - start.px) / s, start.y + (ev.clientY - start.py) / s);
    el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; renderEdges();
  };
  const up = () => {
    el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); el.classList.remove('dragging');
    if (moved) scheduleSave(); else onNodeClick(node);
  };
  el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
function onNodeClick(node) {
  if (!st.connectMode) { select({ type: 'node', id: node.id }); return; }
  if (!st.first) { st.first = node.id; select({ type: 'node', id: node.id }); markSource(); toast(t('firstSelected'), 'info'); return; }
  if (st.first === node.id) { st.first = null; markSource(); select(null); return; }
  const r = M.connect(st.map, st.first, node.id);
  st.first = null; markSource(); select(null);
  if (r.ok) { renderEdges(); scheduleSave(); toast(t('connectionCreated'), 'success'); } else toast(t(r.error === 'exists' ? 'connectionExists' : r.error === 'limit' ? 'limitReached' : 'error'), 'error');
}
function markSource() { document.querySelectorAll('.node').forEach(e => e.classList.toggle('connect-source', e.dataset.id === st.first)); }
function onNodeKey(e, n) {
  if (e.target.closest('button')) return;
  const step = e.shiftKey ? 40 : 10, el = e.currentTarget;
  const mv = (dx, dy) => { e.preventDefault(); M.moveNode(st.map, n.id, n.x + dx, n.y + dy); el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; renderEdges(); scheduleSave(); };
  if (e.key === 'ArrowLeft') mv(-step, 0); else if (e.key === 'ArrowRight') mv(step, 0); else if (e.key === 'ArrowUp') mv(0, -step); else if (e.key === 'ArrowDown') mv(0, step);
  else if (e.key === 'Enter' || e.key === 'F2') { e.preventDefault(); editNode(n.id); }
  else if (e.key === 'Delete') { e.preventDefault(); removeNode(n.id); }
  else if (e.key === ' ') { e.preventDefault(); onNodeClick(n); }
}
function bindCanvas() {
  const cv = $('canvas');
  cv.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest('.node,.edge,.edge-del')) return;
    const v = st.map.view, start = { px: e.clientX, py: e.clientY, x: v.x, y: v.y }; let moved = false;
    try { cv.setPointerCapture(e.pointerId); } catch {}
    const move = ev => { if (!moved && Math.hypot(ev.clientX - start.px, ev.clientY - start.py) < 4) return; moved = true; cv.classList.add('panning'); st.map.view = { ...st.map.view, x: Math.round(start.x + ev.clientX - start.px), y: Math.round(start.y + ev.clientY - start.py) }; applyView(); };
    const up = () => { cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerup', up); cv.removeEventListener('pointercancel', up); cv.classList.remove('panning'); if (moved) scheduleSave(); else { select(null); if (st.first) { st.first = null; markSource(); } } };
    cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  });
  cv.addEventListener('wheel', e => { e.preventDefault(); const vp = viewport(); st.map.view = M.zoomAt(st.map.view, e.deltaY < 0 ? 1.1 : 1 / 1.1, e.clientX - vp.left, e.clientY - vp.top); applyView(); scheduleSave(); }, { passive: false });
}

/* ---------- actions ---------- */
function centerPoint(jitter) { const vp = viewport(), v = st.map.view, off = (st.map.nodes.length % 6) * 24 * (jitter ? 1 : 0); return { x: (vp.w / 2 - v.x) / v.scale - 90 + off, y: (vp.h / 2 - v.y) / v.scale - 32 + off }; }
async function addNode() {
  const p = centerPoint(true), r = M.addNode(st.map, { title: '', x: p.x, y: p.y });
  if (!r.ok) return toast(t('limitNodes'), 'warning');
  renderNodes(); scheduleSave(); await editNode(r.node.id, true);
}
async function addChild(parentId) {
  const r = M.addChild(st.map, parentId, st.sizes); if (!r.ok) return toast(t('limitNodes'), 'warning');
  renderNodes(); scheduleSave(); await editNode(r.node.id, true);
}
async function editNode(id, isNew) {
  const n = M.findNode(st.map, id); if (!n) return;
  const ti = $('nodeTitle'), de = $('nodeDescription'), co = $('nodeColor');
  const d = await openForm($('nodeDialog'), () => { $('nodeDlgTitle').textContent = t(isNew ? 'newNode' : 'editNode'); ti.value = n.title; de.value = n.description; co.value = M.COLORS.includes(n.color) ? n.color : M.COLORS[0]; setTimeout(() => { ti.focus(); ti.select(); }, 0); },
    () => { const title = M.cleanLine(ti.value, M.LIMITS.title); return title ? { value: { title, description: de.value, color: co.value } } : { error: 'titleRequired' }; });
  if (!d) { if (isNew && !n.title) { /* keep the empty node: it shows a default label */ } return; }
  M.updateNode(st.map, id, d); renderNodes(); scheduleSave();
  const el = document.querySelector('.node[data-id="' + CSS.escape(id) + '"]'); el && el.focus();
}
function removeNode(id) {
  const d = M.deleteNode(st.map, id); if (!d) return;
  st.undo = { type: 'node', d }; if (st.sel && st.sel.id === id) st.sel = null; if (st.first === id) st.first = null;
  renderNodes(); scheduleSave(); toast(t('nodeDeleted'), 'info', { label: t('undo'), fn: undo });
}
function removeEdge(id) {
  const d = M.deleteConnection(st.map, id); if (!d) return;
  st.undo = { type: 'edge', d }; st.sel = null; $('deleteEdgeBtn').disabled = true; renderEdges(); scheduleSave(); toast(t('connectionDeleted'), 'info', { label: t('undo'), fn: undo });
}
function undo() {
  const u = st.undo; st.undo = null; if (!u) return;
  const ok = u.type === 'node' ? M.restoreNode(st.map, u.d) : M.restoreConnection(st.map, u.d);
  if (!ok) return toast(t('error'), 'error');
  renderNodes(); scheduleSave(); toast(t('restored'), 'success');
}
function toggleMode() {
  st.connectMode = !st.connectMode; st.first = null; markSource();
  const b = $('toggleModeBtn'); b.classList.toggle('active', st.connectMode); b.setAttribute('aria-pressed', String(st.connectMode)); $('modeLabel').textContent = t(st.connectMode ? 'connectActive' : 'connect');
  $('canvas').classList.toggle('connecting', st.connectMode); toast(t(st.connectMode ? 'connectModeOn' : 'connectModeOff'), 'info');
}
async function clearAll() {
  if (!st.map.nodes.length) return toast(t('nothingToClear'), 'info');
  if (!await askConfirm(t('confirmClear'))) return;
  st.map = M.emptyMap(); st.sel = null; st.first = null; st.undo = null; applyView(); renderNodes(); scheduleSave(); toast(t('cleared'), 'info');
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(M.serialize(st.map), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = 'mindmap-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url); toast(t('exported'), 'success');
}
async function importFile(file) {
  if (file.size > 2 * 1024 * 1024) return toast(t('importTooBig'), 'error');
  let m; try { m = M.normalizeMap(JSON.parse(await file.text()), { legacyWidth: viewport().w }); } catch { m = null; }
  if (!m) return toast(t('importError'), 'error');
  if (st.map.nodes.length && !await askConfirm(t('confirmReplace'))) return;
  st.map = m; st.sel = null; st.first = null; st.undo = null; applyView(); renderNodes(); requestAnimationFrame(() => { if (m.nodes.length) fit(); }); scheduleSave(); toast(t('importOk'), 'success');
}

function bind() {
  $('addNodeBtn').addEventListener('click', addNode); $('toggleModeBtn').addEventListener('click', toggleMode);
  $('deleteEdgeBtn').addEventListener('click', () => { if (st.sel && st.sel.type === 'edge') removeEdge(st.sel.id); });
  $('zoomInBtn').addEventListener('click', () => zoom(1.2)); $('zoomOutBtn').addEventListener('click', () => zoom(1 / 1.2)); $('fitBtn').addEventListener('click', fit);
  $('exportBtn').addEventListener('click', exportJSON); $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => { const f = e.target.files[0]; if (f) importFile(f); e.target.value = ''; });
  $('clearBtn').addEventListener('click', clearAll); bindCanvas();
  document.addEventListener('keydown', e => {
    if (document.querySelector('dialog[open]') || /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName)) return;
    if (e.key === 'Escape') { if (st.connectMode && st.first) { st.first = null; markSource(); } select(null); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && st.sel && st.sel.type === 'edge') { e.preventDefault(); removeEdge(st.sel.id); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && st.undo) { e.preventDefault(); undo(); }
  });
  window.addEventListener('resize', () => { measure(); renderEdges(); });
  window.addEventListener('beforeunload', () => { if (st.saveTimer) saveNow(); });
  window.addEventListener('themeChanged', e => applyTheme(e.detail));
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); renderNodes(); });
}

function load() {
  let raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch {}
  const m = M.normalizeMap(raw, { legacyWidth: viewport().w || 1000 });
  if (m) { st.map = m; if (raw && raw.v !== 2) saveNow(); }
}
async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n(); bind(); load(); applyView(); renderNodes();
}
init().catch(e => { console.error('init failed', e); toast(t('loadError'), 'error'); });
})();
