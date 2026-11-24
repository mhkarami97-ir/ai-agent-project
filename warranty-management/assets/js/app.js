(function () {
'use strict';

/* @logic-start */
var EXPIRING_DAYS = 30;
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function parseISO(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normDigits(s).trim());
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3];
  var dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y: y, m: mo, d: d };
}
function pad(n) { return String(n).padStart(2, '0'); }
function parseDuration(s) {
  var v = normDigits(s).trim();
  if (!/^\d+$/.test(v)) return null;
  var n = parseInt(v, 10);
  return n >= 1 && n <= 600 ? n : null;
}
/* افزودن ماه با حفظ روز؛ اگر ماه مقصد آن روز را نداشت، آخرین روز ماه (۳۱ ژانویه + ۱ ماه = ۲۸/۲۹ فوریه) */
function addMonths(p, months) {
  var total = p.y * 12 + (p.m - 1) + months;
  var y = Math.floor(total / 12), m = total % 12;
  var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return { y: y, m: m + 1, d: Math.min(p.d, last) };
}
function toUTC(p) { return Date.UTC(p.y, p.m - 1, p.d); }
function toISO(p) { return p.y + '-' + pad(p.m) + '-' + pad(p.d); }
function todayUTC(now) { now = now || new Date(); return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()); }
function normalizeWarranty(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var product = String(raw.product == null ? '' : raw.product).trim();
  var pd = parseISO(raw.purchaseDate), dur = parseDuration(raw.duration);
  if (!product || !pd || dur === null) return null;
  return { id: typeof raw.id === 'string' && raw.id ? raw.id : null, product: product.slice(0, 100), purchaseDate: toISO(pd), duration: dur };
}
/* گارانتی تا پایان روز تاریخ پایان معتبر است */
function info(w, now) {
  var pd = parseISO(w.purchaseDate), exp = addMonths(pd, w.duration);
  var left = Math.round((toUTC(exp) - todayUTC(now)) / 86400000);
  var total = Math.max(1, Math.round((toUTC(exp) - toUTC(pd)) / 86400000));
  var used = Math.min(1, Math.max(0, (todayUTC(now) - toUTC(pd)) / 86400000 / total));
  var key = left < 0 ? 'expired' : left <= EXPIRING_DAYS ? 'expiring' : 'active';
  return { expiry: toISO(exp), expiryParts: exp, daysLeft: left, status: key, used: used };
}
function sortByExpiry(list, now) {
  return list.slice().sort(function (a, b) {
    var ia = info(a, now), ib = info(b, now);
    var ea = ia.status === 'expired', eb = ib.status === 'expired';
    if (ea !== eb) return ea ? 1 : -1;
    return ea ? ib.daysLeft - ia.daysLeft : ia.daysLeft - ib.daysLeft;
  });
}
function summarize(list, now) {
  var s = { total: list.length, active: 0, expiring: 0, expired: 0 };
  list.forEach(function (w) { s[info(w, now).status]++; });
  return s;
}
function nextReminder(list, now) {
  var live = sortByExpiry(list, now).filter(function (w) { return info(w, now).status !== 'expired'; });
  return live.length ? { w: live[0], i: info(live[0], now) } : null;
}
/* @logic-end */

var KEY = 'warranties';
var lang = 'fa', dict = {};
try { lang = localStorage.getItem('lang') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function fmtDate(p) { return new Date(p.y, p.m - 1, p.d).toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function newId() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

var items = [], editingId = null, filter = 'all';

function load() {
  var raw = [];
  try { raw = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) {}
  var seen = {}, changed = false;
  items = (Array.isArray(raw) ? raw : []).map(normalizeWarranty).filter(function (w) {
    if (!w) { changed = true; return false; }
    if (!w.id || seen[w.id]) { w.id = newId(); changed = true; }
    seen[w.id] = 1; return true;
  });
  if (changed) save();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { toast(t('err_save'), true); }
}

var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'wm-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 2600);
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  setEditUI();
}
function setEditUI() {
  var ed = editingId !== null;
  $('formCard').classList.toggle('is-editing', ed);
  $('formTitle').textContent = t(ed ? 'heading_edit' : 'heading_add');
  $('submitBtn').textContent = t(ed ? 'btn_save_changes' : 'button_0');
  $('cancelBtn').textContent = t(ed ? 'btn_cancel_edit' : 'button_1');
}
function durationText(n) {
  if (n % 12 === 0) return t('years', { n: nf(n / 12) });
  return t('months', { n: nf(n) });
}
function badgeText(i) {
  if (i.status === 'expired') return t('expired_ago', { n: nf(-i.daysLeft) });
  if (i.daysLeft === 0) return t('ends_today');
  return t('days_left', { n: nf(i.daysLeft) });
}

function render() {
  var now = new Date(), s = summarize(items, now);
  $('statTotal').textContent = nf(s.total);
  $('statActive').textContent = nf(s.active);
  $('statExpiring').textContent = nf(s.expiring);
  $('statExpired').textContent = nf(s.expired);

  var r = $('reminder'), rt = $('reminderText'), nx = nextReminder(items, now);
  r.className = 'wm-reminder';
  if (!items.length) rt.textContent = t('rem_none');
  else if (!nx) { rt.textContent = t('rem_all_expired'); r.classList.add('is-bad'); }
  else {
    rt.textContent = nx.i.daysLeft === 0 ? t('rem_today', { name: nx.w.product }) : t('rem_next', { name: nx.w.product, n: nf(nx.i.daysLeft) });
    if (nx.i.status === 'expiring') r.classList.add('is-warn');
  }

  var box = $('list'); box.textContent = '';
  var list = sortByExpiry(items, now).filter(function (w) { return filter === 'all' || info(w, now).status === filter; });
  if (!list.length) { box.appendChild(el('p', 'wm-empty', t(items.length ? 'empty_filtered' : 'empty_none'))); return; }
  list.forEach(function (w) {
    var i = info(w, now), pd = parseISO(w.purchaseDate);
    var card = el('article', 'wm-item is-' + i.status); card.dataset.id = w.id;
    var top = el('div', 'wm-item-top');
    top.appendChild(el('h3', 'wm-name', w.product));
    top.appendChild(el('span', 'wm-badge', badgeText(i)));
    card.appendChild(top);
    var dl = el('dl', 'wm-dl');
    dl.appendChild(el('dt', '', t('label_1'))); dl.appendChild(el('dd', '', fmtDate(pd)));
    dl.appendChild(el('dt', '', t('label_duration'))); dl.appendChild(el('dd', '', durationText(w.duration)));
    dl.appendChild(el('dt', '', t('label_expiry'))); dl.appendChild(el('dd', '', fmtDate(i.expiryParts)));
    card.appendChild(dl);
    var bar = el('div', 'wm-bar'); var fill = el('span'); fill.style.width = Math.round(i.used * 100) + '%'; bar.appendChild(fill);
    card.appendChild(bar);
    var row = el('div', 'wm-row');
    var eb = el('button', 'wm-btn wm-btn--sm', t('btn_edit')); eb.type = 'button'; eb.dataset.action = 'edit';
    var db = el('button', 'wm-btn wm-btn--sm wm-btn--danger', t('btn_delete')); db.type = 'button'; db.dataset.action = 'delete';
    row.appendChild(eb); row.appendChild(db); card.appendChild(row);
    box.appendChild(card);
  });
}

function resetForm() { $('warrantyForm').reset(); editingId = null; setEditUI(); }
function onSubmit(e) {
  e.preventDefault();
  var w = normalizeWarranty({ product: $('product').value, purchaseDate: $('purchaseDate').value, duration: $('duration').value });
  if (!w) { toast(t('err_invalid'), true); return; }
  if (editingId !== null) {
    items = items.map(function (x) { return x.id === editingId ? Object.assign({}, w, { id: editingId }) : x; });
    toast(t('ok_edited'));
  } else { w.id = newId(); items.push(w); toast(t('ok_added')); }
  save(); resetForm(); render();
}
function startEdit(id) {
  var w = items.find(function (x) { return x.id === id; }); if (!w) return;
  editingId = id;
  $('product').value = w.product; $('purchaseDate').value = w.purchaseDate; $('duration').value = String(w.duration);
  setEditUI();
  $('formCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
  $('product').focus({ preventScroll: true });
}
async function onDelete(id) {
  if (!(await confirmDialog(t('confirm_delete')))) return;
  items = items.filter(function (x) { return x.id !== id; });
  if (editingId === id) resetForm();
  save(); render(); toast(t('ok_deleted'));
}

function bind() {
  $('warrantyForm').addEventListener('submit', onSubmit);
  $('cancelBtn').addEventListener('click', resetForm);
  $('list').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-action]'), c = e.target.closest('.wm-item');
    if (!b || !c) return;
    if (b.dataset.action === 'edit') startEdit(c.dataset.id); else onDelete(c.dataset.id);
  });
  document.querySelectorAll('.wm-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.wm-chip').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); });
      filter = b.dataset.filter; render();
    });
  });
  $('confirmDialog').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); render(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  load(); applyI18n(); bind(); render();
}
document.addEventListener('DOMContentLoaded', boot);
})();
