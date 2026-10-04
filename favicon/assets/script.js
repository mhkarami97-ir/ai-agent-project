(function () {
  "use strict";
  /* @logic-start */
  const SIZES = [16, 32, 48, 64, 128, 144, 152, 167, 180, 192, 256, 384, 512];
  function norm(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    let c = /^#[0-9a-f]{6}$/i.test(raw.color) ? raw.color : "#ffffff",
      p = Math.round(Number(raw.padding));
    return {
      color: c,
      padding: Number.isFinite(p) ? Math.min(30, Math.max(0, p)) : 10,
      transparent: raw.transparent !== false,
      contain: raw.contain !== false,
    };
  }
  function rect(iw, ih, size, pad, contain) {
    let a = (size * pad) / 100,
      box = size - a * 2;
    if (contain) {
      let k = Math.min(box / iw, box / ih),
        w = iw * k,
        h = ih * k;
      return { x: (size - w) / 2, y: (size - h) / 2, w, h };
    }
    let k = Math.max(box / iw, box / ih),
      w = iw * k,
      h = ih * k;
    return { x: (size - w) / 2, y: (size - h) / 2, w, h };
  }
  function ico(images) {
    let n = images.length,
      dir = 6 + n * 16,
      total = dir + images.reduce((s, x) => s + x.length, 0),
      b = new Uint8Array(total),
      v = new DataView(b.buffer),
      o = 0;
    v.setUint16(o, 0, true);
    o += 2;
    v.setUint16(o, 1, true);
    o += 2;
    v.setUint16(o, n, true);
    o += 2;
    let off = dir;
    images.forEach((im, i) => {
      let size = [16, 32, 48][i];
      b[o++] = size;
      b[o++] = size;
      b[o++] = 0;
      b[o++] = 0;
      v.setUint16(o, 1, true);
      o += 2;
      v.setUint16(o, 32, true);
      o += 2;
      v.setUint32(o, im.length, true);
      o += 4;
      v.setUint32(o, off, true);
      o += 4;
      off += im.length;
    });
    let p = dir;
    images.forEach((im) => {
      b.set(im, p);
      p += im.length;
    });
    return b;
  }
  function outName(n, ext) {
    let b =
      String(n || "icon")
        .replace(/\.[^./\\]+$/, "")
        .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, "_")
        .trim()
        .slice(0, 80) || "icon";
    return b + "." + ext;
  }
  /* @logic-end */
  const KEY = "iconGeneratorSettings",
    MAX = 40 * 1024 * 1024;
  let lang = "fa",
    dict = {},
    opt = norm(null),
    img = null,
    name = "icon",
    icons = [],
    icoBlob = null;
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
    $("padVal").textContent = opt.padding + "%";
  }
  function sync() {
    ["transparent", "contain"].forEach((k) => ($(k).checked = opt[k]));
    $("color").value = opt.color;
    $("colorText").value = opt.color;
    $("padding").value = opt.padding;
    apply();
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(opt));
    } catch (e) {}
  }
  async function decode(file) {
    if (createImageBitmap)
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    let u = URL.createObjectURL(file);
    try {
      return await new Promise((r, j) => {
        let x = new Image();
        x.onload = () => r(x);
        x.onerror = j;
        x.src = u;
      });
    } finally {
      URL.revokeObjectURL(u);
    }
  }
  async function load(f) {
    if (!f) return;
    if (!/^image\//.test(f.type) || f.size > MAX) {
      toast(t("err_file"), true);
      return;
    }
    try {
      if (img && img.close) img.close();
      img = await decode(f);
      name = f.name;
      $("preview").src = URL.createObjectURL(f);
      $("work").hidden = false;
      $("results").hidden = true;
    } catch (e) {
      toast(t("err_file"), true);
    }
  }
  async function png(size) {
    let c = document.createElement("canvas");
    c.width = c.height = size;
    let x = c.getContext("2d");
    if (!opt.transparent) {
      x.fillStyle = opt.color;
      x.fillRect(0, 0, size, size);
    }
    let r = rect(img.width, img.height, size, opt.padding, opt.contain);
    x.drawImage(img, r.x, r.y, r.w, r.h);
    let b = await new Promise((r) => c.toBlob(r, "image/png"));
    return b;
  }
  function dl(blob, n) {
    let u = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = u;
    a.download = n;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 1500);
  }
  async function gen() {
    if (!img) return;
    $("generate").disabled = true;
    try {
      icons = [];
      for (const s of SIZES) {
        let b = await png(s);
        icons.push({
          s,
          blob: b,
          url: URL.createObjectURL(b),
          name: (s <= 64 ? "favicon-" : "icon-") + s + "x" + s + ".png",
        });
      }
      let arr = [];
      for (const s of [16, 32, 48])
        arr.push(
          new Uint8Array(await icons.find((x) => x.s === s).blob.arrayBuffer()),
        );
      icoBlob = new Blob([ico(arr)], { type: "image/x-icon" });
      render();
      $("results").hidden = false;
    } catch (e) {
      console.error(e);
      toast(t("err_gen"), true);
    } finally {
      $("generate").disabled = false;
    }
  }
  function render() {
    let b = $("icons");
    b.textContent = "";
    let all = [
      { name: "favicon.ico", blob: icoBlob, url: URL.createObjectURL(icoBlob) },
    ].concat(icons);
    all.forEach((x) => {
      let d = document.createElement("div");
      d.className = "icon";
      if (x.name !== "favicon.ico") {
        let im = document.createElement("img");
        im.src = x.url;
        d.append(im);
      }
      let c = document.createElement("code");
      c.textContent = x.name;
      let bt = document.createElement("button");
      bt.className = "btn primary";
      bt.textContent = t("download");
      bt.onclick = () => dl(x.blob, x.name);
      d.append(c, bt);
      b.append(d);
    });
  }
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    try {
      opt = norm(JSON.parse(localStorage.getItem(KEY)));
    } catch (e) {}
    sync();
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
    ["transparent", "contain"].forEach(
      (k) =>
        ($(k).onchange = () => {
          opt[k] = $(k).checked;
          save();
        }),
    );
    $("color").oninput = (e) => {
      opt.color = e.target.value;
      $("colorText").value = opt.color;
      save();
    };
    $("colorText").onchange = (e) => {
      if (/^#[0-9a-f]{6}$/i.test(e.target.value)) {
        opt.color = e.target.value;
        $("color").value = opt.color;
        save();
      } else e.target.value = opt.color;
    };
    $("padding").oninput = (e) => {
      opt.padding = +e.target.value;
      save();
      apply();
    };
    $("generate").onclick = gen;
    $("all").onclick = async () => {
      for (let i = 0; i < icons.length; i++) {
        dl(icons[i].blob, icons[i].name);
        await new Promise((r) => setTimeout(r, 250));
      }
      dl(icoBlob, "favicon.ico");
    };
    $("reset").onclick = () => {
      if (img && img.close) img.close();
      img = null;
      icons = [];
      icoBlob = null;
      $("file").value = "";
      $("work").hidden = true;
      $("results").hidden = true;
    };
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
