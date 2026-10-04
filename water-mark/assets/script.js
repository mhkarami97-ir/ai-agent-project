(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹';
var POS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br'];
var OLD_POS = { 'top-left': 'tr', 'top-center': 'tc', 'top-right': 'tl', 'center-left': 'mr', 'center': 'mc', 'center-right': 'ml', 'bottom-left': 'br', 'bottom-center': 'bc', 'bottom-right': 'bl' };
var DEFAULTS = { type: 'text', text: 'نمونه واترمارک', sizePct: 6, color: '#ffffff', opacity: 70, position: 'mc', rotation: 0, logoPct: 20, shadow: true, tile: false, tileGap: 100, format: 'png', quality: 92 };
var MAX_EXPORT_PIXELS = 40e6;
function clamp(v, min, max, def) { v = Number(v); return isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : def; }
function normalizeSettings(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var d = DEFAULTS, pos = POS.indexOf(raw.position) >= 0 ? raw.position : (OLD_POS[raw.position] || d.position);
  return {
    type: raw.type === 'image' ? 'image' : 'text',
    text: typeof raw.text === 'string' ? raw.text.slice(0, 200) : d.text,
    sizePct: clamp(raw.sizePct, 2, 40, d.sizePct),
    color: /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : (/^#[0-9a-f]{6}$/i.test(raw.textColor) ? raw.textColor : d.color),
    opacity: clamp(raw.opacity, 5, 100, d.opacity),
    position: pos,
    rotation: clamp(raw.rotation, -180, 180, d.rotation),
    logoPct: clamp(raw.logoPct, 3, 80, d.logoPct),
    shadow: raw.shadow !== false,
    tile: raw.tile === true,
    tileGap: clamp(raw.tileGap, 20, 300, d.tileGap),
    format: raw.format === 'jpeg' || raw.format === 'webp' ? raw.format : 'png',
    quality: clamp(raw.quality, 50, 100, d.quality)
  };
}
/* ابعاد جعبهٔ محیطی مستطیل چرخیده */
function rotatedBox(w, h, deg) {
  var r = deg * Math.PI / 180, c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  return { w: w * c + h * s, h: w * s + h * c };
}
/* مرکز واترمارک برای موقعیت‌های ۹گانه؛ حاشیه از لبه تا لبهٔ جعبهٔ چرخیده */
function placement(pos, W, H, bw, bh, margin) {
  var row = pos[0], col = pos[1], x, y;
  x = col === 'l' ? margin + bw / 2 : col === 'r' ? W - margin - bw / 2 : W / 2;
  y = row === 't' ? margin + bh / 2 : row === 'b' ? H - margin - bh / 2 : H / 2;
  if (bw + 2 * margin > W) x = W / 2;
  if (bh + 2 * margin > H) y = H / 2;
  return { x: x, y: y };
}
/* شبکهٔ کاشی (در دستگاه مختصات چرخیده به مرکز تصویر)، ردیف‌های زوج‌وفرد نیم‌گام جابه‌جا */
function tilePositions(W, H, stepX, stepY) {
  var half = Math.hypot(W, H) / 2 + Math.max(stepX, stepY), out = [];
  stepX = Math.max(stepX, 1); stepY = Math.max(stepY, 1);
  var rows = Math.ceil(half / stepY);
  for (var r = -rows; r <= rows; r++) {
    var off = (r & 1) ? stepX / 2 : 0, cols = Math.ceil(half / stepX);
    for (var c = -cols; c <= cols; c++) out.push({ x: c * stepX + off, y: r * stepY });
  }
  return out;
}
function exportSize(w, h, maxPixels) {
  var px = w * h; if (px <= maxPixels) return { w: w, h: h, scale: 1 };
  var s = Math.sqrt(maxPixels / px); return { w: Math.floor(w * s), h: Math.floor(h * s), scale: s };
}
function outName(name, fmt) {
  var base = String(name || 'image').replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim().slice(0, 80) || 'image';
  return base + '-watermarked.' + (fmt === 'jpeg' ? 'jpg' : fmt === 'webp' ? 'webp' : 'png');
}
function hasRtl(s) { return /[\u0590-\u08FF]/.test(s); }
/* رسم واترمارک روی هر ctx با اندازهٔ W×H؛ همهٔ اندازه‌ها نسبت به عرض تصویرند */
function drawWatermark(ctx, W, H, s, logo) {
  var margin = Math.round(Math.min(W, H) * 0.04), bw, bh, lines = null, fontPx = 0, lineH = 0;
  if (s.type === 'text') {
    lines = String(s.text).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) return;
    fontPx = Math.max(6, s.sizePct / 100 * W); lineH = fontPx * 1.3;
    ctx.font = '700 ' + fontPx + 'px Vazirmatn, Tahoma, Arial, sans-serif';
    bw = 0; lines.forEach(function (l) { bw = Math.max(bw, ctx.measureText(l).width); });
    bh = lines.length * lineH;
  } else {
    if (!logo || !logo.width || !logo.height) return;
    bw = s.logoPct / 100 * W; bh = bw * logo.height / logo.width;
  }
  function paint() {
    if (s.type === 'text') {
      ctx.fillStyle = s.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.direction = hasRtl(s.text) ? 'rtl' : 'ltr';
      if (s.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = fontPx * 0.12; ctx.shadowOffsetX = fontPx * 0.03; ctx.shadowOffsetY = fontPx * 0.03; }
      lines.forEach(function (l, i) { ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * lineH); });
    } else ctx.drawImage(logo, -bw / 2, -bh / 2, bw, bh);
  }
  ctx.save(); ctx.globalAlpha = s.opacity / 100;
  if (s.tile) {
    ctx.translate(W / 2, H / 2); ctx.rotate(s.rotation * Math.PI / 180);
    var sx = bw * (1 + s.tileGap / 100), sy = bh * (1 + s.tileGap / 100);
    tilePositions(W, H, sx, sy).forEach(function (p) { ctx.save(); ctx.translate(p.x, p.y); paint(); ctx.restore(); });
  } else {
    var rb = rotatedBox(bw, bh, s.rotation), c = placement(s.position, W, H, rb.w, rb.h, margin);
    ctx.translate(c.x, c.y); ctx.rotate(s.rotation * Math.PI / 180); paint();
  }
  ctx.restore();
}
/* @logic-end */

var KEY = 'watermarkSettings', PREVIEW_MAX = 1200, MAX_BYTES = 40 * 1024 * 1024, MAX_PIXELS = 120e6;
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US').format(n); }
function $(id) { return document.getElementById(id); }
function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

var S = normalizeSettings(null), base = null, baseName = '', logo = null, raf = 0, saveTimer;

var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'wm-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 3000);
}
function applyI18n() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(function (e) { e.textContent = t(e.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function (e) { e.placeholder = t(e.getAttribute('data-i18n-placeholder')); });
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title'); showValues(); showDims();
  if (!logo) $('logoName').textContent = t('no_file');
}
function showValues() {
  $('fontPctVal').textContent = nf(S.sizePct) + '%'; $('logoPctVal').textContent = nf(S.logoPct) + '%';
  $('opacityVal').textContent = nf(S.opacity) + '%'; $('rotationVal').textContent = nf(S.rotation) + '°';
  $('tileGapVal').textContent = nf(S.tileGap) + '%'; $('qualityVal').textContent = nf(S.quality) + '%';
}
function syncControls() {
  $('wmText').value = S.text; $('fontPct').value = S.sizePct; $('textColor').value = S.color; $('shadow').checked = S.shadow;
  $('logoPct').value = S.logoPct; $('opacity').value = S.opacity; $('rotation').value = S.rotation;
  $('tile').checked = S.tile; $('tileGap').value = S.tileGap; $('tileGapBox').hidden = !S.tile;
  $('format').value = S.format; $('quality').value = S.quality; $('qualityBox').hidden = S.format === 'png';
  document.querySelectorAll('#posGrid button').forEach(function (b) { var on = b.dataset.pos === S.position; b.classList.toggle('is-active', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
  setTab(S.type); showValues();
}
function setTab(name) {
  S.type = name;
  document.querySelectorAll('.wm-tab').forEach(function (b) { var on = b.dataset.tab === name; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on ? 'true' : 'false'); });
  $('textTab').hidden = name !== 'text'; $('imageTab').hidden = name !== 'image';
}
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }, 300); }
function showDims() { if (base) $('dims').textContent = nf(base.width) + ' × ' + nf(base.height) + ' px'; }

function render() {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(function () {
    if (!base) return;
    var c = $('canvas'), sc = Math.min(1, PREVIEW_MAX / Math.max(base.width, base.height));
    var W = Math.max(1, Math.round(base.width * sc)), H = Math.max(1, Math.round(base.height * sc));
    if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
    var ctx = c.getContext('2d'); ctx.clearRect(0, 0, W, H); ctx.drawImage(base, 0, 0, W, H);
    drawWatermark(ctx, W, H, S, logo);
  });
}
function change() { showValues(); render(); save(); }

async function loadFont() { try { if (document.fonts && document.fonts.load) await document.fonts.load('700 48px Vazirmatn', S.text || 'ا'); } catch (e) {} }
async function decode(file) {
  if (window.createImageBitmap) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) {}
  }
  var url = URL.createObjectURL(file);
  try {
    return await new Promise(function (res, rej) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = rej; im.src = url; });
  } finally { URL.revokeObjectURL(url); }
}
async function handleImage(file) {
  if (!file) return;
  if (!/^image\//.test(file.type)) { toast(t('err_type'), true); return; }
  if (file.size > MAX_BYTES) { toast(t('err_size', { n: nf(40) }), true); return; }
  $('loadNote').textContent = t('loading');
  try {
    var img = await decode(file);
    if (img.width * img.height > MAX_PIXELS) { if (img.close) img.close(); throw new Error('too big'); }
    if (base && base.close) base.close();
    base = img; baseName = file.name; await loadFont();
    $('work').hidden = false; showDims();
    var note = '';
    if (file.type === 'image/gif') note = t('gif_note');
    else if (img.width * img.height > MAX_EXPORT_PIXELS) note = t('big_note', { n: nf(Math.round(MAX_EXPORT_PIXELS / 1e6)) });
    $('loadNote').textContent = note; render();
    $('work').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (e) { console.error(e); $('loadNote').textContent = ''; toast(t('err_load'), true); }
}
async function handleLogo(file) {
  if (!file || !/^image\//.test(file.type)) return;
  try { logo = await decode(file); $('logoName').textContent = file.name; render(); } catch (e) { toast(t('err_load'), true); }
}
async function download() {
  if (!base) return;
  var btn = $('downloadBtn'); btn.disabled = true; $('status').textContent = t('working');
  try {
    await loadFont();
    var sz = exportSize(base.width, base.height, MAX_EXPORT_PIXELS), c = document.createElement('canvas'); c.width = sz.w; c.height = sz.h;
    var ctx = c.getContext('2d'), mime = 'image/' + S.format;
    if (S.format === 'jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, sz.w, sz.h); }
    ctx.drawImage(base, 0, 0, sz.w, sz.h); drawWatermark(ctx, sz.w, sz.h, S, logo);
    var blob = await new Promise(function (res) { c.toBlob(res, mime, S.quality / 100); });
    if (!blob) throw new Error('toBlob');
    var url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = outName(baseName, S.format);
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    $('status').textContent = t('done', { s: nf(Math.round(blob.size / 1024)) });
  } catch (e) { console.error(e); $('status').textContent = ''; toast(t('err_export'), true); }
  finally { btn.disabled = false; }
}
function reset() {
  if (base && base.close) base.close(); base = null; logo = null; baseName = '';
  $('imageInput').value = ''; $('logoInput').value = ''; $('logoName').textContent = t('no_file');
  $('work').hidden = true; $('loadNote').textContent = ''; $('status').textContent = '';
  var c = $('canvas'); c.getContext('2d').clearRect(0, 0, c.width, c.height);
}

function bind() {
  $('imageInput').addEventListener('change', function (e) { handleImage(e.target.files[0]); });
  var drop = $('drop');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { handleImage(e.dataTransfer.files[0]); });
  $('logoInput').addEventListener('change', function (e) { handleLogo(e.target.files[0]); });
  document.querySelectorAll('.wm-tab').forEach(function (b) { b.addEventListener('click', function () { setTab(b.dataset.tab); render(); save(); }); });
  $('wmText').addEventListener('input', function () { S.text = this.value.slice(0, 200); loadFont().then(render); change(); });
  $('fontPct').addEventListener('input', function () { S.sizePct = Number(this.value); change(); });
  $('textColor').addEventListener('input', function () { S.color = this.value; change(); });
  $('shadow').addEventListener('change', function () { S.shadow = this.checked; change(); });
  $('logoPct').addEventListener('input', function () { S.logoPct = Number(this.value); change(); });
  $('opacity').addEventListener('input', function () { S.opacity = Number(this.value); change(); });
  $('rotation').addEventListener('input', function () { S.rotation = Number(this.value); change(); });
  $('posGrid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-pos]'); if (!b) return; S.position = b.dataset.pos;
    document.querySelectorAll('#posGrid button').forEach(function (x) { var on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-checked', on ? 'true' : 'false'); });
    change();
  });
  $('tile').addEventListener('change', function () { S.tile = this.checked; $('tileGapBox').hidden = !S.tile; change(); });
  $('tileGap').addEventListener('input', function () { S.tileGap = Number(this.value); change(); });
  $('format').addEventListener('change', function () { S.format = this.value; $('qualityBox').hidden = S.format === 'png'; change(); });
  $('quality').addEventListener('input', function () { S.quality = Number(this.value); change(); });
  $('downloadBtn').addEventListener('click', download);
  $('resetBtn').addEventListener('click', reset);
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  S = normalizeSettings(readJSON(KEY));
  applyI18n(); syncControls(); bind();
}
document.addEventListener('DOMContentLoaded', boot);
})();
