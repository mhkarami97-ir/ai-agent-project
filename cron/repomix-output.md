This file is a merged representation of the entire codebase, combined into a single document by Repomix.

# File Summary

## Purpose
This file contains a packed representation of the entire repository's contents.
It is designed to be easily consumable by AI systems for analysis, code review,
or other automated processes.

## File Format
The content is organized as follows:
1. This summary section
2. Repository information
3. Directory structure
4. Repository files (if enabled)
5. Multiple file entries, each consisting of:
  a. A header with the file path (## File: path/to/file)
  b. The full contents of the file in a code block

## Usage Guidelines
- This file should be treated as read-only. Any changes should be made to the
  original repository files, not this packed version.
- When processing this file, use the file path to distinguish
  between different files in the repository.
- Be aware that this file may contain sensitive information. Handle it with
  the same level of security as you would the original repository.

## Notes
- Some files may have been excluded based on .gitignore rules and Repomix's configuration
- Binary files are not included in this packed representation. Please refer to the Repository Structure section for a complete list of file paths, including binary files
- Files matching patterns in .gitignore are excluded
- Files matching default ignore patterns are excluded
- Files are sorted by Git change count (files with more changes are at the bottom)

# Directory Structure
```
assets/
  css/
    styles.css
  js/
    app.js
  translations.json
index.html
sample-jobs.json
```

# Files

## File: assets/css/styles.css
```css
.cr {
  --bg: #fff;
  --tx: #1b1f2a;
  --mu: #667085;
  --bd: #e2e5ee;
  --in: #fff;
  --ac: #6366f1;
  --act: #fff;
  --ok: #047857;
  --bad: #b91c1c;
  --badbg: #fee2e2;
  max-width: 900px;
  margin: auto;
  padding: 1.5rem max(1rem, env(safe-area-inset-right)) 2rem;
  color: var(--tx);
  font-family: Vazirmatn, sans-serif;
  line-height: 1.7;
}
html[data-theme="dark"] .cr {
  --bg: #181c2e;
  --tx: #e8eaf3;
  --mu: #9aa3b8;
  --bd: #2c3250;
  --in: #11152a;
  --ac: #818cf8;
  --act: #10132a;
  --ok: #6ee7b7;
  --bad: #fca5a5;
  --badbg: #5a1a1a;
}
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) .cr {
    --bg: #181c2e;
    --tx: #e8eaf3;
    --mu: #9aa3b8;
    --bd: #2c3250;
    --in: #11152a;
    --ac: #818cf8;
    --act: #10132a;
    --ok: #6ee7b7;
    --bad: #fca5a5;
    --badbg: #5a1a1a;
  }
}
body {
  margin: 0;
  background: #f4f5f9;
}
html[data-theme="dark"] body {
  background: #0f1220;
}
@media (prefers-color-scheme: dark) {
  html:not([data-theme="light"]) body {
    background: #0f1220;
  }
}
.cr h1 {
  margin: 0;
  font-size: clamp(1.5rem, 5vw, 2.2rem);
}
.cr h2 {
  margin: 0;
  font-size: 1.2rem;
}
.muted,
.hint {
  color: var(--mu);
}
.cr header {
  margin-bottom: 1rem;
}
.cr-card {
  background: var(--bg);
  border: 1px solid var(--bd);
  border-radius: 16px;
  padding: 1.25rem;
  margin: 1rem 0;
}
.cr label {
  display: block;
  font-weight: 600;
  margin: 0.7rem 0 0.3rem;
}
.input {
  width: 100%;
  min-height: 46px;
  padding: 0.55rem 0.85rem;
  font: inherit;
  font-size: 16px;
  color: var(--tx);
  background: var(--in);
  border: 1.5px solid var(--bd);
  border-radius: 10px;
}
.mono {
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
.input:focus-visible {
  outline: none;
  border-color: var(--ac);
}
textarea.input {
  resize: vertical;
}
.check {
  display: flex !important;
  align-items: center;
  gap: 0.6rem;
  min-height: 44px;
  cursor: pointer;
}
.check input {
  width: 22px;
  height: 22px;
  accent-color: var(--ac);
}
.actions,
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
}
.btn {
  min-height: 44px;
  padding: 0.4rem 1rem;
  font: inherit;
  font-weight: 700;
  color: var(--tx);
  background: transparent;
  border: 1px solid var(--bd);
  border-radius: 10px;
  cursor: pointer;
}
.primary {
  background: var(--ac);
  border-color: var(--ac);
  color: var(--act);
}
.danger {
  background: var(--badbg);
  border-color: transparent;
  color: var(--bad);
}
.small {
  min-height: 38px;
  padding: 0.2rem 0.7rem;
  font-size: 0.85rem;
}
.runs,
.list {
  display: grid;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.run,
.job,
.hist {
  padding: 0.7rem 1rem;
  border: 1px solid var(--bd);
  border-radius: 10px;
  background: var(--in);
}
.run {
  direction: ltr;
  text-align: left;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.85rem;
}
.job {
  border-inline-start: 5px solid var(--ac);
}
.job.off {
  opacity: 0.6;
}
.jobtop {
  display: flex;
  justify-content: space-between;
  gap: 0.6rem;
  align-items: center;
}
.jobname {
  font-weight: 700;
}
.cron {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  color: var(--ac);
  direction: ltr;
}
.meta {
  color: var(--mu);
  font-size: 0.85rem;
}
.jobactions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.none {
  text-align: center;
  color: var(--mu);
  padding: 1rem;
  margin: 0;
}
dialog {
  border: 1px solid #e2e5ee;
  border-radius: 16px;
  padding: 1.25rem;
  font-family: Vazirmatn;
  max-width: calc(100vw - 1rem);
}
dialog::backdrop {
  background: #0008;
}
#toast {
  position: fixed;
  bottom: 1rem;
  inset-inline: 1rem;
  margin: auto;
  max-width: 400px;
  background: #111827;
  color: #fff;
  border-radius: 12px;
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
}
@media (max-width: 500px) {
  .row .btn,
  .actions .btn {
    flex: 1 1 calc(50% - 0.5rem);
  }
}
```

## File: assets/js/app.js
```javascript
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
```

## File: assets/translations.json
```json
{
  "fa": {
    "title": "مدیریت کرون جاب‌ها",
    "heading_0": "مدیریت کرون جاب‌ها",
    "subtitle": "ذخیره، اعتبارسنجی و پیش‌نمایش زمان اجرای کرون جاب‌ها — این ابزار جاب‌ها را اجرا نمی‌کند.",
    "heading_1": "ایجاد کرون جاب جدید",
    "heading_3": "کرون جاب‌های موجود",
    "heading_4": "تاریخچه تغییرات",
    "label_0": "نام جاب",
    "label_1": "عبارت کرون",
    "label_2": "توضیحات",
    "label_3": "فعال",
    "button_0": "ایجاد جاب",
    "button_1": "پاک کردن",
    "button_3": "پاک کردن همه",
    "button_4": "خروجی",
    "button_5": "ورودی",
    "button_6": "پاک کردن تاریخچه",
    "yes": "بله",
    "cancel": "انصراف",
    "active": "فعال",
    "inactive": "غیرفعال",
    "enable": "فعال‌سازی",
    "disable": "غیرفعال‌سازی",
    "delete": "حذف",
    "next": "اجرای بعدی",
    "valid": "عبارت کرون معتبر است؛ پنج اجرای آینده:",
    "invalid": "عبارت کرون نامعتبر است. فقط پنج فیلد عددی، *، فهرست، بازه و گام پشتیبانی می‌شود.",
    "empty": "هنوز هیچ کرون جابی ایجاد نکرده‌اید",
    "emptyhist": "تاریخچه‌ای موجود نیست",
    "created": "ایجاد جاب",
    "imported": "ورود داده",
    "confirmdel": "جاب «{n}» حذف شود؟",
    "confirmall": "همهٔ جاب‌ها پاک شوند؟",
    "confirmhist": "تاریخچه پاک شود؟",
    "badimport": "فایل ورودی نامعتبر است",
    "err_save": "ذخیره‌سازی انجام نشد"
  },
  "en": {
    "title": "Cron Job Manager",
    "heading_0": "Cron Job Manager",
    "subtitle": "Save, validate and preview cron schedules — this tool does not run jobs.",
    "heading_1": "Create new cron job",
    "heading_3": "Existing cron jobs",
    "heading_4": "Change history",
    "label_0": "Job name",
    "label_1": "Cron expression",
    "label_2": "Description",
    "label_3": "Active",
    "button_0": "Create job",
    "button_1": "Clear",
    "button_3": "Clear all",
    "button_4": "Export",
    "button_5": "Import",
    "button_6": "Clear history",
    "yes": "Yes",
    "cancel": "Cancel",
    "active": "Active",
    "inactive": "Inactive",
    "enable": "Enable",
    "disable": "Disable",
    "delete": "Delete",
    "next": "Next run",
    "valid": "Valid cron expression; next five runs:",
    "invalid": "Invalid cron expression. Only five numeric fields, *, lists, ranges and steps are supported.",
    "empty": "No cron jobs yet",
    "emptyhist": "No history",
    "created": "Job created",
    "imported": "Imported data",
    "confirmdel": "Delete \"{n}\"?",
    "confirmall": "Clear all jobs?",
    "confirmhist": "Clear history?",
    "badimport": "Invalid import file",
    "err_save": "Could not save"
  }
}
```

## File: index.html
```html
<!doctype html>
<html dir="rtl" lang="fa">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
    <title data-i18n="title">مدیریت کرون جاب‌ها</title>
    <link rel="icon" href="/favicon.ico">
    <script>(function () { try { var t = (localStorage.getItem('theme') || '').replace(/"/g, ''); if (t === 'dark' || t === 'light') document.documentElement.dataset.theme = t } catch (e) { } })()</script>
    <link rel="stylesheet" href="../Vazirmatn-font-face.css">
    <link rel="stylesheet" href="../assets/tools.css">
    <link rel="stylesheet" href="assets/css/styles.css">
    <link rel="stylesheet" href="../assets/tool-wrapper.css">
</head>

<body>
    <main class="cr page">
        <header>
            <h1 data-i18n="heading_0">مدیریت کرون جاب‌ها</h1>
            <p class="muted" data-i18n="subtitle">ذخیره، اعتبارسنجی و پیش‌نمایش زمان اجرای کرون جاب‌ها — این ابزار
                جاب‌ها را اجرا نمی‌کند.</p>
        </header>
        <section class="cr-card">
            <h2 id="formtitle" data-i18n="heading_1">ایجاد کرون جاب جدید</h2>
            <form id="form"><label data-i18n="label_0">نام جاب</label><input id="name" class="input" required
                    maxlength="80"><label data-i18n="label_1">عبارت کرون</label><input id="expr" class="input mono"
                    dir="ltr" required placeholder="0 9 * * 1">
                <p id="desc" class="hint"></p>
                <div id="runs" class="runs"></div><label data-i18n="label_2">توضیحات</label><textarea id="note"
                    class="input" rows="2" maxlength="300"></textarea><label class="check"><input id="active"
                        type="checkbox" checked><span data-i18n="label_3">فعال</span></label>
                <div class="actions"><button class="btn primary" data-i18n="button_0">ایجاد جاب</button><button
                        type="button" id="reset" class="btn" data-i18n="button_1">پاک کردن</button></div>
            </form>
        </section>
        <section class="cr-card">
            <div class="row">
                <h2 data-i18n="heading_3">کرون جاب‌های موجود</h2>
                <div><button id="export" class="btn small" data-i18n="button_4">خروجی</button><button id="import"
                        class="btn small" data-i18n="button_5">ورودی</button><button id="clear" class="btn danger small"
                        data-i18n="button_3">پاک کردن همه</button><input id="file" type="file" accept=".json" hidden>
                </div>
            </div>
            <div id="jobs" class="list"></div>
        </section>
        <section class="cr-card">
            <div class="row">
                <h2 data-i18n="heading_4">تاریخچه تغییرات</h2><button id="clearhist" class="btn danger small"
                    data-i18n="button_6">پاک کردن تاریخچه</button>
            </div>
            <div id="hist" class="list"></div>
        </section>
    </main>
    <dialog id="confirm">
        <form method="dialog">
            <p id="confirmtext"></p>
            <div class="actions"><button value="yes" class="btn danger" data-i18n="yes">بله</button><button
                    value="cancel" class="btn" data-i18n="cancel">انصراف</button></div>
        </form>
    </dialog>
    <div id="toast" role="status" hidden></div>
    <script src="assets/js/app.js"></script>
    <script src="../assets/tool-wrapper.js"></script>
</body>

</html>
```

## File: sample-jobs.json
```json
[
  {
    "id": "1234567890",
    "name": "پشتیبان‌گیری روزانه",
    "cronExpression": "0 2 * * *",
    "description": "پشتیبان‌گیری خودکار از دیتابیس هر شب ساعت 2",
    "isActive": true,
    "createdAt": "2025-12-20T10:00:00.000Z",
    "lastModified": "2025-12-20T10:00:00.000Z"
  },
  {
    "id": "1234567891",
    "name": "ارسال گزارش هفتگی",
    "cronExpression": "0 9 * * 1",
    "description": "ارسال گزارش عملکرد هفتگی هر دوشنبه ساعت 9 صبح",
    "isActive": true,
    "createdAt": "2025-12-20T10:05:00.000Z",
    "lastModified": "2025-12-20T10:05:00.000Z"
  },
  {
    "id": "1234567892",
    "name": "پاکسازی فایل‌های موقت",
    "cronExpression": "0 0 1 * *",
    "description": "حذف فایل‌های موقت اول هر ماه",
    "isActive": true,
    "createdAt": "2025-12-20T10:10:00.000Z",
    "lastModified": "2025-12-20T10:10:00.000Z"
  },
  {
    "id": "1234567893",
    "name": "بررسی سلامت سیستم",
    "cronExpression": "*/15 * * * *",
    "description": "بررسی وضعیت سرورها هر 15 دقیقه",
    "isActive": true,
    "createdAt": "2025-12-20T10:15:00.000Z",
    "lastModified": "2025-12-20T10:15:00.000Z"
  },
  {
    "id": "1234567894",
    "name": "به‌روزرسانی کش",
    "cronExpression": "0 */6 * * *",
    "description": "به‌روزرسانی کش هر 6 ساعت یکبار",
    "isActive": false,
    "createdAt": "2025-12-20T10:20:00.000Z",
    "lastModified": "2025-12-20T10:20:00.000Z"
  }
]
```
