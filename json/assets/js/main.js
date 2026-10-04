(function () {
  "use strict";
  /* @logic-start */
  function errInfo(text, e) {
    let m = /position (\d+)/i.exec(e.message);
    let p = m ? +m[1] : null;
    if (p === null) {
      let q = /line (\d+) column (\d+)/i.exec(e.message);
      return q
        ? { pos: null, line: +q[1], col: +q[2], msg: e.message }
        : { pos: null, line: null, col: null, msg: e.message };
    }
    let before = text.slice(0, p),
      line = before.split("\n").length,
      col = p - (before.lastIndexOf("\n") + 1) + 1;
    return { pos: p, line, col, msg: e.message };
  }
  function stats(v) {
    let n = 0,
      d = 0,
      max = 0;
    const walk = (x, l) => {
      n++;
      max = Math.max(max, l);
      if (x && typeof x === "object") {
        d += Array.isArray(x) ? x.length : Object.keys(x).length;
        Object.values(x).forEach((y) => walk(y, l + 1));
      }
    };
    walk(v, 0);
    return { nodes: n, children: d, depth: max };
  }
  function limit(v, maxDepth, maxNodes) {
    let count = 0;
    function w(x, d) {
      count++;
      if (count > maxNodes) return { tr: true };
      if (d >= maxDepth && x && typeof x === "object") return { tr: true };
      if (Array.isArray(x)) return x.map((y) => w(y, d + 1));
      if (x && typeof x === "object") {
        let o = {};
        for (const k of Object.keys(x)) {
          o[k] = w(x[k], d + 1);
          if (count > maxNodes) break;
        }
        return o;
      }
      return x;
    }
    return w(v, 0);
  }
  function primitive(x) {
    return x === null
      ? "null"
      : typeof x === "string"
        ? JSON.stringify(x)
        : String(x);
  }
  function wordCount(s) {
    return (String(s).match(/[\p{L}\p{N}]+/gu) || []).length;
  }
  /* @logic-end */
  const KEY = "json-formatter-input",
    MAX = 1000000;
  let lang = "fa",
    dict = {},
    current = null,
    timer;
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
      new Intl.NumberFormat(lang === "fa" ? "fa-IR" : "en-US").format(n);
  function toast(x, b) {
    let e = $("toast");
    e.textContent = x;
    e.style.background = b ? "#b91c1c" : "#111827";
    e.hidden = false;
    clearTimeout(toast.x);
    toast.t = setTimeout(() => (e.hidden = true), 2500);
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
    counts();
    if (current !== null) tree(current);
  }
  function counts() {
    let s = $("input").value;
    $("counts").textContent = t("counts", {
      c: nf(Array.from(s).length),
      w: nf(wordCount(s)),
    });
  }
  function store() {
    try {
      let v = $("input").value;
      if (v) localStorage.setItem(KEY, v);
      else localStorage.removeItem(KEY);
    } catch (e) {
      toast(t("err_save"), true);
    }
  }
  function status(x, cls) {
    let e = $("status");
    e.textContent = x;
    e.className = cls || "";
  }
  function parse(show) {
    let s = $("input").value;
    if (!s.trim()) {
      status(t("err_empty"), "err");
      return null;
    }
    if (s.length > MAX) {
      status(t("err_big", { n: nf(MAX) }), "err");
      return null;
    }
    try {
      let x = JSON.parse(s);
      if (show) {
        current = x;
        tree(x);
      }
      return x;
    } catch (e) {
      let z = errInfo(s, e);
      status(
        z.line
          ? t("invalid_at", { l: nf(z.line), c: nf(z.col) })
          : t("invalid"),
        "err",
      );
      return null;
    }
  }
  function val(x) {
    let e = document.createElement("span");
    if (x === null) {
      e.className = "nil";
      e.textContent = "null";
    } else if (typeof x === "string") {
      e.className = "str";
      e.textContent = JSON.stringify(x);
    } else if (typeof x === "number") {
      e.className = "num";
      e.textContent = String(x);
    } else {
      e.className = "bool";
      e.textContent = String(x);
    }
    return e;
  }
  function tree(x) {
    let root = $("tree");
    root.textContent = "";
    let y = limit(x, 30, 10000);
    function node(v, key) {
      if (v && typeof v === "object" && !v.tr) {
        let d = document.createElement("details");
        d.className = "node";
        d.open = true;
        let sum = document.createElement("summary");
        if (key !== null) {
          let k = document.createElement("span");
          k.className = "key";
          k.textContent = JSON.stringify(key) + ": ";
          sum.append(k);
        }
        sum.append(
          document.createTextNode(
            Array.isArray(v)
              ? "[" + v.length + "]"
              : "{" + Object.keys(v).length + "}",
          ),
        );
        d.append(sum);
        if (Array.isArray(v)) v.forEach((z, i) => d.append(node(z, String(i))));
        else Object.keys(v).forEach((k) => d.append(node(v[k], k)));
        return d;
      }
      let p = document.createElement("div");
      p.className = "leaf";
      if (key !== null) {
        let k = document.createElement("span");
        k.className = "key";
        k.textContent = JSON.stringify(key) + ": ";
        p.append(k);
      }
      if (v && v.tr) {
        let q = document.createElement("span");
        q.className = "trunc";
        q.textContent = t("truncated");
        p.append(q);
      } else p.append(val(v));
      return p;
    }
    root.append(node(y, null));
  }
  function format() {
    let x = parse(true);
    if (x === null) return;
    $("input").value = JSON.stringify(x, null, 2);
    store();
    counts();
    status(t("formatted"), "ok");
    $("copy").disabled = false;
  }
  function validate() {
    let x = parse(true);
    if (x === null) return;
    status(t("valid", { n: nf(stats(x).nodes), d: nf(stats(x).depth) }), "ok");
    $("copy").disabled = false;
  }
  function minify() {
    let x = parse(true);
    if (x === null) return;
    $("input").value = JSON.stringify(x);
    store();
    counts();
    status(t("minified"), "ok");
    $("copy").disabled = false;
  }
  async function copy() {
    let s = $("input").value;
    try {
      await navigator.clipboard.writeText(s);
      toast(t("copied"));
    } catch (e) {
      let a = document.createElement("textarea");
      a.value = s;
      document.body.append(a);
      a.select();
      document.execCommand("copy");
      a.remove();
      toast(t("copied"));
    }
  }
  const samples = {
    object: { service: "سرویس من", items: [1, 2, 3], active: true },
    array: [
      { id: 1, done: false },
      { id: 2, done: true },
    ],
    nested: {
      name: "فروشگاه",
      products: [
        { id: "a1", price: 9900 },
        { id: "b2", price: 12500 },
      ],
      meta: { owner: null, opened: true },
    },
  };
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    try {
      $("input").value = localStorage.getItem(KEY) || "";
    } catch (e) {}
    apply();
    counts();
    $("format").onclick = format;
    $("validate").onclick = validate;
    $("minify").onclick = minify;
    $("copy").onclick = copy;
    $("clear").onclick = () => {
      $("input").value = "";
      current = null;
      $("tree").textContent = "";
      status("");
      store();
      counts();
      $("copy").disabled = true;
    };
    document.querySelectorAll(".chip").forEach(
      (b) =>
        (b.onclick = () => {
          $("input").value = JSON.stringify(samples[b.dataset.sample], null, 2);
          store();
          counts();
          validate();
        }),
    );
    $("expand").onclick = () =>
      document
        .querySelectorAll("#tree details")
        .forEach((x) => (x.open = true));
    $("collapse").onclick = () =>
      document
        .querySelectorAll("#tree details")
        .forEach((x) => (x.open = false));
    $("input").addEventListener("input", () => {
      counts();
      clearTimeout(timer);
      timer = setTimeout(() => {
        store();
        parse(true);
      }, 400);
    });
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
