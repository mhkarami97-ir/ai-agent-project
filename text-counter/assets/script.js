(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
var READ_WPM = 200, SPEAK_WPM = 130, MAX_SAVED = 100000, HAS_WORD = /[\p{L}\p{N}]/u;
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function fold(s) { return normDigits(s).replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').toLowerCase(); }
var segmenter = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter('fa', { granularity: 'grapheme' }) : null;
/* کاراکتر = grapheme (ایموجی مرکب یک کاراکتر است) */
function countChars(s) {
  if (!s) return 0;
  if (!segmenter) return Array.from(s).length;
  var n = 0; for (var x of segmenter.segment(s)) { n++; } return n;
}
/* بدون فاصله: فاصله‌ها و نیم‌فاصله و صفر-عرض حذف می‌شوند */
function countCharsNoSpace(s) { return countChars(s.replace(/[\s\u200c\u200b]/g, '')); }
function getWords(text) {
  return String(text).split(/[\s\u200b]+/).filter(function (w) { return HAS_WORD.test(w); });
}
function getSentences(text) {
  var out = [];
  String(text).replace(/\r\n?/g, '\n').split('\n').forEach(function (line) {
    line.split(/(?<=[.!?؟…۔]+["»”'’)\]]*)\s+/u).forEach(function (s) { if (HAS_WORD.test(s)) out.push(s.trim()); });
  });
  return out;
}
/* پاراگراف = هر خط غیرخالی */
function getParagraphs(text) {
  return String(text).replace(/\r\n?/g, '\n').split('\n').filter(function (l) { return HAS_WORD.test(l); });
}
function secondsFor(words, wpm) { return words > 0 ? Math.max(1, Math.round(words / wpm * 60)) : 0; }
function splitSeconds(sec) { return { m: Math.floor(sec / 60), s: sec % 60 }; }
function analyze(text) {
  var words = getWords(text);
  return {
    chars: countChars(text), charsNoSpace: countCharsNoSpace(text), words: words.length,
    sentences: getSentences(text).length, paragraphs: getParagraphs(text).length,
    readSec: secondsFor(words.length, READ_WPM), speakSec: secondsFor(words.length, SPEAK_WPM)
  };
}
function stripEdges(w) { return w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''); }
function frequency(text, min, limit) {
  var map = {};
  getWords(text).forEach(function (w) { var k = fold(stripEdges(w)); if (k) map[k] = (map[k] || 0) + 1; });
  var arr = Object.keys(map).filter(function (k) { return map[k] >= min; }).map(function (k) { return { word: k, count: map[k] }; });
  arr.sort(function (a, b) { return b.count - a.count || a.word.localeCompare(b.word, 'fa'); });
  return { total: arr.length, items: arr.slice(0, limit || 100) };
}
function parseMin(v) {
  var s = normDigits(v).trim();
  var n = /^\d+$/.test(s) ? parseInt(s, 10) : NaN;
  return isFinite(n) ? Math.min(100, Math.max(1, n)) : 2;
}
function truncate(text, n) {
  var a = Array.from(text);
  return a.length > n ? a.slice(0, n).join('') + '…' : text;
}
/* تاریخچه: {id, text, date, stats}؛ date قدیمی رشتهٔ محلی بوده و id برابر Date.now() */
function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (h, i) {
    if (!h || typeof h !== 'object') return null;
    var text = typeof h.text === 'string' ? h.text.slice(0, MAX_SAVED) : '';
    if (!text.trim()) return null;
    var id = Number(h.id); if (!isFinite(id) || id <= 0) id = Date.now() + i;
    while (seen[id]) id++;
    seen[id] = 1;
    var d = new Date(h.date), ts = !isNaN(d.getTime()) ? d.getTime() : (id > 1e12 ? id : 0);
    return { id: id, text: text, ts: ts, legacyDate: !isNaN(d.getTime()) || typeof h.date !== 'string' ? '' : h.date };
  }).filter(Boolean).slice(0, 10);
}
/* @logic-end */

var HIST_KEY = 'textAnalyzerHistory', LAST_KEY = 'lastText';
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
function timeLabel(sec) {
  if (!sec) return '–';
  var p = splitSeconds(sec);
  if (!p.m) return t('t_sec', { s: nf(p.s) });
  return p.s ? t('t_min_sec', { m: nf(p.m), s: nf(p.s) }) : t('t_min', { m: nf(p.m) });
}

var history = [], minOcc = 2, saveTimer, freqTimer;

function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
function writeHistory() {
  var out = history.map(function (h) {
    var a = analyze(h.text);
    return { id: h.id, text: h.text, date: h.ts ? new Date(h.ts).toISOString() : h.legacyDate, stats: { words: a.words, sentences: a.sentences, characters: a.chars } };
  });
  try { localStorage.setItem(HIST_KEY, JSON.stringify(out)); return true; } catch (e) { toast(t('err_save'), true); return false; }
}
var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'tc-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 2500);
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

function updateStats() {
  var a = analyze($('textInput').value);
  $('sChars').textContent = nf(a.chars); $('sCharsNo').textContent = nf(a.charsNoSpace);
  $('sWords').textContent = nf(a.words); $('sSentences').textContent = nf(a.sentences); $('sParas').textContent = nf(a.paragraphs);
  $('sRead').textContent = timeLabel(a.readSec); $('sSpeak').textContent = timeLabel(a.speakSec);
}
function renderFreq() {
  var text = $('textInput').value, box = $('freq'); box.textContent = '';
  if (!getWords(text).length) { box.appendChild(el('p', 'tc-none', t('freq_empty'))); return; }
  var r = frequency(text, minOcc, 100);
  if (!r.items.length) { box.appendChild(el('p', 'tc-none', t('freq_none', { n: nf(minOcc) }))); return; }
  var max = r.items[0].count;
  r.items.forEach(function (it) {
    var row = el('div', 'tc-w'); row.appendChild(el('b', '', it.word));
    var bar = el('div', 'tc-bar'), f = el('span'); f.style.width = Math.max(3, Math.round(it.count / max * 100)) + '%'; bar.appendChild(f); row.appendChild(bar);
    row.appendChild(el('small', '', t('times', { n: nf(it.count) }))); box.appendChild(row);
  });
  if (r.total > r.items.length) box.appendChild(el('p', 'tc-none', t('freq_more', { n: nf(r.total - r.items.length) })));
}
function renderHistory() {
  var box = $('hist'); box.textContent = '';
  $('clearHistBtn').hidden = !history.length;
  if (!history.length) { box.appendChild(el('p', 'tc-none', t('text_empty_message_2'))); return; }
  history.forEach(function (h) {
    var a = analyze(h.text), it = el('article', 'tc-h'); it.dataset.id = h.id;
    it.appendChild(el('div', 'tc-h-date', h.ts ? new Date(h.ts).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US') : h.legacyDate));
    var long = Array.from(h.text).length > 150, p = el('p', 'tc-h-text', long ? truncate(h.text, 150) : h.text); p.dir = 'auto'; it.appendChild(p);
    var st = el('div', 'tc-h-stats');
    st.appendChild(el('span', '', t('n_chars', { n: nf(a.chars) }))); st.appendChild(el('span', '', t('n_words', { n: nf(a.words) }))); st.appendChild(el('span', '', t('n_sentences', { n: nf(a.sentences) })));
    it.appendChild(st);
    var act = el('div', 'tc-h-actions');
    [long ? ['toggle', 'show_full', ''] : null, ['restore', 'restore', 'tc-btn--primary'], ['delete', 'delete', 'tc-btn--danger']].forEach(function (d) {
      if (!d) return; var b = el('button', 'tc-btn tc-btn--sm ' + d[2], t(d[1])); b.type = 'button'; b.dataset.action = d[0]; act.appendChild(b);
    });
    it.appendChild(act); box.appendChild(it);
  });
}

function onInput() {
  updateStats();
  clearTimeout(freqTimer); freqTimer = setTimeout(renderFreq, 250);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(function () {
    try { var v = $('textInput').value; if (v.trim()) localStorage.setItem(LAST_KEY, v.slice(0, MAX_SAVED * 2)); else localStorage.removeItem(LAST_KEY); } catch (e) {}
  }, 300);
}
function setText(v) { $('textInput').value = v; onInput(); }
async function onClear() {
  var ta = $('textInput');
  if (ta.value.trim() && !(await confirmDialog(t('confirm_clear_text')))) return;
  setText(''); ta.focus();
}
function onSave() {
  var text = $('textInput').value.trim();
  if (!text) { toast(t('err_empty'), true); return; }
  if (text.length > MAX_SAVED) { toast(t('err_too_long', { n: nf(MAX_SAVED) }), true); return; }
  var id = Date.now(); while (history.some(function (h) { return h.id === id; })) id++;
  history.unshift({ id: id, text: text, ts: id, legacyDate: '' });
  history = history.slice(0, 10);
  if (writeHistory()) toast(t('ok_saved'));
  renderHistory();
}

function bind() {
  $('textInput').addEventListener('input', onInput);
  $('clearBtn').addEventListener('click', onClear);
  $('saveBtn').addEventListener('click', onSave);
  $('minOcc').addEventListener('input', function () { var v = normDigits(this.value).replace(/\D/g, ''); this.value = v; if (v) { minOcc = parseMin(v); renderFreq(); } });
  $('minOcc').addEventListener('blur', function () { this.value = String(minOcc); });
  $('hist').addEventListener('click', async function (e) {
    var b = e.target.closest('button[data-action]'), c = e.target.closest('.tc-h'); if (!b || !c) return;
    var h = history.find(function (x) { return String(x.id) === c.dataset.id; }); if (!h) return;
    if (b.dataset.action === 'restore') { setText(h.text); $('textInput').focus(); $('textInput').scrollIntoView({ behavior: 'smooth', block: 'center' }); toast(t('ok_restored')); }
    else if (b.dataset.action === 'delete') {
      if (!(await confirmDialog(t('confirm_delete')))) return;
      history = history.filter(function (x) { return x !== h; }); if (writeHistory()) toast(t('ok_deleted')); renderHistory();
    } else {
      var p = c.querySelector('.tc-h-text'), open = p.classList.toggle('is-open');
      p.textContent = open ? h.text : truncate(h.text, 150); b.textContent = t(open ? 'show_short' : 'show_full');
    }
  });
  $('clearHistBtn').addEventListener('click', async function () {
    if (!(await confirmDialog(t('confirm_clear_hist')))) return;
    history = []; try { localStorage.removeItem(HIST_KEY); } catch (e) {} renderHistory(); toast(t('ok_cleared'));
  });
  $('confirmDialog').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); updateStats(); renderFreq(); renderHistory(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  history = normalizeHistory(readJSON(HIST_KEY));
  var last = null; try { last = localStorage.getItem(LAST_KEY); } catch (e) {}
  if (last) $('textInput').value = last;
  applyI18n(); bind(); updateStats(); renderFreq(); renderHistory();
}
document.addEventListener('DOMContentLoaded', boot);
})();
