(function () {
'use strict';

/* @logic-start */
var ZWNJ = '\u200c';
var TEXTS = {
  fa: [
    'برنامه‌نویسی یکی از مهارت‌های مهم در دنیای امروز است. یادگیری برنامه‌نویسی می‌تواند فرصت‌های شغلی زیادی را برای افراد فراهم کند. با تمرین و پشتکار می‌توان در این زمینه به موفقیت دست یافت.',
    'تایپ سریع و دقیق یکی از مهارت‌های کلیدی برای کار با کامپیوتر است. با تمرین منظم می‌توان سرعت تایپ خود را افزایش داد و در کار روزمره بهره‌وری بیشتری داشت.',
    'کتاب خواندن یکی از بهترین راه‌های توسعه فکری و افزایش دانش است. هر روز کمی وقت برای مطالعه اختصاص دهید تا از فواید آن بهره‌مند شوید.',
    'ورزش منظم برای سلامت جسمی و روحی بسیار مفید است. حتی پیاده‌روی روزانه نیز می‌تواند تاثیر زیادی در بهبود کیفیت زندگی داشته باشد.',
    'یادگیری زبان‌های جدید دیدگاه ما را نسبت به دنیا تغییر می‌دهد و فرصت‌های بیشتری برای ارتباط با مردم سراسر جهان فراهم می‌کند.'
  ],
  en: [
    "Programming is one of the most important skills in today's world. Learning to code can open up many career opportunities. With practice and persistence, anyone can succeed in this field.",
    'Fast and accurate typing is a key skill for working with computers. With regular practice, you can increase your typing speed and be more productive in your daily work.',
    'Reading books is one of the best ways to develop intellectually and increase knowledge. Dedicate some time each day to reading to benefit from its advantages.',
    'Regular exercise is very beneficial for physical and mental health. Even daily walking can have a significant impact on improving quality of life.',
    'Learning new languages changes our perspective on the world and provides more opportunities to connect with people around the globe.'
  ]
};
var MIN_MS = 2000;

/* کاراکتر عربی را به فارسی یکسان می‌کند؛ نیم‌فاصله در متن مرجع با فاصله هم پذیرفته می‌شود */
function canon(c) {
  if (c === 'ي' || c === 'ى') return 'ی';
  if (c === 'ك') return 'ک';
  return c;
}
function eq(refCh, typedCh) {
  if (refCh === undefined || typedCh === undefined) return false;
  var a = canon(refCh), b = canon(typedCh);
  if (a === b) return true;
  return a === ZWNJ && (b === ' ' || b === ZWNJ);
}
function countCorrect(ref, typed) {
  var n = 0;
  for (var i = 0; i < typed.length && i < ref.length; i++) if (eq(ref[i], typed[i])) n++;
  return n;
}
/* ثبت فشار کلیدها: فقط حروف تازه‌اضافه‌شده شمرده می‌شوند و اصلاح کردن خطا را پاک نمی‌کند */
function trackAdded(ref, prev, next, stats) {
  var out = { keys: stats.keys, errors: stats.errors };
  for (var i = prev.length; i < next.length; i++) {
    out.keys++;
    if (!eq(ref[i], next[i])) out.errors++;
  }
  return out;
}
function accuracyOf(stats) {
  return stats.keys > 0 ? Math.max(0, Math.round(((stats.keys - stats.errors) / stats.keys) * 100)) : 100;
}
/* WPM خالص: هر ۵ حرف درست یک کلمه */
function wpmOf(correctChars, ms) {
  if (ms < MIN_MS) return 0;
  return Math.round(correctChars / 5 / (ms / 60000));
}
function formatMs(ms) {
  var s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(function (h) {
    if (!h || typeof h !== 'object') return null;
    var d = new Date(h.date);
    var wpm = Math.round(Number(h.wpm)), acc = Math.round(Number(h.accuracy));
    if (isNaN(d.getTime()) || !isFinite(wpm) || wpm < 0 || wpm > 400 || !isFinite(acc)) return null;
    return {
      date: d.toISOString(), wpm: wpm, accuracy: Math.min(100, Math.max(0, acc)),
      time: typeof h.time === 'string' ? h.time.slice(0, 8) : '',
      language: h.language === 'en' ? 'en' : 'fa',
      textIndex: Number.isInteger(h.textIndex) && h.textIndex >= 0 && h.textIndex < 5 ? h.textIndex : 0
    };
  }).filter(Boolean).slice(0, 20);
}
function bestWpm(history, lang) {
  var v = history.filter(function (h) { return h.language === lang; }).map(function (h) { return h.wpm; });
  return v.length ? Math.max.apply(null, v) : null;
}
/* آخرین ۱۰ تمرین یک زبان به‌ترتیب قدیمی‌ترین تا جدیدترین */
function chartSeries(history, lang) {
  return history.filter(function (h) { return h.language === lang; }).slice(0, 10).reverse();
}
/* @logic-end */

var KEY = 'typingHistory', LANG_KEY = 'typingPracticeLang';
var uiLang = 'fa', dict = {};
try { uiLang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[uiLang] && dict[uiLang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(uiLang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

var practice = 'fa', textIndex = 0, ref = '', spans = [];
var st = { start: null, prev: '', keys: 0, errors: 0, done: false, composing: false, timer: null };

function loadHistory() { try { return normalizeHistory(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return []; } }
function saveHistory(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20))); } catch (e) {} }

function applyI18n() {
  document.documentElement.lang = uiLang;
  document.documentElement.dir = uiLang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  $('typed').placeholder = t(practice === 'fa' ? 'placeholder_fa' : 'placeholder_en');
  fillSelect();
  $('best').dataset.k = '';
  renderBest(); renderNext(); renderChart();
  if (!$('historyBox').hidden) renderHistory();
}
function fillSelect() {
  var sel = $('textSelect'); sel.textContent = '';
  TEXTS[practice].forEach(function (_, i) {
    var o = el('option', '', t('text_n', { n: nf(i + 1) })); o.value = String(i); sel.appendChild(o);
  });
  sel.value = String(textIndex);
}

function buildRef() {
  ref = TEXTS[practice][textIndex];
  var box = $('refText'); box.textContent = ''; spans = [];
  for (var i = 0; i < ref.length; i++) { var s = el('span', '', ref[i]); spans.push(s); box.appendChild(s); }
  box.className = 'ty-ref ' + (practice === 'fa' ? 'is-rtl' : 'is-ltr');
  box.lang = practice;
  var ta = $('typed');
  ta.className = 'ty-input ty-typed ' + (practice === 'fa' ? 'is-rtl' : 'is-ltr');
  ta.lang = practice; ta.maxLength = ref.length;
  ta.placeholder = t(practice === 'fa' ? 'placeholder_fa' : 'placeholder_en');
}
function paintRef(typed) {
  for (var i = 0; i < spans.length; i++) {
    var c = '';
    if (i < typed.length) c = eq(ref[i], typed[i]) ? 'c' : 'w';
    else if (i === typed.length) c = 'n';
    if (spans[i].className !== c) spans[i].className = c;
  }
}
function renderNext() {
  var box = $('nextChar'), typed = $('typed').value;
  box.textContent = '';
  if (st.done || typed.length >= ref.length) { box.textContent = '✓ ' + t('completed'); return; }
  var ch = ref[typed.length];
  box.appendChild(document.createTextNode(t('next_char') + ': '));
  var b = el('b', '', ch === ' ' ? t('space') : ch === ZWNJ ? t('zwnj') : ch);
  b.lang = practice; box.appendChild(b);
}
function renderBest() {
  var b = bestWpm(loadHistory(), practice);
  $('best').textContent = b === null ? '–' : nf(b);
}
function elapsed() { return st.start ? Date.now() - st.start : 0; }
function renderLive() {
  var typed = $('typed').value, ms = elapsed();
  $('timer').textContent = formatMs(ms);
  $('wpm').textContent = nf(wpmOf(countCorrect(ref, typed), ms));
  $('accuracy').textContent = nf(accuracyOf(st)) + '%';
}
function startTimer() {
  clearInterval(st.timer);
  st.timer = setInterval(function () { if (!st.done) renderLive(); }, 250);
}
function track(next) {
  if (next.length > st.prev.length) {
    var r = trackAdded(ref, st.prev, next, st); st.keys = r.keys; st.errors = r.errors;
  }
  st.prev = next;
}
function onInput() {
  var ta = $('typed'), v = ta.value;
  if (st.done) return;
  if (!st.start && v.length > 0) { st.start = Date.now(); startTimer(); }
  if (!st.composing) track(v);
  paintRef(v); renderNext(); renderLive();
  if (!st.composing && v.length >= ref.length) finish();
}
function finish() {
  if (st.done) return;
  st.done = true; clearInterval(st.timer);
  var ta = $('typed'), ms = Math.max(elapsed(), MIN_MS);
  ta.readOnly = true;
  var wpm = wpmOf(countCorrect(ref, ta.value), ms), acc = accuracyOf(st);
  $('timer').textContent = formatMs(ms); $('wpm').textContent = nf(wpm); $('accuracy').textContent = nf(acc) + '%';
  var hist = loadHistory(), prevBest = bestWpm(hist, practice);
  hist.unshift({ date: new Date().toISOString(), wpm: wpm, accuracy: acc, time: formatMs(ms), language: practice, textIndex: textIndex });
  saveHistory(hist);
  var isBest = prevBest === null || wpm > prevBest;
  $('resultText').textContent = t('result', { wpm: nf(wpm), acc: nf(acc), time: formatMs(ms) }) + (isBest && prevBest !== null ? ' ' + t('new_best') : '');
  $('resultBox').hidden = false;
  renderNext(); renderBest(); renderChart();
  if (!$('historyBox').hidden) renderHistory();
  $('againBtn').focus({ preventScroll: false });
}
function reset(focus) {
  clearInterval(st.timer);
  st = { start: null, prev: '', keys: 0, errors: 0, done: false, composing: false, timer: null };
  var ta = $('typed'); ta.value = ''; ta.readOnly = false;
  $('resultBox').hidden = true;
  $('wpm').textContent = nf(0); $('accuracy').textContent = nf(100) + '%'; $('timer').textContent = '0:00';
  buildRef(); paintRef(''); renderNext(); renderBest();
  if (focus !== false) ta.focus({ preventScroll: true });
}
function setPractice(lang) {
  practice = lang; textIndex = 0;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  document.querySelectorAll('.ty-seg-btn').forEach(function (b) { var on = b.dataset.lang === lang; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  fillSelect(); reset(false); renderChart();
}

/* ---------- نمودار ---------- */
function cssVar(name, fb) { var v = getComputedStyle($('refText').closest('.ty')).getPropertyValue(name).trim(); return v || fb; }
function renderChart() {
  var cv = $('chart'), wrap = cv.parentElement, dpr = window.devicePixelRatio || 1;
  var w = Math.max(200, wrap.clientWidth), h = wrap.clientHeight || 260;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  var ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
  var accent = cssVar('--c-accent', '#4f46e5'), muted = cssVar('--c-muted', '#667085'), border = cssVar('--c-border', '#e2e5ee'), text = cssVar('--c-text', '#1b1f2a'), ok = cssVar('--c-ok', '#047857');
  var series = chartSeries(loadHistory(), practice);
  var font = "12px Vazirmatn, system-ui, sans-serif";
  ctx.direction = 'ltr'; ctx.font = font; ctx.textBaseline = 'middle';
  cv.setAttribute('aria-label', series.length ? t('chart_aria', { n: nf(series.length), last: nf(series[series.length - 1].wpm) }) : t('no_data'));
  if (!series.length) { ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.fillText(t('no_data'), w / 2, h / 2); return; }
  var padL = 34, padR = 14, padT = 22, padB = 28, pw = w - padL - padR, ph = h - padT - padB;
  var max = Math.max(50, Math.ceil(Math.max.apply(null, series.map(function (s) { return s.wpm; })) / 10) * 10);
  ctx.fillStyle = muted; ctx.textAlign = 'center'; ctx.fillText('WPM', padL + 8, 8);
  ctx.textAlign = 'right';
  for (var i = 0; i <= 5; i++) {
    var y = padT + ph * i / 5;
    ctx.strokeStyle = border; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
    ctx.fillStyle = muted; ctx.fillText(String(Math.round(max * (5 - i) / 5)), padL - 6, y);
  }
  var xs = series.map(function (s, i) { return series.length === 1 ? padL + pw / 2 : padL + pw * i / (series.length - 1); });
  var ys = series.map(function (s) { return padT + ph - ph * s.wpm / max; });
  ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.beginPath();
  xs.forEach(function (x, i) { if (i === 0) ctx.moveTo(x, ys[i]); else ctx.lineTo(x, ys[i]); }); ctx.stroke();
  ctx.textAlign = 'center';
  xs.forEach(function (x, i) {
    ctx.fillStyle = series[i].accuracy < 90 ? cssVar('--c-bad', '#b91c1c') : ok;
    ctx.beginPath(); ctx.arc(x, ys[i], 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = muted; ctx.fillText(String(i + 1), x, h - 10);
    if (series.length <= 6) { ctx.fillStyle = text; ctx.fillText(String(series[i].wpm), x, ys[i] - 14); }
  });
}

/* ---------- تاریخچه ---------- */
function renderHistory() {
  var list = loadHistory(), box = $('historyList'); box.textContent = '';
  $('clearHistoryBtn').hidden = !list.length;
  if (!list.length) { box.appendChild(el('p', 'ty-none', t('no_history'))); return; }
  list.forEach(function (h) {
    var it = el('div', 'ty-hist-item');
    it.appendChild(el('div', 'ty-hist-date', new Date(h.date).toLocaleString(uiLang === 'fa' ? 'fa-IR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })));
    var s = el('div', 'ty-hist-stats');
    s.appendChild(el('span', '', 'WPM: ' + nf(h.wpm)));
    s.appendChild(el('span', '', t('accuracy') + ': ' + nf(h.accuracy) + '%'));
    if (h.time) s.appendChild(el('span', '', t('time') + ': ' + h.time));
    s.appendChild(el('span', '', t(h.language === 'fa' ? 'lang_fa' : 'lang_en')));
    it.appendChild(s); box.appendChild(it);
  });
}
function toggleHistory(force) {
  var box = $('historyBox'), show = typeof force === 'boolean' ? force : box.hidden;
  box.hidden = !show; $('historyBtn').setAttribute('aria-expanded', show ? 'true' : 'false');
  if (show) { renderHistory(); box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}

function bind() {
  var ta = $('typed');
  ta.addEventListener('input', onInput);
  ta.addEventListener('compositionstart', function () { st.composing = true; });
  ta.addEventListener('compositionend', function () { st.composing = false; onInput(); });
  ['paste', 'drop', 'cut'].forEach(function (ev) { ta.addEventListener(ev, function (e) { e.preventDefault(); }); });
  $('textSelect').addEventListener('change', function (e) { textIndex = parseInt(e.target.value, 10) || 0; reset(); });
  $('resetBtn').addEventListener('click', function () { reset(); });
  $('againBtn').addEventListener('click', function () { reset(); });
  $('nextTextBtn').addEventListener('click', function () { textIndex = (textIndex + 1) % TEXTS[practice].length; $('textSelect').value = String(textIndex); reset(); });
  $('historyBtn').addEventListener('click', function () { toggleHistory(); });
  $('closeHistoryBtn').addEventListener('click', function () { toggleHistory(false); $('historyBtn').focus(); });
  $('clearHistoryBtn').addEventListener('click', async function () {
    if (!(await confirmDialog(t('clear_confirm')))) return;
    saveHistory([]); renderHistory(); renderBest(); renderChart();
  });
  document.querySelectorAll('.ty-seg-btn').forEach(function (b) { b.addEventListener('click', function () { if (b.dataset.lang !== practice) setPractice(b.dataset.lang); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('historyBox').hidden && !$('confirmDialog').open) toggleHistory(false); });
  $('confirmDialog').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(renderChart, 120); });
  window.addEventListener('themeChanged', function () { setTimeout(renderChart, 30); });
  new MutationObserver(function () { renderChart(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  window.addEventListener('languageChanged', function (e) { uiLang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); renderLive(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  var saved = null; try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
  practice = saved === 'en' || saved === 'fa' ? saved : uiLang;
  document.querySelectorAll('.ty-seg-btn').forEach(function (b) { var on = b.dataset.lang === practice; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  applyI18n(); bind(); reset(false);
  renderChart();
}
document.addEventListener('DOMContentLoaded', boot);
})();
