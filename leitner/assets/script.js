(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function foldText(s) { return normDigits(s).replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase(); }
function pad(n) { return String(n).padStart(2, '0'); }
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function addDays(key, n) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  var d = new Date(+m[1], +m[2] - 1, +m[3] + n);
  return dayKey(d);
}
/* نسخهٔ قدیمی nextReview را به صورت toDateString ذخیره می‌کرد ("Sun Oct 04 2026") */
function toDayKey(v, fallback) {
  if (typeof v !== 'string' || !v) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  var d = new Date(v);
  return isNaN(d.getTime()) ? fallback : dayKey(d);
}
function intervalDays(box) { return Math.pow(2, box - 1); }
function normalizeWord(raw, today) {
  if (!raw || typeof raw !== 'object') return null;
  var front = String(raw.front == null ? '' : raw.front).trim().slice(0, 200);
  var back = String(raw.back == null ? '' : raw.back).trim().slice(0, 200);
  if (!front || !back) return null;
  var box = Math.round(Number(raw.box));
  var cc = Math.round(Number(raw.correctCount)), wc = Math.round(Number(raw.wrongCount));
  return {
    id: raw.id == null || raw.id === '' ? null : String(raw.id),
    front: front, back: back,
    box: box >= 1 && box <= 5 ? box : 1,
    nextReview: toDayKey(raw.nextReview, today),
    correctCount: cc > 0 ? cc : 0,
    wrongCount: wc > 0 ? wc : 0
  };
}
function normalizeStats(raw, today) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var td = raw.today && typeof raw.today === 'object' ? raw.today : {};
  var n = function (v) { v = Math.round(Number(v)); return v > 0 ? v : 0; };
  return {
    totalCorrect: n(raw.totalCorrect), totalWrong: n(raw.totalWrong),
    lastReviewDate: toDayKey(raw.lastReviewDate, ''),
    streak: n(raw.streak),
    today: { date: toDayKey(td.date, ''), reviewed: n(td.reviewed), correct: n(td.correct) }
  };
}
function todayStats(stats, today) {
  return stats.today.date === today ? stats.today : { date: today, reviewed: 0, correct: 0 };
}
function dueWords(words, today) { return words.filter(function (w) { return w.nextReview <= today; }); }
function shuffle(arr, rng) {
  rng = rng || Math.random;
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
/* جواب بار اول: درست → جعبهٔ بعد؛ غلط → جعبهٔ ۱ و همچنان امروز سررسید.
   جواب درست در تکرار همان جلسه (بعد از شکست): در جعبهٔ ۱ می‌ماند و فردا مرور می‌شود */
function applyAnswer(w, correct, firstTry, today) {
  var o = Object.assign({}, w);
  if (correct && firstTry) { o.box = Math.min(5, w.box + 1); o.nextReview = addDays(today, intervalDays(o.box)); o.correctCount = w.correctCount + 1; }
  else if (correct) { o.box = 1; o.nextReview = addDays(today, 1); }
  else { o.box = 1; o.nextReview = today; o.wrongCount = w.wrongCount + 1; }
  return o;
}
/* صف جلسه: کارت غلط به انتهای صف می‌رود تا در همان جلسه تکرار شود */
function stepQueue(queue, failed, correct) {
  var id = queue[0], q = queue.slice(1), f = Object.assign({}, failed);
  var firstTry = !f[id];
  if (!correct) { f[id] = true; q.push(id); }
  return { queue: q, failed: f, firstTry: firstTry, id: id };
}
function bumpStreak(stats, today) {
  if (stats.lastReviewDate === today) return stats;
  var s = Object.assign({}, stats);
  s.streak = stats.lastReviewDate === addDays(today, -1) ? stats.streak + 1 : 1;
  s.lastReviewDate = today;
  return s;
}
function streakShown(stats, today) {
  return stats.lastReviewDate === today || stats.lastReviewDate === addDays(today, -1) ? stats.streak : 0;
}
function parseBulk(text, existing) {
  var seen = {};
  existing.forEach(function (w) { seen[foldText(w.front) + '|' + foldText(w.back)] = 1; });
  var items = [], invalid = 0, dup = 0;
  String(text == null ? '' : text).split(/\r?\n/).forEach(function (line) {
    line = line.trim(); if (!line) return;
    var i = line.search(/\||\t/);
    if (i < 0) { invalid++; return; }
    var f = line.slice(0, i).trim().slice(0, 200), b = line.slice(i + 1).trim().slice(0, 200);
    if (!f || !b) { invalid++; return; }
    var k = foldText(f) + '|' + foldText(b);
    if (seen[k]) { dup++; return; }
    seen[k] = 1; items.push({ front: f, back: b });
  });
  return { items: items, invalid: invalid, duplicates: dup };
}
function filterWords(words, box, query) {
  var q = foldText(query || '').trim();
  return words.filter(function (w) {
    if (box !== 'all' && w.box !== Number(box)) return false;
    return !q || foldText(w.front).indexOf(q) >= 0 || foldText(w.back).indexOf(q) >= 0;
  });
}
function boxCounts(words) {
  var c = [0, 0, 0, 0, 0];
  words.forEach(function (w) { c[w.box - 1]++; });
  return c;
}
/* @logic-end */

var KEY = 'leitnerData', MAX_LIST = 300;
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
function newId() { return window.crypto && crypto.randomUUID ? crypto.randomUUID() : 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

var words = [], stats = normalizeStats(null, ''), tab = 'review', boxFilter = 'all', session = null, flipped = false, editingId = null;

function load() {
  var raw = null, today = dayKey();
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var seen = {}, changed = false;
  var list = raw && Array.isArray(raw.words) ? raw.words : [];
  words = list.map(function (w) { return normalizeWord(w, today); }).filter(function (w) {
    if (!w) { changed = true; return false; }
    if (!w.id || seen[w.id]) { w.id = newId(); changed = true; }
    seen[w.id] = 1; return true;
  });
  stats = normalizeStats(raw && raw.stats, today);
  if (changed) save();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ words: words, stats: stats })); return true; }
  catch (e) { toast(t('err_save'), true); return false; }
}
var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'lt-toast' + (isError ? ' is-error' : ''); n.hidden = false;
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
}

/* ---------- مرور ---------- */
function newSession() {
  var due = shuffle(dueWords(words, dayKey()));
  session = { queue: due.map(function (w) { return w.id; }), failed: {}, total: due.length, correct: 0, firstTries: 0 };
  flipped = false;
}
function getWord(id) { return words.find(function (w) { return w.id === id; }); }
function renderReview() {
  var today = dayKey();
  if (!session) newSession();
  var left = session.queue.length, done = session.total - new Set(session.queue).size;
  $('sToday').textContent = nf(session.total);
  $('sRemaining').textContent = nf(new Set(session.queue).size);
  $('sCorrect').textContent = nf(session.correct);
  var pct = session.total ? Math.round(done / session.total * 100) : 0;
  $('progress').setAttribute('aria-valuenow', pct); $('progressFill').style.width = pct + '%';
  var none = session.total === 0, fin = session.total > 0 && left === 0;
  $('noCards').hidden = !none; $('doneBox').hidden = !fin; $('cardBox').hidden = none || fin;
  $('progress').hidden = none;
  if (fin) { $('doneText').textContent = t('done_text', { c: nf(session.correct), n: nf(session.total) }); return; }
  if (none) return;
  var w = getWord(session.queue[0]);
  if (!w) { session.queue.shift(); renderReview(); return; }
  $('boxBadge').textContent = t('box_n', { n: nf(w.box) }) + (session.failed[w.id] ? ' · ' + t('retry') : '');
  var q = $('cardQ'), a = $('cardA');
  q.textContent = w.front; a.textContent = w.back;
  q.classList.toggle('is-small', flipped);
  a.hidden = !flipped; $('flipBtn').hidden = flipped; $('answerBtns').hidden = !flipped;
}
function flip() { flipped = true; renderReview(); $('knewBtn').focus({ preventScroll: true }); }
function answer(correct) {
  if (!session || !session.queue.length) return;
  var today = dayKey(), step = stepQueue(session.queue, session.failed, correct), w = getWord(step.id);
  if (w) {
    var upd = applyAnswer(w, correct, step.firstTry, today);
    words = words.map(function (x) { return x.id === w.id ? upd : x; });
    if (correct) stats.totalCorrect++; else stats.totalWrong++;
    if (step.firstTry) {
      stats = bumpStreak(stats, today);
      var td = todayStats(stats, today);
      stats.today = { date: today, reviewed: td.reviewed + 1, correct: td.correct + (correct ? 1 : 0) };
      if (correct) session.correct++;
    }
    save();
  }
  session.queue = step.queue; session.failed = step.failed; flipped = false;
  renderReview(); updateBadge();
  if (session.queue.length) $('flipBtn').focus({ preventScroll: true });
}
function updateBadge() {
  var n = dueWords(words, dayKey()).length, b = $('dueBadge');
  b.textContent = nf(n); b.hidden = n === 0;
}

/* ---------- افزودن ---------- */
function showMsg(text, isError) {
  var m = $('addMsg'); m.textContent = text; m.className = 'lt-msg' + (isError ? ' is-error' : ''); m.hidden = false;
  clearTimeout(showMsg.t); showMsg.t = setTimeout(function () { m.hidden = true; }, 4000);
}
function addItems(items) {
  var today = dayKey();
  items.forEach(function (it) { words.push({ id: newId(), front: it.front, back: it.back, box: 1, nextReview: today, correctCount: 0, wrongCount: 0 }); });
  session = null; save(); updateBadge();
}
function onAddOne() {
  var f = $('wFront').value.trim(), b = $('wBack').value.trim();
  if (!f || !b) { showMsg(t('err_both'), true); return; }
  var p = parseBulk(f + '|' + b, words);
  if (!p.items.length) { showMsg(t('err_dup'), true); return; }
  addItems([{ front: f.slice(0, 200), back: b.slice(0, 200) }]);
  $('wFront').value = ''; $('wBack').value = ''; $('wFront').focus();
  showMsg(t('ok_added'));
}
function onAddBulk() {
  var p = parseBulk($('bulk').value, words);
  if (!p.items.length) { showMsg(p.duplicates ? t('err_dup') : t('err_format'), true); return; }
  addItems(p.items);
  $('bulk').value = '';
  var extra = [];
  if (p.invalid) extra.push(t('n_invalid', { n: nf(p.invalid) }));
  if (p.duplicates) extra.push(t('n_dup', { n: nf(p.duplicates) }));
  showMsg(t('ok_bulk', { n: nf(p.items.length) }) + (extra.length ? ' (' + extra.join('، ') + ')' : ''));
}

/* ---------- لیست ---------- */
function renderFilters() {
  var c = boxCounts(words), box = $('filters'); box.textContent = '';
  var defs = [['all', t('filter_all') + ' (' + nf(words.length) + ')']];
  for (var i = 1; i <= 5; i++) defs.push([String(i), t('box_n', { n: nf(i) }) + ' (' + nf(c[i - 1]) + ')']);
  defs.forEach(function (d) {
    var b = el('button', 'lt-chip' + (String(boxFilter) === d[0] ? ' is-active' : ''), d[1]);
    b.type = 'button'; b.dataset.filter = d[0]; b.setAttribute('aria-pressed', String(boxFilter) === d[0] ? 'true' : 'false'); box.appendChild(b);
  });
}
function renderList() {
  renderFilters();
  var list = filterWords(words, boxFilter, $('search').value), box = $('words'); box.textContent = '';
  if (!list.length) {
    var e = el('div', 'lt-empty'); e.appendChild(el('h3', '', t(words.length ? 'no_match' : 'no_words')));
    e.appendChild(el('p', 'lt-muted', t(words.length ? 'no_match_hint' : 'no_words_hint'))); box.appendChild(e); return;
  }
  list.slice(0, MAX_LIST).forEach(function (w) {
    var it = el('div', 'lt-word'); it.dataset.id = w.id;
    var m = el('div', 'lt-word-main');
    var f = el('div', 'lt-word-front', w.front); f.dir = 'auto'; m.appendChild(f);
    var b = el('div', 'lt-word-back', w.back); b.dir = 'auto'; m.appendChild(b);
    it.appendChild(m);
    var act = el('div', 'lt-word-actions');
    act.appendChild(el('span', 'lt-box-tag', t('box_n', { n: nf(w.box) })));
    var eb = el('button', 'lt-btn lt-btn--sm', t('edit')); eb.type = 'button'; eb.dataset.action = 'edit'; act.appendChild(eb);
    var db = el('button', 'lt-btn lt-btn--sm lt-btn--bad', t('delete')); db.type = 'button'; db.dataset.action = 'delete'; act.appendChild(db);
    it.appendChild(act); box.appendChild(it);
  });
  if (list.length > MAX_LIST) box.appendChild(el('p', 'lt-more', t('more_hint', { n: nf(list.length - MAX_LIST) })));
}
function openEdit(id) {
  var w = getWord(id); if (!w) return;
  editingId = id; $('eFront').value = w.front; $('eBack').value = w.back; $('editDialog').showModal();
}
function onEditSave(e) {
  e.preventDefault();
  var f = $('eFront').value.trim(), b = $('eBack').value.trim();
  if (!f || !b) { toast(t('err_both'), true); return; }
  words = words.map(function (w) { return w.id === editingId ? Object.assign({}, w, { front: f.slice(0, 200), back: b.slice(0, 200) }) : w; });
  save(); session = null; $('editDialog').close(); renderList(); toast(t('ok_edited'));
}
async function onDelete(id) {
  var w = getWord(id); if (!w) return;
  if (!(await confirmDialog(t('confirm_delete', { w: w.front })))) return;
  words = words.filter(function (x) { return x.id !== id; });
  session = null; save(); updateBadge(); renderList(); toast(t('ok_deleted'));
}

/* ---------- آمار ---------- */
function renderStats() {
  var today = dayKey(), td = todayStats(stats, today);
  $('stTotal').textContent = nf(words.length);
  $('stDue').textContent = nf(dueWords(words, today).length);
  $('stReviewed').textContent = nf(td.reviewed);
  $('stStreak').textContent = nf(streakShown(stats, today));
  $('stAcc').textContent = nf(td.reviewed ? Math.round(td.correct / td.reviewed * 100) : 0) + '%';
  var c = boxCounts(words), max = Math.max.apply(null, c.concat([1])), box = $('boxDist'); box.textContent = '';
  c.forEach(function (n, i) {
    var row = el('div', 'lt-dist');
    row.appendChild(el('span', '', t('box_n', { n: nf(i + 1) })));
    var tr = el('div', 'lt-dist-track'), f = el('span'); f.style.width = Math.round(n / max * 100) + '%'; f.style.background = 'var(--b' + (i + 1) + ')'; tr.appendChild(f);
    row.appendChild(tr); row.appendChild(el('b', '', nf(n))); box.appendChild(row);
  });
}
async function onClearAll() {
  if (!(await confirmDialog(t('confirm_clear')))) return;
  try { localStorage.removeItem(KEY); } catch (e) {}
  words = []; stats = normalizeStats(null, ''); session = null;
  switchTab('add'); updateBadge(); toast(t('ok_cleared'));
}

function switchTab(name) {
  tab = name;
  document.querySelectorAll('.lt-tab').forEach(function (b) { var on = b.dataset.tab === name; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  ['review', 'add', 'list', 'stats'].forEach(function (x) { $('tab-' + x).hidden = x !== name; });
  render();
}
function render() {
  updateBadge();
  if (tab === 'review') renderReview(); else if (tab === 'list') renderList(); else if (tab === 'stats') renderStats();
}

function bind() {
  document.querySelectorAll('.lt-tab').forEach(function (b) { b.addEventListener('click', function () { switchTab(b.dataset.tab); }); });
  $('flipBtn').addEventListener('click', flip);
  $('knewBtn').addEventListener('click', function () { answer(true); });
  $('didntBtn').addEventListener('click', function () { answer(false); });
  $('backBtn').addEventListener('click', function () { session = null; renderReview(); });
  $('addOneBtn').addEventListener('click', onAddOne);
  $('addBulkBtn').addEventListener('click', onAddBulk);
  $('wFront').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); $('wBack').focus(); } });
  $('wBack').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); onAddOne(); } });
  $('search').addEventListener('input', renderList);
  $('filters').addEventListener('click', function (e) { var b = e.target.closest('.lt-chip'); if (!b) return; boxFilter = b.dataset.filter; renderList(); });
  $('words').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-action]'), r = e.target.closest('.lt-word'); if (!b || !r) return;
    if (b.dataset.action === 'edit') openEdit(r.dataset.id); else onDelete(r.dataset.id);
  });
  $('editForm').addEventListener('submit', onEditSave);
  $('editCancel').addEventListener('click', function () { $('editDialog').close(); });
  $('clearAllBtn').addEventListener('click', onClearAll);
  ['editDialog', 'confirmDialog'].forEach(function (id) { $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); }); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); render(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) return;
    if (session && session.queue.length === 0 && session.total === 0) session = null;
    render();
  });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  load(); applyI18n(); bind(); render();
}
document.addEventListener('DOMContentLoaded', boot);
})();
