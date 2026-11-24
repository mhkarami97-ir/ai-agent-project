(function () {
'use strict';

/* @logic-start */
var ZWNJ = '\u200c';
/* حروف فارسی/عربی (بدون کشیده U+0640) */
var PL = '[\\u0621-\\u063A\\u0641-\\u064A\\u067E\\u0686\\u0698\\u06A9\\u06AF\\u06CC\\u06C0]';
/* حروفی که به حرف بعد نمی‌چسبند: نیم‌فاصله بعد از آن‌ها بی‌اثر است */
var NONJOIN = '[\\u0627\\u0622\\u0623\\u0625\\u062F\\u0630\\u0631\\u0632\\u0698\\u0648\\u0624]';
var P = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
var OPTIONS = ['invisible', 'arabic', 'zwnjClean', 'zwnjAdd', 'punct', 'spaces', 'harakat'];
var DEFAULTS = { invisible: true, arabic: true, zwnjClean: true, zwnjAdd: true, punct: true, spaces: true, harakat: false, digits: 'none' };

function sub(text, re, rep) {
  var n = 0;
  var out = text.replace(re, function () {
    n++;
    return rep.apply(null, arguments);
  });
  return { text: out, n: n };
}
function R(re, flags) { return new RegExp(re, flags); }

function stepInvisible(text) {
  var n = 0, t = text;
  var a = sub(t, /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B\u200E\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\uFFF9-\uFFFB]/g, function () { return ''; });
  t = a.text; n += a.n;
  /* ZWJ فقط بین دو حرف فارسی حذف می‌شود تا ایموجی‌های مرکب نشکنند */
  var b = sub(t, R('(?<=' + PL + ')\\u200D(?=' + PL + ')', 'g'), function () { return ''; });
  return { text: b.text, n: n + b.n };
}
function stepArabic(text) {
  return sub(text, /[كيى\u0640]/g, function (c) { return c === 'ك' ? 'ک' : c === '\u0640' ? '' : 'ی'; });
}
function stepHarakat(text) {
  return sub(text, /[\u064B-\u065F\u0670]/g, function () { return ''; });
}
function stepZwnjAdd(text) {
  var n = 0, a;
  /* پیشوند فعل «می/نمی» + فاصله + حرف */
  a = sub(text, R('(?<!' + PL + ')(ن?می)[ \\t]+(?=' + PL + ')', 'g'), function (m, p) { return p + ZWNJ; }); text = a.text; n += a.n;
  /* پسوندهای ها/های/هایی/ترین جدا از کلمه */
  a = sub(text, R('(?<=' + PL + ')[ \\t]+(ها|های|هایی|ترین)(?!' + PL + ')', 'g'), function (m, s) { return ZWNJ + s; }); text = a.text; n += a.n;
  return { text: text, n: n };
}
function stepZwnjClean(text) {
  var n = 0, a;
  a = sub(text, /\u200c{2,}/g, function () { return ZWNJ; }); text = a.text; n += a.n;
  /* نیم‌فاصله‌ای که کنار غیرحرف (فاصله، رقم، نشانه، لاتین، ابتدا/انتها) است */
  a = sub(text, R('\\u200c(?!' + PL + ')|(?<!' + PL + ')\\u200c', 'g'), function () { return ''; }); text = a.text; n += a.n;
  /* بعد از حروف غیرچسبان بی‌اثر است */
  a = sub(text, R('(?<=' + NONJOIN + ')\\u200c', 'g'), function () { return ''; }); text = a.text; n += a.n;
  return { text: text, n: n };
}
function stepPunct(text) {
  return sub(text, R('(?<=' + PL + '[ \\t]*)[,;?]', 'g'), function (c) { return c === ',' ? '،' : c === ';' ? '؛' : '؟'; });
}
function stepSpaces(text) {
  var n = 0, a;
  a = sub(text, /\r\n?/g, function () { return '\n'; }); text = a.text;
  a = sub(text, /[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\t]/g, function () { return ' '; }); text = a.text; n += a.n;
  a = sub(text, / {2,}/g, function () { return ' '; }); text = a.text; n += a.n;
  a = sub(text, /^ +| +$/gm, function () { return ''; }); text = a.text; n += a.n;
  a = sub(text, / +(?=[،؛؟!.,:;»)\]])/g, function () { return ''; }); text = a.text; n += a.n;
  a = sub(text, /([«(\[]) +/g, function (m, c) { return c; }); text = a.text; n += a.n;
  a = sub(text, /([،؛؟!])(?=[\p{L}\p{N}])/gu, function (m, c) { return c + ' '; }); text = a.text; n += a.n;
  a = sub(text, R('(?<=' + PL + ')([.:,;])(?=' + PL + ')', 'g'), function (m, c) { return c + ' '; }); text = a.text; n += a.n;
  a = sub(text, /\n{3,}/g, function () { return '\n\n'; }); text = a.text; n += a.n;
  var trimmed = text.trim();
  if (trimmed !== text) { n++; text = trimmed; }
  return { text: text, n: n };
}
var ASCII_ONLY_TOKEN = /^(?:[a-z][a-z0-9+.-]*:\/\/|www\.)|@/i;
function digitsToFa(text) {
  var n = 0;
  var out = text.split(/(\s+)/).map(function (tok) {
    if (ASCII_ONLY_TOKEN.test(tok)) return tok;
    return tok.replace(/\d+/g, function (run, off, whole) {
      var before = whole[off - 1], after = whole[off + run.length];
      if ((before && /[A-Za-z_]/.test(before)) || (after && /[A-Za-z_]/.test(after))) return run;
      n++;
      return run.replace(/\d/g, function (d) { return P[d]; });
    });
  }).join('');
  out = out.replace(/[٠-٩]/g, function (d) { n++; return P[AR.indexOf(d)]; });
  return { text: out, n: n };
}
function digitsToEn(text) {
  var n = 0;
  var out = text.replace(/[۰-۹٠-٩٫٬]/g, function (c) {
    n++;
    if (c === '٫') return '.';
    if (c === '٬') return ',';
    var i = P.indexOf(c); return String(i >= 0 ? i : AR.indexOf(c));
  });
  return { text: out, n: n };
}
/* ترتیب: نامرئی → حروف → (اعراب) → افزودن/پاک‌سازی نیم‌فاصله → علائم → فاصله → ارقام */
function clean(text, opts) {
  opts = Object.assign({}, DEFAULTS, opts || {});
  var rep = [], t = String(text == null ? '' : text);
  function run(key, fn) { var r = fn(t); t = r.text; if (r.n) rep.push({ key: key, n: r.n }); }
  if (opts.invisible) run('invisible', stepInvisible);
  if (opts.arabic) run('arabic', stepArabic);
  if (opts.harakat) run('harakat', stepHarakat);
  if (opts.zwnjAdd) run('zwnjAdd', stepZwnjAdd);
  if (opts.zwnjClean) run('zwnjClean', stepZwnjClean);
  if (opts.punct) run('punct', stepPunct);
  if (opts.spaces) run('spaces', stepSpaces);
  if (opts.digits === 'fa') run('digitsFa', digitsToFa);
  else if (opts.digits === 'en') run('digitsEn', digitsToEn);
  return { text: t, report: rep };
}
function normalizeOptions(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var o = Object.assign({}, DEFAULTS);
  OPTIONS.forEach(function (k) { if (typeof raw[k] === 'boolean') o[k] = raw[k]; });
  o.digits = raw.digits === 'fa' || raw.digits === 'en' ? raw.digits : 'none';
  return o;
}
/* @logic-end */

var TEXT_KEY = 'textFormatterInput', OPT_KEY = 'textFormatterOptions', MAX = 500000;
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

var opts = Object.assign({}, DEFAULTS), prevInput = null, timer, saveTimer;

function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.title = t('title');
  buildOpts();
}
function buildOpts() {
  var box = $('opts'); box.textContent = '';
  OPTIONS.forEach(function (k) {
    var lab = el('label', 'tf-opt'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!opts[k]; cb.dataset.key = k;
    var d = el('span'); d.appendChild(el('b', '', t('opt_' + k))); d.appendChild(el('small', '', t('opt_' + k + '_d')));
    lab.appendChild(cb); lab.appendChild(d); box.appendChild(lab);
  });
  document.querySelectorAll('.tf-seg-btn').forEach(function (b) { var on = b.dataset.digits === opts.digits; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
}
function counts() {
  var i = $('inputText').value.length, o = $('outputText').value.length;
  $('inputCount').textContent = t('n_chars', { n: nf(i) }); $('outputCount').textContent = t('n_chars', { n: nf(o) });
}
function process() {
  var src = $('inputText').value, r = clean(src, opts);
  $('outputText').value = r.text; counts();
  var ul = $('report'); ul.textContent = '';
  if (!src.trim()) { var e0 = el('li', 'is-none', t('rep_empty')); ul.appendChild(e0); return; }
  if (!r.report.length) { ul.appendChild(el('li', 'is-none', t('rep_nochange'))); return; }
  r.report.forEach(function (x) { var li = el('li'); li.appendChild(el('span', '', t('rep_' + x.key))); li.appendChild(el('b', '', nf(x.n))); ul.appendChild(li); });
}
function schedule() { clearTimeout(timer); timer = setTimeout(process, 120); }
function saveText() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { try { var v = $('inputText').value; if (v) localStorage.setItem(TEXT_KEY, v.slice(0, MAX)); else localStorage.removeItem(TEXT_KEY); } catch (e) {} }, 300); }
function saveOpts() { try { localStorage.setItem(OPT_KEY, JSON.stringify(opts)); } catch (e) {} }
var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'tf-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 2500);
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
  var ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
}

function bind() {
  $('inputText').addEventListener('input', function () { counts(); schedule(); saveText(); });
  $('opts').addEventListener('change', function (e) { var k = e.target.dataset.key; if (!k) return; opts[k] = e.target.checked; saveOpts(); process(); });
  document.querySelectorAll('.tf-seg-btn').forEach(function (b) {
    b.addEventListener('click', function () { opts.digits = b.dataset.digits; saveOpts(); buildOpts(); process(); });
  });
  $('copyBtn').addEventListener('click', async function () {
    var v = $('outputText').value;
    if (!v) { toast(t('err_nothing_copy'), true); return; }
    toast(t((await copyText(v)) ? 'ok_copied' : 'err_copy'), false);
  });
  $('replaceBtn').addEventListener('click', function () {
    var v = $('outputText').value;
    if (!v) { toast(t('err_nothing_replace'), true); return; }
    prevInput = $('inputText').value; $('inputText').value = v; $('undoBtn').hidden = false; saveText(); process(); toast(t('ok_replaced'));
  });
  $('undoBtn').addEventListener('click', function () {
    if (prevInput === null) return;
    $('inputText').value = prevInput; prevInput = null; $('undoBtn').hidden = true; saveText(); process();
  });
  $('clearBtn').addEventListener('click', async function () {
    if (!$('inputText').value && !$('outputText').value) { toast(t('err_nothing_clear'), true); return; }
    if (!(await confirmDialog(t('confirm_clear')))) return;
    $('inputText').value = ''; prevInput = null; $('undoBtn').hidden = true; saveText(); process(); toast(t('ok_cleared'));
  });
  $('confirmDialog').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); process(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  try { opts = normalizeOptions(JSON.parse(localStorage.getItem(OPT_KEY))); } catch (e) { opts = normalizeOptions(null); }
  try { var s = localStorage.getItem(TEXT_KEY); if (s) $('inputText').value = s; } catch (e) {}
  applyI18n(); bind(); process();
}
document.addEventListener('DOMContentLoaded', boot);
})();
