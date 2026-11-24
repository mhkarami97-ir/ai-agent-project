(function (root) {
'use strict';
const LIMITS = { nodes: 500, connections: 2000, title: 120, desc: 1000, coord: 100000 };
const SCALE = { min: 0.2, max: 3 };
const COLORS = ['#4A90E2', '#7ED321', '#F5A623', '#D0021B', '#9013FE', '#50E3C2', '#F8E71C', '#BD10E0'];
const DEFAULT_SIZE = { w: 180, h: 64 };
const strip = s => s.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const cleanLine = (s, max) => typeof s === 'string' ? strip(s).replace(/\s+/g, ' ').trim().slice(0, max) : '';
const cleanText = (s, max) => typeof s === 'string' ? strip(s).replace(/\r\n?/g, '\n').trim().slice(0, max) : '';
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const coord = v => Number.isFinite(v) ? Math.round(clamp(v, -LIMITS.coord, LIMITS.coord)) : 0;
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
const idOf = v => (typeof v === 'string' && v && v.length <= 64 ? v : (Number.isFinite(v) ? String(v) : null));
const color = c => (typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : COLORS[0]);
const normView = v => (v && typeof v === 'object' ? { x: coord(v.x), y: coord(v.y), scale: Number.isFinite(v.scale) ? clamp(v.scale, SCALE.min, SCALE.max) : 1 } : { x: 0, y: 0, scale: 1 });
const emptyMap = () => ({ nodes: [], connections: [], view: { x: 0, y: 0, scale: 1 } });

// Legacy data (no v:2) measured x from the RIGHT edge; convert to left-based using the viewport width at load time.
function normalizeMap(raw, opts) {
  opts = opts || {}; const gen = opts.gen || newId;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.nodes)) return null;
  const legacy = raw.v !== 2, W = Number.isFinite(opts.legacyWidth) ? opts.legacyWidth : 1000;
  const seen = new Set(), nodes = [], idMap = new Map();
  for (const r of raw.nodes.slice(0, LIMITS.nodes)) {
    if (!r || typeof r !== 'object') continue;
    const rawId = idOf(r.id); let id = rawId || gen(); while (seen.has(id)) id = gen(); seen.add(id);
    if (rawId && !idMap.has(rawId)) idMap.set(rawId, id);
    const x = legacy ? W - (Number.isFinite(r.x) ? r.x : 0) - DEFAULT_SIZE.w : r.x;
    nodes.push({ id, title: cleanLine(r.title, LIMITS.title) || '', description: cleanText(r.description, LIMITS.desc), color: color(r.color), x: coord(x), y: coord(r.y) });
  }
  const conns = [], keys = new Set();
  for (const c of (Array.isArray(raw.connections) ? raw.connections : []).slice(0, LIMITS.connections * 2)) {
    if (conns.length >= LIMITS.connections) break;
    if (!c || typeof c !== 'object') continue;
    const f = idMap.get(idOf(c.from)), t = idMap.get(idOf(c.to));
    if (!f || !t || f === t) continue;
    const key = f < t ? f + '|' + t : t + '|' + f; if (keys.has(key)) continue; keys.add(key);
    let id = idOf(c.id) || gen(); while (seen.has(id)) id = gen(); seen.add(id);
    conns.push({ id, from: f, to: t });
  }
  return { nodes, connections: conns, view: normView(raw.view) };
}
const serialize = m => ({ v: 2, nodes: m.nodes, connections: m.connections, view: m.view });
const findNode = (m, id) => m.nodes.find(n => n.id === id) || null;
const fresh = (m, gen) => { const ids = new Set([...m.nodes.map(n => n.id), ...m.connections.map(c => c.id)]); let id = (gen || newId)(); while (ids.has(id)) id = (gen || newId)(); return id; };

function addNode(m, o, gen) {
  if (m.nodes.length >= LIMITS.nodes) return { ok: false, error: 'limit' };
  const n = { id: fresh(m, gen), title: cleanLine(o && o.title, LIMITS.title), description: cleanText(o && o.description, LIMITS.desc), color: color(o && o.color), x: coord(o && o.x), y: coord(o && o.y) };
  m.nodes.push(n); return { ok: true, node: n };
}
function updateNode(m, id, o) {
  const n = findNode(m, id); if (!n) return { ok: false, error: 'notfound' };
  const t = cleanLine(o && o.title, LIMITS.title); if (!t) return { ok: false, error: 'empty' };
  n.title = t; n.description = cleanText(o.description, LIMITS.desc); n.color = color(o.color); return { ok: true, node: n };
}
function moveNode(m, id, x, y) { const n = findNode(m, id); if (!n) return false; n.x = coord(x); n.y = coord(y); return true; }
function deleteNode(m, id) {
  const i = m.nodes.findIndex(n => n.id === id); if (i < 0) return null;
  const node = m.nodes.splice(i, 1)[0], removed = m.connections.filter(c => c.from === id || c.to === id);
  m.connections = m.connections.filter(c => c.from !== id && c.to !== id); return { node, index: i, connections: removed };
}
function restoreNode(m, d) {
  if (m.nodes.length >= LIMITS.nodes || findNode(m, d.node.id)) return false;
  m.nodes.splice(Math.max(0, Math.min(d.index, m.nodes.length)), 0, d.node);
  d.connections.forEach(c => { if (findNode(m, c.from) && findNode(m, c.to) && !hasConnection(m, c.from, c.to) && m.connections.length < LIMITS.connections) m.connections.push(c); }); return true;
}
const hasConnection = (m, a, b) => m.connections.some(c => (c.from === a && c.to === b) || (c.from === b && c.to === a));
function connect(m, from, to, gen) {
  if (from === to) return { ok: false, error: 'self' };
  if (!findNode(m, from) || !findNode(m, to)) return { ok: false, error: 'notfound' };
  if (hasConnection(m, from, to)) return { ok: false, error: 'exists' };
  if (m.connections.length >= LIMITS.connections) return { ok: false, error: 'limit' };
  const c = { id: fresh(m, gen), from, to }; m.connections.push(c); return { ok: true, connection: c };
}
function deleteConnection(m, id) { const i = m.connections.findIndex(c => c.id === id); if (i < 0) return null; return { connection: m.connections.splice(i, 1)[0], index: i }; }
function restoreConnection(m, d) {
  const c = d.connection; if (m.connections.some(x => x.id === c.id) || hasConnection(m, c.from, c.to) || !findNode(m, c.from) || !findNode(m, c.to)) return false;
  m.connections.splice(Math.max(0, Math.min(d.index, m.connections.length)), 0, c); return true;
}
function addChild(m, parentId, sizes, gen) {
  const p = findNode(m, parentId); if (!p) return { ok: false, error: 'notfound' };
  if (m.nodes.length >= LIMITS.nodes || m.connections.length >= LIMITS.connections) return { ok: false, error: 'limit' };
  const sz = (sizes && sizes[parentId]) || DEFAULT_SIZE, kids = m.connections.filter(c => c.from === parentId).length;
  const r = addNode(m, { title: '', color: p.color, x: p.x + sz.w + 70, y: p.y + kids * (DEFAULT_SIZE.h + 24) }, gen);
  connect(m, parentId, r.node.id, gen); return { ok: true, node: r.node };
}

// rect = {x,y,w,h}; returns the segment between the two rect borders along the line of their centers.
function clipPoint(r, dx, dy) {
  const hw = r.w / 2, hh = r.h / 2, ax = Math.abs(dx), ay = Math.abs(dy);
  const t = Math.min(ax > 1e-9 ? hw / ax : Infinity, ay > 1e-9 ? hh / ay : Infinity);
  return { x: r.x + hw + dx * t, y: r.y + hh + dy * t };
}
function edgeGeometry(a, b) {
  const ax = a.x + a.w / 2, ay = a.y + a.h / 2, bx = b.x + b.w / 2, by = b.y + b.h / 2, dx = bx - ax, dy = by - ay;
  if (Math.hypot(dx, dy) < 1e-6) return null;
  const p1 = clipPoint(a, dx, dy), p2 = clipPoint(b, -dx, -dy);
  if ((p2.x - p1.x) * dx + (p2.y - p1.y) * dy <= 0) return null;   // rectangles overlap: nothing to draw
  return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
}
function zoomAt(view, factor, px, py) {
  const s = clamp(view.scale * factor, SCALE.min, SCALE.max), wx = (px - view.x) / view.scale, wy = (py - view.y) / view.scale;
  return { x: px - wx * s, y: py - wy * s, scale: s };
}
function fitView(rects, w, h, pad) {
  if (!rects.length || w <= 0 || h <= 0) return { x: 0, y: 0, scale: 1 };
  pad = pad == null ? 40 : pad;
  const minX = Math.min(...rects.map(r => r.x)), minY = Math.min(...rects.map(r => r.y)), maxX = Math.max(...rects.map(r => r.x + r.w)), maxY = Math.max(...rects.map(r => r.y + r.h));
  const bw = Math.max(1, maxX - minX), bh = Math.max(1, maxY - minY);
  const s = clamp(Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh, 1.5), SCALE.min, SCALE.max);
  return { x: (w - bw * s) / 2 - minX * s, y: (h - bh * s) / 2 - minY * s, scale: s };
}
const api = { LIMITS, SCALE, COLORS, DEFAULT_SIZE, cleanLine, cleanText, newId, normalizeMap, emptyMap, serialize, findNode, addNode, updateNode, moveNode, deleteNode, restoreNode, connect, hasConnection, deleteConnection, restoreConnection, addChild, edgeGeometry, zoomAt, fitView };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.MindCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
