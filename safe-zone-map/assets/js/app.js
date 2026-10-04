(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
var TYPES = ['hospital', 'pharmacy', 'shelter', 'emergency', 'fire-station', 'police', 'store', 'gas-station', 'bank', 'bakery'];
var EMOJI = { 'hospital': '🏥', 'pharmacy': '💊', 'shelter': '🏠', 'emergency': '🚑', 'fire-station': '🚒', 'police': '👮', 'store': '🏪', 'gas-station': '⛽', 'bank': '🏦', 'bakery': '🍞' };
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return AR.indexOf(d); });
}
function fold(s) { return normDigits(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase(); }
/* عدد اعشاری با ارقام فارسی، ٫ یا ویرگول اعشار (اگر نقطه نباشد) */
function parseNumber(s) {
  var v = normDigits(s).replace(/٫/g, '.').replace(/[\s\u200c]/g, '');
  if (v.indexOf('.') < 0 && /^-?\d+,\d+$/.test(v)) v = v.replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(v)) return null;
  var n = parseFloat(v); return isFinite(n) ? n : null;
}
function parseLat(s) { var n = parseNumber(s); return n !== null && n >= -90 && n <= 90 ? n : null; }
function parseLng(s) { var n = parseNumber(s); return n !== null && n >= -180 && n <= 180 ? n : null; }
/* «35.6892, 51.3890» یا «35.6892 51.3890» (مثل کپی از نقشه‌ها) */
function parsePair(s) {
  var m = /^\s*([-+]?\d+(?:[.,٫]\d+)?)\s*[,،;\s]\s*([-+]?\d+(?:[.,٫]\d+)?)\s*$/.exec(normDigits(s).replace(/٫/g, '.'));
  if (!m) return null;
  var lat = parseLat(m[1]), lng = parseLng(m[2]);
  return lat !== null && lng !== null ? { lat: lat, lng: lng } : null;
}
function haversine(a, b) {
  var R = 6371000, r = Math.PI / 180, dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
  var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(x)));
}
function phoneHref(p) { var d = String(p || '').replace(/[^\d+]/g, ''); return /^\+?\d{3,15}$/.test(d) ? 'tel:' + d : ''; }
function osmUrl(l) { return 'https://www.openstreetmap.org/?mlat=' + l.lat.toFixed(6) + '&mlon=' + l.lng.toFixed(6) + '#map=17/' + l.lat.toFixed(6) + '/' + l.lng.toFixed(6); }
function newId() { return 'l' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function normalizeLocation(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var name = String(raw.name == null ? '' : raw.name).trim().slice(0, 100);
  var lat = typeof raw.lat === 'number' ? raw.lat : parseNumber(raw.lat), lng = typeof raw.lng === 'number' ? raw.lng : parseNumber(raw.lng);
  if (!name || TYPES.indexOf(raw.type) < 0 || typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  var c = new Date(raw.createdAt), u = new Date(raw.updatedAt);
  return {
    id: raw.id == null || raw.id === '' ? newId() : String(raw.id), name: name, type: raw.type, lat: lat, lng: lng,
    address: String(raw.address == null ? '' : raw.address).trim().slice(0, 300), phone: String(raw.phone == null ? '' : raw.phone).trim().slice(0, 30),
    description: String(raw.description == null ? '' : raw.description).trim().slice(0, 500),
    createdAt: isNaN(c.getTime()) ? new Date(0).toISOString() : c.toISOString(), updatedAt: isNaN(u.getTime()) ? (isNaN(c.getTime()) ? new Date(0).toISOString() : c.toISOString()) : u.toISOString()
  };
}
function normalizeList(raw) {
  var arr = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.locations) ? raw.locations : null);
  if (!arr) return null;
  var seen = {}, items = [];
  arr.forEach(function (r) { var l = normalizeLocation(r); if (!l) return; while (seen[l.id]) l.id = newId(); seen[l.id] = 1; items.push(l); });
  return { items: items, skipped: arr.length - items.length };
}
/* ادغام: نقطهٔ هم‌نام+هم‌نوع+هم‌مختصات (تا ~۱ متر) تکراری حساب می‌شود */
function mergeLocations(existing, incoming) {
  var key = function (l) { return fold(l.name) + '|' + l.type + '|' + l.lat.toFixed(5) + '|' + l.lng.toFixed(5); };
  var have = {}, ids = {}, out = existing.slice(), added = 0, dup = 0;
  existing.forEach(function (l) { have[key(l)] = 1; ids[l.id] = 1; });
  incoming.forEach(function (l) {
    if (have[key(l)]) { dup++; return; }
    var n = Object.assign({}, l); while (ids[n.id]) n.id = newId();
    have[key(n)] = 1; ids[n.id] = 1; out.push(n); added++;
  });
  return { items: out, added: added, duplicates: dup };
}
function typeCounts(list) { var c = {}; TYPES.forEach(function (t) { c[t] = 0; }); list.forEach(function (l) { c[l.type]++; }); return c; }
function filterSort(list, o, me, typeLabel) {
  var q = fold(o.search || '').trim();
  var out = list.filter(function (l) {
    if (o.type && o.type !== 'all' && l.type !== o.type) return false;
    if (!q) return true;
    return fold(l.name + ' ' + l.address + ' ' + l.description + ' ' + l.phone + ' ' + (typeLabel ? typeLabel(l.type) : l.type)).indexOf(q) >= 0;
  });
  var dist = function (l) { return me ? haversine(me, l) : Infinity; };
  if (o.sort === 'distance' && me) out.sort(function (a, b) { return dist(a) - dist(b); });
  else if (o.sort === 'name') out.sort(function (a, b) { return a.name.localeCompare(b.name, 'fa'); });
  else out.sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0; });
  return out;
}
/* موقعیت نقاط در یک بوم W×H (تصویر شماتیک هم‌مقیاس؛ طول جغرافیایی با cos(عرض) تصحیح می‌شود) */
function plotPoints(list, me, W, H, pad) {
  var pts = list.map(function (l) { return { id: l.id, lat: l.lat, lng: l.lng }; });
  if (me) pts.push({ id: '__me', lat: me.lat, lng: me.lng });
  if (!pts.length) return [];
  var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  pts.forEach(function (p) { minLat = Math.min(minLat, p.lat); maxLat = Math.max(maxLat, p.lat); minLng = Math.min(minLng, p.lng); maxLng = Math.max(maxLng, p.lng); });
  var k = Math.cos((minLat + maxLat) / 2 * Math.PI / 180) || 1e-6;
  var spanX = (maxLng - minLng) * k, spanY = maxLat - minLat, aw = W - 2 * pad, ah = H - 2 * pad;
  var scale = spanX === 0 && spanY === 0 ? 0 : Math.min(spanX > 0 ? aw / spanX : Infinity, spanY > 0 ? ah / spanY : Infinity);
  var cx = (minLng + maxLng) / 2, cy = (minLat + maxLat) / 2;
  return pts.map(function (p) { return { id: p.id, x: W / 2 + (p.lng - cx) * k * scale, y: H / 2 - (p.lat - cy) * scale }; });
}
/* @logic-end */

var KEY = 'safeZoneLocations';
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function svg(tag, attrs) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
function typeLabel(ty) { return t('type_' + ty); }

var locs = [], f = { type: 'all', search: '', sort: 'newest' }, me = null, editingId = null, selected = null, pending = null;

function load() {
  var raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var r = normalizeList(raw); locs = r ? r.items : [];
  if (r && (r.skipped || (Array.isArray(raw) && raw.some(function (x) { return typeof (x && x.id) !== 'string'; })))) save();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(locs)); return true; } catch (e) { toast(t('err_save'), true); return false; } }
var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'sz-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 3200);
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}
function choiceDialog(message) {
  return new Promise(function (resolve) {
    var d = $('importDialog'); $('importText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue); };
    d.returnValue = 'cancel'; d.addEventListener('close', done); d.showModal();
  });
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  var sel = $('fType'), cur = sel.value; sel.textContent = '';
  var ph = el('option', '', t('choose')); ph.value = ''; sel.appendChild(ph);
  TYPES.forEach(function (ty) { var o = el('option', '', EMOJI[ty] + ' ' + typeLabel(ty)); o.value = ty; sel.appendChild(o); });
  sel.value = cur; $('plot').setAttribute('aria-label', t('plot_title'));
  $('formTitle').textContent = t(editingId ? 'edit_title' : 'heading_1');
  render();
}
function fmtDist(m) { return m < 1000 ? t('dist_m', { n: nf(Math.round(m / 10) * 10 || 10) }) : t('dist_km', { n: nf(Math.round(m / 100) / 10) }); }

/* ---------- نمایش ---------- */
function renderChips() {
  var c = typeCounts(locs), box = $('chips'); box.textContent = '';
  var all = el('button', 'sz-chip' + (f.type === 'all' ? ' is-active' : ''), t('all')); all.type = 'button'; all.dataset.type = 'all'; all.appendChild(el('b', '', nf(locs.length))); box.appendChild(all);
  TYPES.forEach(function (ty) {
    if (!c[ty] && f.type !== ty) return;
    var b = el('button', 'sz-chip' + (f.type === ty ? ' is-active' : ''), EMOJI[ty] + ' ' + typeLabel(ty)); b.type = 'button'; b.dataset.type = ty; b.setAttribute('aria-pressed', f.type === ty ? 'true' : 'false');
    b.appendChild(el('b', '', nf(c[ty]))); box.appendChild(b);
  });
}
function renderPlot(list) {
  var card = $('plotCard'), s = $('plot'); s.textContent = '';
  card.hidden = !list.length; if (!list.length) return;
  var W = 600, H = 340, pts = plotPoints(list, me, W, H, 34), pos = {};
  pts.forEach(function (p) { pos[p.id] = p; });
  [0.25, 0.5, 0.75].forEach(function (r) { s.appendChild(svg('line', { x1: W * r, x2: W * r, y1: 0, y2: H, 'class': 'grid' })); s.appendChild(svg('line', { x1: 0, x2: W, y1: H * r, y2: H * r, 'class': 'grid' })); });
  list.forEach(function (l) {
    var p = pos[l.id]; if (!p) return;
    var g = svg('g', { 'class': 'sz-pin' + (selected === l.id ? ' is-sel' : ''), tabindex: '0', role: 'button', 'aria-label': l.name + ' - ' + typeLabel(l.type), transform: 'translate(' + p.x.toFixed(1) + ',' + p.y.toFixed(1) + ')' });
    g.dataset.id = l.id;
    g.appendChild(svg('circle', { r: 16, fill: 'var(--t-' + l.type + ')' }));
    var tx = svg('text', {}); tx.textContent = EMOJI[l.type]; g.appendChild(tx); s.appendChild(g);
  });
  if (me && pos.__me) {
    var m = svg('g', { transform: 'translate(' + pos.__me.x.toFixed(1) + ',' + pos.__me.y.toFixed(1) + ')' });
    m.appendChild(svg('circle', { r: 9, 'class': 'me' })); var tt = svg('title', {}); tt.textContent = t('my_location'); m.appendChild(tt); s.appendChild(m);
  }
}
function card(l) {
  var c = el('article', 'sz-loc' + (selected === l.id ? ' is-sel' : '')); c.dataset.id = l.id; c.id = 'loc-' + l.id; c.style.setProperty('--tc', 'var(--t-' + l.type + ')');
  var top = el('div', 'sz-loc-top'); top.appendChild(el('span', 'sz-loc-icon', EMOJI[l.type]));
  var tt = el('div'); tt.appendChild(el('h3', 'sz-loc-name', l.name)); tt.appendChild(el('div', 'sz-loc-type', typeLabel(l.type))); top.appendChild(tt);
  if (me) top.appendChild(el('span', 'sz-dist', fmtDist(haversine(me, l))));
  c.appendChild(top);
  var dl = el('dl', 'sz-dl');
  function row(label, node) { dl.appendChild(el('dt', '', label)); var dd = el('dd'); dd.appendChild(node); dl.appendChild(dd); }
  if (l.address) row(t('label_6'), document.createTextNode(l.address));
  if (l.phone) { var h = phoneHref(l.phone), n; if (h) { n = el('a', '', l.phone); n.href = h; n.dir = 'ltr'; } else n = document.createTextNode(l.phone); row(t('label_7'), n); }
  row(t('coords'), el('span', 'ltr', l.lat.toFixed(6) + ', ' + l.lng.toFixed(6)));
  if (l.description) row(t('label_8'), document.createTextNode(l.description));
  c.appendChild(dl);
  var act = el('div', 'sz-loc-actions');
  var map = el('a', 'sz-btn sz-btn--sm sz-btn--primary', t('open_map')); map.href = osmUrl(l); map.target = '_blank'; map.rel = 'noopener noreferrer'; act.appendChild(map);
  [['copy', 'copy_coords', ''], ['edit', 'edit', ''], ['delete', 'delete', 'sz-btn--danger']].forEach(function (d) { var b = el('button', 'sz-btn sz-btn--sm ' + d[2], t(d[1])); b.type = 'button'; b.dataset.action = d[0]; act.appendChild(b); });
  c.appendChild(act); return c;
}
function render() {
  renderChips();
  var list = filterSort(locs, f, me, typeLabel), box = $('list'); box.textContent = '';
  $('sort').querySelector('[value="distance"]').disabled = !me;
  renderPlot(list);
  if (!list.length) {
    var e = el('div', 'sz-empty'); e.appendChild(el('div', 'e', '📍'));
    e.appendChild(el('p', '', t(locs.length ? 'no_match' : 'text_empty')));
    e.appendChild(el('p', 'sz-muted', t(locs.length ? 'no_match_hint' : 'text_empty_hint_4'))); box.appendChild(e); return;
  }
  list.forEach(function (l) { box.appendChild(card(l)); });
}

/* ---------- فرم ---------- */
function setHint(msg, bad) { var h = $('coordHint'); h.textContent = msg; h.style.color = bad ? 'var(--c-bad)' : ''; }
function openForm(id) {
  editingId = id || null; var l = id ? locs.find(function (x) { return x.id === id; }) : null; if (id && !l) return;
  $('form').reset(); setHint(''); ['fLat', 'fLng', 'fName', 'fType'].forEach(function (k) { $(k).classList.remove('is-bad'); });
  $('formTitle').textContent = t(l ? 'edit_title' : 'heading_1');
  if (l) { $('fName').value = l.name; $('fType').value = l.type; $('fLat').value = String(l.lat); $('fLng').value = String(l.lng); $('fAddress').value = l.address; $('fPhone').value = l.phone; $('fDesc').value = l.description; }
  $('formDialog').showModal(); $('fName').focus();
}
function geolocate() {
  return new Promise(function (resolve, reject) {
    if (!navigator.geolocation) { reject({ code: 0 }); return; }
    navigator.geolocation.getCurrentPosition(function (p) { resolve({ lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy }); }, reject, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
  });
}
function geoError(e) { return t(e && e.code === 1 ? 'geo_denied' : e && e.code === 3 ? 'geo_timeout' : 'geo_unavailable'); }
function onSubmit(ev) {
  ev.preventDefault();
  var name = $('fName').value.trim(), type = $('fType').value, lat = parseLat($('fLat').value), lng = parseLng($('fLng').value), bad = false;
  $('fName').classList.toggle('is-bad', !name); $('fType').classList.toggle('is-bad', !type);
  $('fLat').classList.toggle('is-bad', lat === null); $('fLng').classList.toggle('is-bad', lng === null);
  if (!name || !type) { toast(t('err_required'), true); return; }
  if (lat === null || lng === null) { setHint(t('err_coords'), true); toast(t('err_coords'), true); return; }
  var old = editingId ? locs.find(function (x) { return x.id === editingId; }) : null, now = new Date().toISOString();
  var l = normalizeLocation({ id: editingId || newId(), name: name, type: type, lat: lat, lng: lng, address: $('fAddress').value, phone: $('fPhone').value, description: $('fDesc').value, createdAt: old ? old.createdAt : now, updatedAt: now });
  if (editingId) locs = locs.map(function (x) { return x.id === editingId ? l : x; }); else locs.push(l);
  if (save()) toast(t(editingId ? 'ok_edited' : 'ok_added'));
  $('formDialog').close(); selected = l.id; render();
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
  var ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
}
function exportData() {
  if (!locs.length) { toast(t('nothing_export'), true); return; }
  var data = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), locations: locs }, null, 2);
  var url = URL.createObjectURL(new Blob([data], { type: 'application/json' })), a = document.createElement('a');
  a.href = url; a.download = 'safe-zone-map-' + new Date().toISOString().slice(0, 10) + '.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  toast(t('ok_export'));
}
function importFile(file) {
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { toast(t('err_import_size'), true); return; }
  var r = new FileReader();
  r.onload = async function () {
    var parsed; try { parsed = normalizeList(JSON.parse(String(r.result))); } catch (e) { parsed = null; }
    if (!parsed || !parsed.items.length) { toast(t('err_import'), true); return; }
    var msg = t('import_found', { n: nf(parsed.items.length) }) + (parsed.skipped ? ' ' + t('import_skipped', { n: nf(parsed.skipped) }) : '');
    var choice = await choiceDialog(msg);
    if (choice === 'replace') { locs = parsed.items; if (save()) toast(t('ok_import', { n: nf(parsed.items.length) })); }
    else if (choice === 'merge') { var m = mergeLocations(locs, parsed.items); locs = m.items; if (save()) toast(t('ok_merge', { a: nf(m.added), d: nf(m.duplicates) })); }
    else return;
    render();
  };
  r.onerror = function () { toast(t('err_import'), true); };
  r.readAsText(file);
}

function bind() {
  $('addBtn').addEventListener('click', function () { openForm(); });
  $('form').addEventListener('submit', onSubmit);
  $('cancelBtn').addEventListener('click', function () { $('formDialog').close(); });
  $('fLat').addEventListener('input', function () { var p = parsePair(this.value); if (p) { this.value = String(p.lat); $('fLng').value = String(p.lng); setHint(t('pair_split')); } });
  $('fillMe').addEventListener('click', async function () {
    setHint(t('geo_wait'));
    try { var p = await geolocate(); $('fLat').value = p.lat.toFixed(6); $('fLng').value = p.lng.toFixed(6); $('fLat').classList.remove('is-bad'); $('fLng').classList.remove('is-bad'); setHint(t('geo_ok', { n: nf(Math.round(p.acc || 0)) })); }
    catch (e) { setHint(geoError(e), true); }
  });
  $('meBtn').addEventListener('click', async function () {
    $('status').textContent = t('geo_wait');
    try { me = await geolocate(); $('status').textContent = t('geo_found'); f.sort = 'distance'; $('sort').value = 'distance'; render(); }
    catch (e) { $('status').textContent = ''; toast(geoError(e), true); }
  });
  $('exportBtn').addEventListener('click', exportData);
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', function (e) { var fl = e.target.files[0]; e.target.value = ''; importFile(fl); });
  $('chips').addEventListener('click', function (e) { var b = e.target.closest('.sz-chip'); if (!b) return; f.type = b.dataset.type; render(); });
  $('search').addEventListener('input', function () { f.search = this.value; render(); });
  $('sort').addEventListener('change', function () { f.sort = this.value; render(); });
  $('list').addEventListener('click', async function (e) {
    var b = e.target.closest('button[data-action]'), c = e.target.closest('.sz-loc'); if (!b || !c) return;
    var l = locs.find(function (x) { return x.id === c.dataset.id; }); if (!l) return;
    if (b.dataset.action === 'edit') openForm(l.id);
    else if (b.dataset.action === 'copy') toast(t((await copyText(l.lat.toFixed(6) + ', ' + l.lng.toFixed(6))) ? 'copied' : 'copy_failed'), false);
    else if (await confirmDialog(t('confirm_delete', { n: l.name }))) { locs = locs.filter(function (x) { return x.id !== l.id; }); if (save()) toast(t('ok_deleted')); render(); }
  });
  var pick = function (g) {
    if (!g) return; selected = g.dataset.id; render();
    var c = document.getElementById('loc-' + selected); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  $('plot').addEventListener('click', function (e) { pick(e.target.closest('.sz-pin')); });
  $('plot').addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { var g = e.target.closest('.sz-pin'); if (g) { e.preventDefault(); pick(g); } } });
  ['formDialog', 'confirmDialog', 'importDialog'].forEach(function (id) { $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); }); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  load(); applyI18n(); bind();
}
document.addEventListener('DOMContentLoaded', boot);
})();
