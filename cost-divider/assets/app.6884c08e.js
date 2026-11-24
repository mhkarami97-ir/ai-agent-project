(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
var COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d'];
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
/* مبلغ: عدد صحیح مثبت (ریال)؛ جداکنندهٔ هزارگان پذیرفته می‌شود */
function parseAmount(s) {
  var v = normDigits(s).replace(/[\s,٬،]/g, '');
  if (!/^\d+$/.test(v)) return null;
  var n = parseInt(v, 10);
  return n > 0 && n <= 1e13 ? n : null;
}
function hash(s) { var h = 0; s = String(s); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
/* تقسیم مساوی بدون گم‌شدن باقی‌مانده؛ باقی‌مانده از نقطهٔ شروع ثابت (بر اساس id) پخش می‌شود */
function splitEqual(amount, ids, seed) {
  var n = ids.length, base = Math.floor(amount / n), r = amount - base * n, off = n ? hash(seed) % n : 0, out = {};
  ids.forEach(function (id, i) { out[id] = base + (((i - off + n) % n) < r ? 1 : 0); });
  return out;
}
function normalizeMember(raw) {
  if (!raw || typeof raw !== 'object') return null;
  var name = String(raw.name == null ? '' : raw.name).trim().slice(0, 40);
  if (!name || raw.id == null || raw.id === '') return null;
  return { id: String(raw.id), name: name, color: typeof raw.color === 'string' && /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : null };
}
function normalizeExpense(raw) {
  if (!raw || typeof raw !== 'object' || raw.id == null || raw.id === '') return null;
  var amount = Math.round(Number(raw.amount));
  if (!isFinite(amount) || amount <= 0 || amount > 1e13) return null;
  var ids = Array.isArray(raw.participantIds) ? raw.participantIds.map(String) : [];
  var shares = null;
  if (Array.isArray(raw.customShares)) {
    shares = raw.customShares.map(function (s) { return s && { memberId: String(s.memberId), amount: Math.round(Number(s.amount)) }; })
      .filter(function (s) { return s && isFinite(s.amount) && s.amount >= 0; });
  }
  var d = Number(raw.date);
  return {
    id: String(raw.id), title: String(raw.title == null ? '' : raw.title).trim().slice(0, 100), amount: amount,
    date: d > 0 ? d : 0, payerId: String(raw.payerId == null ? '' : raw.payerId), participantIds: ids,
    splitMode: raw.splitMode === 'custom' ? 'custom' : 'equal', customShares: shares
  };
}
/* سهم هر نفر از یک هزینه؛ جمع سهم‌ها همیشه برابر مبلغ است */
function sharesOf(exp, memberIds) {
  var parts = exp.participantIds.filter(function (id, i, a) { return memberIds.indexOf(id) >= 0 && a.indexOf(id) === i; });
  if (!parts.length) parts = memberIds.slice();
  if (exp.splitMode === 'custom' && exp.customShares) {
    var m = {}, sum = 0, ok = true;
    exp.customShares.forEach(function (s) { if (parts.indexOf(s.memberId) < 0) { ok = false; return; } m[s.memberId] = (m[s.memberId] || 0) + s.amount; sum += s.amount; });
    if (ok && sum === exp.amount) return m;
  }
  return splitEqual(exp.amount, parts, exp.id);
}
function balances(members, expenses) {
  var ids = members.map(function (m) { return m.id; }), out = {};
  ids.forEach(function (id) { out[id] = { paid: 0, share: 0, net: 0 }; });
  expenses.forEach(function (e) {
    if (!out[e.payerId]) return;
    out[e.payerId].paid += e.amount;
    var sh = sharesOf(e, ids);
    Object.keys(sh).forEach(function (id) { if (out[id]) out[id].share += sh[id]; });
  });
  ids.forEach(function (id) { out[id].net = out[id].paid - out[id].share; });
  return out;
}
function totalSpent(members, expenses) {
  var ids = {}; members.forEach(function (m) { ids[m.id] = 1; });
  return expenses.reduce(function (s, e) { return ids[e.payerId] ? s + e.amount : s; }, 0);
}
/* گرد کردن ترازها به مضرب unit و اصلاح اختلاف روی بزرگ‌ترین تراز تا جمع صفر بماند */
function roundNets(entries, unit) {
  unit = unit > 0 ? unit : 1;
  var r = entries.map(function (e) { return { id: e.id, net: Math.round(e.net / unit) * unit }; });
  var total = r.reduce(function (s, x) { return s + x.net; }, 0);
  if (total !== 0 && r.length) {
    var idx = 0; for (var i = 1; i < r.length; i++) if (Math.abs(r[i].net) > Math.abs(r[idx].net)) idx = i;
    r[idx].net -= total;
  }
  return r;
}
/* حداقل‌سازی تعداد پرداخت‌ها به روش حریصانه: بزرگ‌ترین بدهکار به بزرگ‌ترین طلبکار */
function settle(entries) {
  var d = entries.filter(function (x) { return x.net < 0; }).map(function (x) { return { id: x.id, amount: -x.net }; }).sort(function (a, b) { return b.amount - a.amount; });
  var c = entries.filter(function (x) { return x.net > 0; }).map(function (x) { return { id: x.id, amount: x.net }; }).sort(function (a, b) { return b.amount - a.amount; });
  var out = [], i = 0, j = 0;
  while (i < d.length && j < c.length) {
    var p = Math.min(d[i].amount, c[j].amount);
    if (p > 0) out.push({ from: d[i].id, to: c[j].id, amount: p });
    d[i].amount -= p; c[j].amount -= p;
    if (d[i].amount === 0) i++;
    if (c[j].amount === 0) j++;
  }
  return out;
}
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function dayToMs(key) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key); return m ? new Date(+m[1], +m[2] - 1, +m[3], 12).getTime() : 0; }
/* @logic-end */

var DB_NAME = 'cost-divider-db', STORES = ['groups', 'members', 'expenses'], ROUND_KEY = 'costDividerRound';
var ROUNDS = [1, 100, 1000, 10000];
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function loc() { return lang === 'fa' ? 'fa-IR' : 'en-US'; }
function nf(n) { return new Intl.NumberFormat(loc()).format(n); }
function money(n) { return nf(n) + ' ' + t('currency'); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function uid() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function fmtDate(ms) { return ms ? new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR-u-ca-persian' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(ms)) : ''; }

var members = [], expenses = [], editingId = null, formMode = 'equal', roundUnit = 100, db = null;

/* ---------- IndexedDB (همان پایگاه و ساختار قبلی) ---------- */
function openDB() {
  return new Promise(function (res, rej) {
    var r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = function (e) { var d = e.target.result; STORES.forEach(function (s) { if (!d.objectStoreNames.contains(s)) d.createObjectStore(s, { keyPath: 'id' }); }); };
    r.onsuccess = function () { db = r.result; res(); };
    r.onerror = function () { rej(r.error); };
  });
}
function run(stores, mode, fn) {
  return new Promise(function (res, rej) {
    var tx = db.transaction(stores, mode), req = fn(tx);
    tx.oncomplete = function () { res(req && req.result); };
    tx.onerror = tx.onabort = function () { rej(tx.error); };
  });
}
function putItem(store, obj) { return run([store], 'readwrite', function (tx) { return tx.objectStore(store).put(obj); }); }
function delItem(store, id) { return run([store], 'readwrite', function (tx) { return tx.objectStore(store).delete(id); }); }
function clearAll() { return run(STORES, 'readwrite', function (tx) { STORES.forEach(function (s) { tx.objectStore(s).clear(); }); }); }
async function reload() {
  var m = await run(['members'], 'readonly', function (tx) { return tx.objectStore('members').getAll(); });
  var e = await run(['expenses'], 'readonly', function (tx) { return tx.objectStore('expenses').getAll(); });
  var seen = {};
  members = m.map(normalizeMember).filter(function (x) { if (!x || seen[x.id]) return false; seen[x.id] = 1; return true; });
  expenses = e.map(normalizeExpense).filter(Boolean).sort(function (a, b) { return b.date - a.date; });
  render();
}

var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'cd-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 2800);
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}
function memberName(id) { var m = members.find(function (x) { return x.id === id; }); return m ? m.name : t('unknown'); }
function memberColor(m) { var i = members.indexOf(m); return m.color || COLORS[i % COLORS.length]; }

function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.title = t('title');
  $('expDialogTitle').textContent = t(editingId ? 'expense_edit' : 'expense_new');
  fillRound();
}
function fillRound() {
  var s = $('roundSel'); s.textContent = '';
  ROUNDS.forEach(function (u) { var o = el('option', '', u === 1 ? t('round_none') : nf(u) + ' ' + t('currency')); o.value = String(u); s.appendChild(o); });
  s.value = String(roundUnit);
}

/* ---------- نمایش ---------- */
function render() {
  var ml = $('memberList'); ml.textContent = '';
  if (!members.length) ml.appendChild(el('p', 'cd-none', t('no_members')));
  members.forEach(function (m) {
    var c = el('span', 'cd-chip', m.name); c.style.setProperty('--dot', memberColor(m)); c.dataset.id = m.id;
    var x = el('button', 'cd-x', '×'); x.type = 'button'; x.dataset.action = 'del-member'; x.setAttribute('aria-label', t('remove') + ': ' + m.name);
    c.appendChild(x); ml.appendChild(c);
  });
  var el2 = $('expenseList'); el2.textContent = '';
  if (!expenses.length) el2.appendChild(el('p', 'cd-none', t('no_expenses')));
  expenses.forEach(function (e) {
    var ids = members.map(function (m) { return m.id; });
    var parts = Object.keys(sharesOf(e, ids)).length;
    var row = el('article', 'cd-exp'); row.dataset.id = e.id;
    var main = el('div', 'cd-exp-main'), top = el('div', 'cd-exp-top');
    top.appendChild(el('span', 'cd-exp-title', e.title || t('untitled'))); top.appendChild(el('span', 'cd-exp-amt', money(e.amount)));
    main.appendChild(top);
    main.appendChild(el('div', 'cd-exp-meta', t('paid_by', { n: memberName(e.payerId) }) + ' · ' + t('for_n', { n: nf(parts) }) + (e.splitMode === 'custom' ? ' · ' + t('mode_custom') : '') + (e.date ? ' · ' + fmtDate(e.date) : '')));
    row.appendChild(main);
    var act = el('div', 'cd-exp-actions');
    var eb = el('button', 'cd-btn cd-btn--sm', t('edit')); eb.type = 'button'; eb.dataset.action = 'edit';
    var db2 = el('button', 'cd-btn cd-btn--sm cd-btn--danger', t('delete')); db2.type = 'button'; db2.dataset.action = 'delete';
    act.appendChild(eb); act.appendChild(db2); row.appendChild(act); el2.appendChild(row);
  });
  renderSummary();
}
function computeSettlement() {
  var bal = balances(members, expenses);
  var entries = members.map(function (m) { return { id: m.id, net: bal[m.id].net }; });
  return { bal: bal, transfers: settle(roundNets(entries, roundUnit)) };
}
function renderSummary() {
  $('totalSpent').textContent = money(totalSpent(members, expenses));
  var s = computeSettlement(), bl = $('balances'); bl.textContent = '';
  if (!members.length) bl.appendChild(el('p', 'cd-none', t('no_members')));
  members.forEach(function (m) {
    var b = s.bal[m.id], row = el('div', 'cd-bal ' + (b.net > 0 ? 'pos' : b.net < 0 ? 'neg' : ''));
    row.appendChild(el('b', '', m.name));
    row.appendChild(el('span', 'cd-net', (b.net > 0 ? '+' : b.net < 0 ? '−' : '') + nf(Math.abs(b.net))));
    row.appendChild(el('small', '', t('paid_share', { p: nf(b.paid), s: nf(b.share) })));
    bl.appendChild(row);
  });
  var sl = $('settlements'); sl.textContent = '';
  if (!s.transfers.length) sl.appendChild(el('p', 'cd-none', t(expenses.length ? 'all_settled' : 'nothing_to_settle')));
  s.transfers.forEach(function (x) {
    var r = el('div', 'cd-set');
    r.appendChild(el('span', '', t('transfer', { a: memberName(x.from), b: memberName(x.to) })));
    r.appendChild(el('span', '', money(x.amount))); sl.appendChild(r);
  });
  $('copyBtn').disabled = !s.transfers.length;
}
function summaryText() {
  var s = computeSettlement();
  var lines = [t('title') + ' — ' + t('total_spent') + ': ' + money(totalSpent(members, expenses)), ''];
  s.transfers.forEach(function (x) { lines.push(t('transfer', { a: memberName(x.from), b: memberName(x.to) }) + ': ' + money(x.amount)); });
  return lines.join('\n');
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
  var ok = false; try { ok = document.execCommand('copy'); } catch (e) {} ta.remove(); return ok;
}

/* ---------- فرم هزینه ---------- */
function setMode(mode) {
  formMode = mode;
  document.querySelectorAll('.cd-seg-btn').forEach(function (b) { var on = b.dataset.mode === mode; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  document.querySelectorAll('.cd-part .cd-input').forEach(function (i) { i.hidden = mode !== 'custom'; });
  updateCustomHint();
}
function buildParts(selected, shares) {
  var box = $('partList'); box.textContent = '';
  members.forEach(function (m) {
    var row = el('div', 'cd-part'), lab = el('label'); lab.htmlFor = 'part-' + m.id;
    var cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'part-' + m.id; cb.value = m.id; cb.checked = selected.indexOf(m.id) >= 0;
    lab.appendChild(cb); lab.appendChild(document.createTextNode(m.name)); row.appendChild(lab);
    var am = document.createElement('input'); am.type = 'text'; am.inputMode = 'numeric'; am.className = 'cd-input'; am.dataset.id = m.id; am.placeholder = '0';
    am.setAttribute('aria-label', t('share_of', { n: m.name })); am.hidden = formMode !== 'custom';
    if (shares && shares[m.id] != null) am.value = String(shares[m.id]);
    row.appendChild(am); box.appendChild(row);
  });
}
function selectedParts() { return [].filter.call($('partList').querySelectorAll('input[type=checkbox]'), function (c) { return c.checked; }).map(function (c) { return c.value; }); }
function customShares() {
  var out = [];
  selectedParts().forEach(function (id) {
    var inp = $('partList').querySelector('.cd-input[data-id="' + id + '"]'), v = normDigits(inp.value).replace(/[\s,٬،]/g, '');
    out.push({ memberId: id, amount: v === '' ? 0 : (/^\d+$/.test(v) ? parseInt(v, 10) : NaN) });
  });
  return out;
}
function updateCustomHint() {
  var h = $('customHint'); h.className = 'cd-hint';
  var amt = parseAmount($('eAmount').value);
  if (formMode !== 'custom') { h.textContent = amt ? t('equal_hint', { n: nf(selectedParts().length || 0) }) : ''; return; }
  var sum = customShares().reduce(function (s, x) { return s + (isFinite(x.amount) ? x.amount : 0); }, 0);
  if (!amt) { h.textContent = ''; return; }
  var diff = amt - sum;
  h.textContent = diff === 0 ? t('custom_ok') : t(diff > 0 ? 'custom_remaining' : 'custom_over', { n: nf(Math.abs(diff)) });
  if (diff !== 0) h.classList.add('is-bad');
}
function openExpense(id) {
  if (!members.length) { toast(t('add_member_first'), true); $('memberName').focus(); return; }
  editingId = id || null;
  var e = id ? expenses.find(function (x) { return x.id === id; }) : null;
  if (id && !e) return;
  $('expForm').reset();
  $('expDialogTitle').textContent = t(e ? 'expense_edit' : 'expense_new');
  var ps = $('ePayer'); ps.textContent = '';
  members.forEach(function (m) { var o = el('option', '', m.name); o.value = m.id; ps.appendChild(o); });
  formMode = e ? e.splitMode : 'equal';
  var sel = e ? sharesOf(e, members.map(function (m) { return m.id; })) : null;
  var selIds = e ? Object.keys(sel) : members.map(function (m) { return m.id; });
  buildParts(selIds, e && e.splitMode === 'custom' ? sel : null);
  if (e) { $('eTitle').value = e.title; $('eAmount').value = String(e.amount); $('eDate').value = e.date ? dayKey(new Date(e.date)) : dayKey(); if (members.some(function (m) { return m.id === e.payerId; })) ps.value = e.payerId; }
  else $('eDate').value = dayKey();
  setMode(formMode); amountHint();
  $('expDialog').showModal(); $('eTitle').focus();
}
function amountHint() { var n = parseAmount($('eAmount').value); $('amountHint').textContent = n ? money(n) : ''; }
async function onExpenseSubmit(ev) {
  ev.preventDefault();
  var amount = parseAmount($('eAmount').value);
  if (amount === null) { toast(t('err_amount'), true); return; }
  var parts = selectedParts();
  if (!parts.length) { toast(t('err_parts'), true); return; }
  var shares = null;
  if (formMode === 'custom') {
    shares = customShares();
    var bad = shares.some(function (s) { return !isFinite(s.amount); }), sum = shares.reduce(function (s, x) { return s + x.amount; }, 0);
    if (bad || sum !== amount) { toast(t('err_custom'), true); return; }
  }
  var date = dayToMs($('eDate').value);
  if (!date) { toast(t('err_date'), true); return; }
  var exp = normalizeExpense({ id: editingId || uid(), title: $('eTitle').value || t('untitled'), amount: amount, date: date, payerId: $('ePayer').value, participantIds: parts, splitMode: formMode, customShares: shares });
  if (!exp) { toast(t('err_amount'), true); return; }
  try { await putItem('expenses', exp); await reload(); $('expDialog').close(); toast(t(editingId ? 'ok_edited' : 'ok_added')); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onAddMember(ev) {
  ev.preventDefault();
  var name = $('memberName').value.trim();
  if (!name) return;
  if (members.some(function (m) { return m.name === name; })) { toast(t('err_dup_member'), true); return; }
  var m = normalizeMember({ id: uid(), name: name, color: COLORS[members.length % COLORS.length] });
  try { await putItem('members', m); $('memberName').value = ''; await reload(); }
  catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onDeleteMember(id) {
  var used = expenses.some(function (e) { return e.payerId === id || e.participantIds.indexOf(id) >= 0 || (e.customShares || []).some(function (s) { return s.memberId === id; }); });
  if (used) { toast(t('err_member_used'), true); return; }
  if (!(await confirmDialog(t('confirm_member', { n: memberName(id) })))) return;
  try { await delItem('members', id); await reload(); } catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onDeleteExpense(id) {
  if (!(await confirmDialog(t('confirm_expense')))) return;
  try { await delItem('expenses', id); await reload(); toast(t('ok_deleted')); } catch (err) { console.error(err); toast(t('err_save'), true); }
}
async function onClear() {
  if (!(await confirmDialog(t('confirm_clear')))) return;
  try { await clearAll(); await reload(); toast(t('ok_cleared')); } catch (err) { console.error(err); toast(t('err_save'), true); }
}

function bind() {
  $('memberForm').addEventListener('submit', onAddMember);
  $('newExpenseBtn').addEventListener('click', function () { openExpense(); });
  $('expForm').addEventListener('submit', onExpenseSubmit);
  $('expCancel').addEventListener('click', function () { $('expDialog').close(); });
  document.querySelectorAll('.cd-seg-btn').forEach(function (b) { b.addEventListener('click', function () { setMode(b.dataset.mode); }); });
  $('eAmount').addEventListener('input', function () { amountHint(); updateCustomHint(); });
  $('partList').addEventListener('input', updateCustomHint);
  $('partList').addEventListener('change', updateCustomHint);
  $('memberList').addEventListener('click', function (e) { var b = e.target.closest('[data-action="del-member"]'), c = e.target.closest('.cd-chip'); if (b && c) onDeleteMember(c.dataset.id); });
  $('expenseList').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-action]'), r = e.target.closest('.cd-exp'); if (!b || !r) return;
    if (b.dataset.action === 'edit') openExpense(r.dataset.id); else onDeleteExpense(r.dataset.id);
  });
  $('roundSel').addEventListener('change', function () { roundUnit = Number(this.value) || 1; try { localStorage.setItem(ROUND_KEY, String(roundUnit)); } catch (e) {} renderSummary(); });
  $('copyBtn').addEventListener('click', async function () { toast(t((await copyText(summaryText())) ? 'copied' : 'copy_failed'), false); });
  $('clearBtn').addEventListener('click', onClear);
  ['expDialog', 'confirmDialog'].forEach(function (id) { $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); }); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); render(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  try { var r = Number(localStorage.getItem(ROUND_KEY)); if (ROUNDS.indexOf(r) >= 0) roundUnit = r; } catch (e) {}
  applyI18n(); bind(); render();
  try { await openDB(); await reload(); } catch (e) { console.error(e); toast(t('err_db'), true); }
}
document.addEventListener('DOMContentLoaded', boot);
})();
