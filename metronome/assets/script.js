(function () {
'use strict';

/* @logic-start */
var P = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
var SIGS = { '2/4': { beats: 2, mid: [] }, '3/4': { beats: 3, mid: [] }, '4/4': { beats: 4, mid: [] }, '5/4': { beats: 5, mid: [3] }, '6/8': { beats: 6, mid: [3] } };
var BPM_MIN = 40, BPM_MAX = 240;
function normDigits(s) {
  return String(s == null ? '' : s).replace(/[۰-۹]/g, function (d) { return P.indexOf(d); }).replace(/[٠-٩]/g, function (d) { return AR.indexOf(d); });
}
function clampInt(v, min, max) {
  var s = normDigits(v).trim();
  if (!/^\d+$/.test(s)) return null;
  return Math.min(max, Math.max(min, parseInt(s, 10)));
}
function parseBpm(v) { return clampInt(v, BPM_MIN, BPM_MAX); }
function parseMinutes(v) { var n = clampInt(v, 1, 180); return n; }
/* 2 = ضربهٔ تأکیدی، 1 = ضربهٔ میانی، 0 = ضربهٔ معمولی */
function beatLevel(sig, idx, accentFirst) {
  var d = SIGS[sig] || SIGS['4/4'];
  if (idx === 0) return accentFirst ? 2 : 0;
  return d.mid.indexOf(idx) >= 0 ? 1 : 0;
}
/* زمان‌بند با پیش‌نگری: ضربه‌ها را تا now+ahead برنامه‌ریزی می‌کند (زمان‌ها بر پایهٔ ساعت صوتی، نه setInterval) */
function pump(st, now, ahead, emit) {
  var n = 0;
  while (st.next < now + ahead && n < 64) {
    emit(st.beat, st.next, beatLevel(st.sig, st.beat, st.accentFirst));
    st.next += 60 / st.bpm;
    st.beat = (st.beat + 1) % SIGS[st.sig].beats;
    n++;
  }
}
/* ضرب‌گیری: میانگین فاصلهٔ چند ضربهٔ اخیر (میلی‌ثانیه) */
function tapBpm(times) {
  if (times.length < 2) return null;
  var t = times.slice(-6), sum = 0;
  for (var i = 1; i < t.length; i++) sum += t[i] - t[i - 1];
  var avg = sum / (t.length - 1);
  if (!(avg > 0)) return null;
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(60000 / avg)));
}
function remainingSec(endAt, now) { return Math.max(0, Math.ceil((endAt - now) / 1000)); }
function fmtClock(sec) { sec = Math.max(0, Math.floor(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); }
function dayKey(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function normalizeSessions(raw) {
  if (!Array.isArray(raw)) return [];
  var seen = {};
  return raw.map(function (s, i) {
    if (!s || typeof s !== 'object') return null;
    var d = new Date(s.date), dur = Math.round(Number(s.duration)), bpm = Math.round(Number(s.bpm));
    if (isNaN(d.getTime()) || !(dur > 0) || dur > 1440) return null;
    var id = Number(s.id); if (!(id > 0)) id = d.getTime() + i; while (seen[id]) id++; seen[id] = 1;
    return { id: id, ts: d.getTime(), duration: dur, bpm: bpm >= 1 && bpm <= 400 ? bpm : 0, note: String(s.note == null ? '' : s.note).slice(0, 200) };
  }).filter(Boolean);
}
function sessionStats(list, today) {
  var total = 0, day = 0;
  list.forEach(function (s) { total += s.duration; if (dayKey(new Date(s.ts)) === today) day += s.duration; });
  return { total: total, today: day, count: list.length };
}
function normalizeSettings(raw) {
  raw = raw && typeof raw === 'object' ? raw : {};
  var b = parseBpm(raw.bpm), m = clampInt(raw.timerMinutes, 1, 180), v = Number(raw.volume);
  return { bpm: b === null ? 120 : b, sig: SIGS[raw.sig] ? raw.sig : '4/4', accentFirst: raw.accentFirst !== false, volume: isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : 70, timerMinutes: m === null ? 10 : m };
}
/* @logic-end */

var SET_KEY = 'metronomeSettings', SESS_KEY = 'practiceSessions', AHEAD = 0.12, TICK_MS = 25;
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
function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

var cfg = normalizeSettings(null);
var A = { ctx: null, master: null, st: null, timer: null, queue: [], raf: 0, playing: false, wake: null };
var T = { dur: 600, remainingMs: 600000, endAt: 0, running: false, iv: null };
var taps = [];

function saveCfg() { try { localStorage.setItem(SET_KEY, JSON.stringify(cfg)); } catch (e) {} }
var toastTimer;
function toast(msg, isError) {
  var n = $('toast'); n.textContent = msg; n.className = 'mt-toast' + (isError ? ' is-error' : ''); n.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { n.hidden = true; }, 3500);
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
  $('playText').textContent = t(A.playing ? 'stop' : 'text_play_text_1');
  renderHistory(); updateTimerUI();
}

/* ---------- صدا ---------- */
function ensureAudio() {
  if (!A.ctx) {
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) { toast(t('err_audio'), true); return false; }
    A.ctx = new C();
  }
  if (A.ctx.state === 'suspended') A.ctx.resume();
  if (!A.master) { A.master = A.ctx.createGain(); A.master.gain.value = cfg.volume / 100; A.master.connect(A.ctx.destination); }
  return true;
}
function click(time, level) {
  var o = A.ctx.createOscillator(), g = A.ctx.createGain();
  o.type = 'sine'; o.frequency.value = level === 2 ? 1200 : level === 1 ? 1000 : 800;
  var peak = level === 2 ? 1 : level === 1 ? 0.75 : 0.55;
  g.gain.setValueAtTime(0.0001, time);
  g.gain.exponentialRampToValueAtTime(peak, time + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
  o.connect(g); g.connect(A.master); o.start(time); o.stop(time + 0.09);
}
function buildDots() {
  var box = $('dots'); box.textContent = '';
  for (var i = 0; i < SIGS[cfg.sig].beats; i++) box.appendChild(el('span', 'mt-dot'));
}
function lightDot(beat, level) {
  var dots = $('dots').children;
  for (var i = 0; i < dots.length; i++) { dots[i].classList.remove('is-on', 'is-accent'); }
  if (dots[beat]) { dots[beat].classList.add('is-on'); if (level === 2) dots[beat].classList.add('is-accent'); }
}
function draw() {
  if (!A.playing) return;
  var now = A.ctx.currentTime;
  while (A.queue.length && A.queue[0].time <= now) { var q = A.queue.shift(); lightDot(q.beat, q.level); }
  A.raf = requestAnimationFrame(draw);
}
function tick() {
  pump(A.st, A.ctx.currentTime, AHEAD, function (beat, time, level) { click(time, level); A.queue.push({ beat: beat, time: time, level: level }); });
}
function startMetro() {
  if (A.playing || !ensureAudio()) return;
  A.st = { next: A.ctx.currentTime + 0.06, beat: 0, bpm: cfg.bpm, sig: cfg.sig, accentFirst: cfg.accentFirst };
  A.queue = []; A.playing = true; tick();
  A.timer = setInterval(tick, TICK_MS); A.raf = requestAnimationFrame(draw);
  setPlayUI(); wakeSync();
}
function stopMetro() {
  if (!A.playing) return;
  A.playing = false; clearInterval(A.timer); cancelAnimationFrame(A.raf); A.queue = [];
  try { A.master.disconnect(); } catch (e) {} A.master = null;
  lightDot(-1); setPlayUI(); wakeSync();
}
function setPlayUI() {
  var b = $('playBtn'); b.classList.toggle('is-playing', A.playing); b.setAttribute('aria-pressed', A.playing ? 'true' : 'false');
  $('playIcon').textContent = A.playing ? '⏸' : '▶'; $('playText').textContent = t(A.playing ? 'stop' : 'text_play_text_1');
}
function toggleMetro() { if (A.playing) stopMetro(); else startMetro(); }

/* ---------- تنظیمات ---------- */
function setBpm(v) {
  var b = typeof v === 'number' ? Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(v))) : parseBpm(v);
  if (b === null) return;
  cfg.bpm = b; $('bpmInput').value = String(b); $('bpmSlider').value = String(b);
  if (A.st) A.st.bpm = b; saveCfg(); markQuick();
}
function markQuick() { document.querySelectorAll('.mt-chip[data-bpm]').forEach(function (c) { c.classList.toggle('is-active', Number(c.dataset.bpm) === cfg.bpm); }); }
function setSig(sig) {
  if (!SIGS[sig]) return;
  cfg.sig = sig; if (A.st) { A.st.sig = sig; A.st.beat = 0; }
  document.querySelectorAll('#sigs .mt-chip').forEach(function (c) { var on = c.dataset.sig === sig; c.classList.toggle('is-active', on); c.setAttribute('aria-checked', on ? 'true' : 'false'); });
  buildDots(); saveCfg();
}
function tap() {
  var now = Date.now();
  if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
  taps.push(now); if (taps.length > 8) taps.shift();
  var b = tapBpm(taps); if (b !== null) setBpm(b);
}

/* ---------- تایمر (بر پایهٔ ساعت واقعی، نه شمارش ثانیه‌ای) ---------- */
function updateTimerUI() {
  var sec = T.running ? remainingSec(T.endAt, Date.now()) : Math.ceil(T.remainingMs / 1000);
  $('timeDisplay').textContent = fmtClock(sec);
  document.querySelectorAll('#presets .mt-chip').forEach(function (c) { c.classList.toggle('is-active', Number(c.dataset.min) * 60 === T.dur); });
  $('startTimer').disabled = T.running; $('pauseTimer').disabled = !T.running;
  $('startTimer').textContent = t(!T.running && T.remainingMs < T.dur * 1000 ? 'resume' : 'button_20');
}
function setDuration(min) {
  T.dur = min * 60; T.remainingMs = T.dur * 1000; cfg.timerMinutes = min; saveCfg();
  if (T.running) { T.endAt = Date.now() + T.remainingMs; } updateTimerUI();
}
function timerStart() {
  if (T.running) return;
  ensureAudio(); T.running = true; T.endAt = Date.now() + T.remainingMs; $('timerMsg').textContent = '';
  T.iv = setInterval(timerTick, 250); timerTick(); wakeSync();
}
function timerPause() {
  if (!T.running) return;
  T.remainingMs = Math.max(0, T.endAt - Date.now()); T.running = false; clearInterval(T.iv); updateTimerUI(); wakeSync();
}
function timerReset() {
  T.running = false; clearInterval(T.iv); T.remainingMs = T.dur * 1000; $('timerMsg').textContent = ''; updateTimerUI(); wakeSync();
}
function timerTick() {
  if (Date.now() >= T.endAt) { timerDone(); return; }
  updateTimerUI();
}
function timerDone() {
  clearInterval(T.iv); T.running = false;
  var minutes = Math.round(T.dur / 60), note = $('note').value.trim();
  saveSession(minutes, cfg.bpm, note);
  if (A.playing) stopMetro();
  if (A.ctx) { if (!A.master) { A.master = A.ctx.createGain(); A.master.gain.value = cfg.volume / 100; A.master.connect(A.ctx.destination); } for (var i = 0; i < 3; i++) click(A.ctx.currentTime + 0.05 + i * 0.25, 2); }
  if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} }
  $('note').value = ''; T.remainingMs = T.dur * 1000; updateTimerUI(); wakeSync();
  toast(t('timer_done')); $('timerMsg').textContent = t('timer_done');
}

/* ---------- نگه‌داشتن صفحه روشن (اگر پشتیبانی شود) ---------- */
function wakeSync() {
  var need = A.playing || T.running;
  if (!navigator.wakeLock) return;
  if (need && !A.wake) { navigator.wakeLock.request('screen').then(function (l) { A.wake = l; l.addEventListener('release', function () { A.wake = null; }); }).catch(function () {}); }
  else if (!need && A.wake) { A.wake.release().catch(function () {}); A.wake = null; }
}

/* ---------- تاریخچه ---------- */
function sessions() { return normalizeSessions(readJSON(SESS_KEY)); }
function writeSessions(list) {
  try { localStorage.setItem(SESS_KEY, JSON.stringify(list.map(function (s) { return { id: s.id, date: new Date(s.ts).toISOString(), duration: s.duration, bpm: s.bpm, note: s.note }; }))); }
  catch (e) { toast(t('err_save'), true); }
}
function saveSession(minutes, bpm, note) {
  var list = sessions(), id = Date.now(); while (list.some(function (s) { return s.id === id; })) id++;
  list.unshift({ id: id, ts: Date.now(), duration: minutes, bpm: bpm, note: note }); writeSessions(list.slice(0, 500)); renderHistory();
}
function renderHistory() {
  var list = sessions(), st = sessionStats(list, dayKey()), box = $('histList'); box.textContent = '';
  $('stToday').textContent = t('n_min', { n: nf(st.today) }); $('stTotal').textContent = t('n_min', { n: nf(st.total) }); $('stCount').textContent = nf(st.count);
  $('clearHist').hidden = !list.length;
  if (!list.length) { box.appendChild(el('p', 'mt-none', t('empty'))); return; }
  var loc = lang === 'fa' ? 'fa-IR' : 'en-US';
  list.slice(0, 100).forEach(function (s) {
    var it = el('article', 'mt-item'); it.dataset.id = s.id;
    it.appendChild(el('div', 'mt-item-date', new Date(s.ts).toLocaleDateString(loc) + ' - ' + new Date(s.ts).toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' })));
    var main = el('div', 'mt-item-main');
    main.appendChild(el('b', '', '⏱️ ' + t('n_min', { n: nf(s.duration) })));
    if (s.bpm) main.appendChild(el('span', '', '🎵 ' + nf(s.bpm) + ' BPM'));
    var del = el('button', 'mt-btn mt-btn--danger mt-btn--sm', t('delete')); del.type = 'button'; del.dataset.action = 'delete'; main.appendChild(del);
    it.appendChild(main);
    if (s.note) it.appendChild(el('p', 'mt-note', '📝 ' + s.note));
    box.appendChild(it);
  });
}

function bind() {
  $('playBtn').addEventListener('click', toggleMetro);
  $('bpmMinus').addEventListener('click', function () { setBpm(cfg.bpm - 1); });
  $('bpmPlus').addEventListener('click', function () { setBpm(cfg.bpm + 1); });
  $('bpmSlider').addEventListener('input', function () { setBpm(Number(this.value)); });
  $('bpmInput').addEventListener('input', function () { var v = normDigits(this.value).replace(/\D/g, '').slice(0, 3); this.value = v; var b = parseBpm(v); if (b !== null && v.length >= 2 && Number(v) >= BPM_MIN) setBpm(Number(v) > BPM_MAX ? BPM_MAX : Number(v)); });
  $('bpmInput').addEventListener('change', function () { var b = parseBpm(this.value); this.value = String(b === null ? cfg.bpm : b); if (b !== null) setBpm(b); });
  $('bpmInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') this.blur(); });
  document.querySelectorAll('.mt-chip[data-bpm]').forEach(function (c) { c.addEventListener('click', function () { setBpm(Number(c.dataset.bpm)); }); });
  $('tapBtn').addEventListener('click', tap);
  $('sigs').addEventListener('click', function (e) { var b = e.target.closest('[data-sig]'); if (b) setSig(b.dataset.sig); });
  $('accentFirst').addEventListener('change', function () { cfg.accentFirst = this.checked; if (A.st) A.st.accentFirst = this.checked; saveCfg(); });
  $('volume').addEventListener('input', function () { cfg.volume = Number(this.value); if (A.master) A.master.gain.value = cfg.volume / 100; saveCfg(); });
  $('presets').addEventListener('click', function (e) { var b = e.target.closest('[data-min]'); if (b) setDuration(Number(b.dataset.min)); });
  $('setCustom').addEventListener('click', function () { var m = parseMinutes($('customMin').value); if (m === null) { toast(t('err_minutes'), true); return; } setDuration(m); $('customMin').value = ''; });
  $('customMin').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('setCustom').click(); });
  $('startTimer').addEventListener('click', timerStart);
  $('pauseTimer').addEventListener('click', timerPause);
  $('resetTimer').addEventListener('click', timerReset);
  $('clearHist').addEventListener('click', async function () { if (!(await confirmDialog(t('confirm_clear')))) return; try { localStorage.removeItem(SESS_KEY); } catch (e) {} renderHistory(); });
  $('histList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-action="delete"]'), it = e.target.closest('.mt-item'); if (!b || !it) return;
    writeSessions(sessions().filter(function (s) { return String(s.id) !== it.dataset.id; })); renderHistory();
  });
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(e.target.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); toggleMetro(); }
    else if (e.code === 'ArrowUp') { e.preventDefault(); setBpm(cfg.bpm + 1); }
    else if (e.code === 'ArrowDown') { e.preventDefault(); setBpm(cfg.bpm - 1); }
  });
  $('confirmDialog').addEventListener('click', function (e) { if (e.target === e.currentTarget) e.currentTarget.close(); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { updateTimerUI(); wakeSync(); } });
  window.addEventListener('languageChanged', function (e) { lang = e.detail === 'en' ? 'en' : 'fa'; applyI18n(); });
}

async function boot() {
  try { dict = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  cfg = normalizeSettings(readJSON(SET_KEY));
  $('accentFirst').checked = cfg.accentFirst; $('volume').value = String(cfg.volume);
  T.dur = cfg.timerMinutes * 60; T.remainingMs = T.dur * 1000;
  applyI18n(); bind(); setBpm(cfg.bpm); setSig(cfg.sig); updateTimerUI(); renderHistory();
}
document.addEventListener('DOMContentLoaded', boot);
})();
