(function (root) {
'use strict';
const div = (a, b) => Math.trunc(a / b);
const mod = (a, b) => a - Math.trunc(a / b) * b;
const BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

function jalCal(jy, withoutLeap) {
  const bl = BREAKS.length, gy = jy + 621;
  let leapJ = -14, jp = BREAKS[0], jump = 0, n, i;
  if (jy < jp || jy >= BREAKS[bl - 1]) throw new RangeError('Invalid Jalaali year ' + jy);
  for (i = 1; i < bl; i++) {
    const jm = BREAKS[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }
  n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;
  if (withoutLeap) return { gy, march };
  if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;
  return { leap, gy, march };
}
function g2d(gy, gm, gd) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}
function d2g(jdn) {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1, gm = mod(div(i, 153), 12) + 1, gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { y: gy, m: gm, d: gd };
}
function j2d(jy, jm, jd) {
  const r = jalCal(jy, true);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}
function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }
function toJalali(gy, gm, gd) {
  const jdn = g2d(gy, gm, gd);
  let jy = d2g(jdn).y - 621;
  const r = jalCal(jy, false), jdn1f = g2d(jy + 621, 3, r.march);
  let k = jdn - jdn1f, jm, jd;
  if (k >= 0) {
    if (k <= 185) { return { y: jy, m: 1 + div(k, 31), d: mod(k, 31) + 1 }; }
    k -= 186;
  } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
  jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
  return { y: jy, m: jm, d: jd };
}
const isLeap = jy => jalCal(jy, false).leap === 0;
const monthLength = (jy, jm) => jm <= 6 ? 31 : jm <= 11 ? 30 : (isLeap(jy) ? 30 : 29);
function isValid(y, m, d) {
  return Number.isInteger(y) && Number.isInteger(m) && Number.isInteger(d) && y >= 1200 && y <= 1700 && m >= 1 && m <= 12 && d >= 1 && d <= monthLength(y, m);
}
const pad = n => String(n).padStart(2, '0');
const format = (y, m, d) => y + '/' + pad(m) + '/' + pad(d);
function parse(s) {
  const mt = typeof s === 'string' && /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(s.trim());
  if (!mt) return null;
  const y = +mt[1], m = +mt[2], d = +mt[3];
  return isValid(y, m, d) ? { y, m, d } : null;
}
function todayStr(now) { const n = now || new Date(); const j = toJalali(n.getFullYear(), n.getMonth() + 1, n.getDate()); return format(j.y, j.m, j.d); }
function weekdayIndex(y, m, d) { const g = toGregorian(y, m, d); return (new Date(Date.UTC(g.y, g.m - 1, g.d)).getUTCDay() + 1) % 7; }
function addDays(str, n) {
  const p = parse(str), g = toGregorian(p.y, p.m, p.d), dt = new Date(Date.UTC(g.y, g.m - 1, g.d + n));
  const j = toJalali(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
  return format(j.y, j.m, j.d);
}
function weekRange(str) { const p = parse(str), start = addDays(str, -weekdayIndex(p.y, p.m, p.d)); return [start, addDays(start, 6)]; }

const PRIORITIES = ['low', 'medium', 'high'], REMINDERS = ['none', '0', '5', '15', '30', '60'];
function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
function normalizeTask(raw, today, seen) {
  if (!raw || typeof raw !== 'object' || typeof raw.title !== 'string' || !raw.title.trim()) return null;
  let id = typeof raw.id === 'string' && raw.id ? raw.id : newId();
  if (seen) { while (seen.has(id)) id = newId(); seen.add(id); }
  const time = typeof raw.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.time) ? raw.time : '';
  let reminder = REMINDERS.includes(String(raw.reminder)) ? String(raw.reminder) : 'none';
  if (!time) reminder = 'none';
  const p = parse(raw.date);
  const created = typeof raw.createdAt === 'string' && !isNaN(Date.parse(raw.createdAt)) ? raw.createdAt : new Date().toISOString();
  return {
    id, title: raw.title.trim().slice(0, 120), description: typeof raw.description === 'string' ? raw.description.slice(0, 1000) : '',
    date: p ? format(p.y, p.m, p.d) : today, time, priority: PRIORITIES.includes(raw.priority) ? raw.priority : 'medium',
    reminder, completed: raw.completed === true, createdAt: created, notified: raw.notified === true
  };
}
function taskDateTime(task) {
  const p = parse(task.date); if (!p || !task.time) return null;
  const g = toGregorian(p.y, p.m, p.d), [h, mi] = task.time.split(':').map(Number);
  return new Date(g.y, g.m - 1, g.d, h, mi);
}
function reminderStatus(task, now) {
  if (task.completed || task.notified || task.reminder === 'none') return 'none';
  const at = taskDateTime(task); if (!at) return 'none';
  const rem = new Date(at.getTime() - Number(task.reminder) * 60000);
  if (now < rem) return 'wait';
  return now.getTime() <= at.getTime() + 3600000 ? 'fire' : 'expired';
}
function isOverdue(task, now) {
  if (task.completed) return false;
  const at = taskDateTime(task);
  return at ? at < now : task.date < todayStr(now);
}
const norm = s => String(s).toLowerCase().replace(/\u064a/g, '\u06cc').replace(/\u0643/g, '\u06a9');
function filterTasks(tasks, o) {
  const today = o.today, [ws, we] = weekRange(today), q = norm(o.query || '').trim();
  return tasks.filter(t => {
    switch (o.filter) {
      case 'today': if (t.date !== today) return false; break;
      case 'week': if (t.date < ws || t.date > we) return false; break;
      case 'selected': if (t.date !== o.selected) return false; break;
      case 'completed': if (!t.completed) return false; break;
      case 'pending': if (t.completed) return false; break;
    }
    return !q || norm(t.title).includes(q) || norm(t.description).includes(q);
  }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt));
}

const api = { toJalali, toGregorian, isLeap, monthLength, isValid, format, parse, todayStr, weekdayIndex, addDays, weekRange, normalizeTask, taskDateTime, reminderStatus, isOverdue, filterTasks };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PlannerCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
