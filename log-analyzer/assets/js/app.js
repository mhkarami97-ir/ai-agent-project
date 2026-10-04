(function () {
  "use strict";
  /* @logic-start */
  function level(s) {
    s = String(s).toUpperCase();
    return /\b(?:ERROR|FATAL|EXCEPTION)\b/.test(s)
      ? "error"
      : /\b(?:WARN|WARNING)\b/.test(s)
        ? "warn"
        : /\bINFO\b/.test(s)
          ? "info"
          : /\b(?:DEBUG|TRACE)\b/.test(s)
            ? "debug"
            : "other";
  }
  function dateOf(s) {
    let m = /\b\d{4}[-/]\d{2}[-/]\d{2}\b/.exec(s);
    return m ? m[0] : "other";
  }
  function sourceOf(s) {
    let m = /\[([^\]]{1,80})\]/.exec(s);
    return m ? m[1] : "other";
  }
  function parse(content, isJson) {
    if (!isJson)
      return String(content)
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .filter((x) => x !== "");
    let x = JSON.parse(content);
    return Array.isArray(x)
      ? x.map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
      : String(JSON.stringify(x, null, 2)).split("\n");
  }
  function stats(a) {
    let o = { total: a.length, error: 0, warn: 0, info: 0, debug: 0, other: 0 };
    a.forEach((x) => o[level(x)]++);
    return o;
  }
  function filter(a, q, l) {
    q = q.toLowerCase();
    return a.filter(
      (x) =>
        (!q || x.toLowerCase().includes(q)) && (l === "all" || level(x) === l),
    );
  }
  function groups(a, k) {
    let o = {};
    a.forEach((x) => {
      let q =
        k === "level"
          ? level(x)
          : k === "date"
            ? dateOf(x)
            : k === "source"
              ? sourceOf(x)
              : "all";
      (o[q] = o[q] || []).push(x);
    });
    return o;
  }
  /* @logic-end */
  let lang = "fa",
    dict = {},
    lines = [],
    name = "",
    wrap = false;
  try {
    lang = localStorage.getItem("lang") === "en" ? "en" : "fa";
  } catch (e) {}
  const $ = (id) => document.getElementById(id),
    t = (k) => (dict[lang] || dict.fa || {})[k] || k;
  function toast(x, b) {
    let e = $("toast");
    e.textContent = x;
    e.style.background = b ? "#b91c1c" : "#111827";
    e.hidden = false;
    clearTimeout(toast.t);
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
    render();
  }
  function cls(x) {
    return level(x);
  }
  function worker() {
    return `onmessage=e=>{try{let r=new RegExp(e.data.p,'gi'),a=[];for(let i=0;i<e.data.l.length&&a.length<10000;i++){r.lastIndex=0;if(r.test(e.data.l[i]))a.push(i)}postMessage({a})}catch(x){postMessage({err:x.message})}}`;
  }
  async function render() {
    let a = filter(lines, $("search").value, $("level").value),
      p = $("regex").value.trim();
    if (p) {
      let u = URL.createObjectURL(
          new Blob([worker()], { type: "text/javascript" }),
        ),
        w = new Worker(u),
        done = false;
      let rr = await new Promise((r) => {
        let z = setTimeout(() => {
          if (!done) {
            w.terminate();
            r({ timeout: true });
          }
        }, 500);
        w.onmessage = (e) => {
          done = true;
          clearTimeout(z);
          w.terminate();
          URL.revokeObjectURL(u);
          r(e.data);
        };
        w.postMessage({ p, l: a });
      });
      if (rr.err) {
        toast(rr.err, true);
        return;
      }
      if (rr.timeout) {
        toast(t("timeout"), true);
        return;
      }
      a = rr.a.map((i) => a[i]);
    }
    let st = stats(lines);
    for (const k of ["total", "error", "warn", "info", "debug"])
      $(k).textContent = st[k];
    let b = $("log");
    b.textContent = "";
    b.className = "log " + (wrap ? "wrap" : "");
    let g =
      $("group").value === "none" ? { all: a } : groups(a, $("group").value);
    for (const [key, ls] of Object.entries(g)) {
      let d = document.createElement("details");
      d.className = "group";
      d.open = true;
      let s = document.createElement("summary");
      s.textContent = key + " (" + ls.length + ")";
      d.append(s);
      ls.forEach((x) => {
        let q = document.createElement("div");
        q.className = "line " + cls(x);
        q.textContent = x;
        d.append(q);
      });
      b.append(d);
    }
    if (!a.length) b.textContent = t("none");
  }
  async function load(f) {
    if (!f || f.size > 10 * 1024 * 1024) {
      toast(t("badfile"), true);
      return;
    }
    try {
      let s = await f.text();
      lines = parse(s, /\.json$/i.test(f.name));
      name = f.name;
      $("fileInfo").textContent = name + " · " + lines.length;
      $("work").hidden = false;
      render();
    } catch (e) {
      toast(t("badfile"), true);
    }
  }
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    apply();
    $("file").onchange = (e) => load(e.target.files[0]);
    let d = $("drop");
    ["dragover", "dragenter"].forEach((x) =>
      d.addEventListener(x, (e) => {
        e.preventDefault();
        d.classList.add("over");
      }),
    );
    ["dragleave", "drop"].forEach((x) =>
      d.addEventListener(x, (e) => {
        e.preventDefault();
        d.classList.remove("over");
      }),
    );
    d.addEventListener("drop", (e) => load(e.dataTransfer.files[0]));
    ["search", "level", "group", "regex"].forEach((x) =>
      $(x).addEventListener(
        x === "level" || x === "group" ? "change" : "input",
        () => {
          clearTimeout(window.x);
          window.x = setTimeout(render, 300);
        },
      ),
    );
    $("wrap").onclick = () => {
      wrap = !wrap;
      render();
    };
    $("copy").onclick = async () => {
      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        toast(t("copied"));
      } catch (e) {
        toast(t("copyfail"), true);
      }
    };
    $("export").onclick = () => {
      let u = URL.createObjectURL(
          new Blob(
            [
              JSON.stringify(
                { fileName: name, stats: stats(lines), logs: lines },
                null,
                2,
              ),
            ],
            { type: "application/json" },
          ),
        ),
        a = document.createElement("a");
      a.href = u;
      a.download = "log-analysis.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    $("save").onclick = () => {
      try {
        localStorage.setItem(
          "logAnalyzerLast",
          JSON.stringify({ name, lines }),
        );
        toast(t("saved"));
      } catch (e) {
        toast(t("savefail"), true);
      }
    };
    $("load").onclick = () => {
      try {
        let x = JSON.parse(localStorage.getItem("logAnalyzerLast"));
        if (x) {
          name = x.name;
          lines = x.lines;
          $("work").hidden = false;
          render();
          toast(t("loaded"));
        }
      } catch (e) {
        toast(t("none"), true);
      }
    };
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
