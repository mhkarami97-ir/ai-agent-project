(function () {
  "use strict";
  /* @logic-start */
  function hostOf(raw) {
    let s = String(raw ?? "").trim();
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = "https://" + s;
    let u;
    try {
      u = new URL(s);
    } catch (e) {
      return null;
    }
    if (!/^https?:$/.test(u.protocol) || !u.hostname) return null;
    let h = u.hostname.toLowerCase().replace(/\.$/, "");
    if (h.length > 253 || h.split(".").some((x) => !x || x.length > 63))
      return null;
    return h;
  }
  function probeResult(scheme, ok, ms, reason) {
    return { scheme, ok, ms, reason };
  }
  function classify(r) {
    let h = r.https,
      o = r.http;
    if (h.ok) return { level: "unknown", key: "reachable_request" };
    if (typeof navigator !== "undefined" && !navigator.onLine)
      return { level: "offline", key: "offline" };
    if (!h.ok && o.ok) return { level: "limited", key: "http_only" };
    return { level: "unknown", key: "inconclusive" };
  }
  function normSites(raw) {
    if (!Array.isArray(raw)) return [];
    let seen = {};
    return raw
      .map((x) => {
        let h = hostOf(x && x.url);
        if (!h || seen[h]) return null;
        seen[h] = 1;
        let d = new Date(x.date);
        return { url: h, ts: isNaN(d) ? 0 : d.getTime() };
      })
      .filter(Boolean)
      .slice(0, 100);
  }
  function normHist(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) => {
        let h = hostOf(x && x.url);
        if (!h) return null;
        let d = new Date(x.date);
        return {
          url: h,
          ts: isNaN(d) ? 0 : d.getTime(),
          https: x.https || null,
          http: x.http || null,
          level: typeof x.level === "string" ? x.level : "unknown",
          key: typeof x.key === "string" ? x.key : "inconclusive",
        };
      })
      .filter(Boolean)
      .slice(0, 50);
  }
  /* @logic-end */
  const SK = "siteChecker_savedSites",
    HK = "siteChecker_history";
  let lang = "fa",
    dict = {},
    cur = null,
    sites = [],
    hist = [];
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
    fmt = (d) => new Date(d).toLocaleString(lang === "fa" ? "fa-IR" : "en-US");
  function save() {
    try {
      localStorage.setItem(
        SK,
        JSON.stringify(
          sites.map((x) => ({
            url: x.url,
            date: new Date(x.ts).toISOString(),
          })),
        ),
      );
      localStorage.setItem(
        HK,
        JSON.stringify(
          hist.map((x) =>
            Object.assign({}, x, { date: new Date(x.ts).toISOString() }),
          ),
        ),
      );
    } catch (e) {
      toast(t("err_save"), true);
    }
  }
  function toast(x, b) {
    let e = $("toast");
    e.textContent = x;
    e.style.background = b ? "#b91c1c" : "#111827";
    e.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (e.hidden = true), 2800);
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
    renderSites();
    renderHist();
    if (cur) show(cur);
  }
  async function probe(scheme, host) {
    let ctl = new AbortController(),
      start = performance.now(),
      timer = setTimeout(() => ctl.abort(), 10000);
    try {
      await fetch(scheme + "://" + host + "/?_sc=" + Date.now(), {
        method: "HEAD",
        mode: "no-cors",
        cache: "no-store",
        signal: ctl.signal,
      });
      return probeResult(
        scheme,
        true,
        Math.round(performance.now() - start),
        "opaque",
      );
    } catch (e) {
      return probeResult(
        scheme,
        false,
        Math.round(performance.now() - start),
        e.name === "AbortError" ? "timeout" : "network-error",
      );
    } finally {
      clearTimeout(timer);
    }
  }
  async function check(host) {
    $("check").disabled = true;
    $("check").textContent = t("checking");
    let [h, o] = await Promise.all([probe("https", host), probe("http", host)]);
    let x = { url: host, ts: Date.now(), https: h, http: o };
    Object.assign(x, classify(x));
    cur = x;
    hist.unshift(x);
    hist = hist.slice(0, 50);
    save();
    show(x);
    renderHist();
    $("check").disabled = false;
    $("check").textContent = t("button_0");
  }
  function val(r) {
    if (!r) return t("na");
    return r.ok
      ? t("request_started", { n: r.ms })
      : t(r.reason === "timeout" ? "timeout" : "request_failed", { n: r.ms });
  }
  function show(x) {
    $("result").hidden = false;
    $("host").textContent = x.url;
    $("open").href = "https://" + x.url;
    let b = $("badge");
    b.textContent = t("level_" + x.level);
    b.className =
      x.level === "offline" ? "bad" : x.level === "limited" ? "warn" : "warn";
    $("net").textContent = navigator.onLine ? t("online") : t("offline");
    $("https").textContent = val(x.https);
    $("http").textContent = val(x.http);
    $("detail").textContent = t("detail_" + x.key);
  }
  function item(x, kind) {
    let a = document.createElement("div");
    a.className = "item";
    let m = document.createElement("div");
    m.className = "item-main";
    let u = document.createElement("div");
    u.className = "url";
    u.textContent = x.url;
    let d = document.createElement("div");
    d.className = "date";
    d.textContent = x.ts ? fmt(x.ts) : "";
    m.append(u, d);
    a.append(m);
    let ac = document.createElement("div");
    ac.className = "actions";
    let c = document.createElement("button");
    c.className = "btn small";
    c.textContent = t("button_0");
    c.onclick = () => {
      $("url").value = x.url;
      check(x.url);
    };
    ac.append(c);
    if (kind === "site") {
      let r = document.createElement("button");
      r.className = "btn danger small";
      r.textContent = t("delete");
      r.onclick = () => {
        sites = sites.filter((y) => y !== x);
        save();
        renderSites();
      };
      ac.append(r);
    }
    a.append(ac);
    return a;
  }
  function renderSites() {
    let b = $("sites");
    b.textContent = "";
    $("clearSites").hidden = !sites.length;
    if (!sites.length) {
      let p = document.createElement("p");
      p.className = "none";
      p.textContent = t("empty_sites");
      b.append(p);
    } else sites.forEach((x) => b.append(item(x, "site")));
  }
  function renderHist() {
    let b = $("history");
    b.textContent = "";
    $("clearHist").hidden = !hist.length;
    if (!hist.length) {
      let p = document.createElement("p");
      p.className = "none";
      p.textContent = t("empty_hist");
      b.append(p);
    } else hist.forEach((x) => b.append(item(x, "hist")));
  }
  async function confirm(msg) {
    let d = $("confirm");
    $("confirmtext").textContent = msg;
    return await new Promise((r) => {
      let f = () => {
        d.removeEventListener("close", f);
        r(d.returnValue === "yes");
      };
      d.addEventListener("close", f);
      d.showModal();
    });
  }
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    try {
      sites = normSites(JSON.parse(localStorage.getItem(SK)));
    } catch (e) {}
    try {
      hist = normHist(JSON.parse(localStorage.getItem(HK)));
    } catch (e) {}
    apply();
    $("check").onclick = () => {
      let h = hostOf($("url").value);
      if (!h) {
        toast(t("err_url"), true);
        return;
      }
      $("url").value = h;
      check(h);
    };
    $("url").addEventListener("keydown", (e) => {
      if (e.key === "Enter") $("check").click();
    });
    $("save").onclick = () => {
      if (!cur) {
        toast(t("err_first"), true);
        return;
      }
      if (sites.some((x) => x.url === cur.url)) {
        toast(t("exists"), true);
        return;
      }
      sites.unshift({ url: cur.url, ts: Date.now() });
      save();
      renderSites();
      toast(t("saved"));
    };
    $("clearSites").onclick = async () => {
      if (await confirm(t("confirm_sites"))) {
        sites = [];
        save();
        renderSites();
      }
    };
    $("clearHist").onclick = async () => {
      if (await confirm(t("confirm_hist"))) {
        hist = [];
        save();
        renderHist();
      }
    };
    $("confirm").addEventListener("click", (e) => {
      if (e.target === e.currentTarget) e.currentTarget.close();
    });
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
