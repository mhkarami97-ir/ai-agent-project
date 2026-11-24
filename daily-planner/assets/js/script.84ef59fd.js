(() => {
'use strict';
const J = window.PlannerCore;
const $ = id => document.getElementById(id);
const KEY = 'dailyPlannerTasks';
const MIN_YEAR = 1300, MAX_YEAR = 1600;
let T = {}, lang = localStorage.getItem('lang') || 'fa', toastTimer = null, confirmOpen = false;
const st = { tasks: [], viewY: 0, viewM: 0, selected: '', filter: 'all', query: '', editingId: null, today: '' };

const t = (k, v) => {
  let s = (T[lang] && T[lang][k]) ?? (T.fa && T.fa[k]) ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b);
  return s;
};
const locale = () => lang === 'fa' ? 'fa-IR' : 'en-US';
const num = n => new Intl.NumberFormat(locale(), { useGrouping: false }).format(n);
const showDate = s => { const p = J.parse(s); return p ? num(p.y) + '/' + num(String(p.m).padStart(2, '0')).replace(/^(\d)$/, '0$1') + '/' + num(String(p.d).padStart(2, '0')) : s; };
const pad2 = n => (n < 10 ? num(0) : '') + num(n);
const showDateP = s => { const p = J.parse(s); return p ? num(p.y) + '/' + pad2(p.m) + '/' + pad2(p.d) : s; };
const showTime = s => s ? s.split(':').map(x => pad2(Number(x))).join(':') : '';
const monthName = m => t('mon' + m), weekdayName = i => t('wd' + i);

function applyTheme(th) {
  const v = th === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', v);
  document.body.setAttribute('data-theme', v);
}
function applyI18n() {
  const r = document.documentElement;
  r.lang = lang; r.dir = lang === 'fa' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(e => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(e => { e.placeholder = t(e.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(e => { e.setAttribute('aria-label', t(e.dataset.i18nAria)); });
  document.title = t('title');
  $('prevMonth').textContent = lang === 'fa' ? '►' : '◄';
  $('nextMonth').textContent = lang === 'fa' ? '◄' : '►';
  $('taskDate').value = st.selected ? showDateP(st.selected) : '';
  updateNotifUi(); renderAll();
}

function toast(msg, type = 'success') {
  const el = $('toast'); el.textContent = msg; el.className = 'toast show ' + type;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
function askConfirm(msg) {
  return new Promise(res => {
    const d = $('confirmDialog'); $('confirmMessage').textContent = msg;
    const done = v => { $('confirmYes').onclick = $('confirmNo').onclick = null; d.onclose = null; if (d.open) d.close(); res(v); };
    $('confirmYes').onclick = () => done(true); $('confirmNo').onclick = () => done(false); d.onclose = () => done(false);
    d.showModal();
  });
}

/* ---------- storage ---------- */
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(st.tasks)); return true; }
  catch { toast(t('errSave'), 'error'); return false; }
}
function load() {
  let raw = [];
  try { const p = JSON.parse(localStorage.getItem(KEY) || '[]'); if (Array.isArray(p)) raw = p; } catch {}
  const seen = new Set();
  st.tasks = raw.map(r => J.normalizeTask(r, st.today, seen)).filter(Boolean);
  if (JSON.stringify(st.tasks) !== JSON.stringify(raw)) save();
}

/* ---------- calendar ---------- */
function renderCalendar() {
  const grid = $('calendar'); grid.replaceChildren();
  const { viewY: y, viewM: m } = st;
  $('currentMonth').textContent = monthName(m) + ' ' + num(y);
  for (let i = 0; i < 7; i++) {
    const h = document.createElement('div'); h.className = 'calendar-day header'; h.textContent = t('wds' + i); h.title = weekdayName(i); grid.append(h);
  }
  const counts = new Map();
  st.tasks.forEach(k => counts.set(k.date, (counts.get(k.date) || 0) + 1));
  const first = J.weekdayIndex(y, m, 1), len = J.monthLength(y, m);
  const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y, plen = J.monthLength(py, pm);
  const other = d => { const s = document.createElement('span'); s.className = 'calendar-day other-month'; s.setAttribute('aria-hidden', 'true'); s.textContent = num(d); return s; };
  for (let i = first - 1; i >= 0; i--) grid.append(other(plen - i));
  for (let d = 1; d <= len; d++) {
    const ds = J.format(y, m, d), n = counts.get(ds) || 0;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'calendar-day';
    b.textContent = num(d);
    if (ds === st.today) b.classList.add('today');
    if (ds === st.selected) b.classList.add('selected');
    if (n) { b.classList.add('has-tasks'); }
    b.setAttribute('aria-pressed', String(ds === st.selected));
    b.setAttribute('aria-label', weekdayName(J.weekdayIndex(y, m, d)) + ' ' + num(d) + ' ' + monthName(m) + ' ' + num(y) + (n ? '، ' + t('dayTasks', { n: num(n) }) : ''));
    b.addEventListener('click', () => selectDate(ds));
    grid.append(b);
  }
  const used = first + len, tail = (7 - used % 7) % 7;
  for (let d = 1; d <= tail; d++) grid.append(other(d));
}
function selectDate(ds) {
  st.selected = ds; $('taskDate').value = showDateP(ds);
  if (st.filter === 'selected') renderList();
  renderCalendar();
  const b = document.querySelector('#calendar .calendar-day.selected'); if (b) b.focus();
}
function shiftMonth(delta) {
  let y = st.viewY, m = st.viewM + delta;
  if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
  if (y < MIN_YEAR || y > MAX_YEAR) return;
  st.viewY = y; st.viewM = m; renderCalendar();
}
function gotoToday() { const p = J.parse(st.today); st.viewY = p.y; st.viewM = p.m; renderCalendar(); }
function updateTodayInfo() {
  const p = J.parse(st.today);
  $('todayDate').textContent = t('todayLabel', { wd: weekdayName(J.weekdayIndex(p.y, p.m, p.d)), d: num(p.d), m: monthName(p.m), y: num(p.y) });
}

/* ---------- list ---------- */
function taskEl(task, now) {
  const li = document.createElement('li');
  const over = J.isOverdue(task, now);
  li.className = 'task-item priority-' + task.priority + (task.completed ? ' completed' : '') + (over ? ' overdue' : '');
  const head = document.createElement('div'); head.className = 'task-header';
  const wrap = document.createElement('label'); wrap.className = 'task-title-wrapper';
  const cb = document.createElement('input'); cb.type = 'checkbox'; cb.className = 'task-checkbox'; cb.checked = task.completed;
  cb.addEventListener('change', () => toggleTask(task.id));
  const title = document.createElement('span'); title.className = 'task-title'; title.textContent = task.title;
  wrap.append(cb, title);
  const acts = document.createElement('div'); acts.className = 'task-actions';
  const mk = (cls, icon, key, fn) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn-icon ' + cls; b.textContent = icon; b.title = t(key); b.setAttribute('aria-label', t(key) + ': ' + task.title); b.addEventListener('click', fn); return b; };
  acts.append(mk('btn-edit', '✏️', 'edit', () => editTask(task.id)), mk('btn-delete', '🗑️', 'delete', () => deleteTask(task.id)));
  head.append(wrap, acts); li.append(head);
  if (task.description) { const d = document.createElement('div'); d.className = 'task-description'; d.textContent = task.description; li.append(d); }
  const meta = document.createElement('div'); meta.className = 'task-meta';
  const item = txt => { const s = document.createElement('div'); s.className = 'task-meta-item'; s.textContent = txt; meta.append(s); };
  item('📅 ' + showDateP(task.date));
  if (task.time) item('🕐 ' + showTime(task.time));
  const badge = document.createElement('span'); badge.className = 'task-badge badge-' + task.priority; badge.textContent = t('pri' + task.priority[0].toUpperCase() + task.priority.slice(1)); meta.append(badge);
  if (task.reminder !== 'none') item('🔔 ' + t('rem' + task.reminder));
  if (over) { const o = document.createElement('span'); o.className = 'task-badge badge-overdue'; o.textContent = t('overdue'); meta.append(o); }
  li.append(meta);
  return li;
}
function renderList() {
  const list = $('tasksList'); list.replaceChildren();
  const items = J.filterTasks(st.tasks, { filter: st.filter, query: st.query, selected: st.selected, today: st.today });
  if (!items.length) {
    const li = document.createElement('li'); li.className = 'no-tasks';
    li.textContent = st.tasks.length ? t('noMatch') : t('noTasks'); list.append(li);
  } else { const now = new Date(); items.forEach(k => list.append(taskEl(k, now))); }
  $('clearCompletedBtn').disabled = !st.tasks.some(k => k.completed);
}
function renderStats() {
  const total = st.tasks.length, done = st.tasks.filter(k => k.completed).length;
  $('totalTasks').textContent = num(total); $('completedTasks').textContent = num(done);
  $('pendingTasks').textContent = num(total - done); $('todayTasks').textContent = num(st.tasks.filter(k => k.date === st.today).length);
}
function renderAll() { updateTodayInfo(); renderCalendar(); renderList(); renderStats(); }

/* ---------- form ---------- */
function formError(key, id) {
  const e = $('formError'); e.textContent = t(key); e.hidden = false;
  if (id) { $(id).setAttribute('aria-invalid', 'true'); $(id).focus(); }
}
function clearErrors() { $('formError').hidden = true; ['taskTitle', 'taskTime'].forEach(i => $(i).removeAttribute('aria-invalid')); }
function readForm() {
  clearErrors();
  const title = $('taskTitle').value.trim(), time = $('taskTime').value, reminder = $('taskReminder').value;
  if (!title) { formError('errTitle', 'taskTitle'); return null; }
  if (!st.selected) { formError('errDate'); return null; }
  if (reminder !== 'none' && !time) { formError('errTime', 'taskTime'); return null; }
  return { title, description: $('taskDescription').value.trim(), date: st.selected, time, priority: $('taskPriority').value, reminder };
}
function clearForm() {
  $('taskTitle').value = ''; $('taskDescription').value = ''; $('taskTime').value = '';
  $('taskPriority').value = 'medium'; $('taskReminder').value = 'none'; clearErrors();
}
function setEditing(id) {
  st.editingId = id;
  $('addTaskBtn').hidden = !!id; $('updateTaskBtn').hidden = !id; $('cancelEditBtn').hidden = !id;
  $('formTitle').textContent = t(id ? 'editTaskTitle' : 'addTaskTitle');
  $('formTitle').dataset.i18n = id ? 'editTaskTitle' : 'addTaskTitle';
}
function onSubmit(ev) {
  ev.preventDefault();
  const data = readForm(); if (!data) return;
  if (st.editingId) {
    const k = st.tasks.find(x => x.id === st.editingId);
    if (k) { Object.assign(k, data, { notified: false }); if (save()) toast(t('updated')); }
    setEditing(null);
  } else {
    const seen = new Set(st.tasks.map(x => x.id));
    const k = J.normalizeTask({ ...data, completed: false, createdAt: new Date().toISOString() }, st.today, seen);
    st.tasks.push(k); if (save()) toast(t('added'));
  }
  clearForm(); renderAll(); checkReminders();
}
function editTask(id) {
  const k = st.tasks.find(x => x.id === id); if (!k) return;
  setEditing(id);
  $('taskTitle').value = k.title; $('taskDescription').value = k.description; $('taskTime').value = k.time;
  $('taskPriority').value = k.priority; $('taskReminder').value = k.reminder;
  const p = J.parse(k.date); st.selected = k.date; st.viewY = p.y; st.viewM = p.m; $('taskDate').value = showDateP(k.date);
  renderCalendar();
  $('taskForm').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  $('taskTitle').focus();
}
function cancelEdit() { setEditing(null); clearForm(); }
function toggleTask(id) {
  const k = st.tasks.find(x => x.id === id); if (!k) return;
  k.completed = !k.completed; save(); renderList(); renderStats();
}
async function deleteTask(id) {
  const k = st.tasks.find(x => x.id === id); if (!k) return;
  if (!await askConfirm(t('confirmDelete', { t: k.title }))) return;
  st.tasks = st.tasks.filter(x => x.id !== id); if (st.editingId === id) cancelEdit();
  if (save()) toast(t('deleted')); renderAll();
}
async function clearCompleted() {
  const n = st.tasks.filter(k => k.completed).length;
  if (!n) return toast(t('nothingToClear'), 'error');
  if (!await askConfirm(t('confirmClear', { n: num(n) }))) return;
  st.tasks = st.tasks.filter(k => !k.completed);
  if (st.editingId && !st.tasks.some(k => k.id === st.editingId)) cancelEdit();
  if (save()) toast(t('completedCleared')); renderAll();
}

/* ---------- reminders ---------- */
function notifSupported() { return 'Notification' in window; }
function updateNotifUi() {
  $('notifRow').hidden = !notifSupported();
  if (!notifSupported()) return;
  const p = Notification.permission;
  $('notifBtn').hidden = p !== 'default';
  $('notifStatus').textContent = p === 'granted' ? t('notifOn') : p === 'denied' ? t('notifDenied') : '';
}
async function enableNotif() {
  try { await Notification.requestPermission(); } catch {}
  updateNotifUi();
}
function fire(task) {
  const msg = t('reminderMsg', { t: task.title });
  toast(msg, 'info');
  if (notifSupported() && Notification.permission === 'granted') {
    try { new Notification(t('title'), { body: task.title + (task.time ? ' — ' + showTime(task.time) : ''), lang, dir: lang === 'fa' ? 'rtl' : 'ltr', tag: task.id }); } catch {}
  }
}
function checkReminders() {
  const now = new Date(); let changed = false;
  const day = J.todayStr(now);
  if (day !== st.today) { st.today = day; renderAll(); }
  for (const k of st.tasks) {
    const s = J.reminderStatus(k, now);
    if (s === 'fire') { fire(k); k.notified = true; changed = true; }
    else if (s === 'expired') { k.notified = true; changed = true; }
  }
  if (changed) save();
}

function bind() {
  $('taskForm').addEventListener('submit', onSubmit);
  $('cancelEditBtn').addEventListener('click', cancelEdit);
  $('clearCompletedBtn').addEventListener('click', clearCompleted);
  $('prevMonth').addEventListener('click', () => shiftMonth(lang === 'fa' ? -1 : -1));
  $('nextMonth').addEventListener('click', () => shiftMonth(1));
  $('goToday').addEventListener('click', gotoToday);
  $('notifBtn').addEventListener('click', enableNotif);
  document.querySelectorAll('.btn-filter').forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll('.btn-filter').forEach(x => { const on = x === b; x.classList.toggle('active', on); x.setAttribute('aria-pressed', String(on)); });
    st.filter = b.dataset.filter; renderList();
  }));
  $('searchTasks').addEventListener('input', e => { st.query = e.target.value; renderList(); });
  $('confirmDialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkReminders(); });
  window.addEventListener('themeChanged', e => applyTheme(e.detail));
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); });
}

async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  st.today = J.todayStr(); st.selected = st.today;
  const p = J.parse(st.today); st.viewY = p.y; st.viewM = p.m;
  load(); bind(); setEditing(null); applyI18n(); checkReminders();
  setInterval(checkReminders, 30000);
}
init();
})();
