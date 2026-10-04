(function () {
'use strict';

/* @logic-start */
/* ---------- DSP (بدون وابستگی بیرونی تا بتواند داخل Web Worker اجرا شود) ---------- */
function vcResample(chs, p) {
  return chs.map(function (ch) {
    var n = ch.length, m = Math.max(1, Math.floor((n - 1) / p) + 1), o = new Float32Array(m);
    for (var j = 0; j < m; j++) {
      var pos = j * p, i = Math.floor(pos), f = pos - i;
      var a = i > 0 ? ch[i - 1] : ch[0], b = ch[i < n ? i : n - 1], c = i + 1 < n ? ch[i + 1] : ch[n - 1], d = i + 2 < n ? ch[i + 2] : ch[n - 1];
      o[j] = 0.5 * (2 * b + (c - a) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (3 * b - a - 3 * c + d) * f * f * f);
    }
    return o;
  });
}
/* تغییر سرعت بدون تغییر زیر و بمی (WSOLA). tau>1 سریع‌تر و کوتاه‌تر */
function vcWsola(chs, sr, tau, progress) {
  var n = chs[0].length, nch = chs.length, i, ch;
  var win = Math.round(sr * 0.04); if (win % 2) win++;
  var hop = win / 2, anaHop = hop * tau, tol = Math.round(sr * 0.012), D = 8, STEP = 4;
  var outLen = Math.ceil(n / tau) + win;
  var mono = new Float32Array(n);
  for (ch = 0; ch < nch; ch++) { var src = chs[ch]; for (i = 0; i < n; i++) mono[i] += src[i] / nch; }
  var w = new Float32Array(win);
  for (i = 0; i < win; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / win);
  var out = [], norm = new Float32Array(outLen);
  for (ch = 0; ch < nch; ch++) out.push(new Float32Array(outLen));
  var prevStart = 0, total = Math.max(1, Math.round(n / tau));
  for (var k = 0; ; k++) {
    var outPos = k * hop, nominal = Math.round(k * anaHop);
    if (nominal >= n || outPos + win > outLen) break;
    var start = nominal;
    if (k > 0) {
      var tpl = prevStart + hop, lo = Math.max(0, nominal - tol), hi = Math.min(n - 1, nominal + tol), best = -Infinity;
      for (var c = lo; c <= hi; c += STEP) {
        var dot = 0, en = 1e-9;
        for (i = 0; i < hop; i += D) {
          var a = tpl + i < n ? mono[tpl + i] : 0, b = c + i < n ? mono[c + i] : 0;
          dot += a * b; en += b * b;
        }
        var sc = dot / Math.sqrt(en);
        if (sc > best) { best = sc; start = c; }
      }
    }
    var lim = Math.min(win, n - start);
    for (i = 0; i < lim; i++) {
      var wi = w[i]; norm[outPos + i] += wi;
      for (ch = 0; ch < nch; ch++) out[ch][outPos + i] += chs[ch][start + i] * wi;
    }
    prevStart = start;
    if (progress && (k & 63) === 0) progress(Math.min(0.95, nominal / n));
  }
  return out.map(function (o) {
    var r = new Float32Array(total);
    for (var q = 0; q < total; q++) { var nv = norm[q]; r[q] = nv > 1e-3 ? o[q] / nv : o[q]; }
    return r;
  });
}
/* semitones: نیم‌پرده، speed: سرعت بدون تغییر زیر و بمی، gain: ضریب حجم */
function shiftAudio(channels, sr, semitones, speed, gain, progress) {
  var p = Math.pow(2, semitones / 12), tau = speed / p, cur = channels;
  if (Math.abs(tau - 1) > 1e-3) cur = vcWsola(cur, sr, tau, progress);
  if (Math.abs(p - 1) > 1e-3) cur = vcResample(cur, p);
  var res = cur.map(function (ch) {
    var o = new Float32Array(ch.length);
    for (var i = 0; i < ch.length; i++) { var v = ch[i] * gain; o[i] = v > 1 ? 1 : v < -1 ? -1 : v; }
    return o;
  });
  if (progress) progress(1);
  return res;
}
function encodeWav(chs, sr) {
  var nch = chs.length, len = chs[0].length, bytes = 2, dataLen = len * nch * bytes;
  var buf = new ArrayBuffer(44 + dataLen), v = new DataView(buf);
  function str(o, s) { for (var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); }
  str(0, 'RIFF'); v.setUint32(4, 36 + dataLen, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, nch, true); v.setUint32(24, sr, true); v.setUint32(28, sr * nch * bytes, true);
  v.setUint16(32, nch * bytes, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, dataLen, true);
  var off = 44;
  for (var i = 0; i < len; i++) for (var c = 0; c < nch; c++) {
    var s = Math.max(-1, Math.min(1, chs[c][i]));
    v.setInt16(off, Math.round(s < 0 ? s * 0x8000 : s * 0x7FFF), true); off += 2;
  }
  return buf;
}
/* ---------- تنظیمات و ذخیره‌سازی ---------- */
function snap(v, step) { return Math.round(v / step) * step; }
function clampSettings(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var p = Number(raw.pitch), s = Number(raw.speed), g = Number(raw.volume);
  return {
    pitch: isFinite(p) ? Math.min(12, Math.max(-12, snap(p, 0.5))) : 0,
    speed: isFinite(s) ? Math.min(2, Math.max(0.5, Math.round(snap(s, 0.05) * 100) / 100)) : 1,
    volume: isFinite(g) ? Math.min(2, Math.max(0, Math.round(g * 100) / 100)) : 1
  };
}
function normalizePresets(raw) {
  var out = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  Object.keys(raw).forEach(function (name) {
    var n = String(name).trim().slice(0, 40), r = raw[name];
    if (!n || !r || typeof r !== 'object') return;
    out.push(Object.assign({ name: n, createdAt: typeof r.createdAt === 'string' ? r.createdAt : '' }, clampSettings(r)));
  });
  return out;
}
function normalizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map(function (h, i) {
    if (!h || typeof h !== 'object') return null;
    var d = new Date(h.date), s = clampSettings(h);
    return { id: Number(h.id) > 0 ? Number(h.id) : i + 1, originalName: String(h.originalName == null ? '' : h.originalName).slice(0, 200), modifiedName: String(h.modifiedName == null ? '' : h.modifiedName).slice(0, 200), pitch: s.pitch, speed: s.speed, volume: s.volume, ts: isNaN(d.getTime()) ? 0 : d.getTime() };
  }).filter(function (h) { return h && (h.originalName || h.modifiedName); }).slice(0, 20);
}
function outName(name) {
  var base = String(name || 'audio').replace(/\.[^./\\]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim().slice(0, 80) || 'audio';
  return 'modified_' + base + '.wav';
}
function fmtBytes(n, units) {
  if (!(n > 0)) return '0 ' + units[0];
  var i = Math.min(units.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  return Math.round(n / Math.pow(1024, i) * 100) / 100 + ' ' + units[i];
}
function fmtDuration(sec) {
  sec = Math.round(sec); var m = Math.floor(sec / 60), s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}
/* @logic-end */

var MAX_BYTES = 60 * 1024 * 1024, MAX_SECONDS = 600;
var PRESET_KEY = 'voiceChangePresets', HIST_KEY = 'voiceChangeHistory';
var lang = 'fa', dict = {};
try { lang = String(localStorage.getItem('lang') || '').replace(/"/g, '') === 'en' ? 'en' : 'fa'; } catch (e) {}
function t(key, vars) {
  var s = (dict[lang] && dict[lang][key]) || (dict.fa && dict.fa[key]) || key;
  if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
  return s;
}
function nf(n) { return new Intl.NumberFormat(lang === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 }).format(n); }
function $(id) { return document.getElementById(id); }
function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

var S = { file: null, chs: null, sr: 44100, settings: { pitch: 0, speed: 1, volume: 1 }, origUrl: '', outUrl: '', blob: null, worker: null, job: 0, timer: null };

var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'vc-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 3000);
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
  document.querySelectorAll('[data-i18n-aria]').forEach(function (e) { e.setAttribute('aria-label', t(e.getAttribute('data-i18n-aria'))); });
  document.title = t('title');
  $('presetName').placeholder = t('preset_ph');
  showValues(); renderFileInfo(); renderPresets(); renderHistory();
}
function units() { return [t('u_b'), t('u_kb'), t('u_mb'), t('u_gb')]; }
function showValues() {
  var s = S.settings;
  $('pitchVal').textContent = (s.pitch > 0 ? '+' : '') + s.pitch;
  $('speedVal').textContent = s.speed + 'x';
  $('volVal').textContent = Math.round(s.volume * 100) + '%';
  document.querySelectorAll('.vc-btn--chip').forEach(function (b) {
    var on = Number(b.dataset.pitch) === s.pitch && Number(b.dataset.speed) === s.speed; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
}
function setSettings(raw, process) {
  S.settings = clampSettings(raw);
  $('pitch').value = String(S.settings.pitch); $('speed').value = String(S.settings.speed); $('volume').value = String(Math.round(S.settings.volume * 100));
  showValues(); if (process !== false) schedule(0);
}
function renderFileInfo() {
  if (!S.file) return;
  $('fileName').textContent = S.file.name;
  $('fileMeta').textContent = fmtBytes(S.file.size, units()) + ' · ' + fmtDuration(S.chs ? S.chs[0].length / S.sr : 0) + ' · ' + nf(S.chs ? S.chs.length : 0) + ' ' + t('channels');
}

/* ---------- پردازش ---------- */
function stopJob() {
  S.job++; clearTimeout(S.timer);
  if (S.worker) { S.worker.terminate(); S.worker = null; }
}
function progress(p) { $('progressFill').style.width = Math.round(p * 100) + '%'; $('progressText').textContent = t('processing', { p: nf(Math.round(p * 100)) }); }
function finish(chs, job) {
  if (job !== S.job) return;
  var blob = new Blob([encodeWav(chs, S.sr)], { type: 'audio/wav' });
  if (S.outUrl) URL.revokeObjectURL(S.outUrl);
  S.outUrl = URL.createObjectURL(blob); S.blob = blob;
  $('outAudio').src = S.outUrl; $('progressBox').hidden = true; $('downloadBtn').disabled = false;
}
function workerSource() {
  return [vcResample, vcWsola, shiftAudio].map(String).join('\n') +
    '\nonmessage=function(e){var d=e.data;var out=shiftAudio(d.chs,d.sr,d.semi,d.speed,d.gain,function(p){postMessage({p:p});});postMessage({done:1,chs:out},out.map(function(c){return c.buffer;}));};';
}
function run() {
  if (!S.chs) return;
  var job = ++S.job, st = S.settings;
  $('progressBox').hidden = false; $('downloadBtn').disabled = true; progress(0);
  var copy = S.chs.map(function (c) { return c.slice(); });
  try {
    var url = URL.createObjectURL(new Blob([workerSource()], { type: 'text/javascript' }));
    var w = new Worker(url); URL.revokeObjectURL(url); S.worker = w;
    w.onmessage = function (e) {
      if (job !== S.job) return;
      if (e.data.p !== undefined) progress(e.data.p);
      else if (e.data.done) { w.terminate(); S.worker = null; finish(e.data.chs, job); }
    };
    w.onerror = function () { w.terminate(); S.worker = null; fallback(S.chs.map(function (c) { return c.slice(); }), st, job); };
    w.postMessage({ chs: copy, sr: S.sr, semi: st.pitch, speed: st.speed, gain: st.volume }, copy.map(function (c) { return c.buffer; }));
  } catch (e) { fallback(S.chs.map(function (c) { return c.slice(); }), st, job); }
}
function fallback(copy, st, job) {
  setTimeout(function () {
    if (job !== S.job) return;
    try { finish(shiftAudio(copy, S.sr, st.pitch, st.speed, st.volume, null), job); }
    catch (err) { console.error(err); toast(t('err_process'), true); $('progressBox').hidden = true; }
  }, 20);
}
function schedule(delay) { clearTimeout(S.timer); S.timer = setTimeout(function () { stopJobKeepTimer(); run(); }, delay === undefined ? 350 : delay); }
function stopJobKeepTimer() { if (S.worker) { S.worker.terminate(); S.worker = null; } }

/* ---------- فایل ---------- */
async function handleFile(file) {
  if (!file) return;
  if (!/^audio\//.test(file.type) && !/\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|webm)$/i.test(file.name)) { toast(t('err_type'), true); return; }
  if (file.size > MAX_BYTES) { toast(t('err_size', { n: nf(60) }), true); return; }
  stopJob();
  var Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) { toast(t('err_unsupported'), true); return; }
  var ctx = new Ctx();
  try {
    var buf = await ctx.decodeAudioData(await file.arrayBuffer());
    if (buf.duration > MAX_SECONDS) { toast(t('err_long', { n: nf(MAX_SECONDS / 60) }), true); return; }
    S.file = file; S.sr = buf.sampleRate; S.chs = [];
    for (var c = 0; c < Math.min(2, buf.numberOfChannels); c++) S.chs.push(buf.getChannelData(c).slice());
    if (S.origUrl) URL.revokeObjectURL(S.origUrl);
    S.origUrl = URL.createObjectURL(file); $('origAudio').src = S.origUrl;
    ['origSection', 'ctrlSection', 'outSection'].forEach(function (id) { $(id).hidden = false; });
    renderFileInfo(); toast(t('ok_loaded')); schedule(0);
  } catch (err) { console.error(err); toast(t('err_decode'), true); }
  finally { try { ctx.close(); } catch (e) {} }
}
function resetAll() {
  stopJob();
  if (S.origUrl) URL.revokeObjectURL(S.origUrl); if (S.outUrl) URL.revokeObjectURL(S.outUrl);
  S.file = null; S.chs = null; S.origUrl = ''; S.outUrl = ''; S.blob = null;
  $('origAudio').removeAttribute('src'); $('outAudio').removeAttribute('src'); $('origAudio').load(); $('outAudio').load();
  $('audioFile').value = ''; ['origSection', 'ctrlSection', 'outSection'].forEach(function (id) { $(id).hidden = true; });
}

/* ---------- تنظیمات ذخیره‌شده و تاریخچه ---------- */
function renderPresets() {
  var list = normalizePresets(readJSON(PRESET_KEY)), box = $('presetList'); box.textContent = '';
  $('presetSection').hidden = !list.length;
  list.forEach(function (p) {
    var it = el('div', 'vc-item'), main = el('div', 'vc-item-main');
    main.appendChild(el('div', 'vc-item-name', p.name));
    main.appendChild(el('div', 'vc-item-sub', t('detail', { p: (p.pitch > 0 ? '+' : '') + p.pitch, s: p.speed, v: Math.round(p.volume * 100) })));
    it.appendChild(main);
    var act = el('div', 'vc-item-actions');
    var a = el('button', 'vc-btn vc-btn--primary vc-btn--sm', t('apply')); a.type = 'button'; a.dataset.action = 'apply'; a.dataset.name = p.name;
    var d = el('button', 'vc-btn vc-btn--danger vc-btn--sm', t('delete')); d.type = 'button'; d.dataset.action = 'delete'; d.dataset.name = p.name;
    act.appendChild(a); act.appendChild(d); it.appendChild(act); box.appendChild(it);
  });
}
function renderHistory() {
  var list = normalizeHistory(readJSON(HIST_KEY)), box = $('histList'); box.textContent = '';
  $('histSection').hidden = !list.length;
  list.forEach(function (h) {
    var it = el('div', 'vc-item'), main = el('div', 'vc-item-main');
    main.appendChild(el('div', 'vc-item-name', h.originalName + ' → ' + h.modifiedName));
    main.appendChild(el('div', 'vc-item-sub', t('detail', { p: (h.pitch > 0 ? '+' : '') + h.pitch, s: h.speed, v: Math.round(h.volume * 100) }) + (h.ts ? ' · ' + new Intl.DateTimeFormat(lang === 'fa' ? 'fa-IR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(h.ts)) : '')));
    it.appendChild(main); box.appendChild(it);
  });
}
function savePreset(name) {
  var raw = readJSON(PRESET_KEY); if (!raw || typeof raw !== 'object' || Array.isArray(raw)) raw = {};
  var all = {}; normalizePresets(raw).forEach(function (p) { all[p.name] = { pitch: p.pitch, speed: p.speed, volume: p.volume, createdAt: p.createdAt }; });
  all[name] = { pitch: S.settings.pitch, speed: S.settings.speed, volume: S.settings.volume, createdAt: new Date().toISOString() };
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(all)); toast(t('ok_preset')); } catch (e) { toast(t('err_save'), true); }
  renderPresets();
}
function deletePreset(name) {
  var all = {}; normalizePresets(readJSON(PRESET_KEY)).forEach(function (p) { if (p.name !== name) all[p.name] = { pitch: p.pitch, speed: p.speed, volume: p.volume, createdAt: p.createdAt }; });
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(all)); } catch (e) {}
  renderPresets(); toast(t('ok_preset_deleted'));
}
function download() {
  if (!S.blob || !S.file) return;
  var name = outName(S.file.name), url = URL.createObjectURL(S.blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  var h = normalizeHistory(readJSON(HIST_KEY));
  h.unshift({ id: Date.now(), originalName: S.file.name, modifiedName: name, pitch: S.settings.pitch, speed: S.settings.speed, volume: S.settings.volume, ts: Date.now() });
  try { localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, 20).map(function (x) { return { id: x.id, originalName: x.originalName, modifiedName: x.modifiedName, pitch: x.pitch, speed: x.speed, volume: x.volume, date: new Date(x.ts || Date.now()).toISOString() }; }))); } catch (e) {}
  toast(t('ok_downloaded')); renderHistory();
}

function bind() {
  $('audioFile').addEventListener('change', function (e) { handleFile(e.target.files[0]); });
  var drop = $('dropArea');
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { handleFile(e.dataTransfer.files[0]); });
  var onSlide = function () {
    S.settings = clampSettings({ pitch: $('pitch').value, speed: $('speed').value, volume: Number($('volume').value) / 100 });
    showValues(); schedule();
  };
  ['pitch', 'speed', 'volume'].forEach(function (id) { $(id).addEventListener('input', onSlide); });
  document.querySelectorAll('.vc-btn--chip').forEach(function (b) {
    b.addEventListener('click', function () { setSettings({ pitch: b.dataset.pitch, speed: b.dataset.speed, volume: S.settings.volume }); });
  });
  $('downloadBtn').addEventListener('click', download);
  $('newBtn').addEventListener('click', resetAll);
  $('saveBtn').addEventListener('click', function () { $('presetName').value = ''; $('nameDialog').showModal(); $('presetName').focus(); });
  $('nameForm').addEventListener('submit', function (e) { e.preventDefault(); var n = $('presetName').value.trim(); if (!n) return; savePreset(n); $('nameDialog').close(); });
  $('nameCancel').addEventListener('click', function () { $('nameDialog').close(); });
  $('presetList').addEventListener('click', async function (e) {
    var b = e.target.closest('button[data-action]'); if (!b) return;
    var name = b.dataset.name;
    if (b.dataset.action === 'apply') {
      var p = normalizePresets(readJSON(PRESET_KEY)).find(function (x) { return x.name === name; });
      if (p) { setSettings(p); toast(t('ok_applied', { n: name })); }
    } else if (await confirmDialog(t('confirm_delete', { n: name }))) deletePreset(name);
  });
  $('clearHistBtn').addEventListener('click', async function () {
    if (!(await confirmDialog(t('confirm_clear_hist')))) return;
    try { localStorage.removeItem(HIST_KEY); } catch (e) {} renderHistory();
  });
  ['nameDialog', 'confirmDialog'].forEach(function (id) { $(id).addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); }); });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); });
  window.addEventListener('beforeunload', function () { if (S.origUrl) URL.revokeObjectURL(S.origUrl); if (S.outUrl) URL.revokeObjectURL(S.outUrl); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  applyI18n(); bind();
}
document.addEventListener('DOMContentLoaded', boot);
})();
