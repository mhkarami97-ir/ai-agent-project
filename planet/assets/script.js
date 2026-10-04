(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
var LEVELS = ['low', 'medium', 'high'];
var DEFAULT_WATER = { low: 10, medium: 4, high: 2 };

function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function foldText(s) { return normDigits(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase(); }
function parseInterval(s, min, max) {
  var v = normDigits(s).trim();
  if (!/^\d+$/.test(v)) return null;
  var n = parseInt(v, 10);
  return n >= min && n <= max ? n : null;
}
function dayNum(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000); }
function validISO(s) { if (typeof s !== 'string') return null; var d = new Date(s); return isNaN(d.getTime()) ? null : d.toISOString(); }
function parseTags(s) {
  var seen = {}, out = [];
  String(s == null ? '' : s).split(/[,،]/).forEach(function (x) {
    x = x.trim().slice(0, 30);
    var k = foldText(x);
    if (x && !seen[k] && out.length < 10) { seen[k] = 1; out.push(x); }
  });
  return out;
}
function normalizePlant(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var name = String(raw.name == null ? '' : raw.name).trim();
  if (!name) return null;
  var water = LEVELS.indexOf(raw.waterNeeds) >= 0 ? raw.waterNeeds : 'medium';
  var light = LEVELS.indexOf(raw.lightNeeds) >= 0 ? raw.lightNeeds : 'medium';
  var wi = parseInterval(raw.waterInterval, 1, 30);
  var fi = raw.fertilizeInterval === '' || raw.fertilizeInterval == null ? null : parseInterval(raw.fertilizeInterval, 1, 90);
  var tags = Array.isArray(raw.tags) ? parseTags(raw.tags.join(',')) : parseTags(raw.tags);
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : (raw.id != null ? String(raw.id) : null),
    name: name.slice(0, 80),
    scientificName: String(raw.scientificName == null ? '' : raw.scientificName).trim().slice(0, 80),
    waterNeeds: water,
    lightNeeds: light,
    waterInterval: wi === null ? DEFAULT_WATER[water] : wi,
    fertilizeInterval: fi,
    location: String(raw.location == null ? '' : raw.location).trim().slice(0, 60),
    tags: tags,
    notes: String(raw.notes == null ? '' : raw.notes).trim().slice(0, 500),
    image: typeof raw.image === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(raw.image) ? raw.image : '',
    lastWatered: validISO(raw.lastWatered),
    lastFertilized: validISO(raw.lastFertilized),
    createdAt: validISO(raw.createdAt) || new Date(0).toISOString()
  };
}
/* روز سررسید (شمارهٔ روز محلی). بدون ثبت قبلی: امروز */
function nextDue(plant, kind, today) {
  var interval = kind === 'water' ? plant.waterInterval : plant.fertilizeInterval;
  if (!interval) return null;
  var last = kind === 'water' ? plant.lastWatered : plant.lastFertilized;
  return last ? dayNum(new Date(last)) + interval : today;
}
function reminders(plants, today) {
  var out = [];
  plants.forEach(function (p) {
    ['water', 'fertilize'].forEach(function (k) {
      var due = nextDue(p, k, today);
      if (due !== null) out.push({ plantId: p.id, name: p.name, type: k, due: due, diff: due - today });
    });
  });
  return out.sort(function (a, b) { return a.diff - b.diff || a.name.localeCompare(b.name, 'fa') || (a.type === b.type ? 0 : a.type === 'water' ? -1 : 1); });
}
function splitReminders(list) {
  return { today: list.filter(function (r) { return r.diff <= 0; }), upcoming: list.filter(function (r) { return r.diff > 0; }) };
}
function filterTokens(plants) {
  var seen = { all: 1 }, out = ['all'];
  function add(t) { if (!seen[t]) { seen[t] = 1; out.push(t); } }
  plants.forEach(function (p) { if (p.location) add('loc:' + p.location); });
  LEVELS.forEach(function (l) { if (plants.some(function (p) { return p.waterNeeds === l; })) add('water:' + l); });
  LEVELS.forEach(function (l) { if (plants.some(function (p) { return p.lightNeeds === l; })) add('light:' + l); });
  plants.forEach(function (p) { p.tags.forEach(function (t) { add('tag:' + t); }); });
  return out;
}
function matchesToken(p, token) {
  if (token === 'all') return true;
  var i = token.indexOf(':'), kind = token.slice(0, i), val = token.slice(i + 1);
  if (kind === 'loc') return p.location === val;
  if (kind === 'water') return p.waterNeeds === val;
  if (kind === 'light') return p.lightNeeds === val;
  if (kind === 'tag') return p.tags.indexOf(val) >= 0;
  return false;
}
function filterPlants(plants, search, token) {
  var q = foldText(search || '').trim();
  return plants.filter(function (p) {
    if (!matchesToken(p, token)) return false;
    return !q || foldText(p.name).indexOf(q) >= 0 || foldText(p.scientificName).indexOf(q) >= 0;
  });
}
function distribution(plants, field) {
  var d = {};
  plants.forEach(function (p) { var k = p[field]; if (k) d[k] = (d[k] || 0) + 1; });
  return d;
}
function normalizeCompleted(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(function (c) {
    if (!c || typeof c !== 'object') return null;
    var at = validISO(c.completedAt);
    if (!at || (c.type !== 'water' && c.type !== 'fertilize')) return null;
    return { reminderId: String(c.reminderId || ''), plantId: String(c.plantId || ''), type: c.type, completedAt: at };
  }).filter(Boolean);
}
function pruneCompleted(list, now) {
  var cutoff = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate()).getTime();
  return list.filter(function (c) { return new Date(c.completedAt).getTime() >= cutoff; }).slice(-2000);
}
function completedThisMonth(list, now) {
  return list.filter(function (c) { var d = new Date(c.completedAt); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length;
}
/* ورودی: آرایهٔ گیاهان (قدیمی) یا {plants, completedTasks} */
function parseImport(text) {
  var data;
  try { data = JSON.parse(text); } catch (e) { return null; }
  var arr = Array.isArray(data) ? data : (data && Array.isArray(data.plants) ? data.plants : null);
  if (!arr) return null;
  var seen = {}, plants = [];
  arr.forEach(function (r) {
    var p = normalizePlant(r);
    if (!p || (p.id && seen[p.id])) return;
    if (p.id) seen[p.id] = 1;
    plants.push(p);
  });
  return { plants: plants, skipped: arr.length - plants.length, completed: Array.isArray(data) ? [] : normalizeCompleted(data.completedTasks) };
}
/* @logic-end */

var KEYS = { plants: 'plants', completed: 'completedTasks' };
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function loc() { return lang === 'fa' ? 'fa-IR' : 'en-US'; }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function newId() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

var plants = [], completed = [], view = 'plants', search = '', activeFilter = 'all', editingId = null, pendingImage = '', detailsId = null;

function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
function load() {
  var raw = readJSON(KEYS.plants), seen = {}, changed = false;
  plants = (Array.isArray(raw) ? raw : []).map(normalizePlant).filter(function (p) {
    if (!p) { changed = true; return false; }
    if (!p.id || seen[p.id]) { p.id = newId(); changed = true; }
    seen[p.id] = 1; return true;
  });
  completed = normalizeCompleted(readJSON(KEYS.completed));
  if (changed) save();
}
function save() {
  completed = pruneCompleted(completed, new Date());
  try {
    localStorage.setItem(KEYS.plants, JSON.stringify(plants));
    localStorage.setItem(KEYS.completed, JSON.stringify(completed));
    return true;
  } catch (e) { toast(t('err_save'), 'error'); return false; }
}

var toastTimer;
function toast(msg, kind) {
  var n = $('toast'); n.textContent = msg; n.className = 'pl-toast' + (kind === 'error' ? ' is-error' : kind === 'warn' ? ' is-warn' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 3000);
}
function confirmDialog(message, okKey) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message; $('confirmOk').textContent = t(okKey || 'confirm_yes');
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}

function levelLabel(kind, v) { return t(kind + '_' + v); }
function fillLevels(sel, kind) {
  var cur = sel.value; sel.textContent = '';
  var o = el('option', '', t('select_option')); o.value = ''; sel.appendChild(o);
  LEVELS.forEach(function (l) { var x = el('option', '', levelLabel(kind, l)); x.value = l; sel.appendChild(x); });
  sel.value = cur;
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  fillLevels($('fWater'), 'water'); fillLevels($('fLight'), 'light');
  $('plantDialogTitle').textContent = t(editingId ? 'edit_plant' : 'add_new_plant');
}

/* ---------- نمایش ---------- */
function careText(diff) {
  if (diff < 0) return t('d_ago', { n: nf(-diff) });
  if (diff === 0) return t('today');
  if (diff === 1) return t('tomorrow');
  return t('d_later', { n: nf(diff) });
}
function dateText(r) {
  if (r.diff === 0) return t('today');
  if (r.diff === 1) return t('tomorrow');
  if (r.diff === -1) return t('yesterday');
  if (r.diff < 0) return t('d_ago', { n: nf(-r.diff) });
  if (r.diff < 7) return t('d_later', { n: nf(r.diff) });
  return new Date(r.due * 86400000).toLocaleDateString(loc(), { timeZone: 'UTC', month: 'long', day: 'numeric' });
}
function filterLabel(tok) {
  if (tok === 'all') return t('all');
  var i = tok.indexOf(':'), k = tok.slice(0, i), v = tok.slice(i + 1);
  if (k === 'loc') return '📍 ' + v;
  if (k === 'water') return '💧 ' + t(v);
  if (k === 'light') return '☀️ ' + t(v);
  return '# ' + v;
}
function todayNum() { return dayNum(new Date()); }

function renderPlants() {
  var tokens = filterTokens(plants);
  if (tokens.indexOf(activeFilter) < 0) activeFilter = 'all';
  var fbox = $('filterTags'); fbox.textContent = '';
  tokens.forEach(function (tok) {
    var b = el('button', 'pl-chip' + (tok === activeFilter ? ' is-active' : ''), filterLabel(tok));
    b.type = 'button'; b.dataset.filter = tok; b.setAttribute('aria-pressed', tok === activeFilter ? 'true' : 'false'); fbox.appendChild(b);
  });
  fbox.hidden = tokens.length < 2;

  var list = filterPlants(plants, search, activeFilter), grid = $('plantsGrid'), td = todayNum();
  grid.textContent = '';
  var empty = $('emptyState'); empty.hidden = list.length > 0;
  if (!list.length) {
    var none = !plants.length;
    $('emptyTitle').textContent = t(none ? 'no_plants' : 'no_match');
    $('emptyDesc').textContent = t(none ? 'no_plants_desc' : 'no_match_desc');
    $('emptyAddBtn').hidden = !none;
    return;
  }
  list.forEach(function (p) {
    var card = el('article', 'pl-plant'); card.dataset.id = p.id;
    var ph = el('div', 'pl-photo');
    if (p.image) { var im = document.createElement('img'); im.src = p.image; im.alt = p.name; im.loading = 'lazy'; ph.appendChild(im); } else ph.textContent = '🌿';
    card.appendChild(ph);
    var body = el('div', 'pl-body');
    var top = el('div', 'pl-top'), tl = el('div');
    var nb = el('button', 'pl-name-btn', p.name); nb.type = 'button'; nb.dataset.action = 'details'; tl.appendChild(nb);
    if (p.scientificName) tl.appendChild(el('p', 'pl-sci', p.scientificName));
    top.appendChild(tl);
    var ic = el('div', 'pl-icons');
    var eb = el('button', 'pl-btn pl-btn--icon', '✏️'); eb.type = 'button'; eb.dataset.action = 'edit'; eb.setAttribute('aria-label', t('edit')); ic.appendChild(eb);
    var db = el('button', 'pl-btn pl-btn--icon', '🗑️'); db.type = 'button'; db.dataset.action = 'delete'; db.setAttribute('aria-label', t('delete')); ic.appendChild(db);
    top.appendChild(ic); body.appendChild(top);
    var meta = el('div', 'pl-meta');
    meta.appendChild(el('span', '', '💧 ' + levelLabel('water', p.waterNeeds)));
    meta.appendChild(el('span', '', '☀️ ' + levelLabel('light', p.lightNeeds)));
    if (p.location) meta.appendChild(el('span', '', '📍 ' + p.location));
    body.appendChild(meta);
    if (p.tags.length) { var tg = el('div', 'pl-tags'); p.tags.forEach(function (x) { tg.appendChild(el('span', 'pl-tag', x)); }); body.appendChild(tg); }
    var cares = el('div', 'pl-cares');
    [['water', '💧'], ['fertilize', '🌱']].forEach(function (k) {
      var due = nextDue(p, k[0], td); if (due === null) return;
      var diff = due - td;
      var b = el('button', 'pl-care' + (diff <= 0 ? ' is-due' : '')); b.type = 'button'; b.dataset.action = 'care'; b.dataset.type = k[0];
      b.appendChild(el('span', '', k[1])); b.appendChild(el('span', '', careText(diff)));
      b.setAttribute('aria-label', t(k[0] === 'water' ? 'watering' : 'fertilizing_task') + ': ' + careText(diff));
      cares.appendChild(b);
    });
    body.appendChild(cares); card.appendChild(body); grid.appendChild(card);
  });
}
function reminderCard(r) {
  var card = el('article', 'pl-rem' + (r.diff < 0 ? ' is-overdue' : '')); card.dataset.id = r.plantId; card.dataset.type = r.type;
  var b = el('button', 'pl-done', '✓'); b.type = 'button'; b.dataset.action = 'care'; b.dataset.type = r.type;
  b.setAttribute('aria-label', t('mark_done') + ': ' + r.name);
  card.appendChild(b);
  var main = el('div', 'pl-rem-main');
  main.appendChild(el('p', 'pl-rem-title', (r.type === 'water' ? '💧 ' + t('watering') : '🌱 ' + t('fertilizing_task')) + ' - ' + r.name));
  var p = plants.find(function (x) { return x.id === r.plantId; });
  var n = p ? (r.type === 'water' ? p.waterInterval : p.fertilizeInterval) : '';
  main.appendChild(el('p', 'pl-rem-sub', t('every_n_days', { n: nf(n) })));
  card.appendChild(main);
  card.appendChild(el('span', 'pl-rem-date', dateText(r)));
  return card;
}
function renderReminders() {
  var sp = splitReminders(reminders(plants, todayNum()));
  [['todayReminders', sp.today, 'no_reminders_today'], ['upcomingReminders', sp.upcoming, 'no_reminders_upcoming']].forEach(function (x) {
    var box = $(x[0]); box.textContent = '';
    if (!x[1].length) box.appendChild(el('p', 'pl-none', t(x[2])));
    else x[1].forEach(function (r) { box.appendChild(reminderCard(r)); });
  });
}
var GUIDE = [
  ['💧', 'watering_correct', [['watering_low', 'watering_low_desc'], ['watering_medium', 'watering_medium_desc'], ['watering_high', 'watering_high_desc'], ['watering_note', 'watering_note_desc']]],
  ['☀️', 'light_suitable', [['g_light_low', 'light_low_desc'], ['g_light_medium', 'light_medium_desc'], ['g_light_high', 'light_high_desc'], ['watering_note', 'light_note_desc']]],
  ['🌡️', 'temp_humidity', [['temp_suitable', 'temp_suitable_desc'], ['humidity', 'humidity_desc'], ['watering_note', 'temp_note_desc']]],
  ['🌿', 'fertilizing', [['fertilizing_time', 'fertilizing_time_desc'], ['fertilizer_type', 'fertilizer_type_desc'], ['watering_note', 'fertilizing_note_desc']]],
  ['✂️', 'pruning_care', [['pruning_leaves', 'pruning_leaves_desc'], ['cleaning_leaves', 'cleaning_leaves_desc'], ['pot_change', 'pot_change_desc']]],
  ['🐛', 'pests_diseases', [['aphids', 'aphids_desc'], ['mites', 'mites_desc'], ['root_rot', 'root_rot_desc'], ['watering_note', 'pest_note_desc']]],
  ['🌱', 'beginner_plants', [['pothos', 'pothos_desc'], ['sansevieria', 'sansevieria_desc'], ['rubber_plant', 'rubber_plant_desc'], ['cactus', 'cactus_desc'], ['peace_lily', 'peace_lily_desc']]]
];
function renderGuide() {
  var box = $('guideBox'); box.textContent = '';
  GUIDE.forEach(function (g) {
    var sec = el('section', 'pl-card pl-guide-sec');
    sec.appendChild(el('h3', '', g[0] + ' ' + t(g[1])));
    g[2].forEach(function (row) {
      var p = el('p'); p.appendChild(el('strong', '', t(row[0]) + ' ')); p.appendChild(document.createTextNode(t(row[1]))); sec.appendChild(p);
    });
    box.appendChild(sec);
  });
}
function chart(id, data, labelFn) {
  var box = $(id); box.textContent = '';
  var keys = Object.keys(data), total = keys.reduce(function (s, k) { return s + data[k]; }, 0);
  if (!total) { box.appendChild(el('p', 'pl-none', t('no_data'))); return; }
  var max = Math.max.apply(null, keys.map(function (k) { return data[k]; }));
  keys.forEach(function (k) {
    var row = el('div', 'pl-bar');
    row.appendChild(el('span', 'pl-bar-label', labelFn(k)));
    var tr = el('div', 'pl-bar-track'), f = el('span'); f.style.width = Math.round(data[k] / max * 100) + '%'; tr.appendChild(f); row.appendChild(tr);
    row.appendChild(el('span', 'pl-bar-val', nf(data[k])));
    box.appendChild(row);
  });
}
function renderStats() {
  var sp = splitReminders(reminders(plants, todayNum())), locs = distribution(plants.filter(function (p) { return p.location; }), 'location');
  $('sTotal').textContent = nf(plants.length);
  $('sToday').textContent = nf(sp.today.length);
  $('sDone').textContent = nf(completedThisMonth(completed, new Date()));
  $('sLoc').textContent = nf(Object.keys(locs).length);
  chart('chartLoc', locs, function (k) { return k; });
  var w = distribution(plants, 'waterNeeds'), l = distribution(plants, 'lightNeeds'), wo = {}, lo = {};
  LEVELS.forEach(function (x) { if (w[x]) wo[x] = w[x]; if (l[x]) lo[x] = l[x]; });
  chart('chartWater', wo, function (k) { return t(k); });
  chart('chartLight', lo, function (k) { return t(k); });
}
function updateBadge() {
  var n = splitReminders(reminders(plants, todayNum())).today.length, b = $('navCount');
  b.textContent = nf(n); b.hidden = n === 0;
}
function render() {
  updateBadge();
  if (view === 'plants') renderPlants();
  else if (view === 'reminders') renderReminders();
  else if (view === 'guide') renderGuide();
  else renderStats();
}
function switchView(v) {
  view = v;
  document.querySelectorAll('.pl-tab').forEach(function (b) { var on = b.dataset.view === v; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  ['plants', 'reminders', 'guide', 'statistics'].forEach(function (x) { $('view-' + x).hidden = x !== v; });
  render();
}

/* ---------- عملیات ---------- */
function completeTask(id, type) {
  var p = plants.find(function (x) { return x.id === id; }); if (!p) return;
  var now = new Date().toISOString();
  if (type === 'water') p.lastWatered = now; else p.lastFertilized = now;
  completed.push({ reminderId: id + '-' + type, plantId: id, type: type, completedAt: now });
  if (save()) toast(t(type === 'water' ? 'watering' : 'fertilizing_task') + ': ' + t('task_completed'));
  render();
}
function fillLocations() {
  var dl = $('locList'); dl.textContent = '';
  var seen = {};
  plants.forEach(function (p) { if (p.location && !seen[p.location]) { seen[p.location] = 1; var o = document.createElement('option'); o.value = p.location; dl.appendChild(o); } });
}
function showPreview(src) {
  var box = $('imgPreview');
  box.hidden = !src;
  if (src) box.querySelector('img').src = src;
}
function openPlantDialog(id) {
  editingId = id || null; pendingImage = '';
  $('plantForm').reset();
  var p = id ? plants.find(function (x) { return x.id === id; }) : null;
  if (id && !p) return;
  $('plantDialogTitle').textContent = t(p ? 'edit_plant' : 'add_new_plant');
  fillLocations();
  if (p) {
    $('fName').value = p.name; $('fSci').value = p.scientificName; $('fWater').value = p.waterNeeds; $('fLight').value = p.lightNeeds;
    $('fWInt').value = String(p.waterInterval); $('fFInt').value = p.fertilizeInterval ? String(p.fertilizeInterval) : '';
    $('fLoc').value = p.location; $('fTags').value = p.tags.join(', '); $('fNotes').value = p.notes; pendingImage = p.image;
  }
  showPreview(pendingImage);
  $('plantDialog').showModal();
}
function onPlantSubmit(e) {
  e.preventDefault();
  var old = editingId ? plants.find(function (x) { return x.id === editingId; }) : null;
  var wi = parseInterval($('fWInt').value, 1, 30);
  var fiRaw = $('fFInt').value.trim(), fi = fiRaw ? parseInterval(fiRaw, 1, 90) : null;
  if (wi === null || (fiRaw && fi === null)) { toast(t('err_interval'), 'error'); return; }
  var p = normalizePlant({
    name: $('fName').value, scientificName: $('fSci').value, waterNeeds: $('fWater').value, lightNeeds: $('fLight').value,
    waterInterval: wi, fertilizeInterval: fi, location: $('fLoc').value, tags: $('fTags').value, notes: $('fNotes').value, image: pendingImage,
    lastWatered: old && old.lastWatered, lastFertilized: old && old.lastFertilized, createdAt: old ? old.createdAt : new Date().toISOString()
  });
  if (!p || !p.location) { toast(t('err_required'), 'error'); return; }
  if (old) { p.id = old.id; plants = plants.map(function (x) { return x.id === old.id ? p : x; }); }
  else { p.id = newId(); plants.push(p); }
  if (save()) toast(t(old ? 'plant_saved' : 'plant_added'));
  $('plantDialog').close(); render();
}
function resizeImage(file) {
  return new Promise(function (resolve, reject) {
    var MAX = 640;
    var draw = function (src, w, h) {
      var s = Math.min(1, MAX / Math.max(w, h)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s));
      var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(src, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    if (window.createImageBitmap) {
      createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (b) { draw(b, b.width, b.height); }, reject);
    } else {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () { URL.revokeObjectURL(url); draw(im, im.naturalWidth, im.naturalHeight); };
      im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('img')); };
      im.src = url;
    }
  });
}
async function onImageChange(e) {
  var f = e.target.files[0]; if (!f) return;
  if (!/^image\//.test(f.type) || f.size > 20 * 1024 * 1024) { toast(t('err_image'), 'error'); e.target.value = ''; return; }
  try { pendingImage = await resizeImage(f); showPreview(pendingImage); }
  catch (err) { console.error(err); toast(t('err_image'), 'error'); }
  e.target.value = '';
}
async function onDelete(id) {
  var p = plants.find(function (x) { return x.id === id; }); if (!p) return;
  if (!(await confirmDialog(t('delete_confirm') + ' (' + p.name + ')', 'delete'))) return;
  plants = plants.filter(function (x) { return x.id !== id; });
  completed = completed.filter(function (c) { return c.plantId !== id; });
  if (save()) toast(t('plant_deleted'));
  render();
}
function dl(parent, rows) {
  var d = el('dl', 'pl-dl');
  rows.forEach(function (r) { if (r[1]) { d.appendChild(el('dt', '', r[0])); d.appendChild(el('dd', '', r[1])); } });
  parent.appendChild(d);
}
function openDetails(id) {
  var p = plants.find(function (x) { return x.id === id; }); if (!p) return;
  detailsId = id;
  $('detailsTitle').textContent = p.name;
  var body = $('detailsBody'); body.textContent = '';
  var fd = function (iso) { return iso ? new Date(iso).toLocaleDateString(loc(), { year: 'numeric', month: 'long', day: 'numeric' }) : ''; };
  if (p.image) { var im = document.createElement('img'); im.className = 'pl-d-img'; im.src = p.image; im.alt = p.name; body.appendChild(im); }
  var s1 = el('div', 'pl-d-sec'); s1.appendChild(el('h3', '', t('main_info')));
  dl(s1, [[t('scientific_name'), p.scientificName], [t('location'), p.location], [t('date_added'), p.createdAt === new Date(0).toISOString() ? '' : fd(p.createdAt)]]);
  body.appendChild(s1);
  var s2 = el('div', 'pl-d-sec'); s2.appendChild(el('h3', '', t('plant_needs')));
  dl(s2, [[t('water_needs'), levelLabel('water', p.waterNeeds)], [t('light_needs'), levelLabel('light', p.lightNeeds)],
    [t('water_interval'), t('every_n_days', { n: nf(p.waterInterval) })],
    [t('fertilize_interval'), p.fertilizeInterval ? t('every_n_days', { n: nf(p.fertilizeInterval) }) : '']]);
  body.appendChild(s2);
  var s3 = el('div', 'pl-d-sec'); s3.appendChild(el('h3', '', t('last_care')));
  dl(s3, [[t('last_watering'), p.lastWatered ? fd(p.lastWatered) : t('not_watered_yet')], [t('last_fertilizing'), p.fertilizeInterval ? (p.lastFertilized ? fd(p.lastFertilized) : t('not_fertilized_yet')) : '']]);
  body.appendChild(s3);
  if (p.tags.length) { var s4 = el('div', 'pl-d-sec'); s4.appendChild(el('h3', '', t('tags'))); var tg = el('div', 'pl-tags'); p.tags.forEach(function (x) { tg.appendChild(el('span', 'pl-tag', x)); }); s4.appendChild(tg); body.appendChild(s4); }
  if (p.notes) { var s5 = el('div', 'pl-d-sec'); s5.appendChild(el('h3', '', t('notes'))); s5.appendChild(el('p', '', p.notes)); body.appendChild(s5); }
  $('detailsDialog').showModal();
}
function exportData() {
  var data = JSON.stringify({ version: 1, plants: plants, completedTasks: completed }, null, 2);
  var url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  var a = document.createElement('a'); a.href = url; a.download = 'plants-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  toast(t('export_success'));
}
function onImportFile(e) {
  var f = e.target.files[0]; e.target.value = ''; if (!f) return;
  if (f.size > 25 * 1024 * 1024) { toast(t('import_error'), 'error'); return; }
  var r = new FileReader();
  r.onload = async function () {
    var res = parseImport(String(r.result));
    if (!res || !res.plants.length) { toast(t('import_error'), 'error'); return; }
    if (!(await confirmDialog(t('import_confirm', { n: nf(res.plants.length), m: nf(plants.length) }), 'import_replace'))) return;
    var seen = {};
    plants = res.plants.map(function (p) { if (!p.id || seen[p.id]) p.id = newId(); seen[p.id] = 1; return p; });
    completed = res.completed;
    if (save()) toast(res.skipped ? t('import_partial', { n: nf(res.skipped) }) : t('import_success'), res.skipped ? 'warn' : '');
    activeFilter = 'all'; render();
  };
  r.onerror = function () { toast(t('import_error'), 'error'); };
  r.readAsText(f);
}

function bind() {
  document.querySelectorAll('.pl-tab').forEach(function (b) { b.addEventListener('click', function () { switchView(b.dataset.view); }); });
  document.querySelector('.pl-nav').addEventListener('keydown', function (e) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('.pl-tab')), i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var step = (e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0) * (document.documentElement.dir === 'rtl' ? 1 : -1);
    if (e.key === 'Home') i = 0; else if (e.key === 'End') i = tabs.length - 1; else if (step) i = (i + step + tabs.length) % tabs.length; else return;
    e.preventDefault(); tabs[i].focus(); switchView(tabs[i].dataset.view);
  });
  $('addPlantBtn').addEventListener('click', function () { openPlantDialog(); });
  $('emptyAddBtn').addEventListener('click', function () { openPlantDialog(); });
  $('plantForm').addEventListener('submit', onPlantSubmit);
  $('plantCancel').addEventListener('click', function () { $('plantDialog').close(); });
  $('fImage').addEventListener('change', onImageChange);
  $('imgRemove').addEventListener('click', function () { pendingImage = ''; showPreview(''); });
  $('fWater').addEventListener('change', function () { if (!$('fWInt').value.trim() && DEFAULT_WATER[this.value]) $('fWInt').value = String(DEFAULT_WATER[this.value]); });
  $('searchInput').addEventListener('input', function (e) { search = e.target.value; renderPlants(); });
  $('filterTags').addEventListener('click', function (e) { var b = e.target.closest('.pl-chip'); if (!b) return; activeFilter = b.dataset.filter; renderPlants(); });
  var onAction = function (e) {
    var b = e.target.closest('button[data-action]'), c = e.target.closest('[data-id]'); if (!b || !c) return;
    var id = c.dataset.id, a = b.dataset.action;
    if (a === 'details') openDetails(id); else if (a === 'edit') openPlantDialog(id); else if (a === 'delete') onDelete(id); else if (a === 'care') completeTask(id, b.dataset.type);
  };
  $('plantsGrid').addEventListener('click', onAction);
  $('todayReminders').addEventListener('click', onAction);
  $('upcomingReminders').addEventListener('click', onAction);
  $('clearCompletedBtn').addEventListener('click', async function () {
    if (!completed.length) { toast(t('nothing_to_clear')); return; }
    if (!(await confirmDialog(t('clear_history_confirm'), 'confirm_yes'))) return;
    completed = []; if (save()) toast(t('tasks_cleared')); render();
  });
  $('exportBtn').addEventListener('click', exportData);
  $('importBtn').addEventListener('click', function () { $('importFile').click(); });
  $('importFile').addEventListener('change', onImportFile);
  $('detailsClose').addEventListener('click', function () { $('detailsDialog').close(); });
  $('detailsEdit').addEventListener('click', function () { var id = detailsId; $('detailsDialog').close(); openPlantDialog(id); });
  ['plantDialog', 'detailsDialog', 'confirmDialog'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); render(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  load(); applyI18n(); bind(); render();
  var due = splitReminders(reminders(plants, todayNum())).today.length;
  if (due > 0) setTimeout(function () { toast(t('reminders_alert', { n: nf(due) }), 'warn'); }, 800);
}
document.addEventListener('DOMContentLoaded', boot);
})();
