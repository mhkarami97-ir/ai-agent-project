/* Conversion utilities for Jalali ? Gregorian ? Hijri plus age calculation. */
const converters = (() => {
  const breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  const div = (a, b) => Math.trunc(a / b);
  const mod = (a, b) => a - Math.trunc(a / b) * b;
  const jalCal = (jy, withoutLeap = false) => {
    let gy = jy + 621;
    let leapJ = -14;
    let jp = breaks[0];
    let jm;
    let jump;
    let leap;
    let n;
    if (jy < jp || jy >= breaks[breaks.length - 1]) {
      throw new Error("??? ???? ???????? ???????");
    }
    for (let i = 1; i < breaks.length; i += 1) {
      jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) {
        break;
      }
      leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) {
      leapJ += 1;
    }
    const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    const march = 20 + leapJ - leapG;
    if (withoutLeap) {
      return { gy, march };
    }
    if (jump - n < 6) {
      n = n - jump + div(jump + 4, 33) * 33;
    }
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) {
      leap = 4;
    }
    return { leap, gy, march };
  };
  const g2d = (gy, gm, gd) => {
    let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4);
    d += div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d -= div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) - 752;
    return d;
  };
  const d2g = (jdn) => {
    let j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    const i = div(mod(j, 1461), 4) * 5 + 308;
    const gd = div(mod(i, 153), 5) + 1;
    const gm = mod(div(i, 153), 12) + 1;
    const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy, gm, gd };
  };
  const j2d = (jy, jm, jd) => {
    const r = jalCal(jy, true);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  };
  const d2j = (jdn) => {
    const g = d2g(jdn);
    let jy = g.gy - 621;
    const r = jalCal(jy);
    const jdn1f = g2d(g.gy, 3, r.march);
    let k = jdn - jdn1f;
    let jm;
    let jd;
    if (k >= 0) {
      if (k <= 185) {
        jm = 1 + div(k, 31);
        jd = mod(k, 31) + 1;
        return { jy, jm, jd };
      }
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) {
        k += 1;
      }
    }
    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;
    return { jy, jm, jd };
  };
  const jalaliMonthLength = (jy, jm) => {
    if (jm < 1 || jm > 12) {
      throw new Error("??? ???? ??????? ???");
    }
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return jalCal(jy).leap === 1 ? 30 : 29;
  };
  const hijriLeapYears = new Set([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]);
  const hijriMonthLength = (hy, hm) => {
    if (hm < 1 || hm > 12) {
      throw new Error("??? ???? ??????? ???");
    }
    if (hm === 12) {
      return hijriLeapYears.has(mod(hy % 30 || 30, 30)) ? 30 : 29;
    }
    return hm % 2 === 1 ? 30 : 29;
  };
  const hijriToJdn = (hy, hm, hd) => {
    return hd + Math.ceil(29.5 * (hm - 1)) + (hy - 1) * 354 + Math.floor((3 + (11 * hy)) / 30) + 1948439 - 1;
  };
  const jdnToHijri = (jdn) => {
    const jd = jdn - 1948439 + 10632;
    const n = Math.floor((jd - 1) / 10631);
    const r = jd - 10631 * n + 354;
    const q = Math.floor((10985 - r) / 5316) * Math.floor((50 * r) / 17719) + Math.floor(r / 5670) * Math.floor((43 * r) / 15238);
    const s = r - Math.floor((30 - q) / 15) * Math.floor((17719 * q) / 50) - Math.floor(q / 16) * Math.floor((15238 * q) / 43) + 29;
    const month = Math.floor((24 * s) / 709);
    const day = s - Math.floor((709 * month) / 24);
    const year = 30 * n + q - 30;
    return { hy: year, hm: month, hd: day };
  };
  const daysInGregorianMonth = (year, month) => {
    if (month < 1 || month > 12) {
      throw new Error("??? ?????? ??????? ???");
    }
    const date = new Date(Date.UTC(year, month, 0));
    if (Number.isNaN(date.getUTCDate())) {
      throw new Error("????? ?????? ??????? ???");
    }
    return date.getUTCDate();
  };
  const normalize = (calendar, year, month, day) => {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) {
      throw new Error("????? ???? ???? ????");
    }
    switch (calendar) {
      case "jalali": {
        const max = jalaliMonthLength(y, m);
        if (d < 1 || d > max) throw new Error("????? ???? ??????? ???");
        break;
      }
      case "gregorian": {
        const max = daysInGregorianMonth(y, m);
        if (d < 1 || d > max) throw new Error("????? ?????? ??????? ???");
        break;
      }
      case "hijri": {
        const max = hijriMonthLength(y, m);
        if (d < 1 || d > max) throw new Error("????? ???? ??????? ???");
        break;
      }
      default:
        throw new Error("????? ????????");
    }
    return { calendar, year: y, month: m, day: d };
  };
  const toJdn = ({ calendar, year, month, day }) => {
    if (calendar === "jalali") return j2d(year, month, day);
    if (calendar === "gregorian") return g2d(year, month, day);
    return hijriToJdn(year, month, day);
  };
  const convert = ({ calendar, year, month, day }) => {
    const normalized = normalize(calendar, year, month, day);
    const jdn = toJdn(normalized);
    return {
      jalali: d2j(jdn),
      gregorian: d2g(jdn),
      hijri: jdnToHijri(jdn)
    };
  };
  const gregorianFromInput = (input) => {
    if (input.calendar === "gregorian") {
      return { gy: input.year, gm: input.month, gd: input.day };
    }
    const jdn = toJdn(input);
    return d2g(jdn);
  };
  const calcAge = ({ calendar, year, month, day }) => {
    const normalized = normalize(calendar, year, month, day);
    const birthJdn = toJdn(normalized);
    const now = new Date();
    const today = { gy: now.getFullYear(), gm: now.getMonth() + 1, gd: now.getDate() };
    const todayJdn = g2d(today.gy, today.gm, today.gd);
    if (todayJdn < birthJdn) {
      throw new Error("????? ???? ?? ????? ???");
    }
    const birthGreg = gregorianFromInput(normalized);
    let years = today.gy - birthGreg.gy;
    let months = today.gm - birthGreg.gm;
    let days = today.gd - birthGreg.gd;
    if (days < 0) {
      months -= 1;
      const prevMonth = today.gm === 1 ? 12 : today.gm - 1;
      const prevYear = prevMonth === 12 ? today.gy - 1 : today.gy;
      days += daysInGregorianMonth(prevYear, prevMonth);
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return { years, months, days };
  };
  return { convert, calcAge };
})();
if (typeof module !== "undefined" && module.exports) {
  module.exports = converters;
}
