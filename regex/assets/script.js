(function () {
  "use strict";
  /* @logic-start */
  function flags(o) {
    return (
      (o.g ? "g" : "") +
      (o.i ? "i" : "") +
      (o.m ? "m" : "") +
      (o.s ? "s" : "") +
      (o.u ? "u" : "")
    );
  }
  function safePattern(p) {
    return typeof p === "string" && p.length <= 1000;
  }
  function explain(p) {
    let a = [];
    if (/\\d/.test(p)) a.push("\\d: " + "digits");
    if (/\\w/.test(p)) a.push("\\w: " + "word characters");
    if (/\\s/.test(p)) a.push("\\s: " + "whitespace");
    if (/\[/.test(p)) a.push("[…]: " + "character set");
    if (/[+*?{]/.test(p)) a.push("+, *, ?, {n}: " + "repetition");
    if (/[()]/.test(p)) a.push("(...): " + "group");
    if (/\^/.test(p)) a.push("^: " + "line start");
    if (/\$/.test(p)) a.push("$: " + "line end");
    return a;
  }
  function normalizeSnips(x) {
    if (!Array.isArray(x)) return [];
    return x
      .map((s) =>
        s &&
        typeof s === "object" &&
        typeof s.regex === "string" &&
        typeof s.name === "string"
          ? {
              id: Number(s.id) > 0 ? Number(s.id) : Date.now(),
              name: s.name.slice(0, 80),
              description: String(s.description || "").slice(0, 200),
              regex: s.regex.slice(0, 1000),
              flags: String(s.flags || "").replace(/[^gimsu]/g, ""),
            }
          : null,
      )
      .filter(Boolean)
      .slice(0, 50);
  }
  /* @logic-end */
  const KEY = "regex-snippets";
  let lang = "fa",
    dict = {},
    last = null,
    snips = [];
  try {
    lang = localStorage.getItem("lang") === "en" ? "en" : "fa";
  } catch (e) {}
  const $ = (id) => document.getElementById(id),
    t = (k, v) => {
      let s = (dict[lang] || dict.fa || {})[k] || k;
      if (v)
        Object.keys(v).forEach((x) => (s = s.replace("{" + x + "}", v[x])));
      return s;
    };
  const samples = {
    digits: "\\d+",
    english: "[a-zA-Z]+",
    persian: "[\\u0600-\\u06FF]+",
    email: "\\w+@\\w+\\.\\w+",
    mobile: "09\\d{9}",
    four: "\\b\\w{4}\\b",
    line: "^.*$",
    space: "\\s+",
  };
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
    renderSnips();
    renderSamples();
  }
  function status(x, c) {
    let e = $("status");
    e.textContent = x;
    e.className = c || "";
  }
  function workerCode() {
    return `onmessage=e=>{let{p,f,text}=e.data;try{let r=new RegExp(p,f.includes('g')?f:f+'g'),a=[],m,lim=1000;while((m=r.exec(text))&&a.length<lim){a.push({v:m[0],i:m.index,g:m.slice(1)});if(m[0]==='')r.lastIndex++}postMessage({a})}catch(x){postMessage({err:x.message})}}`;
  }
  async function run() {
    let p = $("pattern").value,
      txt = $("text").value,
      fl = flags({
        g: $("g").checked,
        i: $("i").checked,
        m: $("m").checked,
        s: $("s").checked,
        u: $("u").checked,
      });
    if (!safePattern(p)) {
      status(t("err_pattern"), "err");
      return;
    }
    let url = URL.createObjectURL(
        new Blob([workerCode()], { type: "text/javascript" }),
      ),
      w = new Worker(url),
      done = false;
    let timer = setTimeout(() => {
      if (!done) {
        w.terminate();
        status(t("timeout"), "err");
      }
    }, 500);
    w.onmessage = (e) => {
      done = true;
      clearTimeout(timer);
      w.terminate();
      URL.revokeObjectURL(url);
      if (e.data.err) {
        status(t("err_regex", { e: e.data.err }), "err");
        return;
      }
      last = { p, txt, fl, a: e.data.a };
      status(t("matches", { n: e.data.a.length }), "ok");
      render();
    };
    w.postMessage({ p, f: fl, text: txt });
  }
  function render() {
    let b = $("matches"),
      h = $("highlight"),
      e = $("explain");
    b.textContent = "";
    h.textContent = "";
    e.textContent = "";
    if (!last) return;
    let pos = 0;
    last.a.forEach((m, i) => {
      let d = document.createElement("div");
      d.className = "match";
      d.textContent =
        "#" +
        (i + 1) +
        " [" +
        m.i +
        "–" +
        (m.i + m.v.length) +
        "]: " +
        JSON.stringify(m.v) +
        (m.g.length
          ? " | " +
            m.g
              .map((x, j) => "$" + (j + 1) + "=" + JSON.stringify(x))
              .join(", ")
          : "");
      b.append(d);
      h.append(document.createTextNode(last.txt.slice(pos, m.i)));
      let q = document.createElement("span");
      q.className = "hl";
      q.textContent = m.v;
      h.append(q);
      pos = m.i + m.v.length;
    });
    h.append(document.createTextNode(last.txt.slice(pos)));
    if (!last.a.length) h.textContent = last.txt || t("none");
    let n = document.createElement("div");
    n.className = "node";
    n.textContent = "/" + last.p + "/" + last.fl;
    e.append(n);
    explain(last.p).forEach((x) => {
      let q = document.createElement("div");
      q.className = "node";
      q.textContent = x;
      e.append(q);
    });
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(snips));
    } catch (e) {}
  }
  function renderSnips() {
    let b = $("snips");
    b.textContent = "";
    if (!snips.length) {
      let p = document.createElement("p");
      p.className = "none";
      p.textContent = t("empty");
      b.append(p);
      return;
    }
    snips.forEach((s) => {
      let d = document.createElement("div");
      d.className = "snippet";
      let x = document.createElement("div");
      x.textContent = s.name + " — /" + s.regex + "/" + s.flags;
      let a = document.createElement("div");
      let u = document.createElement("button");
      u.className = "btn";
      u.textContent = t("use");
      u.onclick = () => {
        $("pattern").value = s.regex;
        for (const k of "gimsu") $(k).checked = s.flags.includes(k);
        run();
      };
      let z = document.createElement("button");
      z.className = "btn";
      z.textContent = t("delete");
      z.onclick = () => {
        snips = snips.filter((x) => x !== s);
        save();
        renderSnips();
      };
      a.append(u, z);
      d.append(x, a);
      b.append(d);
    });
  }
  function renderSamples() {
    let b = $("samples");
    b.textContent = "";
    for (const [k, p] of Object.entries(samples)) {
      let x = document.createElement("button");
      x.className = "chip";
      x.textContent = t("sample_" + k);
      x.onclick = () => {
        $("pattern").value = p;
        run();
      };
      b.append(x);
    }
  }
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    try {
      snips = normalizeSnips(JSON.parse(localStorage.getItem(KEY)));
    } catch (e) {}
    apply();
    $("test").onclick = run;
    $("clear").onclick = () => {
      $("pattern").value = "";
      $("text").value = "";
      last = null;
      ["matches", "highlight", "explain"].forEach(
        (x) => ($(x).textContent = ""),
      );
      status("");
    };
    $("save").onclick = () => {
      if (!$("pattern").value) {
        status(t("err_pattern"), "err");
        return;
      }
      $("dialog").showModal();
      $("snipName").focus();
    };
    $("dialog").addEventListener("close", () => {
      if ($("dialog").returnValue === "ok") {
        let n = $("snipName").value.trim();
        if (n) {
          snips.unshift({
            id: Date.now(),
            name: n,
            description: $("snipDesc").value,
            regex: $("pattern").value,
            flags: flags({
              g: $("g").checked,
              i: $("i").checked,
              m: $("m").checked,
              s: $("s").checked,
              u: $("u").checked,
            }),
          });
          snips = snips.slice(0, 50);
          save();
          renderSnips();
        }
        $("snipName").value = "";
        $("snipDesc").value = "";
      }
    });
    let ti;
    ["pattern", "text"].forEach((id) =>
      $(id).addEventListener("input", () => {
        clearTimeout(ti);
        ti = setTimeout(run, 350);
      }),
    );
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
      if (last) render();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
