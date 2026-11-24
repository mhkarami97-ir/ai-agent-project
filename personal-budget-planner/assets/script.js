(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
/* مقدار ذخیره‌شدهٔ دسته همان نام فارسی قدیمی است (سازگاری با دادهٔ موجود) */
var CATS = {
  income: [['حقوق', 'salary'], ['پاداش', 'bonus'], ['سرمایه گذاری', 'investment'], ['سایر', 'other']],
  expense: [['غذا', 'food'], ['حمل و نقل', 'transport'], ['خرید', 'shopping'], ['قبض', 'bills'], ['تفریح', 'fun'], ['بهداشت', 'health'], ['آموزش', 'education'], ['سایر', 'other']]
};
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function foldText(s) { return normDigits(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase(); }
function pad(n) { return String(n).padStart(2, '0'); }
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseISO(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normDigits(s).trim());
  if (!m) return null;
  var y = +m[1], mo = +m[2], d = +m[3], dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return { y: y, m: mo, d: d, utc: dt.getTime() };
}
/* مبلغ: ارقام فارسی/عربی، جداکنندهٔ هزارگان (, ٬ فاصله)، اعشار (. ٫) تا دو رقم */
function parseAmount(s) {
  var v = normDigits(s).replace(/[\s,٬،]/g, '').replace(/٫/g, '.');
  if (!/^\d+(\.\d{1,2})?$/.test(v)) return null;
  var n = parseFloat(v);
  return n > 0 && n <= 1e15 ? n : null;
}
var jalaliFmt = null;
function jalaliParts(p) {
  if (!jalaliFmt) jalaliFmt = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
  var o = {};
  jalaliFmt.formatToParts(new Date(Date.UTC(p.y, p.m - 1, p.d, 12))).forEach(function (x) { if (x.type !== 'literal') o[x.type] = x.value; });
  return { y: parseInt(o.relatedYear || o.year, 10), m: parseInt(o.month, 10), d: parseInt(o.day, 10) };
}
/* کلید ماه: cal = 'persian' | 'gregory' */
function monthKey(iso, cal) {
  var p = parseISO(iso); if (!p) return null;
  if (cal === 'persian') { var j = jalaliParts(p); return j.y + '-' + pad(j.m); }
  return p.y + '-' + pad(p.m);
}
function normalizeTx(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.type !== 'income' && raw.type !== 'expense') return null;
  var amount = Number(raw.amount);
  var date = parseISO(raw.date);
  if (!isFinite(amount) || amount <= 0 || !date) return null;
  return {
    id: raw.id,
    type: raw.type,
    category: String(raw.category == null ? '' : raw.category).trim().slice(0, 60) || 'سایر',
    description: String(raw.description == null ? '' : raw.description).trim().slice(0, 120),
    amount: Math.round(amount * 100) / 100,
    date: normDigits(raw.date).trim(),
    timestamp: Number(raw.timestamp) > 0 ? Number(raw.timestamp) : 0
  };
}
function sortTx(list) {
  return list.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : b.timestamp - a.timestamp; });
}
function round2(n) { return Math.round(n * 100) / 100; }
function summarize(list) {
  var i = 0, o = 0;
  list.forEach(function (t) { if (t.type === 'income') i += t.amount; else o += t.amount; });
  return { income: round2(i), expense: round2(o), balance: round2(i - o) };
}
function inMonth(list, month, cal) {
  return month === 'all' ? list : list.filter(function (t) { return monthKey(t.date, cal) === month; });
}
function filterTx(list, type, query, labelFn) {
  var q = foldText(query || '').trim();
  return list.filter(function (t) {
    if (type !== 'all' && t.type !== type) return false;
    return !q || foldText(t.description).indexOf(q) >= 0 || foldText(labelFn ? labelFn(t) : t.category).indexOf(q) >= 0;
  });
}
function byCategory(list, type) {
  var d = {};
  list.forEach(function (t) { if (t.type === type) d[t.category] = round2((d[t.category] || 0) + t.amount); });
  return Object.keys(d).map(function (k) { return { category: k, total: d[k] }; }).sort(function (a, b) { return b.total - a.total; });
}
function monthlySeries(list, cal) {
  var d = {};
  list.forEach(function (t) {
    var k = monthKey(t.date, cal); if (!k) return;
    d[k] = d[k] || { key: k, income: 0, expense: 0, sample: t.date };
    d[k][t.type] = round2(d[k][t.type] + t.amount);
  });
  return Object.keys(d).sort().map(function (k) { return d[k]; });
}
function csvCell(v) {
  var s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function buildCSV(headers, rows) {
  return '\ufeff' + [headers].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
}
/* زاویه‌های conic-gradient برای نمودار دایره‌ای */
function conicStops(items, colors) {
  var total = items.reduce(function (s, x) { return s + x.total; }, 0), acc = 0, parts = [];
  items.forEach(function (x, i) {
    var a = acc / total * 100; acc += x.total; var b = acc / total * 100;
    parts.push(colors[i % colors.length] + ' ' + a.toFixed(2) + '% ' + b.toFixed(2) + '%');
  });
  return parts.join(', ');
}
/* @logic-end */

var DB_NAME = 'BudgetPlannerDB', STORE = 'transactions', MAX_LIST = 200;
var COLORS = ['var(--p0)', 'var(--p1)', 'var(--p2)', 'var(--p3)', 'var(--p4)', 'var(--p5)', 'var(--p6)', 'var(--p7)', 'var(--p8)'];
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function loc() { return lang === 'fa' ? 'fa-IR' : 'en-US'; }
function cal() { return lang === 'fa' ? 'persian' : 'gregory'; }
function nf(n) { return new Intl.NumberFormat(loc(), { maximumFractionDigits: 2 }).format(n); }
function money(n) { return nf(n) + ' ' + t('currency'); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function svg(tag, attrs) { var e = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
function catLabel(type, value) {
  var f = (CATS[type] || []).find(function (c) { return c[0] === value; });
  return f ? t('cat_' + f[1]) : value;
}
function fmtDate(iso) {
  var p = parseISO(iso); if (!p) return iso;
  return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(Date.UTC(p.y, p.m - 1, p.d, 12)));
}
function monthLabel(sampleIso) {
  var p = parseISO(sampleIso);
  return new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', { timeZone: 'UTC', year: 'numeric', month: 'long' }).format(new Date(Date.UTC(p.y, p.m - 1, p.d, 12)));
}

var db = null, txs = [], skipped = 0, typeFilter = 'all', chartType = 'pie', monthSel = 'all', formType = 'expense', editingId = null;

/* ---------- IndexedDB (همان پایگاه قبلی) ---------- */
function openDB() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open(DB_NAME, 1);
    r.onerror = function () { rej(r.error); };
    r.onupgradeneeded = function (e) {
      var d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) {
        var s = d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        s.createIndex('type', 'type', { unique: false }); s.createIndex('category', 'category', { unique: false }); s.createIndex('date', 'date', { unique: false });
      }
    };
    r.onsuccess = function () { db = r.result; res(); };
  });
}
function run(mode, fn) {
  return new Promise(function (res, rej) {
    var tx = db.transaction([STORE], mode), req = fn(tx.objectStore(STORE));
    tx.oncomplete = function () { res(req && req.result); };
    tx.onerror = tx.onabort = function () { rej(tx.error); };
  });
}
async function reload() {
  var raw = await run('readonly', function (s) { return s.getAll(); });
  skipped = 0;
  txs = sortTx(raw.map(function (r) { var n = normalizeTx(r); if (!n) skipped++; return n; }).filter(Boolean));
  render();
}

var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'bp-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 2800);
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}

function fillCats(sel, type, keep) {
  var cur = keep ? sel.value : '';
  sel.textContent = '';
  CATS[type].forEach(function (c) { var o = el('option', '', t('cat_' + c[1])); o.value = c[0]; sel.appendChild(o); });
  if (cur && CATS[type].some(function (c) { return c[0] === cur; })) sel.value = cur;
}
function fillEditType() {
  var s = $('eType'), cur = s.value; s.textContent = '';
  ['income', 'expense'].forEach(function (k) { var o = el('option', '', t('type_' + k)); o.value = k; s.appendChild(o); });
  if (cur) s.value = cur;
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  fillCats($('fCat'), formType, true); fillEditType();
  if (!$('editDialog').open) { fillCats($('eCat'), 'expense', false); }
  hintAmount();
}

function hintAmount() {
  var n = parseAmount($('fAmount').value);
  $('amountHint').textContent = n === null ? '' : money(n);
}

/* ---------- نمایش ---------- */
function monthOptions() {
  var sel = $('monthSel'), cur = monthSel; sel.textContent = '';
  var o = el('option', '', t('all_months')); o.value = 'all'; sel.appendChild(o);
  monthlySeries(txs, cal()).reverse().forEach(function (m) { var x = el('option', '', monthLabel(m.sample)); x.value = m.key; sel.appendChild(x); });
  if ([].some.call(sel.options, function (x) { return x.value === cur; })) sel.value = cur; else { monthSel = 'all'; sel.value = 'all'; }
}
function render() {
  monthOptions();
  var scope = inMonth(txs, monthSel, cal()), s = summarize(scope);
  $('sumIn').textContent = money(s.income); $('sumOut').textContent = money(s.expense); $('sumBal').textContent = money(s.balance);
  $('sumBalBox').className = 'bp-sum ' + (s.balance < 0 ? 'is-neg' : 'is-pos');
  renderList(scope); renderChart(scope);
}
function renderList(scope) {
  var box = $('txList'); box.textContent = '';
  var list = filterTx(scope, typeFilter, $('searchInput').value, function (x) { return catLabel(x.type, x.category); });
  if (!list.length) { box.appendChild(el('p', 'bp-none', t(txs.length ? 'no_match' : 'no_tx'))); return; }
  list.slice(0, MAX_LIST).forEach(function (x) {
    var row = el('article', 'bp-tx ' + x.type); row.dataset.id = x.id;
    var main = el('div', 'bp-tx-main'), top = el('div', 'bp-tx-top');
    top.appendChild(el('span', 'bp-tx-desc', x.description || '—'));
    top.appendChild(el('span', 'bp-tx-amt', (x.type === 'income' ? '+' : '−') + ' ' + money(x.amount)));
    main.appendChild(top);
    var meta = el('div', 'bp-tx-meta');
    meta.appendChild(el('span', '', '📁 ' + catLabel(x.type, x.category)));
    meta.appendChild(el('span', '', '📅 ' + fmtDate(x.date)));
    main.appendChild(meta); row.appendChild(main);
    var act = el('div', 'bp-tx-actions');
    var eb = el('button', 'bp-btn bp-btn--sm', t('edit')); eb.type = 'button'; eb.dataset.action = 'edit';
    var db2 = el('button', 'bp-btn bp-btn--sm bp-btn--danger', t('delete')); db2.type = 'button'; db2.dataset.action = 'delete';
    act.appendChild(eb); act.appendChild(db2); row.appendChild(act); box.appendChild(row);
  });
  if (list.length > MAX_LIST) box.appendChild(el('p', 'bp-more', t('more_hint', { n: nf(list.length - MAX_LIST) })));
}
function renderChart(scope) {
  var box = $('chartBox'); box.textContent = '';
  if (chartType === 'pie') {
    var items = byCategory(scope, 'expense');
    if (!items.length) { box.appendChild(el('p', 'bp-none', t('no_data'))); return; }
    var total = items.reduce(function (s, x) { return s + x.total; }, 0);
    var d = el('div', 'bp-donut'); d.style.background = 'conic-gradient(' + conicStops(items, COLORS) + ')';
    d.setAttribute('role', 'img'); d.setAttribute('aria-label', t('pie_aria', { n: nf(items.length) })); box.appendChild(d);
    var ul = el('ul', 'bp-legend');
    items.forEach(function (x, i) {
      var li = el('li'); var dot = el('span', 'bp-dot'); dot.style.background = COLORS[i % COLORS.length]; li.appendChild(dot);
      var nm = el('span', '', catLabel('expense', x.category)); li.appendChild(nm);
      var v = el('span'); v.appendChild(document.createTextNode(money(x.total) + ' ')); v.appendChild(el('small', '', '(' + nf(Math.round(x.total / total * 100)) + (lang === 'fa' ? '٪' : '%') + ')')); li.appendChild(v);
      ul.appendChild(li);
    });
    box.appendChild(ul);
  } else if (chartType === 'bar') {
    var inc = byCategory(scope, 'income'), exp = byCategory(scope, 'expense'), cats = {};
    var rows = {};
    inc.forEach(function (x) { rows[x.category] = rows[x.category] || { i: 0, e: 0 }; rows[x.category].i = x.total; });
    exp.forEach(function (x) { rows[x.category] = rows[x.category] || { i: 0, e: 0 }; rows[x.category].e = x.total; });
    var keys = Object.keys(rows);
    if (!keys.length) { box.appendChild(el('p', 'bp-none', t('no_data'))); return; }
    var max = Math.max.apply(null, keys.map(function (k) { return Math.max(rows[k].i, rows[k].e); }));
    var wrap = el('div', 'bp-bars');
    keys.sort(function (a, b) { return (rows[b].i + rows[b].e) - (rows[a].i + rows[a].e); }).forEach(function (k) {
      var r = el('div', 'bp-bar-row');
      r.appendChild(el('span', 'bp-bar-name', catLabel(rows[k].e && !rows[k].i ? 'expense' : 'income', k)));
      [['in', rows[k].i], ['out', rows[k].e]].forEach(function (z) {
        if (!z[1]) return;
        var line = el('div', 'bp-bar-line ' + z[0]), tr = el('div', 'bp-bar-track'), f = el('span'); f.style.width = Math.max(2, Math.round(z[1] / max * 100)) + '%'; tr.appendChild(f);
        line.appendChild(tr); line.appendChild(el('span', '', money(z[1]))); r.appendChild(line);
      });
      wrap.appendChild(r);
    });
    box.appendChild(wrap);
    var key = el('div', 'bp-key'); key.appendChild(el('span', 'k-in', t('type_income'))); key.appendChild(el('span', 'k-out', t('type_expense'))); box.appendChild(key);
  } else {
    var ser = monthlySeries(txs, cal());
    if (!ser.length) { box.appendChild(el('p', 'bp-none', t('no_data'))); return; }
    var W = 600, H = 280, pl = 52, pr = 14, pt = 16, pb = 44, pw = W - pl - pr, ph = H - pt - pb;
    var mx = Math.max.apply(null, ser.map(function (s) { return Math.max(s.income, s.expense); }).concat([1]));
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'bp-svg', role: 'img', 'aria-label': t('line_aria', { n: nf(ser.length) }) });
    var compact = new Intl.NumberFormat(loc(), { notation: 'compact', maximumFractionDigits: 1 });
    for (var i = 0; i <= 4; i++) {
      var y = pt + ph * i / 4;
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: y, y2: y, 'class': 'grid' }));
      var tx = svg('text', { x: pl - 6, y: y + 4, 'text-anchor': 'end' }); tx.textContent = compact.format(mx * (4 - i) / 4); s.appendChild(tx);
    }
    var xs = ser.map(function (_, k) { return ser.length === 1 ? pl + pw / 2 : pl + pw * k / (ser.length - 1); });
    var yy = function (v) { return pt + ph - ph * v / mx; };
    ['income', 'expense'].forEach(function (f) {
      var pts = ser.map(function (m, k) { return xs[k].toFixed(1) + ',' + yy(m[f]).toFixed(1); }).join(' ');
      if (ser.length > 1) s.appendChild(svg('polyline', { points: pts, 'class': f === 'income' ? 'l-in' : 'l-out' }));
      ser.forEach(function (m, k) { s.appendChild(svg('circle', { cx: xs[k], cy: yy(m[f]), r: 4.5, 'class': f === 'income' ? 'd-in' : 'd-out' })); });
    });
    var step = Math.ceil(ser.length / 6);
    ser.forEach(function (m, k) {
      if (k % step && k !== ser.length - 1) return;
      var p = parseISO(m.sample), lab = new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', { timeZone: 'UTC', month: 'short', year: '2-digit' }).format(new Date(Date.UTC(p.y, p.m - 1, p.d, 12)));
      var tt = svg('text', { x: xs[k], y: H - 18, 'text-anchor': 'middle' }); tt.textContent = lab; s.appendChild(tt);
    });
    box.appendChild(s);
    var key2 = el('div', 'bp-key'); key2.appendChild(el('span', 'k-in', t('type_income'))); key2.appendChild(el('span', 'k-out', t('type_expense'))); box.appendChild(key2);
  }
}

/* ---------- عملیات ---------- */
function setFormType(type) {
  formType = type;
  document.querySelectorAll('.bp-seg-btn').forEach(function (b) { var on = b.dataset.type === type; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  fillCats($('fCat'), type, false);
}
async function onAdd(e) {
  e.preventDefault();
  var amount = parseAmount($('fAmount').value);
  if (amount === null) { toast(t('err_amount'), true); $('fAmount').focus(); return; }
  var tx = normalizeTx({ type: formType, category: $('fCat').value, description: $('fDesc').value, amount: amount, date: $('fDate').value, timestamp: Date.now() });
  if (!tx) { toast(t('err_invalid'), true); return; }
  delete tx.id;
  try { await run('readwrite', function (s) { return s.add(tx); }); await reload(); $('txForm').reset(); $('fDate').value = dayKey(); setFormType(formType); hintAmount(); toast(t('ok_added')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
function openEdit(id) {
  var x = txs.find(function (v) { return v.id === id; }); if (!x) return;
  editingId = id;
  $('eType').value = x.type; fillCats($('eCat'), x.type, false);
  var has = CATS[x.type].some(function (c) { return c[0] === x.category; });
  if (!has) { var o = el('option', '', x.category); o.value = x.category; $('eCat').appendChild(o); }
  $('eCat').value = x.category; $('eDesc').value = x.description; $('eAmount').value = String(x.amount); $('eDate').value = x.date;
  $('editDialog').showModal();
}
async function onEdit(e) {
  e.preventDefault();
  var old = txs.find(function (v) { return v.id === editingId; }); if (!old) { $('editDialog').close(); return; }
  var amount = parseAmount($('eAmount').value);
  if (amount === null) { toast(t('err_amount'), true); return; }
  var tx = normalizeTx({ id: editingId, type: $('eType').value, category: $('eCat').value, description: $('eDesc').value, amount: amount, date: $('eDate').value, timestamp: old.timestamp || Date.now() });
  if (!tx) { toast(t('err_invalid'), true); return; }
  try { await run('readwrite', function (s) { return s.put(tx); }); await reload(); $('editDialog').close(); toast(t('ok_edited')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onDelete(id) {
  if (!(await confirmDialog(t('confirm_delete')))) return;
  try { await run('readwrite', function (s) { return s.delete(id); }); await reload(); toast(t('ok_deleted')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onClear() {
  if (!(await confirmDialog(t('confirm_clear')))) return;
  try { await run('readwrite', function (s) { return s.clear(); }); await reload(); toast(t('ok_cleared')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
function onExport() {
  if (!txs.length) { toast(t('nothing_export'), true); return; }
  var headers = [t('csv_type'), t('csv_category'), t('csv_desc'), t('csv_amount'), t('csv_date'), t('csv_date_local')];
  var rows = sortTx(txs).reverse().map(function (x) { return [t('type_' + x.type), catLabel(x.type, x.category), x.description, x.amount, x.date, fmtDate(x.date)]; });
  var url = URL.createObjectURL(new Blob([buildCSV(headers, rows)], { type: 'text/csv;charset=utf-8' }));
  var a = document.createElement('a'); a.href = url; a.download = 'budget-' + dayKey() + '.csv';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  toast(t('ok_export'));
}

function bind() {
  $('txForm').addEventListener('submit', onAdd);
  $('editForm').addEventListener('submit', onEdit);
  $('editCancel').addEventListener('click', function () { $('editDialog').close(); });
  document.querySelectorAll('.bp-seg-btn').forEach(function (b) { b.addEventListener('click', function () { setFormType(b.dataset.type); }); });
  $('eType').addEventListener('change', function () { fillCats($('eCat'), this.value, false); });
  $('fAmount').addEventListener('input', hintAmount);
  $('monthSel').addEventListener('change', function () { monthSel = this.value; render(); });
  document.querySelectorAll('.bp-tab').forEach(function (b) {
    b.addEventListener('click', function () {
      chartType = b.dataset.chart;
      document.querySelectorAll('.bp-tab').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); });
      renderChart(inMonth(txs, monthSel, cal()));
    });
  });
  document.querySelectorAll('.bp-chip').forEach(function (b) {
    b.addEventListener('click', function () {
      typeFilter = b.dataset.filter;
      document.querySelectorAll('.bp-chip').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
      renderList(inMonth(txs, monthSel, cal()));
    });
  });
  $('searchInput').addEventListener('input', function () { renderList(inMonth(txs, monthSel, cal())); });
  $('txList').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-action]'), r = e.target.closest('.bp-tx'); if (!b || !r) return;
    var id = Number(r.dataset.id); if (b.dataset.action === 'edit') openEdit(id); else onDelete(id);
  });
  $('exportBtn').addEventListener('click', onExport);
  $('clearBtn').addEventListener('click', onClear);
  ['editDialog', 'confirmDialog'].forEach(function (id) { $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); }); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; monthSel = 'all'; applyI18n(); render(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n(); bind(); $('fDate').value = dayKey(); setFormType('expense'); render();
  try { await openDB(); await reload(); if (skipped) toast(t('warn_skipped', { n: nf(skipped) }), true); }
  catch (e) { console.error(e); toast(t('err_db'), true); }
}
document.addEventListener('DOMContentLoaded', boot);
})();
