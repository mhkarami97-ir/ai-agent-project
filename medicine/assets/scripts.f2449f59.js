(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function parseTime(s) {
  var m = /^(\d{1,2}):(\d{2})/.exec(normDigits(s).trim());
  if (!m) return null;
  var h = +m[1], mi = +m[2];
  if (h > 23 || mi > 59) return null;
  return h * 60 + mi;
}
function fmtTime(min) {
  return String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');
}
function dayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function nowMinutes(d) { d = d || new Date(); return d.getHours() * 60 + d.getMinutes(); }
function normalizeMed(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var name = String(raw.name == null ? '' : raw.name).trim();
  var tm = parseTime(raw.time);
  if (!name || tm === null) return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : null,
    name: name.slice(0, 80),
    dose: String(raw.dose == null ? '' : raw.dose).trim().slice(0, 80),
    time: fmtTime(tm),
    note: String(raw.note == null ? '' : raw.note).trim().slice(0, 160)
  };
}
function cleanLog(log) {
  var out = {};
  if (!log || typeof log !== 'object') return out;
  Object.keys(log).forEach(function (day) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !log[day] || typeof log[day] !== 'object') return;
    Object.keys(log[day]).forEach(function (id) {
      var v = log[day][id];
      if (v === 'taken' || v === 'skipped') { (out[day] = out[day] || {})[id] = v; }
    });
  });
  return out;
}
function pruneLog(log, keepDays, today) {
  var cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - keepDays);
  var ck = dayKey(cutoff), out = {};
  Object.keys(log).forEach(function (d) { if (d >= ck) out[d] = log[d]; });
  return out;
}
/* وضعیت امروز: taken | skipped | overdue | upcoming (۰..۳۰ دقیقه) | pending */
function statusFor(med, logToday, nowMin) {
  var l = logToday && logToday[med.id];
  if (l === 'taken') return { key: 'taken' };
  if (l === 'skipped') return { key: 'skipped' };
  var delta = parseTime(med.time) - nowMin;
  if (delta < 0) return { key: 'overdue', delta: delta };
  if (delta <= 30) return { key: 'upcoming', delta: delta };
  return { key: 'pending', delta: delta };
}
function sortMeds(meds) {
  return meds.slice().sort(function (a, b) { return parseTime(a.time) - parseTime(b.time) || a.name.localeCompare(b.name, 'fa'); });
}
function summarize(meds, logToday, nowMin) {
  var s = { total: meds.length, taken: 0, skipped: 0, upcoming: 0, overdue: 0, pending: 0 };
  meds.forEach(function (m) { s[statusFor(m, logToday, nowMin).key]++; });
  return s;
}
/* بازگرداندن: لاگ جدید با تغییر وضعیت (اگر همان وضعیت دوباره زده شود پاک می‌شود) */
function toggleLog(log, day, id, action) {
  var out = JSON.parse(JSON.stringify(log || {}));
  out[day] = out[day] || {};
  if (out[day][id] === action) delete out[day][id]; else out[day][id] = action;
  if (!Object.keys(out[day]).length) delete out[day];
  return out;
}
function migrateV1(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(function (r) { return normalizeMed(r); }).filter(Boolean);
}
/* @logic-end */

var KEY_V1 = 'medicine-schedule', KEY_V2 = 'medicine-schedule-v2';
var lang = 'fa', dict = {};
try { lang = localStorage.getItem('lang') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function newId() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

var meds = [], log = {};

function load() {
  var v2 = null;
  try { v2 = JSON.parse(localStorage.getItem(KEY_V2)); } catch (e) {}
  if (v2 && Array.isArray(v2.meds)) {
    var seen = {};
    meds = v2.meds.map(normalizeMed).filter(function (m) { if (!m || !m.id || seen[m.id]) return false; seen[m.id] = 1; return true; });
    log = cleanLog(v2.log);
    return;
  }
  var old = [];
  try { old = JSON.parse(localStorage.getItem(KEY_V1) || '[]'); } catch (e) {}
  meds = migrateV1(old).map(function (m) { m.id = newId(); return m; });
  log = {};
  if (meds.length) save();
}
function save() {
  log = pruneLog(log, 60, new Date());
  try { localStorage.setItem(KEY_V2, JSON.stringify({ meds: meds, log: log })); }
  catch (e) { toast(t('err_save'), true); }
}

var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'md-toast' + (isError ? ' is-error' : ''); n.hidden = false;
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
  document.title = t('title');
}

function render() {
  var now = new Date(), nm = nowMinutes(now), today = log[dayKey(now)] || {};
  var list = sortMeds(meds), s = summarize(list, today, nm);
  $('statTotal').textContent = nf(s.total);
  $('statTaken').textContent = nf(s.taken);
  $('statUpcoming').textContent = nf(s.upcoming);
  $('statOverdue').textContent = nf(s.overdue);
  var pct = s.total ? Math.round(((s.taken + s.skipped) / s.total) * 100) : 0;
  $('progress').setAttribute('aria-valuenow', pct);
  $('progressFill').style.width = pct + '%';
  $('todayLabel').textContent = now.toLocaleDateString(lang === 'fa' ? 'fa-IR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  $('emptyMsg').hidden = list.length > 0;

  var al = $('alertList'); al.textContent = '';
  list.forEach(function (m) {
    var st = statusFor(m, today, nm);
    if (st.key === 'upcoming') {
      al.appendChild(el('li', '', st.delta === 0 ? t('alert_now', { name: m.name }) : t('alert_in', { name: m.name, n: nf(st.delta) })));
    } else if (st.key === 'overdue') {
      al.appendChild(el('li', 'is-overdue', t('alert_late', { name: m.name, n: nf(-st.delta >= 60 ? Math.floor(-st.delta / 60) : -st.delta), u: t(-st.delta >= 60 ? 'unit_h' : 'unit_m') })));
    }
  });
  $('alertsBox').hidden = !al.children.length;

  var box = $('medList'); box.textContent = '';
  list.forEach(function (m) {
    var st = statusFor(m, today, nm);
    var li = el('li', 'md-item is-' + st.key); li.dataset.id = m.id;
    var top = el('div', 'md-item-top');
    top.appendChild(el('h3', 'md-name', m.name));
    top.appendChild(el('span', 'md-time', m.time));
    li.appendChild(top);
    li.appendChild(el('span', 'md-badge', t('st_' + st.key)));
    if (m.dose) li.appendChild(el('p', 'md-dose', m.dose));
    if (m.note) li.appendChild(el('p', 'md-note', m.note));
    var row = el('div', 'md-row');
    [['taken', 'btn_taken', 'md-btn md-btn--sm'], ['skipped', 'btn_skipped', 'md-btn md-btn--sm md-btn--skip']].forEach(function (a) {
      var b = el('button', a[2], t(a[1])); b.type = 'button'; b.dataset.action = a[0];
      b.setAttribute('aria-pressed', st.key === a[0] ? 'true' : 'false'); row.appendChild(b);
    });
    var eb = el('button', 'md-btn md-btn--sm', t('btn_edit')); eb.type = 'button'; eb.dataset.action = 'edit';
    var db = el('button', 'md-btn md-btn--sm md-btn--danger', t('btn_delete')); db.type = 'button'; db.dataset.action = 'delete';
    row.appendChild(eb); row.appendChild(db);
    li.appendChild(row);
    box.appendChild(li);
  });
}

function onAdd(e) {
  e.preventDefault();
  var m = normalizeMed({ name: $('medName').value, dose: $('medDose').value, time: $('medTime').value, note: $('medNote').value });
  if (!m) { toast(t('err_invalid'), true); return; }
  m.id = newId(); meds.push(m); save(); $('medForm').reset(); render(); toast(t('ok_added'));
}
function openEdit(id) {
  var m = meds.find(function (x) { return x.id === id; }); if (!m) return;
  $('editId').value = id; $('editName').value = m.name; $('editDose').value = m.dose; $('editTime').value = m.time; $('editNote').value = m.note;
  $('editDialog').showModal();
}
function onEdit(e) {
  e.preventDefault();
  var id = $('editId').value;
  var n = normalizeMed({ name: $('editName').value, dose: $('editDose').value, time: $('editTime').value, note: $('editNote').value });
  if (!n) { toast(t('err_invalid'), true); return; }
  meds = meds.map(function (m) { return m.id === id ? Object.assign({}, n, { id: id }) : m; });
  save(); $('editDialog').close(); render(); toast(t('ok_edited'));
}
async function onDelete(id) {
  if (!(await confirmDialog(t('confirm_delete')))) return;
  meds = meds.filter(function (m) { return m.id !== id; });
  Object.keys(log).forEach(function (d) { delete log[d][id]; if (!Object.keys(log[d]).length) delete log[d]; });
  save(); render(); toast(t('ok_deleted'));
}

function bind() {
  $('medForm').addEventListener('submit', onAdd);
  $('editForm').addEventListener('submit', onEdit);
  $('editCancel').addEventListener('click', function () { $('editDialog').close(); });
  $('medList').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-action]'), li = e.target.closest('.md-item');
    if (!b || !li) return;
    var id = li.dataset.id, a = b.dataset.action;
    if (a === 'edit') openEdit(id);
    else if (a === 'delete') onDelete(id);
    else { log = toggleLog(log, dayKey(), id, a); save(); render(); }
  });
  ['editDialog', 'confirmDialog'].forEach(function (id) {
    $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); render(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) render(); });
  (function tick() { setTimeout(function () { if (!document.hidden) render(); tick(); }, 60000 - (Date.now() % 60000) + 50); })();
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  load(); applyI18n(); bind(); render();
}
document.addEventListener('DOMContentLoaded', boot);
})();
