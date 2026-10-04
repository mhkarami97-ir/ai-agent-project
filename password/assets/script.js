(function () {
'use strict';

/* @logic-start */
var SETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}|;:,.<>?'
};
var SIMILAR = 'il1Lo0O';
var AMBIGUOUS = '{}[]()/\\\'"~,;:.<>';
var DEFAULTS = { length: 16, upper: true, lower: true, digits: true, symbols: true, noSimilar: false, noAmbiguous: false };

/* عدد تصادفی یکنواخت در [0, max) با نمونه‌گیری ردکننده: بدون سوگیری باقی‌مانده (modulo bias) */
function randomInt(max, getU32) {
  if (!(max > 0) || max > 4294967296) throw new RangeError('bad max');
  var limit = Math.floor(4294967296 / max) * max, r;
  do { r = getU32(); } while (r >= limit);
  return r % max;
}
function cryptoU32() { var a = new Uint32Array(1); crypto.getRandomValues(a); return a[0]; }
function shuffle(arr, rnd) {
  for (var i = arr.length - 1; i > 0; i--) { var j = rnd(i + 1), t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr;
}
function normalizeOptions(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var L = Math.round(Number(raw.length));
  return {
    length: isFinite(L) ? Math.min(64, Math.max(4, L)) : DEFAULTS.length,
    upper: raw.upper !== false, lower: raw.lower !== false, digits: raw.digits !== false, symbols: raw.symbols !== false,
    noSimilar: raw.noSimilar === true, noAmbiguous: raw.noAmbiguous === true
  };
}
/* مجموعه‌های فعال پس از حذف کاراکترهای مشابه/مبهم؛ مجموعهٔ خالی کنار گذاشته می‌شود */
function activePools(o) {
  var pools = [];
  ['upper', 'lower', 'digits', 'symbols'].forEach(function (k) {
    if (!o[k]) return;
    var s = SETS[k].split('').filter(function (c) {
      return !(o.noSimilar && SIMILAR.indexOf(c) >= 0) && !(o.noAmbiguous && AMBIGUOUS.indexOf(c) >= 0);
    });
    if (s.length) pools.push(s);
  });
  return pools;
}
/* رمز با طول دقیق؛ حداقل یک کاراکتر از هر مجموعهٔ فعال تضمین می‌شود */
function generate(o, rnd) {
  rnd = rnd || function (m) { return randomInt(m, cryptoU32); };
  var pools = activePools(o);
  if (!pools.length || o.length < pools.length) return null;
  var all = [].concat.apply([], pools), out = [];
  pools.forEach(function (p) { out.push(p[rnd(p.length)]); });
  while (out.length < o.length) out.push(all[rnd(all.length)]);
  return shuffle(out, rnd).join('');
}
function poolSize(o) { var set = {}; activePools(o).forEach(function (p) { p.forEach(function (c) { set[c] = 1; }); }); return Object.keys(set).length; }
/* آنتروپی تقریبی (بیت) = طول × log2(اندازهٔ مجموعه)؛ تضمین حضور هر مجموعه آن را اندکی کم می‌کند */
function entropyBits(o) { var n = poolSize(o); return n > 1 ? Math.round(o.length * Math.log2(n) * 10) / 10 : 0; }
/* سطح ۰..۴ بر پایهٔ بیت */
function strengthLevel(bits) { return bits >= 100 ? 4 : bits >= 70 ? 3 : bits >= 45 ? 2 : bits > 0 ? 1 : 0; }
function charClass(c) { return /[0-9]/.test(c) ? 'n' : /[A-Za-z]/.test(c) ? 'l' : 's'; }
/* @logic-end */

var KEY = 'passwordSettings', HIST_MAX = 10;
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

var opts = normalizeOptions(null), current = '', history = [], hidden = false;

var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'pg-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 2200);
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title'); $('lengthVal').textContent = nf(opts.length);
  $('eyeBtn').setAttribute('aria-label', t(hidden ? 'show_pw' : 'hide_pw'));
  renderStrength(); renderHistory(); if (!current) renderOut();
}
function saveOpts() { try { localStorage.setItem(KEY, JSON.stringify(opts)); } catch (e) {} }
function renderOut() {
  var out = $('out'); out.textContent = '';
  out.classList.toggle('is-hidden', hidden && !!current);
  if (!current) { out.appendChild(el('span', 'pg-err', t(activePools(opts).length ? 'empty' : 'err_none'))); return; }
  current.split('').forEach(function (c) {
    var cl = charClass(c), s = el('span', cl === 'l' ? '' : cl, c); out.appendChild(s);
  });
}
function renderStrength() {
  var bits = current ? entropyBits(opts) : 0, lv = current ? strengthLevel(bits) : 0;
  $('meter').dataset.level = String(lv); $('meter').setAttribute('aria-valuenow', String(lv));
  $('strengthText').textContent = current ? t('lv_' + lv, { b: nf(Math.round(bits)) }) : '';
}
function renderHistory() {
  var box = $('hist'); box.textContent = ''; $('clearBtn').hidden = !history.length;
  if (!history.length) { box.appendChild(el('p', 'pg-none', t('text_empty_history_12'))); return; }
  history.forEach(function (p, i) {
    var it = el('div', 'pg-item'); it.appendChild(el('code', '', p));
    var b = el('button', 'pg-btn pg-btn--sm', t('copy_short')); b.type = 'button'; b.dataset.i = String(i); it.appendChild(b); box.appendChild(it);
  });
}
function validateHint() {
  var pools = activePools(opts), h = $('setHint');
  if (!pools.length) h.textContent = t('err_none');
  else if (opts.length < pools.length) h.textContent = t('err_short', { n: nf(pools.length) });
  else h.textContent = t('pool_info', { n: nf(poolSize(opts)), b: nf(Math.round(entropyBits(opts))) });
}
function make(remember) {
  var p = generate(opts);
  validateHint();
  if (p === null) { current = ''; $('copyBtn').disabled = true; renderOut(); renderStrength(); return; }
  current = p; $('copyBtn').disabled = false; renderOut(); renderStrength();
  if (remember) { history.unshift(p); history = history.slice(0, HIST_MAX); renderHistory(); }
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0;left:-9999px'; document.body.appendChild(ta); ta.select();
  var ok = false; try { ok = document.execCommand('copy'); } catch (e2) {} ta.remove(); return ok;
}
function readOpts() {
  opts = normalizeOptions({ length: $('length').value, upper: $('upper').checked, lower: $('lower').checked, digits: $('digits').checked, symbols: $('symbols').checked, noSimilar: $('noSimilar').checked, noAmbiguous: $('noAmbiguous').checked });
  $('lengthVal').textContent = nf(opts.length); saveOpts();
}
function syncControls() {
  $('length').value = opts.length; $('lengthVal').textContent = nf(opts.length);
  ['upper', 'lower', 'digits', 'symbols', 'noSimilar', 'noAmbiguous'].forEach(function (k) { $(k).checked = opts[k]; });
}

function bind() {
  $('generateBtn').addEventListener('click', function () { make(true); });
  $('copyBtn').addEventListener('click', async function () { if (current) toast(t((await copyText(current)) ? 'copied' : 'copy_failed'), false); });
  $('eyeBtn').addEventListener('click', function () { hidden = !hidden; this.setAttribute('aria-pressed', hidden ? 'true' : 'false'); this.setAttribute('aria-label', t(hidden ? 'show_pw' : 'hide_pw')); renderOut(); });
  var onChange = function () { readOpts(); make(false); };
  $('length').addEventListener('input', onChange);
  ['upper', 'lower', 'digits', 'symbols', 'noSimilar', 'noAmbiguous'].forEach(function (k) { $(k).addEventListener('change', onChange); });
  $('hist').addEventListener('click', async function (e) {
    var b = e.target.closest('button[data-i]'); if (!b) return;
    toast(t((await copyText(history[Number(b.dataset.i)])) ? 'copied' : 'copy_failed'), false);
  });
  $('clearBtn').addEventListener('click', function () { history = []; renderHistory(); toast(t('cleared')); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); validateHint(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  /* نسخهٔ قبلی رمزها را به‌صورت متن ساده در localStorage نگه می‌داشت؛ حذف می‌شود */
  try { localStorage.removeItem('passwordHistory'); } catch (e) {}
  try { opts = normalizeOptions(JSON.parse(localStorage.getItem(KEY))); } catch (e) { opts = normalizeOptions(null); }
  syncControls(); applyI18n(); bind(); make(false);
}
document.addEventListener('DOMContentLoaded', boot);
})();
