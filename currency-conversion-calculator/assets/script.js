(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', A = '٠١٢٣٤٥٦٧٨٩';
var FIAT = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'TRY', 'AED'];
/* MATIC در سپتامبر ۲۰۲۴ به POL ارتقا یافت (۱ به ۱)؛ شناسهٔ CoinGecko برای POL تأیید نشده و اگر قیمتی نیاید گزینه غیرفعال می‌شود */
var CRYPTO = { BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano', SOL: 'solana', DOGE: 'dogecoin', DOT: 'polkadot', POL: 'polygon-ecosystem-token', LTC: 'litecoin' };
var FIAT_TTL = 60 * 60 * 1000, CRYPTO_TTL = 5 * 60 * 1000;
var POPULAR = [['USD', 'EUR'], ['USD', 'GBP'], ['EUR', 'GBP'], ['BTC', 'USD'], ['ETH', 'USD'], ['BNB', 'USD']];

function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return A.indexOf(d); });
}
/* مقدار: ارقام فارسی/عربی، جداکنندهٔ هزارگان و اعشار (. یا ٫)، تا ۱۲ رقم اعشار */
function parseAmount(s) {
  var v = normDigits(s).replace(/[\s,٬،]/g, '').replace(/٫/g, '.');
  if (!/^\d*\.?\d{0,12}$/.test(v) || v === '' || v === '.') return null;
  var n = parseFloat(v);
  return n > 0 && n < 1e15 ? n : null;
}
function legacyCode(c) { return c === 'MATIC' ? 'POL' : c; }
function isKnown(c) { return FIAT.indexOf(c) >= 0 || Object.prototype.hasOwnProperty.call(CRYPTO, c); }
function cacheFresh(ts, ttl, now) { return typeof ts === 'number' && ts > 0 && now - ts >= 0 && now - ts < ttl; }
/* پاسخ open.er-api.com: {result:'success', rates:{USD:1,...}, time_last_update_unix} */
function parseFiat(j) {
  if (!j || j.result !== 'success' || !j.rates || typeof j.rates !== 'object') return null;
  var rates = {};
  FIAT.forEach(function (c) { var v = Number(j.rates[c]); if (isFinite(v) && v > 0) rates[c] = v; });
  if (!rates.USD) rates.USD = 1;
  return { rates: rates, updated: Number(j.time_last_update_unix) > 0 ? Number(j.time_last_update_unix) * 1000 : 0 };
}
/* پاسخ CoinGecko: {bitcoin:{usd:123}, ...} */
function parseCrypto(j) {
  if (!j || typeof j !== 'object') return null;
  var prices = {}, n = 0;
  Object.keys(CRYPTO).forEach(function (sym) {
    var o = j[CRYPTO[sym]], v = o && Number(o.usd);
    if (isFinite(v) && v > 0) { prices[sym] = v; n++; }
  });
  return n ? { prices: prices } : null;
}
/* ارزش هر واحد به دلار */
function usdValues(fiat, crypto) {
  var u = {};
  if (fiat) Object.keys(fiat.rates).forEach(function (c) { u[c] = 1 / fiat.rates[c]; });
  if (crypto) Object.keys(crypto.prices).forEach(function (c) { u[c] = crypto.prices[c]; });
  return u;
}
function rateOf(u, from, to) {
  var a = u[from], b = u[to];
  return a > 0 && b > 0 ? a / b : null;
}
function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(function (h) {
    if (!h || typeof h !== 'object') return null;
    var from = legacyCode(String(h.from)), to = legacyCode(String(h.to));
    var amount = Number(h.amount), result = Number(h.result), rate = Number(h.rate), ts = Number(h.timestamp);
    if (!isKnown(from) || !isKnown(to) || !(amount > 0) || !(result >= 0) || !(rate > 0) || !isFinite(result) || !isFinite(rate)) return null;
    return { amount: amount, from: from, to: to, result: result, rate: rate, timestamp: ts > 0 ? ts : 0 };
  }).filter(Boolean).slice(0, 10);
}
/* قالب‌بندی: بزرگ‌ها با رقم اعشار کم، کوچک‌ها با رقم معنادار */
function fmtOptions(n) {
  var a = Math.abs(n);
  if (a >= 1000) return { maximumFractionDigits: 2 };
  if (a >= 1) return { maximumFractionDigits: 4 };
  if (a === 0) return { maximumFractionDigits: 0 };
  return { maximumSignificantDigits: 6 };
}
/* @logic-end */

var HIST_KEY = 'currency_conversion_history', FIAT_KEY = 'fx_fiat_cache_v1', CRYPTO_KEY = 'fx_crypto_cache_v1';
var FIAT_URL = 'https://open.er-api.com/v6/latest/USD';
var CRYPTO_URL = 'https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=' + Object.keys(CRYPTO).map(function (k) { return CRYPTO[k]; }).join(',');
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function loc() { return lang === 'fa' ? 'fa-IR' : 'en-US'; }
function fmt(n) { return new Intl.NumberFormat(loc(), fmtOptions(n)).format(n); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function curLabel(c) { return t('cur_' + c) + ' (' + c + ')'; }

var state = { fiat: null, crypto: null, fiatAt: 0, cryptoAt: 0, fiatStale: false, cryptoStale: false, fiatFail: false, cryptoFail: false, usd: {} };

function readCache(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }
function writeCache(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
async function fetchJSON(url) {
  var ctl = new AbortController(), timer = setTimeout(function () { ctl.abort(); }, 10000);
  try {
    var r = await fetch(url, { signal: ctl.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(timer); }
}
async function loadFiat() {
  var c = readCache(FIAT_KEY), now = Date.now(), data = c && parseFiat(c.data);
  if (data && cacheFresh(c.ts, FIAT_TTL, now)) { state.fiat = data; state.fiatAt = c.ts; state.fiatStale = false; state.fiatFail = false; return; }
  try {
    var j = await fetchJSON(FIAT_URL), p = parseFiat(j);
    if (!p) throw new Error('bad fiat data');
    writeCache(FIAT_KEY, { ts: now, data: j }); state.fiat = p; state.fiatAt = now; state.fiatStale = false; state.fiatFail = false;
  } catch (e) {
    console.error('fiat', e); state.fiatFail = true;
    if (data) { state.fiat = data; state.fiatAt = c.ts; state.fiatStale = true; }
  }
}
async function loadCrypto() {
  var c = readCache(CRYPTO_KEY), now = Date.now(), data = c && parseCrypto(c.data);
  if (data && cacheFresh(c.ts, CRYPTO_TTL, now)) { state.crypto = data; state.cryptoAt = c.ts; state.cryptoStale = false; state.cryptoFail = false; return; }
  try {
    var j = await fetchJSON(CRYPTO_URL), p = parseCrypto(j);
    if (!p) throw new Error('bad crypto data');
    writeCache(CRYPTO_KEY, { ts: now, data: j }); state.crypto = p; state.cryptoAt = now; state.cryptoStale = false; state.cryptoFail = false;
  } catch (e) {
    console.error('crypto', e); state.cryptoFail = true;
    if (data) { state.crypto = data; state.cryptoAt = c.ts; state.cryptoStale = true; }
  }
}
var loading = null;
function loadAll() {
  if (loading) return loading;
  $('result').setAttribute('aria-busy', 'true');
  loading = Promise.all([loadFiat(), loadCrypto()]).then(function () {
    state.usd = usdValues(state.fiat, state.crypto);
    loading = null; $('result').removeAttribute('aria-busy');
    markOptions(); renderStatus(); renderRates(); convertNow(false);
  });
  return loading;
}

/* ---------- رابط ---------- */
function fillSelect(sel, keep) {
  var cur = keep ? sel.value : '';
  sel.textContent = '';
  [['group_fiat', FIAT], ['group_crypto', Object.keys(CRYPTO)]].forEach(function (g) {
    var og = document.createElement('optgroup'); og.label = t(g[0]);
    g[1].forEach(function (c) { var o = el('option', '', curLabel(c)); o.value = c; og.appendChild(o); });
    sel.appendChild(og);
  });
  if (cur) sel.value = cur;
}
function markOptions() {
  var ready = state.fiat || state.crypto;
  ['fromCur', 'toCur'].forEach(function (id) {
    [].forEach.call($(id).options, function (o) { o.disabled = ready ? !(state.usd[o.value] > 0) : false; });
  });
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  fillSelect($('fromCur'), true); fillSelect($('toCur'), true); markOptions();
}
function showError(msg) { var e = $('error'); e.textContent = msg; e.hidden = !msg; }
function renderStatus() {
  var parts = [], s = $('status'), warn = false;
  var when = function (ts) { return new Date(ts).toLocaleString(loc(), { dateStyle: 'medium', timeStyle: 'short' }); };
  if (state.fiat) parts.push(t('fiat_updated', { d: when(state.fiat.updated || state.fiatAt) }));
  if (state.crypto) parts.push(t('crypto_updated', { d: when(state.cryptoAt) }));
  if (state.fiatFail && !state.fiat) { parts.push(t('fiat_unavailable')); warn = true; }
  else if (state.fiatStale) { parts.push(t('fiat_stale')); warn = true; }
  if (state.cryptoFail && !state.crypto) { parts.push(t('crypto_unavailable')); warn = true; }
  else if (state.cryptoStale) { parts.push(t('crypto_stale')); warn = true; }
  s.textContent = parts.join(' · '); s.className = 'fx-status' + (warn ? ' is-warn' : '');
}
function convertNow(save) {
  var amt = parseAmount($('amount').value), from = $('fromCur').value, to = $('toCur').value;
  var box = $('result');
  if (amt === null) { box.hidden = true; showError($('amount').value.trim() ? t('err_amount') : ''); return; }
  if (!Object.keys(state.usd).length) { box.hidden = true; showError(loading ? '' : t('err_no_data')); return; }
  var rate = rateOf(state.usd, from, to);
  if (rate === null) { box.hidden = true; showError(t('err_rate', { c: state.usd[from] > 0 ? to : from })); return; }
  showError('');
  var result = amt * rate;
  $('resultValue').textContent = fmt(result) + ' ' + to;
  $('resultRate').textContent = '1 ' + from + ' = ' + fmt(rate) + ' ' + to;
  box.hidden = false;
  if (save && from !== to) addHistory({ amount: amt, from: from, to: to, result: result, rate: rate, timestamp: Date.now() });
}
function renderRates() {
  var box = $('rates'); box.textContent = '';
  POPULAR.forEach(function (p) {
    var rate = Object.keys(state.usd).length ? rateOf(state.usd, p[0], p[1]) : null;
    var b = el('button', 'fx-rate'); b.type = 'button'; b.dataset.from = p[0]; b.dataset.to = p[1];
    b.appendChild(el('b', '', p[0] + '/' + p[1])); b.appendChild(el('span', '', rate === null ? '—' : fmt(rate)));
    box.appendChild(b);
  });
}
function loadHist() { return normalizeHistory(readCache(HIST_KEY)); }
function addHistory(item) {
  var list = loadHist(); list.unshift(item); writeCache(HIST_KEY, list.slice(0, 10)); renderHistory();
}
function ago(ts) {
  if (!ts) return '';
  var s = Math.max(0, Math.floor((Date.now() - ts) / 1000)), rtf = new Intl.RelativeTimeFormat(loc(), { numeric: 'auto' });
  if (s < 60) return rtf.format(0, 'second');
  if (s < 3600) return rtf.format(-Math.floor(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.floor(s / 3600), 'hour');
  return rtf.format(-Math.floor(s / 86400), 'day');
}
function renderHistory() {
  var list = loadHist(), box = $('hist'); box.textContent = '';
  $('clearBtn').hidden = !list.length;
  if (!list.length) { box.appendChild(el('p', 'fx-none', t('text_empty_history_1'))); return; }
  list.forEach(function (h) {
    var b = el('button', 'fx-h-item'); b.type = 'button'; b.dataset.amount = String(h.amount); b.dataset.from = h.from; b.dataset.to = h.to;
    b.appendChild(el('div', 'fx-h-main', fmt(h.amount) + ' ' + h.from + ' = ' + fmt(h.result) + ' ' + h.to));
    b.appendChild(el('div', 'fx-h-sub', '1 ' + h.from + ' = ' + fmt(h.rate) + ' ' + h.to));
    var tm = ago(h.timestamp); if (tm) b.appendChild(el('div', 'fx-h-time', tm));
    box.appendChild(b);
  });
}
function confirmDialog(message) {
  return new Promise(function (resolve) {
    var d = $('confirmDialog'); $('confirmText').textContent = message;
    var done = function () { d.removeEventListener('close', done); resolve(d.returnValue === 'ok'); };
    d.returnValue = ''; d.addEventListener('close', done); d.showModal();
  });
}
function setPair(from, to, amount) {
  if (from) $('fromCur').value = from; if (to) $('toCur').value = to;
  if (amount != null) $('amount').value = String(amount);
  convertNow(false);
}

function bind() {
  var timer;
  $('amount').addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(function () { convertNow(false); }, 150); });
  $('amount').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); convertNow(true); } });
  $('convertBtn').addEventListener('click', function () { convertNow(true); });
  $('fromCur').addEventListener('change', function () { convertNow(false); });
  $('toCur').addEventListener('change', function () { convertNow(false); });
  $('swapBtn').addEventListener('click', function () { var f = $('fromCur').value; $('fromCur').value = $('toCur').value; $('toCur').value = f; convertNow(false); });
  $('rates').addEventListener('click', function (e) { var b = e.target.closest('.fx-rate'); if (b) setPair(b.dataset.from, b.dataset.to); });
  $('hist').addEventListener('click', function (e) { var b = e.target.closest('.fx-h-item'); if (b) setPair(b.dataset.from, b.dataset.to, b.dataset.amount); });
  $('clearBtn').addEventListener('click', async function () {
    if (!(await confirmDialog(t('confirm_clear')))) return;
    try { localStorage.removeItem(HIST_KEY); } catch (e) {} renderHistory();
  });
  $('confirmDialog').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); renderStatus(); renderRates(); renderHistory(); convertNow(false); });
  var refresh = function () { if (!document.hidden) loadAll(); };
  document.addEventListener('visibilitychange', refresh);
  setInterval(refresh, CRYPTO_TTL);
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n();
  $('fromCur').value = 'USD'; $('toCur').value = 'EUR';
  bind(); renderHistory(); renderRates();
  var sk = $('rates'); sk.textContent = ''; for (var i = 0; i < POPULAR.length; i++) sk.appendChild(el('div', 'fx-skel'));
  $('status').textContent = t('loading');
  await loadAll();
}
document.addEventListener('DOMContentLoaded', boot);
})();
