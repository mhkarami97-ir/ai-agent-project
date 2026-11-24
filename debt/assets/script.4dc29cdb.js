(() => {
'use strict';
const C = window.LoanCalc;
const $ = id => document.getElementById(id);
const DB_NAME = 'LoanCalculatorDB', STORE = 'calculations', MAX_ITEMS = 100;
let T = {}, lang = localStorage.getItem('lang') || 'fa', cur = null, toastTimer = null, resizeTimer = null, db = null;

const t = (k, v) => {
  let s = (T[lang] && T[lang][k]) ?? (T.fa && T.fa[k]) ?? k;
  if (v) for (const [a, b] of Object.entries(v)) s = s.split('{' + a + '}').join(b);
  return s;
};
const locale = () => lang === 'fa' ? 'fa-IR' : 'en-US';
const fmt = n => new Intl.NumberFormat(locale(), { maximumFractionDigits: 0 }).format(Math.round(n));
const fmtDec = (n, d = 2) => new Intl.NumberFormat(locale(), { maximumFractionDigits: d }).format(n);
const pct = x => x === null || x === undefined ? '—' : (x > 100 ? t('hugeRate') : new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 1 }).format(x));
const money = n => fmt(n) + ' ' + t('toman');
const fmtDate = d => new Intl.DateTimeFormat(locale(), { year: 'numeric', month: 'long', day: 'numeric' }).format(d);

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
  document.title = t('title');
  updateHints(); render(); loadHistory();
  const open = !$('amortizationTable').hidden;
  $('toggleAmortization').textContent = t(open ? 'hideTable' : 'showTable');
}

function toast(msg, type = 'success') {
  const el = $('toast'); el.textContent = msg; el.className = 'toast show ' + type;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}
function askConfirm(msg) {
  return new Promise(res => {
    const d = $('confirmDialog'); $('confirmMessage').textContent = msg;
    const done = v => { $('confirmYes').onclick = $('confirmNo').onclick = null; d.onclose = null; if (d.open) d.close(); res(v); };
    $('confirmYes').onclick = () => done(true); $('confirmNo').onclick = () => done(false); d.onclose = () => done(false);
    d.showModal();
  });
}

const SPECS = [
  ['loanAmount', { min: 1, max: 1e15, req: true, err: 'errLoan' }],
  ['loanPeriod', { min: 1, max: 600, int: true, req: true, err: 'errPeriod' }],
  ['interestRate', { min: 0, max: 200, req: true, err: 'errRate' }],
  ['commissionPercent', { min: 0, max: 100, def: 0, err: 'errCommission' }],
  ['upfrontDeduction', { min: 0, max: 1e15, def: 0, err: 'errDeduction' }],
  ['insurancePercent', { min: 0, max: 100, def: 0, err: 'errInsurance' }],
  ['inflationRate', { min: 0, max: 500, def: 0, err: 'errInflation' }],
  ['depositAmount', { min: 0, max: 1e15, def: 0, err: 'errDeposit' }],
  ['depositPeriod', { min: 0, max: 120, int: true, def: 0, err: 'errDepositPeriod' }],
  ['depositRate', { min: 0, max: 200, def: 0, err: 'errDepositRate' }],
  ['opportunityRate', { min: 0, max: 500, def: null, err: 'errOpportunity' }]
];
class FieldError extends Error { constructor(id, key) { super(key); this.id = id; } }

function readInputs() {
  const x = {};
  for (const [id, s] of SPECS) {
    const raw = $(id).value.trim();
    $(id).removeAttribute('aria-invalid');
    if (raw === '') { if (s.req) throw new FieldError(id, s.err); x[id] = s.def; continue; }
    const v = C.parseNumber(raw);
    if (!isFinite(v) || v < s.min || v > s.max || (s.int && !Number.isInteger(v))) throw new FieldError(id, s.err);
    x[id] = v;
  }
  x.bankName = $('bankName').value.trim().slice(0, 60);
  x.calculationMethod = $('calculationMethod').value;
  x.depositLock = $('depositLock').value;
  if (x.loanAmount * x.commissionPercent / 100 + x.upfrontDeduction >= x.loanAmount) throw new FieldError('upfrontDeduction', 'errFees');
  return x;
}
function showFormError(id, key) {
  const e = $('formError'); e.textContent = t(key); e.hidden = false;
  if (id) { $(id).setAttribute('aria-invalid', 'true'); $(id).focus(); }
}
function clearFormError() { $('formError').hidden = true; }

function onSubmit(ev) {
  ev.preventDefault(); clearFormError();
  try {
    const inputs = readInputs();
    cur = { inputs, results: C.compute(inputs), timestamp: new Date().toISOString() };
    $('saveBtn').disabled = false;
    $('resultsSection').hidden = false;
    render();
    $('resultsSection').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  } catch (e) {
    if (e instanceof FieldError) showFormError(e.id, e.message); else { console.error(e); showFormError(null, 'errUnexpected'); }
  }
}

function setText(id, v) { $(id).textContent = v; }
function render() {
  if (!cur) return;
  const { inputs: x, results: r } = cur;
  const noRate = r.effective === null;
  setText('effRate', noRate ? t('irrFail') : pct(r.effective));
  setText('nomRate', noRate ? '—' : pct(r.nominal));
  setText('received', money(r.received));
  setText('monthly', money(r.monthlyPayment));
  const varies = Math.abs(r.lastPayment - r.monthlyPayment) > 1;
  setText('monthlySub', varies ? t('lastPaymentNote', { v: money(r.lastPayment) }) : t('monthlyPaymentDesc'));
  setText('totalPay', money(r.totalPayment));
  setText('totalPaySub', r.ratio === null ? '' : t('ratioNote', { v: fmtDec(r.ratio, 2) }));
  setText('totalInt', money(r.totalInterest));
  setText('totalIntSub', r.totalInsurance > 0 ? t('insuranceNote', { v: money(r.totalInsurance) }) : t('totalInterestDesc'));
  setText('fees', money(r.fees));
  setText('endDate', fmtDate(C.addMonths(new Date(), x.loanPeriod)));
  $('oppCard').hidden = x.depositAmount <= 0;
  setText('oppCost', money(r.opportunityCost));
  $('realCard').hidden = r.realRate === null;
  $('pvCard').hidden = r.pv === null;
  if (r.realRate !== null) setText('realRate', pct(r.realRate));
  if (r.pv !== null) setText('pvPay', money(r.pv));

  const ul = $('summaryList'); ul.replaceChildren();
  const add = s => { const li = document.createElement('li'); li.textContent = s; ul.append(li); };
  if (!noRate) add(t('sumRate', { eff: pct(r.effective), nom: pct(x.interestRate / 100) }));
  else add(t('irrFail'));
  add(t('sumRatio', { recv: money(r.received), pay: money(r.totalPayment), ratio: fmtDec(r.ratio, 2) }));
  if (r.fees > 0) add(t('sumFees', { v: money(r.fees) }));
  if (x.depositAmount > 0) add(t('sumDeposit', { d: money(x.depositAmount), n: fmt(x.depositPeriod), c: money(r.opportunityCost) }));
  if (r.realRate !== null) add(t('sumInflation', { i: pct(x.inflationRate / 100), real: pct(r.realRate), pv: money(r.pv) }));

  buildTable(r.rows);
  requestAnimationFrame(drawChart);
}

function buildTable(rows) {
  const wrap = $('amortizationTable'); wrap.replaceChildren();
  const tb = document.createElement('table'); tb.className = 'amortization-table';
  const cap = document.createElement('caption'); cap.className = 'sr-only'; cap.textContent = t('tableTitle'); tb.append(cap);
  const hr = tb.createTHead().insertRow();
  ['colMonth', 'colPayment', 'colPrincipal', 'colInterest', 'colInsurance', 'colBalance'].forEach(k => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = t(k); hr.append(th); });
  const body = tb.createTBody();
  for (const r of rows) {
    const tr = body.insertRow();
    [r.month, r.payment, r.principal, r.interest, r.insurance, r.balance].forEach((v, i) => { tr.insertCell().textContent = i === 0 ? fmt(v) : fmt(v); });
  }
  wrap.append(tb);
}

function drawChart() {
  if (!cur || $('resultsSection').hidden) return;
  const rows = cur.results.rows, cv = $('paymentChart');
  const w = cv.clientWidth || 600, h = 300, dpr = window.devicePixelRatio || 1;
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, w, h);
  const cs = getComputedStyle(document.documentElement);
  const col = n => cs.getPropertyValue(n).trim();
  const bin = rows.length > 96 ? 12 : 1, bars = [];
  for (let i = 0; i < rows.length; i += bin) {
    const g = rows.slice(i, i + bin);
    bars.push({ p: g.reduce((s, r) => s + r.principal, 0), i: g.reduce((s, r) => s + r.interest + r.insurance, 0), label: bin === 1 ? g[0].month : Math.floor(i / 12) + 1 });
  }
  const max = Math.max(...bars.map(b => b.p + b.i)) || 1;
  const L = 52, R = 8, Tp = 10, B = 26, cw = w - L - R, ch = h - Tp - B;
  const compact = new Intl.NumberFormat(locale(), { notation: 'compact', maximumFractionDigits: 1 });
  c.font = '11px Vazirmatn, sans-serif'; c.fillStyle = col('--muted'); c.strokeStyle = col('--border'); c.textBaseline = 'middle';
  c.textAlign = 'right';
  for (let k = 0; k <= 4; k++) {
    const y = Tp + ch - ch * k / 4;
    c.beginPath(); c.moveTo(L, y); c.lineTo(w - R, y); c.stroke();
    c.fillText(compact.format(max * k / 4), L - 6, y);
  }
  const bw = cw / bars.length, gap = Math.min(2, bw * 0.2);
  bars.forEach((b, idx) => {
    const x = L + idx * bw + gap / 2, ph = ch * b.p / max, ih = ch * b.i / max;
    c.fillStyle = col('--c-principal'); c.fillRect(x, Tp + ch - ph, bw - gap, ph);
    c.fillStyle = col('--c-interest'); c.fillRect(x, Tp + ch - ph - ih, bw - gap, ih);
  });
  c.fillStyle = col('--muted'); c.textAlign = 'center'; c.textBaseline = 'top';
  const every = Math.max(1, Math.ceil(bars.length / Math.max(2, Math.floor(cw / 40))));
  bars.forEach((b, idx) => { if (idx % every === 0) c.fillText(fmt(b.label), L + idx * bw + bw / 2, Tp + ch + 6); });
  cv.setAttribute('aria-label', t('chartAria', { n: fmt(rows.length), unit: t(bin === 1 ? 'chartMonth' : 'chartYear') }));
}

function updateHints() {
  [['loanAmount', 'loanAmountHint'], ['depositAmount', 'depositAmountHint']].forEach(([id, hid]) => {
    const v = C.parseNumber($(id).value);
    $(hid).textContent = isFinite(v) && v > 0 ? money(v) : '';
  });
}

/* ---------- storage ---------- */
const wrap = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
async function dbInit() {
  if (db) return db;
  db = await new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onerror = () => rej(r.error); r.onsuccess = () => res(r.result);
    r.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) { const s = d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }); s.createIndex('timestamp', 'timestamp'); }
    };
  });
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite'), cur = tx.objectStore(STORE).openCursor();
    cur.onsuccess = () => { const c = cur.result; if (!c) return; const v = c.value; if (v.results) { delete v.results; c.update(v); } c.continue(); };
    tx.oncomplete = res; tx.onerror = () => rej(tx.error);
  });
  return db;
}
async function dbAll() { await dbInit(); const a = await wrap(db.transaction(STORE).objectStore(STORE).getAll()); return a.sort((p, q) => q.timestamp.localeCompare(p.timestamp)); }
async function dbAdd(rec) {
  await dbInit();
  const tx = db.transaction(STORE, 'readwrite'), s = tx.objectStore(STORE);
  s.add(rec);
  const keys = await wrap(s.getAllKeys());
  keys.slice(0, Math.max(0, keys.length - MAX_ITEMS)).forEach(k => s.delete(k));
  await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
async function dbDel(id) { await dbInit(); const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).delete(id); await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }
async function dbClear() { await dbInit(); const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).clear(); await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); }

async function saveCurrent() {
  if (!cur) return toast(t('noCalc'), 'error');
  try { await dbAdd({ inputs: cur.inputs, timestamp: cur.timestamp }); toast(t('saved')); loadHistory(); }
  catch { toast(t('errSave'), 'error'); }
}
function fillForm(i) {
  const d = C.defaults(i);
  const set = (id, v) => { $(id).value = v === null || v === undefined || v === 0 && id !== 'loanAmount' ? (v === 0 ? '0' : '') : String(v); };
  $('bankName').value = i.bankName || '';
  ['loanAmount', 'loanPeriod', 'interestRate', 'commissionPercent', 'upfrontDeduction', 'insurancePercent', 'inflationRate', 'depositAmount', 'depositPeriod', 'depositRate'].forEach(id => { $(id).value = String(d[id]); });
  $('opportunityRate').value = d.opportunityRate === null ? '' : String(d.opportunityRate);
  $('calculationMethod').value = d.calculationMethod; $('depositLock').value = d.depositLock;
  updateHints();
}
async function loadHistory() {
  const list = $('historyList'); list.replaceChildren();
  let items;
  try { items = await dbAll(); } catch { const p = document.createElement('p'); p.className = 'empty'; p.textContent = t('historyErr'); list.append(p); return; }
  if (!items.length) { const p = document.createElement('p'); p.className = 'empty'; p.textContent = t('historyEmpty'); list.append(p); return; }
  for (const it of items) {
    let r; try { r = C.compute(it.inputs); } catch { continue; }
    const x = C.defaults(it.inputs);
    const card = document.createElement('div'); card.className = 'history-item';
    const h = document.createElement('h4'); h.textContent = (x.bankName || t('defaultBank')) + ' — ' + money(x.loanAmount); card.append(h);
    [['📅', new Date(it.timestamp).toLocaleDateString(locale(), { year: 'numeric', month: 'long', day: 'numeric' })],
     ['💰', t('monthlyPayment') + ': ' + money(r.monthlyPayment)],
     ['📊', t('effectiveRate') + ': ' + pct(r.effective)],
     ['⏱️', t('loanPeriod') + ': ' + fmt(x.loanPeriod) + ' ' + t('months')]].forEach(([i, s]) => { const p = document.createElement('p'); p.textContent = i + ' ' + s; card.append(p); });
    const acts = document.createElement('div'); acts.className = 'actions';
    const load = document.createElement('button'); load.type = 'button'; load.className = 'btn btn-secondary btn-sm'; load.textContent = t('historyLoad');
    load.addEventListener('click', () => { fillForm(it.inputs); $('loanForm').requestSubmit(); window.scrollTo({ top: 0 }); });
    const del = document.createElement('button'); del.type = 'button'; del.className = 'btn btn-danger btn-sm'; del.textContent = t('historyDelete');
    del.addEventListener('click', async () => {
      if (!await askConfirm(t('confirmDelete'))) return;
      try { await dbDel(it.id); toast(t('deleted')); loadHistory(); } catch { toast(t('errSave'), 'error'); }
    });
    acts.append(load, del); card.append(acts); list.append(card);
  }
}
async function clearHistory() {
  if (!await askConfirm(t('confirmClear'))) return;
  try { await dbClear(); toast(t('cleared')); loadHistory(); } catch { toast(t('errSave'), 'error'); }
}

function bind() {
  $('loanForm').addEventListener('submit', onSubmit);
  $('saveBtn').addEventListener('click', saveCurrent);
  $('clearHistoryBtn').addEventListener('click', clearHistory);
  $('toggleAmortization').addEventListener('click', () => {
    const tbl = $('amortizationTable'), open = tbl.hidden;
    tbl.hidden = !open; $('toggleAmortization').setAttribute('aria-expanded', String(open));
    $('toggleAmortization').textContent = t(open ? 'hideTable' : 'showTable');
  });
  ['loanAmount', 'depositAmount'].forEach(id => $(id).addEventListener('input', updateHints));
  document.querySelectorAll('#loanForm input').forEach(i => i.addEventListener('input', () => { i.removeAttribute('aria-invalid'); }));
  $('confirmDialog').addEventListener('click', e => { if (e.target === e.currentTarget) e.currentTarget.close(); });
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(drawChart, 150); });
  window.addEventListener('themeChanged', e => { applyTheme(e.detail); requestAnimationFrame(drawChart); });
  window.addEventListener('languageChanged', e => { lang = e.detail === 'en' ? 'en' : 'fa'; localStorage.setItem('lang', lang); applyI18n(); });
}

async function init() {
  applyTheme(localStorage.getItem('theme'));
  try { T = await (await fetch('assets/translations.json')).json(); } catch (e) { console.error('translations', e); }
  bind(); applyI18n();
}
init();
})();
