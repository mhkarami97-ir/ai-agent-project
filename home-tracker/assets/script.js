(function () {
'use strict';

/* @logic-start */
var CATEGORIES = ['dairy','meat','vegetables','fruits','grains','canned','beverages','snacks','cleaning','personal','other'];
var LOCATIONS = ['fridge','freezer','pantry','cabinet','other'];
var EXPIRING_DAYS = 7;
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';

function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function parseISODate(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normDigits(s).trim());
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3];
  var dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y: y, m: mo, d: d, utc: dt.getTime() };
}
function todayUTC(now) {
  now = now || new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
}
function daysUntil(expiry, now) {
  var p = parseISODate(expiry);
  if (!p) return null;
  return Math.round((p.utc - todayUTC(now)) / 86400000);
}
function statusOf(expiry, now) {
  var d = daysUntil(expiry, now);
  if (d === null) return { key: 'expired', days: null };
  if (d < 0) return { key: 'expired', days: d };
  if (d <= EXPIRING_DAYS) return { key: 'expiring', days: d };
  return { key: 'fresh', days: d };
}
function normalizeItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var name = String(raw.name == null ? '' : raw.name).trim();
  if (!name) return null;
  var exp = parseISODate(raw.expiryDate);
  if (!exp) return null;
  var added = Number(new Date(raw.dateAdded));
  return {
    id: raw.id,
    name: name.slice(0, 80),
    category: CATEGORIES.indexOf(raw.category) >= 0 ? raw.category : 'other',
    quantity: String(raw.quantity == null ? '' : raw.quantity).trim().slice(0, 40),
    expiryDate: raw.expiryDate.trim ? normDigits(raw.expiryDate).trim() : '',
    location: LOCATIONS.indexOf(raw.location) >= 0 ? raw.location : 'other',
    notes: String(raw.notes == null ? '' : raw.notes).trim().slice(0, 300),
    dateAdded: isNaN(added) ? new Date(0).toISOString() : new Date(added).toISOString()
  };
}
function foldText(s) {
  return normDigits(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
}
function filterSort(items, opts, now) {
  var q = foldText(opts.search || '').trim();
  var out = items.filter(function (it) {
    if (q && foldText(it.name).indexOf(q) < 0) return false;
    if (opts.filter && opts.filter !== 'all' && statusOf(it.expiryDate, now).key !== opts.filter) return false;
    return true;
  });
  var byName = function (a, b) { return a.name.localeCompare(b.name, 'fa'); };
  var byExp = function (a, b) { return parseISODate(a.expiryDate).utc - parseISODate(b.expiryDate).utc; };
  var cmp = {
    'expiry-asc': byExp,
    'expiry-desc': function (a, b) { return byExp(b, a); },
    'name-asc': byName,
    'name-desc': function (a, b) { return byName(b, a); },
    'added-desc': function (a, b) { return new Date(b.dateAdded) - new Date(a.dateAdded); }
  }[opts.sort] || byExp;
  return out.sort(cmp);
}
function computeStats(items, now) {
  var s = { total: items.length, fresh: 0, expiring: 0, expired: 0 };
  items.forEach(function (it) { s[statusOf(it.expiryDate, now).key]++; });
  return s;
}
/* @logic-end */

/* ---------- i18n ---------- */
var lang = 'fa', dict = {};
try { lang = localStorage.getItem('lang') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function fmtDate(iso) {
  var p = parseISODate(iso);
  if (!p) return iso;
  return new Date(p.y, p.m - 1, p.d).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  fillSelect($('category'), CATEGORIES, 'cat_', true);
  fillSelect($('editCategory'), CATEGORIES, 'cat_', false);
  fillSelect($('location'), LOCATIONS, 'loc_', false);
  fillSelect($('editLocation'), LOCATIONS, 'loc_', false);
}

/* ---------- DOM helpers ---------- */
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function fillSelect(sel, keys, prefix, withPlaceholder) {
  var cur = sel.value;
  sel.textContent = '';
  if (withPlaceholder) {
    var o = el('option', '', t('choose')); o.value = ''; sel.appendChild(o);
  }
  keys.forEach(function (k) { var o = el('option', '', t(prefix + k)); o.value = k; sel.appendChild(o); });
  if (cur) sel.value = cur;
}

var toastTimer;
function toast(msg, isError) {
  var n = $('toast');
  n.textContent = msg;
  n.className = 'ht-toast' + (isError ? ' is-error' : '');
  n.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { n.hidden = true; }, 2800);
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog');
    $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = '';
    d.addEventListener('close', done);
    d.showModal();
  });
}

/* ---------- IndexedDB (همان پایگاه قبلی: داده‌های موجود حفظ می‌شود) ---------- */
var DB = {
  db: null,
  open: function () {
    var self = this;
    return new Promise(function (res, rej) {
      var r = indexedDB.open('HomeTrackerDB', 1);
      r.onerror = function () { rej(r.error); };
      r.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('items')) {
          var s = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
          s.createIndex('name', 'name', { unique: false });
          s.createIndex('category', 'category', { unique: false });
          s.createIndex('expiryDate', 'expiryDate', { unique: false });
        }
      };
      r.onsuccess = function () { self.db = r.result; res(); };
    });
  },
  run: function (mode, fn) {
    var self = this;
    return new Promise(function (res, rej) {
      var tx = self.db.transaction(['items'], mode);
      var req = fn(tx.objectStore('items'));
      tx.oncomplete = function () { res(req && req.result); };
      tx.onerror = function () { rej(tx.error); };
      tx.onabort = function () { rej(tx.error); };
    });
  },
  all: function () { return this.run('readonly', function (s) { return s.getAll(); }); },
  add: function (it) { return this.run('readwrite', function (s) { return s.add(it); }); },
  put: function (it) { return this.run('readwrite', function (s) { return s.put(it); }); },
  del: function (id) { return this.run('readwrite', function (s) { return s.delete(id); }); },
  clear: function () { return this.run('readwrite', function (s) { return s.clear(); }); }
};

/* ---------- state & render ---------- */
var items = [], filter = 'all', sort = 'expiry-asc', skipped = 0;

function badgeText(st) {
  if (st.days === null) return t('status_invalid');
  if (st.days < 0) return t('days_ago', { n: nf(-st.days) });
  if (st.days === 0) return t('today');
  return t('days_left', { n: nf(st.days) });
}
function renderStats() {
  var s = computeStats(items);
  $('statTotal').textContent = nf(s.total);
  $('statFresh').textContent = nf(s.fresh);
  $('statExpiring').textContent = nf(s.expiring);
  $('statExpired').textContent = nf(s.expired);
  $('clearAllBtn').hidden = s.total === 0;
  var b = $('alertBanner');
  if (s.expired > 0) { $('alertText').textContent = t('alert_expired', { n: nf(s.expired) }); b.className = 'ht-alert is-bad'; b.hidden = false; }
  else if (s.expiring > 0) { $('alertText').textContent = t('alert_expiring', { n: nf(s.expiring) }); b.className = 'ht-alert'; b.hidden = false; }
  else b.hidden = true;
}
function renderList() {
  var box = $('itemsList');
  box.textContent = '';
  var list = filterSort(items, { search: $('searchInput').value, filter: filter, sort: sort });
  if (!list.length) {
    var e = el('div', 'ht-empty');
    e.appendChild(el('strong', '', t(items.length ? 'empty_filtered' : 'empty_none')));
    e.appendChild(el('span', '', t(items.length ? 'empty_filtered_hint' : 'empty_none_hint')));
    box.appendChild(e);
    return;
  }
  list.forEach(function (it) {
    var st = statusOf(it.expiryDate);
    var card = el('article', 'ht-item is-' + st.key);
    card.dataset.id = it.id;
    var top = el('div', 'ht-item-top');
    top.appendChild(el('h3', 'ht-item-name', it.name));
    top.appendChild(el('span', 'ht-badge', badgeText(st)));
    card.appendChild(top);
    var meta = el('div', 'ht-meta');
    meta.appendChild(el('span', 'ht-tag', t('cat_' + it.category)));
    meta.appendChild(el('span', 'ht-tag', t('loc_' + it.location)));
    card.appendChild(meta);
    var dl = el('dl', 'ht-dl');
    dl.appendChild(el('dt', '', t('label_quantity'))); dl.appendChild(el('dd', '', it.quantity));
    dl.appendChild(el('dt', '', t('label_expiry'))); dl.appendChild(el('dd', '', fmtDate(it.expiryDate)));
    card.appendChild(dl);
    if (it.notes) card.appendChild(el('p', 'ht-note', it.notes));
    var act = el('div', 'ht-item-actions');
    var eb = el('button', 'ht-btn ht-btn--sm', t('btn_edit')); eb.type = 'button'; eb.dataset.action = 'edit';
    var db = el('button', 'ht-btn ht-btn--sm ht-btn--danger', t('btn_delete')); db.type = 'button'; db.dataset.action = 'delete';
    act.appendChild(eb); act.appendChild(db);
    card.appendChild(act);
    box.appendChild(card);
  });
}
function render() { renderStats(); renderList(); }

async function reload() {
  var raw = await DB.all();
  skipped = 0;
  items = raw.map(function (r) { var n = normalizeItem(r); if (!n) skipped++; return n; }).filter(Boolean);
  render();
}

/* ---------- actions ---------- */
function readForm(p) {
  return {
    name: $(p.name).value, category: $(p.category).value, quantity: $(p.quantity).value,
    expiryDate: $(p.expiry).value, location: $(p.location).value, notes: $(p.notes).value
  };
}
async function onAdd(e) {
  e.preventDefault();
  var f = readForm({ name: 'itemName', category: 'category', quantity: 'quantity', expiry: 'expiryDate', location: 'location', notes: 'notes' });
  f.dateAdded = new Date().toISOString();
  var n = normalizeItem(f);
  if (!n) { toast(t('err_invalid'), true); return; }
  delete n.id;
  try { await DB.add(n); await reload(); $('itemForm').reset(); toast(t('ok_added')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
function openEdit(id) {
  var it = items.find(function (x) { return x.id === id; });
  if (!it) return;
  $('editId').value = it.id;
  $('editName').value = it.name; $('editCategory').value = it.category; $('editQuantity').value = it.quantity;
  $('editExpiry').value = it.expiryDate; $('editLocation').value = it.location; $('editNotes').value = it.notes;
  $('editDialog').showModal();
}
async function onEdit(e) {
  e.preventDefault();
  var id = Number($('editId').value);
  var old = items.find(function (x) { return x.id === id; });
  if (!old) { $('editDialog').close(); return; }
  var f = readForm({ name: 'editName', category: 'editCategory', quantity: 'editQuantity', expiry: 'editExpiry', location: 'editLocation', notes: 'editNotes' });
  f.dateAdded = old.dateAdded; f.id = id;
  var n = normalizeItem(f);
  if (!n) { toast(t('err_invalid'), true); return; }
  try { await DB.put(n); await reload(); $('editDialog').close(); toast(t('ok_edited')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onDelete(id) {
  if (!(await confirmDialog(t('confirm_delete')))) return;
  try { await DB.del(id); await reload(); toast(t('ok_deleted')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onClearAll() {
  if (!(await confirmDialog(t('confirm_clear')))) return;
  try { await DB.clear(); await reload(); toast(t('ok_cleared')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}

function bind() {
  $('itemForm').addEventListener('submit', onAdd);
  $('editForm').addEventListener('submit', onEdit);
  $('resetBtn').addEventListener('click', function () { $('itemForm').reset(); });
  $('editCancel').addEventListener('click', function () { $('editDialog').close(); });
  $('clearAllBtn').addEventListener('click', onClearAll);
  $('alertClose').addEventListener('click', function () { $('alertBanner').hidden = true; });
  $('searchInput').addEventListener('input', renderList);
  $('sortBy').addEventListener('change', function (e) { sort = e.target.value; renderList(); });
  document.querySelectorAll('.ht-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.ht-chip').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); });
      filter = b.dataset.filter; renderList();
    });
  });
  $('itemsList').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action]');
    var card = e.target.closest('.ht-item');
    if (!btn || !card) return;
    var id = Number(card.dataset.id);
    if (btn.dataset.action === 'edit') openEdit(id); else onDelete(id);
  });
  ['editDialog', 'confirmDialog'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  });
  window.addEventListener('languageChanged', function (e) {
    lang = e.detail === 'en' ? 'en' : 'fa';
    applyI18n(); render();
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
  setInterval(function () { if (!document.hidden) render(); }, 5 * 60 * 1000);
}

async function boot() {
  try {
    var r = await fetch('assets/translations.json');
    dict = await r.json();
  } catch (e) { console.error('translations', e); }
  applyI18n();
  bind();
  try {
    await DB.open();
    await reload();
    if (skipped) toast(t('warn_skipped', { n: nf(skipped) }), true);
  } catch (e) {
    console.error(e);
    toast(t('err_db'), true);
  }
}
document.addEventListener('DOMContentLoaded', boot);
})();
