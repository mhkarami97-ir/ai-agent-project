(function (root) {
'use strict';
const num = v => (typeof v === 'number' && isFinite(v) ? v : 0);

function defaults(x) {
  const o = Object.assign({ bankName: '', loanAmount: 0, depositAmount: 0, depositPeriod: 0, interestRate: 0, loanPeriod: 0, commissionPercent: 0, upfrontDeduction: 0, insurancePercent: 0, inflationRate: 0, calculationMethod: 'reducing', depositLock: 'release', depositRate: 0 }, x || {});
  ['loanAmount', 'depositAmount', 'depositPeriod', 'interestRate', 'loanPeriod', 'commissionPercent', 'upfrontDeduction', 'insurancePercent', 'inflationRate', 'depositRate'].forEach(k => { o[k] = num(Number(o[k])); });
  o.calculationMethod = o.calculationMethod === 'flat' ? 'flat' : 'reducing';
  o.depositLock = o.depositLock === 'locked' ? 'locked' : 'release';
  o.opportunityRate = (x && x.opportunityRate !== undefined && x.opportunityRate !== null && x.opportunityRate !== '' && isFinite(Number(x.opportunityRate))) ? Number(x.opportunityRate) : null;
  return o;
}

function schedule(P, annualRate, n, insRate, method) {
  const rows = [];
  if (method === 'flat') {
    const pp = P / n, ii = P * annualRate / 100 / 12, ss = P * insRate / 100 / 12;
    let bal = P;
    for (let m = 1; m <= n; m++) {
      bal = m === n ? 0 : bal - pp;
      rows.push({ month: m, payment: pp + ii + ss, principal: pp, interest: ii, insurance: ss, balance: Math.max(0, bal) });
    }
    return rows;
  }
  const r = annualRate / 1200, q = insRate / 1200;
  const base = r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n));
  let bal = P;
  for (let m = 1; m <= n; m++) {
    const interest = bal * r, insurance = bal * q;
    const principal = m === n ? bal : base - interest;
    bal = m === n ? 0 : bal - principal;
    rows.push({ month: m, payment: principal + interest + insurance, principal, interest, insurance, balance: Math.max(0, bal) });
  }
  return rows;
}

function irrMonthly(c) {
  const f = r => { let s = 0, d = 1; for (let k = 0; k < c.length; k++) { s += c[k] / d; d *= 1 + r; } return s; };
  let lo = -0.5, hi = 1;
  if (!(c[0] > 0) || f(lo) >= 0) return null;
  let i = 0;
  while (f(hi) <= 0 && i++ < 40) hi *= 2;
  if (f(hi) <= 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
  }
  return (lo + hi) / 2;
}

function opportunityCost(x) {
  if (x.depositAmount <= 0) return 0;
  const o = (x.opportunityRate === null ? x.inflationRate : x.opportunityRate) / 100;
  const d = x.depositRate / 100;
  const months = x.depositPeriod + (x.depositLock === 'locked' ? x.loanPeriod : 0);
  return x.depositAmount * (Math.pow(1 + o, months / 12) - Math.pow(1 + d, months / 12));
}

function compute(input) {
  const x = defaults(input), n = x.loanPeriod;
  const rows = schedule(x.loanAmount, x.interestRate, n, x.insurancePercent, x.calculationMethod);
  const commissionAmount = x.loanAmount * x.commissionPercent / 100;
  const fees = commissionAmount + x.upfrontDeduction;
  const received = x.loanAmount - fees;
  const opp = opportunityCost(x);
  const flows = new Array(n + 1).fill(0);
  flows[0] = received;
  rows.forEach(r => { flows[r.month] -= r.payment; });
  if (x.depositAmount > 0) { if (x.depositLock === 'locked') flows[n] -= opp; else flows[0] -= opp; }
  const rm = irrMonthly(flows);
  const effective = rm === null ? null : Math.pow(1 + rm, 12) - 1;
  const nominal = rm === null ? null : rm * 12;
  const totalPayment = rows.reduce((s, r) => s + r.payment, 0);
  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  const totalInsurance = rows.reduce((s, r) => s + r.insurance, 0);
  let pv = null, realRate = null;
  if (x.inflationRate > 0) {
    const m = Math.pow(1 + x.inflationRate / 100, 1 / 12) - 1;
    pv = rows.reduce((s, r) => s + r.payment / Math.pow(1 + m, r.month), 0);
    if (effective !== null) realRate = (1 + effective) / (1 + x.inflationRate / 100) - 1;
  }
  return { rows, received, fees, commissionAmount, monthlyPayment: rows[0].payment, lastPayment: rows[rows.length - 1].payment, totalPayment, totalInterest, totalInsurance, opportunityCost: opp, effective, nominal, pv, realRate, totalCost: totalPayment - received + opp, ratio: received > 0 ? totalPayment / received : null };
}

function parseNumber(str) {
  if (typeof str !== 'string') return NaN;
  const map = { '۰': 0, '۱': 1, '۲': 2, '۳': 3, '۴': 4, '۵': 5, '۶': 6, '۷': 7, '۸': 8, '۹': 9, '٠': 0, '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9 };
  const s = str.trim().replace(/[۰-۹٠-٩]/g, d => String(map[d])).replace(/[\s,٬،_]/g, '').replace(/[٫]/g, '.');
  if (s === '') return NaN;
  return /^\d*\.?\d+$/.test(s) ? Number(s) : NaN;
}

function addMonths(date, n) {
  const d = new Date(date.getTime()), day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d;
}

const api = { compute, schedule, irrMonthly, parseNumber, addMonths, defaults };
if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.LoanCalc = api;
})(typeof window !== 'undefined' ? window : globalThis);
