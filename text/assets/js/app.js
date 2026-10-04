(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
var FRAGMENTS = [
  'خورشید بلند و طلایی در افق می‌درخشید، نوید صبحی تازه را می‌داد.',
  'کلمات نرم و روان روی صفحه می‌لغزیدند تا چیدمانی آرام ایجاد کنند.',
  'پرنده‌ها در باغچه آواز محبت می‌خواندند و نسیمی خنک می‌گذشت.',
  'دریاچهٔ آبی در دل کوه‌ها، ذهن را به سفر در دنیای خیال می‌برد.',
  'گل‌های بهاری با رنگ‌های زنده، امید را در هوا پخش می‌کردند.',
  'شب‌های روشن، چراغ‌هایی هستند که خاطره‌ها را روشن نگاه می‌دارند.',
  'پرچم‌های کوچک بر فراز خانه‌ها موج می‌زدند و شادی را انتقال می‌دادند.',
  'کلمات نرم و لطیف شعر، فضای صفحه را گرم‌تر می‌کردند.',
  'صدای باران روی پنجره قلب را می‌لرزاند، ولی آرامش می‌آورد.',
  'مسیر پیاده‌رو، هر پیچش را با نور خفیف چراغ‌راه‌ها نشان می‌داد.',
  'نگاه مهربانان، قصه‌ای از درک مشترک را بازگو می‌کرد.',
  'کتاب‌های کهنه روی میز، طنین زمان‌های آرام را حفظ کرده بودند.',
  'قطره‌های شبنم، جواهرهایی روی برگ‌ها می‌ساختند.',
  'هوای صبحگاهی بوی چای و خاطرات کودکی را یادآور می‌شد.',
  'لبخند کوچک، مسیرهای دشوار را هموار می‌کرد.',
  'آفتاب غروب نارنجی، شهری پر از سکوت مطبوع را ترسیم می‌کرد.',
  'دست‌های کوچک کودکان در بازی، انرژی تازه‌ای به فضا می‌دادند.',
  'شمیم خاک نم‌دار، داستان باران‌های گذشته را روایت می‌کرد.',
  'سکوت کوچه‌ها پیش از طلوع، فرصتی برای نفس کشیدن می‌شد.',
  'نغمه‌های آشنا، روزهای دور را به امروز نزدیک می‌کردند.',
  'دوچرخه‌سواران در مسیر، حس پیشروی و زندگی را تعریف می‌کردند.'
];
var UNITS = {
  paragraphs: { min: 1, max: 20, def: 3 },
  sentences: { min: 1, max: 50, def: 5 },
  words: { min: 1, max: 500, def: 50 }
};
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
function clampCount(v, unit) {
  var u = UNITS[unit] || UNITS.paragraphs, s = normDigits(v).trim();
  var n = /^\d+$/.test(s) ? parseInt(s, 10) : NaN;
  if (!isFinite(n)) return u.def;
  return Math.min(u.max, Math.max(u.min, n));
}
function shuffle(arr, rng) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rng() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}
/* جریان جمله‌ها: همهٔ جمله‌ها یک‌بار در هر دور استفاده می‌شوند و جملهٔ پشت‌سرهم تکراری نمی‌آید */
function sentenceStream(rng) {
  var pool = [], last = null;
  return function () {
    if (!pool.length) {
      pool = shuffle(FRAGMENTS, rng);
      if (pool[0] === last) { var k = pool.length - 1; var t = pool[0]; pool[0] = pool[k]; pool[k] = t; }
    }
    last = pool.shift();
    return last;
  };
}
function generate(unit, count, perPara, rng) {
  rng = rng || Math.random;
  var next = sentenceStream(rng), n = clampCount(count, unit), out = [], i, j;
  if (unit === 'paragraphs') {
    var per = Math.min(8, Math.max(2, Math.round(Number(perPara)) || 4));
    for (i = 0; i < n; i++) { var s = []; for (j = 0; j < per; j++) s.push(next()); out.push(s.join(' ')); }
  } else if (unit === 'sentences') {
    var ss = []; for (i = 0; i < n; i++) ss.push(next()); out.push(ss.join(' '));
  } else {
    var words = [];
    while (words.length < n) words = words.concat(next().split(/\s+/));
    words = words.slice(0, n);
    words[n - 1] = words[n - 1].replace(/[،,.؛;:!؟?]+$/, '') + '.';
    out.push(words.join(' '));
  }
  return out;
}
function countWords(text) { var t = String(text).trim(); return t ? t.split(/\s+/).length : 0; }
function normalizeSettings(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var unit = UNITS[raw.unit] ? raw.unit : 'paragraphs';
  var count = raw.count != null ? raw.count : (unit === 'paragraphs' ? raw.paragraphs : null);
  var per = Math.round(Number(raw.sentences));
  return { unit: unit, count: clampCount(count, unit), perPara: per >= 2 && per <= 8 ? per : 4 };
}
/* @logic-end */

var KEY = 'persianLoremSettings';
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function $(id) { return document.getElementById(id); }

var unit = 'paragraphs', count = 3, perPara = 4, paragraphs = [];

function loadSettings() {
  var raw = null; try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var s = normalizeSettings(raw); unit = s.unit; count = s.count; perPara = s.perPara;
}
function saveSettings() { try { localStorage.setItem(KEY, JSON.stringify({ unit: unit, count: count, paragraphs: unit === 'paragraphs' ? count : undefined, sentences: perPara })); } catch (e) {} }
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  $('countLabel').textContent = t('count_' + unit);
  $('perParaValue').textContent = nf(perPara);
  renderStats();
}
function syncControls() {
  document.querySelectorAll('.lg-seg-btn').forEach(function (b) { var on = b.dataset.unit === unit; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  $('countLabel').textContent = t('count_' + unit);
  $('countInput').value = String(count);
  $('perPara').value = String(perPara); $('perParaValue').textContent = nf(perPara);
  $('perParaField').hidden = unit !== 'paragraphs';
}
function renderStats() {
  var text = paragraphs.join(' ');
  $('stats').textContent = paragraphs.length ? t('stats', { w: nf(countWords(text)), c: nf(text.length) }) : '';
}
function render() {
  var box = $('result'); box.textContent = '';
  paragraphs.forEach(function (p) { var e = document.createElement('p'); e.textContent = p; box.appendChild(e); });
  $('copyBtn').disabled = !paragraphs.length;
  renderStats();
}
function status(msg, isError) { var s = $('status'); s.textContent = msg; s.className = 'lg-status' + (isError ? ' is-error' : ''); }
function regenerate(msg) {
  paragraphs = generate(unit, count, perPara); render(); saveSettings();
  status(msg === false ? '' : t('ready'));
}
function setCount(v) { count = clampCount(v, unit); $('countInput').value = String(count); regenerate(false); }
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
  var ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
}

function bind() {
  document.querySelectorAll('.lg-seg-btn').forEach(function (b) {
    b.addEventListener('click', function () { unit = b.dataset.unit; count = UNITS[unit].def; syncControls(); regenerate(false); });
  });
  $('countInput').addEventListener('input', function () {
    var s = normDigits(this.value).replace(/\D/g, '');
    this.value = s;
    if (s) { count = clampCount(s, unit); regenerate(false); }
  });
  $('countInput').addEventListener('blur', function () { this.value = String(count); });
  $('minusBtn').addEventListener('click', function () { setCount(count - 1); });
  $('plusBtn').addEventListener('click', function () { setCount(count + 1); });
  $('perPara').addEventListener('input', function () { perPara = Number(this.value); $('perParaValue').textContent = nf(perPara); regenerate(false); });
  $('generateBtn').addEventListener('click', function () { regenerate(); });
  $('copyBtn').addEventListener('click', async function () {
    if (!paragraphs.length) return;
    var ok = await copyText(paragraphs.join('\n\n'));
    status(t(ok ? 'copied' : 'copy_failed'), !ok);
  });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); syncControls(); status(''); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  loadSettings(); applyI18n(); syncControls(); bind(); regenerate(false);
}
document.addEventListener('DOMContentLoaded', boot);
})();
