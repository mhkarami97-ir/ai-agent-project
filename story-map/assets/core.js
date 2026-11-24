(function (root) {
'use strict';
const STATUSES = ['pending', 'in-progress', 'completed', 'rejected'];
const LIMITS = { boards: 50, columns: 30, stories: 200, name: 80, colTitle: 60, title: 120, desc: 1000, points: 1000 };
const iso = v => (typeof v === 'string' && !isNaN(Date.parse(v)) ? v : null);
const strip = s => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const cleanLine = (s, max) => typeof s === 'string' ? strip(s).replace(/\s+/g, ' ').trim().slice(0, max) : '';
const cleanText = (s, max) => typeof s === 'string' ? strip(s).replace(/\r\n?/g, '\n').trim().slice(0, max) : '';
const toPoints = v => { const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v; return Number.isFinite(n) ? Math.max(0, Math.min(LIMITS.points, Math.round(n))) : 0; };
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const nowIso = () => new Date().toISOString();
const touch = (b, now) => { b.updatedAt = now || nowIso(); };
const uniqueId = (raw, seen, gen) => { let id = typeof raw === 'string' && raw && raw.length <= 64 ? raw : gen(); while (seen.has(id)) id = gen(); seen.add(id); return id; };

function normalizeStory(r, seen, gen, now) {
  if (!r || typeof r !== 'object') return null;
  const title = cleanLine(r.title, LIMITS.title); if (!title) return null;
  const s = { id: uniqueId(r.id, seen, gen), title, description: cleanText(r.description, LIMITS.desc), points: toPoints(r.points), status: STATUSES.includes(r.status) ? r.status : 'pending', createdAt: iso(r.createdAt) || now };
  s.updatedAt = iso(r.updatedAt) || s.createdAt; return s;
}
function normalizeBoard(raw, gen, now) {
  gen = gen || newId; now = now || nowIso();
  if (!raw || typeof raw !== 'object') return null;
  const seen = new Set(), columns = [];
  for (const c of (Array.isArray(raw.columns) ? raw.columns : []).slice(0, LIMITS.columns)) {
    if (!c || typeof c !== 'object') continue;
    const col = { id: uniqueId(c.id, seen, gen), title: cleanLine(c.title, LIMITS.colTitle), stories: [] };
    for (const s of (Array.isArray(c.stories) ? c.stories : [])) {
      if (col.stories.length >= LIMITS.stories) break;
      const ns = normalizeStory(s, seen, gen, now); if (ns) col.stories.push(ns);
    }
    columns.push(col);
  }
  const id = typeof raw.id === 'string' && raw.id && raw.id.length <= 64 ? raw.id : (Number.isFinite(raw.id) ? String(raw.id) : gen());
  return { id, name: cleanLine(raw.name, LIMITS.name), columns, createdAt: iso(raw.createdAt) || now, updatedAt: iso(raw.updatedAt) || now };
}
const createBoard = (name, gen, now) => { const n = now || nowIso(); return { id: (gen || newId)(), name: cleanLine(name, LIMITS.name), columns: [], createdAt: n, updatedAt: n }; };
function duplicateBoard(board, suffix, gen, now) {
  gen = gen || newId; const n = now || nowIso();
  const copy = JSON.parse(JSON.stringify(board));
  copy.id = gen(); copy.name = cleanLine((board.name || '') + ' (' + suffix + ')', LIMITS.name); copy.createdAt = copy.updatedAt = n;
  copy.columns.forEach(c => { c.id = gen(); c.stories.forEach(s => { s.id = gen(); }); });
  return copy;
}
const findColumn = (b, id) => { const i = b.columns.findIndex(c => c.id === id); return i < 0 ? null : { column: b.columns[i], index: i }; };
function findStory(b, id) {
  for (let ci = 0; ci < b.columns.length; ci++) { const i = b.columns[ci].stories.findIndex(s => s.id === id); if (i >= 0) return { column: b.columns[ci], colIndex: ci, index: i, story: b.columns[ci].stories[i] }; }
  return null;
}
const allIds = b => new Set(b.columns.flatMap(c => [c.id, ...c.stories.map(s => s.id)]));
const fresh = (b, gen) => { const ids = allIds(b); let id = (gen || newId)(); while (ids.has(id)) id = (gen || newId)(); return id; };

function addColumn(b, title, gen, now) {
  const t = cleanLine(title, LIMITS.colTitle); if (!t) return { ok: false, error: 'empty' };
  if (b.columns.length >= LIMITS.columns) return { ok: false, error: 'limit' };
  const col = { id: fresh(b, gen), title: t, stories: [] }; b.columns.push(col); touch(b, now); return { ok: true, column: col };
}
function renameColumn(b, id, title, now) {
  const f = findColumn(b, id); if (!f) return { ok: false, error: 'notfound' };
  const t = cleanLine(title, LIMITS.colTitle); if (!t) return { ok: false, error: 'empty' };
  f.column.title = t; touch(b, now); return { ok: true };
}
function deleteColumn(b, id, now) { const f = findColumn(b, id); if (!f) return null; b.columns.splice(f.index, 1); touch(b, now); return { column: f.column, index: f.index }; }
function restoreColumn(b, col, index, now) {
  if (b.columns.length >= LIMITS.columns || findColumn(b, col.id) || col.stories.some(s => findStory(b, s.id))) return false;
  b.columns.splice(Math.max(0, Math.min(index, b.columns.length)), 0, col); touch(b, now); return true;
}
function moveColumn(b, id, toIndex, now) {
  const f = findColumn(b, id); if (!f) return { ok: false };
  b.columns.splice(f.index, 1);
  const idx = Math.max(0, Math.min(Number.isInteger(toIndex) ? toIndex : b.columns.length, b.columns.length));
  b.columns.splice(idx, 0, f.column); touch(b, now); return { ok: true, changed: idx !== f.index };
}
function shiftColumn(b, id, delta, now) {
  const f = findColumn(b, id); if (!f) return false; const j = f.index + delta;
  if (j < 0 || j >= b.columns.length) return false;
  [b.columns[f.index], b.columns[j]] = [b.columns[j], b.columns[f.index]]; touch(b, now); return true;
}
function storyFields(d) {
  return { title: cleanLine(d && d.title, LIMITS.title), description: cleanText(d && d.description, LIMITS.desc), points: toPoints(d && d.points), status: STATUSES.includes(d && d.status) ? d.status : 'pending' };
}
function addStory(b, colId, data, gen, now) {
  const f = findColumn(b, colId); if (!f) return { ok: false, error: 'column' };
  const d = storyFields(data); if (!d.title) return { ok: false, error: 'empty' };
  if (f.column.stories.length >= LIMITS.stories) return { ok: false, error: 'limit' };
  const n = now || nowIso(), s = { id: fresh(b, gen), ...d, createdAt: n, updatedAt: n };
  f.column.stories.push(s); touch(b, n); return { ok: true, story: s };
}
function updateStory(b, id, data, newColId, now) {
  const f = findStory(b, id); if (!f) return { ok: false, error: 'notfound' };
  const d = storyFields(data); if (!d.title) return { ok: false, error: 'empty' };
  const n = now || nowIso();
  if (newColId && newColId !== f.column.id) {
    const dest = findColumn(b, newColId); if (!dest) return { ok: false, error: 'column' };
    if (dest.column.stories.length >= LIMITS.stories) return { ok: false, error: 'limit' };
    f.column.stories.splice(f.index, 1); dest.column.stories.push(f.story);
  }
  Object.assign(f.story, d, { updatedAt: n }); touch(b, n); return { ok: true, story: f.story };
}
function deleteStory(b, id, now) { const f = findStory(b, id); if (!f) return null; f.column.stories.splice(f.index, 1); touch(b, now); return { story: f.story, colId: f.column.id, index: f.index }; }
function restoreStory(b, colId, story, index, now) {
  const f = findColumn(b, colId); if (!f || f.column.stories.length >= LIMITS.stories || findStory(b, story.id)) return false;
  f.column.stories.splice(Math.max(0, Math.min(index, f.column.stories.length)), 0, story); touch(b, now); return true;
}
function moveStory(b, id, toColId, toIndex, now) {
  const f = findStory(b, id), dest = findColumn(b, toColId); if (!f || !dest) return { ok: false };
  const crossed = dest.column.id !== f.column.id;
  if (crossed && dest.column.stories.length >= LIMITS.stories) return { ok: false, error: 'limit' };
  f.column.stories.splice(f.index, 1);
  const arr = dest.column.stories, idx = Math.max(0, Math.min(Number.isInteger(toIndex) ? toIndex : arr.length, arr.length));
  arr.splice(idx, 0, f.story); touch(b, now); return { ok: true, crossed, changed: crossed || idx !== f.index };
}
function shiftStory(b, id, delta, now) {
  const f = findStory(b, id); if (!f) return false; const a = f.column.stories, j = f.index + delta;
  if (j < 0 || j >= a.length) return false; [a[f.index], a[j]] = [a[j], a[f.index]]; touch(b, now); return true;
}
function cycleStatus(b, id, now) {
  const f = findStory(b, id); if (!f) return null;
  f.story.status = STATUSES[(STATUSES.indexOf(f.story.status) + 1) % STATUSES.length]; f.story.updatedAt = now || nowIso(); touch(b, now); return f.story.status;
}
function clearBoard(b, now) { b.columns = []; touch(b, now); }

// Rejected stories are excluded from totals and progress (they are not planned work).
function colStats(col) {
  const act = col.stories.filter(s => s.status !== 'rejected'), done = act.filter(s => s.status === 'completed');
  const points = act.reduce((a, s) => a + s.points, 0), donePoints = done.reduce((a, s) => a + s.points, 0);
  const progress = points > 0 ? donePoints / points : (act.length ? done.length / act.length : 0);
  return { id: col.id, total: act.length, done: done.length, inProgress: act.filter(s => s.status === 'in-progress').length, rejected: col.stories.length - act.length, points, donePoints, progress };
}
function stats(b) {
  const cols = b.columns.map(colStats), sum = k => cols.reduce((a, c) => a + c[k], 0);
  const total = sum('total'), done = sum('done'), points = sum('points'), donePoints = sum('donePoints');
  return { columns: cols, total, done, inProgress: sum('inProgress'), rejected: sum('rejected'), points, donePoints, progress: points > 0 ? donePoints / points : (total ? done / total : 0) };
}
const serialize = b => ({ id: b.id, name: b.name, columns: b.columns, createdAt: b.createdAt, updatedAt: b.updatedAt });
const exportBoard = b => Object.assign({ version: 1 }, serialize(b));
function sanitizeImport(parsed, gen, now) {
  let list = [];
  if (Array.isArray(parsed)) list = parsed;
  else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.boards)) list = parsed.boards;
  else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.columns)) list = [parsed];
  const boards = []; let skipped = 0;
  for (const r of list.slice(0, LIMITS.boards)) { const b = normalizeBoard(r, gen, now); if (b) boards.push(b); else skipped++; }
  return { boards, skipped };
}
const api = { STATUSES, LIMITS, cleanLine, cleanText, toPoints, newId, normalizeBoard, createBoard, duplicateBoard, findColumn, findStory, addColumn, renameColumn, deleteColumn, restoreColumn, moveColumn, shiftColumn, addStory, updateStory, deleteStory, restoreStory, moveStory, shiftStory, cycleStatus, clearBoard, stats, serialize, exportBoard, sanitizeImport };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StoryCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
