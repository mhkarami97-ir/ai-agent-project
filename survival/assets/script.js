(function () {
  "use strict";
  /* @logic-start */
  const P = "۰۱۲۳۴۵۶۷۸۹",
    A = "٠١٢٣٤٥٦٧٨٩";
  function norm(s) {
    return String(s ?? "")
      .replace(/[۰-۹]/g, (d) => P.indexOf(d))
      .replace(/[٠-٩]/g, (d) => A.indexOf(d));
  }
  function num(v, min, max, integer) {
    let s = norm(v).replace(/٫/g, ".").trim();
    if (!/^\d*\.?\d+$/.test(s)) return null;
    let n = Number(s);
    if (!Number.isFinite(n) || n < min || n > max) return null;
    return integer ? Math.round(n) : n;
  }
  function calc(x) {
    return {
      water: x.people * x.days * x.water,
      food: x.people * x.days * x.food,
      medicine: x.people * x.days * x.medicine,
    };
  }
  function rnd(n) {
    return Math.round(n * 100) / 100;
  }
  function normalize(raw) {
    if (!raw || typeof raw !== "object") return null;
    let p = num(raw.people, 1, 10000, true),
      d = num(raw.days, 1, 3650, true),
      w = num(raw.waterPerDay, 0, 1000, false),
      f = num(raw.foodPerDay, 0, 1000, false),
      m = num(raw.medicinePerDay, 0, 10000, false);
    if ([p, d, w, f, m].some((v) => v === null)) return null;
    let dt = new Date(raw.date || raw.ts);
    return {
      id: Number(raw.id) > 0 ? Number(raw.id) : 0,
      name: String(raw.name || "")
        .trim()
        .slice(0, 100),
      ts: isNaN(dt) ? 0 : dt.getTime(),
      people: p,
      days: d,
      waterPerDay: w,
      foodPerDay: f,
      medicinePerDay: m,
      water: rnd(p * d * w),
      food: rnd(p * d * f),
      medicine: rnd(p * d * m),
    };
  }
  function history(raw) {
    if (!Array.isArray(raw)) return [];
    let seen = {};
    return raw
      .map((x, i) => {
        let y = normalize(x);
        if (!y) return null;
        if (!y.id) y.id = Date.now() + i;
        while (seen[y.id]) y.id++;
        seen[y.id] = 1;
        return y;
      })
      .filter(Boolean)
      .slice(0, 50);
  }
  /* @logic-end */
  const KEY = "survivalCalculations";
  let lang = "fa",
    dict = {},
    last = null,
    list = [];
  try {
    lang = localStorage.getItem("lang") === "en" ? "en" : "fa";
  } catch (e) {}
  const $ = (id) => document.getElementById(id),
    t = (k, v) => {
      let s = (dict[lang] || dict.fa || {})[k] || k;
      if (v)
        Object.keys(v).forEach((x) => (s = s.replace("{" + x + "}", v[x])));
      return s;
    },
    nf = (n) =>
      new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US", {
        maximumFractionDigits: 2,
      }).format(n);
  function toast(x, b) {
    let e = $("toast");
    e.textContent = x;
    e.hidden = false;
    e.style.background = b ? "#b91c1c" : "#111827";
    clearTimeout(toast.x);
    toast.x = setTimeout(() => (e.hidden = true), 2500);
  }
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document
      .querySelectorAll("[data-i18n]")
      .forEach((e) => (e.textContent = t(e.dataset.i18n)));
    document
      .querySelectorAll("[data-i18n-placeholder]")
      .forEach((e) => (e.placeholder = t(e.dataset.i18nPlaceholder)));
    document.title = t("title");
    renderHistory();
  }
  function values() {
    let x = {
      people: num($("people").value, 1, 10000, true),
      days: num($("days").value, 1, 3650, true),
      water: num($("water").value, 0, 1000, false),
      food: num($("food").value, 0, 1000, false),
      medicine: num($("medicine").value, 0, 10000, false),
    };
    return Object.values(x).some((v) => v === null) ? null : x;
  }
  function compute() {
    let x = values();
    if (!x) {
      toast(t("err_values"), true);
      return;
    }
    let r = calc(x);
    last = Object.assign({}, x, r);
    $("rwater").textContent = nf(r.water);
    $("rfood").textContent = nf(r.food);
    $("rmed").textContent = nf(r.medicine);
    $("results").hidden = false;
    $("results").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
  function save() {
    if (!last) {
      toast(t("err_calc"), true);
      return;
    }
    let id = Date.now();
    while (list.some((x) => x.id === id)) id++;
    list.unshift(
      Object.assign({ id, name: $("name").value.trim(), ts: Date.now() }, last),
    );
    list = list.slice(0, 50);
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      toast(t("err_save"), true);
      return;
    }
    $("name").value = "";
    renderHistory();
    toast(t("saved"));
  }
  function renderHistory() {
    let box = $("history");
    box.textContent = "";
    $("clear").hidden = !list.length;
    if (!list.length) {
      let p = document.createElement("p");
      p.className = "none";
      p.textContent = t("empty");
      box.append(p);
      return;
    }
    list.forEach((x) => {
      let a = document.createElement("article");
      a.className = "hist-item";
      let n = document.createElement("div");
      n.className = "hist-name";
      n.textContent = x.name || t("unnamed");
      let d = document.createElement("div");
      d.className = "hist-date";
      d.textContent = x.ts
        ? new Date(x.ts).toLocaleString(lang === "fa" ? "fa-IR" : "en-US")
        : "";
      let m = document.createElement("div");
      m.className = "hist-meta";
      m.textContent = t("hist_info", { p: nf(x.people), d: nf(x.days) });
      let r = document.createElement("div");
      r.className = "hist-results";
      r.textContent =
        "💧 " +
        nf(x.water) +
        " " +
        t("unit_l") +
        " · 🍞 " +
        nf(x.food) +
        " " +
        t("unit_kg") +
        " · 💊 " +
        nf(x.medicine) +
        " " +
        t("unit_u");
      let b = document.createElement("button");
      b.className = "btn danger small";
      b.textContent = t("delete");
      b.onclick = () => {
        list = list.filter((y) => y !== x);
        localStorage.setItem(KEY, JSON.stringify(list));
        renderHistory();
      };
      a.append(n, d, m, r, b);
      box.append(a);
    });
  }
  async function clearAll() {
    if (!list.length) return;
    let d = $("confirm");
    $("confirmtext").textContent = t("confirm");
    let ok = await new Promise((r) => {
      let f = () => {
        d.removeEventListener("close", f);
        r(d.returnValue === "yes");
      };
      d.addEventListener("close", f);
      d.showModal();
    });
    if (ok) {
      list = [];
      localStorage.removeItem(KEY);
      renderHistory();
    }
  }
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    try {
      list = history(JSON.parse(localStorage.getItem(KEY)));
    } catch (e) {}
    apply();
    $("calc").onclick = compute;
    $("save").onclick = save;
    $("clear").onclick = clearAll;
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && /INPUT/.test(e.target.tagName)) {
        e.preventDefault();
        e.target.id === "name" ? save() : compute();
      }
    });
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
