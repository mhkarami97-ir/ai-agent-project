(function (root) {
'use strict';
const SECTIONS = ['problems', 'solution', 'benefits', 'users', 'metrics', 'channels', 'costs', 'revenue'];
const LIMITS = { name: 80, text: 500, items: 200, boards: 50 };
const iso = v => (typeof v === 'string' && !isNaN(Date.parse(v)) ? v : null);
const clean = (s, max) => typeof s === 'string' ? s.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '';
function newId() {
  return (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
const nowIso = () => new Date().toISOString();
const emptySections = () => { const o = {}; SECTIONS.forEach(k => { o[k] = []; }); return o; };

function normalizeBoard(raw, gen, now) {
  gen = gen || newId; now = now || nowIso();
  if (!raw || typeof raw !== 'object') return null;
  const seen = new Set(), sections = emptySections(), src = raw.sections && typeof raw.sections === 'object' ? raw.sections : {};
  for (const k of SECTIONS) {
    const arr = Array.isArray(src[k]) ? src[k] : [];
    for (const r of arr) {
      if (sections[k].length >= LIMITS.items) break;
      if (!r || typeof r !== 'object') continue;
      const text = clean(r.text, LIMITS.text); if (!text) continue;
      let id = typeof r.id === 'string' && r.id && r.id.length <= 64 ? r.id : gen();
      while (seen.has(id)) id = gen();
      seen.add(id);
      const it = { id, text, createdAt: iso(r.createdAt) || now };
      const u = iso(r.updatedAt); if (u) it.updatedAt = u;
      sections[k].push(it);
    }
  }
  let id = typeof raw.id === 'string' && raw.id && raw.id.length <= 64 ? raw.id : (Number.isFinite(raw.id) ? String(raw.id) : gen());
  return { id, name: clean(raw.name, LIMITS.name), sections, createdAt: iso(raw.createdAt) || now, updatedAt: iso(raw.updatedAt) || now };
}
function createBoard(name, gen, now) {
  now = now || nowIso();
  return { id: (gen || newId)(), name: clean(name, LIMITS.name), sections: emptySections(), createdAt: now, updatedAt: now };
}
function findItem(board, id) {
  for (const k of SECTIONS) { const i = board.sections[k].findIndex(x => x.id === id); if (i >= 0) return { section: k, index: i, item: board.sections[k][i] }; }
  return null;
}
const touch = (b, now) => { b.updatedAt = now || nowIso(); };

function addItem(board, section, text, gen, now) {
  if (!SECTIONS.includes(section)) return { ok: false, error: 'section' };
  const t = clean(text, LIMITS.text); if (!t) return { ok: false, error: 'empty' };
  if (board.sections[section].length >= LIMITS.items) return { ok: false, error: 'limit' };
  const n = now || nowIso(), ids = new Set(SECTIONS.flatMap(k => board.sections[k].map(x => x.id)));
  let id = (gen || newId)(); while (ids.has(id)) id = (gen || newId)();
  const item = { id, text: t, createdAt: n };
  board.sections[section].push(item); touch(board, n);
  return { ok: true, item };
}
function updateItem(board, id, text, newSection, now) {
  const f = findItem(board, id); if (!f) return { ok: false, error: 'notfound' };
  const t = clean(text, LIMITS.text); if (!t) return { ok: false, error: 'empty' };
  const n = now || nowIso();
  if (newSection && newSection !== f.section) {
    if (!SECTIONS.includes(newSection)) return { ok: false, error: 'section' };
    if (board.sections[newSection].length >= LIMITS.items) return { ok: false, error: 'limit' };
    board.sections[f.section].splice(f.index, 1); board.sections[newSection].push(f.item);
  }
  f.item.text = t; f.item.updatedAt = n; touch(board, n);
  return { ok: true, item: f.item };
}
function deleteItem(board, id, now) {
  const f = findItem(board, id); if (!f) return null;
  board.sections[f.section].splice(f.index, 1); touch(board, now);
  return { item: f.item, section: f.section, index: f.index };
}
function restoreItem(board, section, item, index, now) {
  if (!SECTIONS.includes(section) || findItem(board, item.id) || board.sections[section].length >= LIMITS.items) return false;
  const arr = board.sections[section]; arr.splice(Math.max(0, Math.min(index, arr.length)), 0, item); touch(board, now); return true;
}
function moveItem(board, id, toSection, toIndex, now) {
  const f = findItem(board, id); if (!f || !SECTIONS.includes(toSection)) return { ok: false };
  if (toSection !== f.section && board.sections[toSection].length >= LIMITS.items) return { ok: false, error: 'limit' };
  board.sections[f.section].splice(f.index, 1);
  const dest = board.sections[toSection];
  const idx = Math.max(0, Math.min(Number.isInteger(toIndex) ? toIndex : dest.length, dest.length));
  dest.splice(idx, 0, f.item); touch(board, now);
  return { ok: true, changed: toSection !== f.section || idx !== f.index, crossed: toSection !== f.section };
}
function shiftItem(board, id, delta, now) {
  const f = findItem(board, id); if (!f) return false;
  const arr = board.sections[f.section], j = f.index + delta;
  if (j < 0 || j >= arr.length) return false;
  [arr[f.index], arr[j]] = [arr[j], arr[f.index]]; touch(board, now); return true;
}
function clearBoard(board, now) { board.sections = emptySections(); touch(board, now); }
function serialize(board) { return { id: board.id, name: board.name, sections: board.sections, createdAt: board.createdAt, updatedAt: board.updatedAt }; }
function exportBoard(board) { return Object.assign({ version: 1 }, serialize(board)); }
function sanitizeImport(parsed, gen, now) {
  let list = [];
  if (Array.isArray(parsed)) list = parsed;
  else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.boards)) list = parsed.boards;
  else if (parsed && typeof parsed === 'object' && parsed.sections) list = [parsed];
  const boards = []; let skipped = 0;
  for (const r of list.slice(0, LIMITS.boards)) { const b = normalizeBoard(r, gen, now); if (b) boards.push(b); else skipped++; }
  return { boards, skipped };
}
const api = { SECTIONS, LIMITS, clean, newId, normalizeBoard, createBoard, findItem, addItem, updateItem, deleteItem, restoreItem, moveItem, shiftItem, clearBoard, serialize, exportBoard, sanitizeImport };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CanvasCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
