(function () {
  "use strict";
  /* @logic-start */
  function bytesToB64(b) {
    let s = "";
    for (let i = 0; i < b.length; i += 0x8000)
      s += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function b64ToBytes(s) {
    let x = atob(s),
      b = new Uint8Array(x.length);
    for (let i = 0; i < x.length; i++) b[i] = x.charCodeAt(i);
    return b;
  }
  function encodeText(s) {
    return bytesToB64(new TextEncoder().encode(s));
  }
  function decodeText(s) {
    let v = String(s).replace(/\s/g, "");
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(v) || v.length % 4 === 1)
      throw Error("bad");
    let b = b64ToBytes(v);
    return new TextDecoder("utf-8", { fatal: true }).decode(b);
  }
  function dataUrl(s) {
    let m =
      /^data:(image\/(?:png|jpe?g|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(
        String(s).replace(/\s/g, ""),
      );
    if (!m) return null;
    try {
      return { mime: m[1].toLowerCase(), bytes: b64ToBytes(m[2]) };
    } catch (e) {
      return null;
    }
  }
  function sniff(b) {
    if (
      b.length > 8 &&
      b[0] === 137 &&
      b[1] === 80 &&
      b[2] === 78 &&
      b[3] === 71
    )
      return "image/png";
    if (b.length >= 3 && b[0] === 255 && b[1] === 216 && b[2] === 255)
      return "image/jpeg";
    if (
      b.length > 12 &&
      String.fromCharCode(...b.subarray(0, 4)) === "RIFF" &&
      String.fromCharCode(...b.subarray(8, 12)) === "WEBP"
    )
      return "image/webp";
    if (
      b.length >= 6 &&
      (String.fromCharCode(...b.subarray(0, 6)) === "GIF87a" ||
        String.fromCharCode(...b.subarray(0, 6)) === "GIF89a")
    )
      return "image/gif";
    return null;
  }
  /* @logic-end */
  let lang = "fa",
    dict = {};
  try {
    lang = localStorage.getItem("lang") === "en" ? "en" : "fa";
  } catch (e) {}
  const $ = (id) => document.getElementById(id),
    t = (k) => (dict[lang] || dict.fa || {})[k] || k;
  function msg(id, x, b) {
    let e = $(id);
    e.textContent = x;
    e.style.color = b ? "#b91c1c" : "";
  }
  async function copy(x) {
    try {
      await navigator.clipboard.writeText(x);
      return true;
    } catch (e) {
      return false;
    }
  }
  function apply() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
    document
      .querySelectorAll("[data-i18n]")
      .forEach((e) => (e.textContent = t(e.dataset.i18n)));
    document.title = t("title");
  }
  async function file(f) {
    if (!f || !/^image\//.test(f.type) || f.size > 10 * 1024 * 1024) {
      msg("imgStatus", t("badfile"), true);
      return;
    }
    let b = new Uint8Array(await f.arrayBuffer()),
      m = sniff(b);
    if (!m) {
      msg("imgStatus", t("badfile"), true);
      return;
    }
    $("imgOut").value = "data:" + m + ";base64," + bytesToB64(b);
    preview();
  }
  function preview() {
    let x = dataUrl($("imgOut").value);
    if (!x || sniff(x.bytes) !== x.mime) {
      $("preview").hidden = true;
      msg("imgStatus", t("badbase"), true);
      return;
    }
    $("preview").src = $("imgOut").value.replace(/\s/g, "");
    $("preview").hidden = false;
    msg("imgStatus", t("imgok"));
  }
  async function boot() {
    try {
      dict = await (await fetch("assets/translations.json")).json();
    } catch (e) {}
    apply();
    $("encode").onclick = () => {
      try {
        $("textOut").value = encodeText($("textIn").value);
        msg("textStatus", t("encoded"));
      } catch (e) {
        msg("textStatus", t("bad"), true);
      }
    };
    $("decode").onclick = () => {
      try {
        $("textOut").value = decodeText($("textIn").value);
        msg("textStatus", t("decoded"));
      } catch (e) {
        msg("textStatus", t("bad"), true);
      }
    };
    $("copyText").onclick = async () =>
      msg(
        "textStatus",
        (await copy($("textOut").value)) ? t("copied") : t("copyfail"),
        false,
      );
    $("copyImg").onclick = async () =>
      msg(
        "imgStatus",
        (await copy($("imgOut").value)) ? t("copied") : t("copyfail"),
        false,
      );
    $("clear").onclick = () => {
      $("file").value = "";
      $("imgOut").value = "";
      $("preview").hidden = true;
      msg("imgStatus", t("cleared"));
    };
    $("file").onchange = (e) => file(e.target.files[0]);
    $("imgOut").oninput = () => {
      clearTimeout(window.x);
      window.x = setTimeout(preview, 250);
    };
    let d = $("drop");
    ["dragover", "dragenter"].forEach((q) =>
      d.addEventListener(q, (e) => {
        e.preventDefault();
        d.classList.add("over");
      }),
    );
    ["dragleave", "drop"].forEach((q) =>
      d.addEventListener(q, (e) => {
        e.preventDefault();
        d.classList.remove("over");
      }),
    );
    d.addEventListener("drop", (e) => file(e.dataTransfer.files[0]));
    window.addEventListener("languageChanged", (e) => {
      lang = e.detail === "en" ? "en" : "fa";
      apply();
    });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
