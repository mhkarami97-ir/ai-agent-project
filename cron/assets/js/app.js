(function () {
  "use strict";
  /* @logic-start */
  const R = [
    [0, 59],
    [0, 23],
    [1, 31],
    [1, 12],
    [0, 6],
  ];
  function atom(s, min, max) {
    let a = new Set();
    for (const part of s.split(",")) {
      let m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
      if (!m) throw Error("syntax");
      let step = m[2] ? +m[2] : 1;
      if (step < 1) throw Error("step");
      let [lo, hi] =
        m[1] === "*"
          ? [min, max]
          : m[1].includes("-")
            ? m[1].split("-").map(Number)
            : [+m[1], +m[1]];
      if (lo < min || hi > max || lo > hi) throw Error("range");
      for (let i = lo; i <= hi; i += step) a.add(i);
    }
    return a;
  }
  function parse(s) {
    let p = String(s).trim().split(/\s+/);
    if (p.length !== 5) throw Error("fields");
    return p.map((x, i) => atom(x, R[i][0], R[i][1]));
  }
  function match(d, p) {
    let vals = [
      d.getMinutes(),
      d.getHours(),
      d.getDate(),
      d.getMonth() + 1,
      d.getDay(),
    ];
    return p.every((x, i) => x.has(vals[i]));
  }
  function nextRuns(s, from, count = 5) {
    let p = parse(s),
      d = new Date(from);
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1);
    let out = [];
    for (let i = 0; i < 527040 && out.length < count; i++) {
      if (match(d, p)) out.push(new Date(d));
      d.setMinutes(d.getMinutes() + 1);
    }
    return out;
  }
  function normJob(x) {
    if (!x || typeof x !== "object") return null;
    let name = String(x.name || "")
        .trim()
        .slice(0, 80),
      ex = String(x.cronExpression || x.expr || "").trim();
    if (!name) return null;
    try {
      parse(ex);
    } catch (e) {
      return null;
    }
    let d = new Date(x.createdAt);
    return {
      id: String(x.id || Date.now() + Math.random()),
      name,
      cronExpression: ex,
      description: String(x.description || "")
        .trim()
        .slice(0, 300),
      isActive: x.isActive !== false,
      createdAt: isNaN(d) ? new Date().toISOString() : d.toISOString(),
    };
  }
  function jobs(raw) {
    if (!Array.isArray(raw)) return [];
    let seen = {};
    return raw
      .map(normJob)
      .filter((x) => {
        if (!x) return false;
        while (seen[x.id]) x.id += "x";
        seen[x.id] = 1;
        return true;
      })
      .slice(0, 100);
  }
  /* @logic-end */
  const JK = "cronJobs",
    HK = "cronHistory";
  let lang = "fa",
    dict = {},
    list = [],
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
      localStorage.setItem(JK, JSON.stringify(list));
      localStorage.setItem(HK, JSON.stringify(hist.slice(0, 100)));
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
    toast.t = setTimeout(() => (e.hidden = true), 2500);
  }
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document
      .querySelectorAll("[data-i18n]")
      .forEach((e) => (e.textContent = t(e.dataset.i18n)));
    document.title = t("title");
    render();
  }
  function preview() {
    let e = $("expr").value.trim(),
      b = $("runs"),
      d = $("desc");
    b.textContent = "";
    if (!e) {
      d.textContent = "";
      return;
    }
    try {
      let r = nextRuns(e, new Date(), 5);
      d.textContent = t("valid");
      r.forEach((x) => {
        let q = document.createElement("div");
        q.className = "run";
        q.textContent = fmt(x);
        b.append(q);
      });
    } catch (x) {
      d.textContent = t("invalid");
    }
  }
  function render() {
    let b = $("jobs");
    b.textContent = "";
    if (!list.length) {
      let p = document.createElement("p");
      p.className = "none";
      p.textContent = t("empty");
      b.append(p);
    } else
      list.forEach((j) => {
        let d = document.createElement("div");
        d.className = "job " + (j.isActive ? "" : "off");
        let top = document.createElement("div");
        top.className = "jobtop";
        let n = document.createElement("span");
        n.className = "jobname";
        n.textContent = j.name;
        let c = document.createElement("code");
        c.className = "cron";
        c.textContent = j.cronExpression;
        top.append(n, c);
        d.append(top);
        let m = document.createElement("div");
        m.className = "meta";
        m.textContent =
          (j.isActive ? t("active") : t("inactive")) +
          " · " +
          (j.description || "") +
          " · " +
          t("next") +
          ": " +
          (j.isActive && nextRuns(j.cronExpression, new Date(), 1)[0]
            ? fmt(nextRuns(j.cronExpression, new Date(), 1)[0])
            : "—");
        d.append(m);
        let a = document.createElement("div");
        a.className = "jobactions";
        [
          ["toggle", j.isActive ? "disable" : "enable", ""],
          ["delete", "delete", "danger"],
        ].forEach((x) => {
          let q = document.createElement("button");
          q.className = "btn small " + x[2];
          q.textContent = t(x[1]);
          q.onclick = () => {
            if (x[0] === "toggle") {
              j.isActive = !j.isActive;
              log(j.name, t(j.isActive ? "enable" : "disable"));
              save();
              render();
            } else del(j);
          };
          a.append(q);
        });
        d.append(a);
        b.append(d);
      });
    let h = $("hist");
    h.textContent = "";
    if (!hist.length) {
      let p = document.createElement("p");
      p.className = "none";
      p.textContent = t("emptyhist");
      h.append(p);
    } else
      hist.forEach((x) => {
        let q = document.createElement("div");
        q.className = "hist";
        q.textContent = x.name + " — " + x.action + " · " + fmt(x.ts);
        h.append(q);
      });
  }
  function log(n, a) {
    hist.unshift({ name: n, action: a, ts: Date.now() });
  }
  async function confirm(x) {
    let d = $("confirm");
    $("confirmtext").textContent = x;
    return await new Promise((r) => {
      let f = () => {
        d.removeEventListener("close", f);
        r(d.returnValue === "yes");
      };
      d.addEventListener("close", f);
      d.showModal();
    });
  }
  async function del(j) {
    if (await confirm(t("confirmdel", { n: j.name }))) {
      list = list.filter((x) => x !== j);
      log(j.name, t("delete"));
      save();
      render();
    }
  }
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    try {
      list = jobs(JSON.parse(localStorage.getItem(JK)));
    } catch (e) {}
    try {
      hist = JSON.parse(localStorage.getItem(HK)) || [];
    } catch (e) {}
    apply();
    $("expr").oninput = preview;
    $("form").onsubmit = (e) => {
      e.preventDefault();
      try {
        parse($("expr").value);
        let j = normJob({
          id: Date.now(),
          name: $("name").value,
          cronExpression: $("expr").value,
          description: $("note").value,
          isActive: $("active").checked,
          createdAt: new Date(),
        });
        list.unshift(j);
        log(j.name, t("created"));
        save();
        e.target.reset();
        $("active").checked = true;
        preview();
        render();
        toast(t("created"));
      } catch (x) {
        toast(t("invalid"), true);
      }
    };
    $("reset").onclick = () => {
      $("form").reset();
      preview();
    };
    $("clear").onclick = async () => {
      if (await confirm(t("confirmall"))) {
        list = [];
        save();
        render();
      }
    };
    $("clearhist").onclick = async () => {
      if (await confirm(t("confirmhist"))) {
        hist = [];
        save();
        render();
      }
    };
    $("export").onclick = () => {
      let u = URL.createObjectURL(
          new Blob([JSON.stringify(list, null, 2)], {
            type: "application/json",
          }),
        ),
        a = document.createElement("a");
      a.href = u;
      a.download = "cron-jobs.json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(u), 1000);
    };
    $("import").onclick = () => $("file").click();
    $("file").onchange = (e) => {
      let f = e.target.files[0];
      if (!f) return;
      let r = new FileReader();
      r.onload = () => {
        try {
          let x = jobs(JSON.parse(r.result));
          if (!x.length) throw Error();
          list = x;
          log("system", t("imported"));
          save();
          render();
          toast(t("imported"));
        } catch (q) {
          toast(t("badimport"), true);
        }
      };
      r.readAsText(f);
      e.target.value = "";
    };
    $("confirm").onclick = (e) => {
      if (e.target === $("confirm")) $("confirm").close();
    };
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
