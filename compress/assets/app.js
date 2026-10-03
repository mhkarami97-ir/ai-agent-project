(() => {
  "use strict";

  const TOAST_DURATION_MS = 2200;
  const IMAGE_EXTENSION =
    /\.(jpe?g|png|webp|gif|bmp|tiff?|svg|heic|heif|avif)$/i;
  const OUTPUT_MIME = Object.freeze({
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  });
  const MIME_EXTENSION = Object.freeze({
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  });
  const BYTE_UNITS = Object.freeze(["B", "KB", "MB", "GB"]);

  /* ---------- Pure logic (no DOM) ---------- */

  /** Minimal ZIP writer using the "stored" method; images are already compressed. */
  class ZipWriter {
    static #CRC_TABLE = (() => {
      const table = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++)
          c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
      }
      return table;
    })();

    static #encoder = new TextEncoder();
    #entries = [];

    static crc32(bytes) {
      let crc = 0xffffffff;
      for (let i = 0; i < bytes.length; i++)
        crc = ZipWriter.#CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
      return (crc ^ 0xffffffff) >>> 0;
    }

    add(name, data, date = new Date()) {
      const year = Math.max(date.getFullYear(), 1980);
      this.#entries.push({
        nameBytes: ZipWriter.#encoder.encode(name),
        data,
        crc: ZipWriter.crc32(data),
        time:
          (date.getHours() << 11) |
          (date.getMinutes() << 5) |
          (date.getSeconds() >> 1),
        date:
          ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
      });
    }

    build() {
      const parts = [];
      const central = [];
      let offset = 0;

      for (const entry of this.#entries) {
        const local = new DataView(new ArrayBuffer(30));
        local.setUint32(0, 0x04034b50, true);
        local.setUint16(4, 20, true);
        local.setUint16(6, 0x0800, true); // UTF-8 file names
        local.setUint16(8, 0, true);
        local.setUint16(10, entry.time, true);
        local.setUint16(12, entry.date, true);
        local.setUint32(14, entry.crc, true);
        local.setUint32(18, entry.data.length, true);
        local.setUint32(22, entry.data.length, true);
        local.setUint16(26, entry.nameBytes.length, true);
        local.setUint16(28, 0, true);
        parts.push(new Uint8Array(local.buffer), entry.nameBytes, entry.data);

        const header = new DataView(new ArrayBuffer(46));
        header.setUint32(0, 0x02014b50, true);
        header.setUint16(4, 20, true);
        header.setUint16(6, 20, true);
        header.setUint16(8, 0x0800, true);
        header.setUint16(10, 0, true);
        header.setUint16(12, entry.time, true);
        header.setUint16(14, entry.date, true);
        header.setUint32(16, entry.crc, true);
        header.setUint32(20, entry.data.length, true);
        header.setUint32(24, entry.data.length, true);
        header.setUint16(28, entry.nameBytes.length, true);
        header.setUint32(42, offset, true);
        central.push(new Uint8Array(header.buffer), entry.nameBytes);

        offset += 30 + entry.nameBytes.length + entry.data.length;
      }

      const centralSize = central.reduce((sum, part) => sum + part.length, 0);
      const end = new DataView(new ArrayBuffer(22));
      end.setUint32(0, 0x06054b50, true);
      end.setUint16(8, this.#entries.length, true);
      end.setUint16(10, this.#entries.length, true);
      end.setUint32(12, centralSize, true);
      end.setUint32(16, offset, true);

      return new Blob([...parts, ...central, new Uint8Array(end.buffer)], {
        type: "application/zip",
      });
    }
  }

  class FileNames {
    static isImage(file) {
      return file.type.startsWith("image/") || IMAGE_EXTENSION.test(file.name);
    }

    static withExtension(fileName, extension) {
      return `${fileName.replace(/\.[^.]+$/, "") || "image"}.${extension}`;
    }

    /** Makes names unique inside one archive: a.jpg, a-1.jpg, a-2.jpg ... */
    static unique(name, used) {
      if (!used.has(name)) {
        used.add(name);
        return name;
      }
      const dot = name.lastIndexOf(".");
      const base = dot === -1 ? name : name.slice(0, dot);
      const extension = dot === -1 ? "" : name.slice(dot);
      let counter = 1;
      while (used.has(`${base}-${counter}${extension}`)) counter++;
      const candidate = `${base}-${counter}${extension}`;
      used.add(candidate);
      return candidate;
    }
  }

  class ImageCompressor {
    static targetSize(width, height, maxDimension) {
      if (!maxDimension || maxDimension <= 0) return { width, height };
      const scale = Math.min(maxDimension / width, maxDimension / height, 1);
      return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
      };
    }

    /** @returns {Promise<{blob: Blob, extension: string}>} */
    static async compress(file, { quality, maxDimension, format }) {
      const source = await ImageCompressor.#decode(file);
      const canvas = document.createElement("canvas");

      try {
        const sourceWidth = source.naturalWidth ?? source.width;
        const sourceHeight = source.naturalHeight ?? source.height;
        if (!sourceWidth || !sourceHeight) throw new Error("decode");

        const { width, height } = ImageCompressor.targetSize(
          sourceWidth,
          sourceHeight,
          maxDimension,
        );
        canvas.width = width;
        canvas.height = height;

        const mime = OUTPUT_MIME[format] ?? OUTPUT_MIME.jpeg;
        const context = canvas.getContext("2d");
        if (mime === "image/jpeg") {
          // JPEG has no alpha channel: transparent pixels would turn black
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
        }
        context.imageSmoothingQuality = "high";
        context.drawImage(source, 0, 0, width, height);

        const blob = await new Promise((resolve) => {
          canvas.toBlob(
            resolve,
            mime,
            mime === "image/png" ? undefined : quality / 100,
          );
        });
        if (!blob) throw new Error("encode");

        // Some browsers cannot encode WebP and silently return PNG, so trust blob.type
        return { blob, extension: MIME_EXTENSION[blob.type] ?? "jpg" };
      } finally {
        source.close?.();
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    static async #decode(file) {
      if ("createImageBitmap" in window) {
        try {
          return await createImageBitmap(file, {
            imageOrientation: "from-image",
          });
        } catch {
          try {
            return await createImageBitmap(file);
          } catch {
            // fall through to <img>
          }
        }
      }

      const url = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        return image;
      } catch {
        throw new Error("decode");
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }

  /* ---------- Services ---------- */

  class I18n {
    #translations = {};
    #lang = localStorage.getItem("lang") || "fa";

    get locale() {
      return this.#lang === "fa" ? "fa-IR" : "en-US";
    }

    async load() {
      try {
        const response = await fetch("assets/translations.json");
        this.#translations = await response.json();
      } catch (error) {
        console.error("Failed to load translations:", error);
      }
      this.apply();
    }

    t(key, params = {}) {
      const template = this.#translations[this.#lang]?.[key] ?? key;
      return template.replace(
        /\{(\w+)\}/g,
        (match, name) => params[name] ?? match,
      );
    }

    apply() {
      const html = document.documentElement;
      html.lang = this.#lang;
      html.dir = this.#lang === "fa" ? "rtl" : "ltr";

      for (const element of document.querySelectorAll("[data-i18n]")) {
        element.textContent = this.t(element.dataset.i18n);
      }

      const titleKey = document.querySelector("title")?.dataset.i18n;
      if (titleKey) document.title = this.t(titleKey);
    }
  }

  class Toast {
    #element;
    #timer = 0;

    constructor(element) {
      this.#element = element;
    }

    show(message, duration = TOAST_DURATION_MS) {
      clearTimeout(this.#timer);
      this.#element.textContent = message;
      this.#element.hidden = false;
      this.#timer = setTimeout(() => {
        this.#element.hidden = true;
      }, duration);
    }
  }

  const downloadBlob = (blob, fileName) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  /* ---------- Items ---------- */

  class ImageItem {
    static #nextId = 1;

    constructor(file) {
      this.id = ImageItem.#nextId++;
      this.file = file;
      this.previewUrl = URL.createObjectURL(file);
      this.status = "pending"; // pending | working | done | error
      this.result = null;
      this.errorKey = "";
    }

    static fingerprint(file) {
      return `${file.name}|${file.size}|${file.lastModified}`;
    }

    dispose() {
      URL.revokeObjectURL(this.previewUrl);
    }
  }

  class ItemView {
    element;
    #i18n;
    #refs;

    constructor(item, i18n) {
      this.#i18n = i18n;
      this.element = document.createElement("article");
      this.element.className = "card thumb";
      this.element.dataset.id = String(item.id);

      const image = document.createElement("img");
      image.className = "thumb-image";
      image.alt = "";
      image.loading = "lazy";
      image.src = item.previewUrl;

      const name = document.createElement("div");
      name.className = "thumb-name";
      name.textContent = item.file.name;
      name.title = item.file.name;

      const sizes = document.createElement("div");
      sizes.className = "thumb-sizes";
      sizes.dir = "ltr";

      const status = document.createElement("span");
      status.className = "badge";

      const progress = document.createElement("div");
      progress.className = "progress";
      const bar = document.createElement("div");
      bar.className = "progress-bar";
      progress.append(bar);

      const error = document.createElement("p");
      error.className = "thumb-error";
      error.hidden = true;

      const actions = document.createElement("div");
      actions.className = "row thumb-actions";
      const download = this.#createButton(
        "btn btn--secondary btn--sm",
        "download",
        "button_download",
      );
      const remove = this.#createButton(
        "btn btn--ghost btn--sm",
        "remove",
        "button_remove",
      );
      actions.append(download, remove);

      this.element.append(image, name, sizes, status, progress, error, actions);
      this.#refs = { sizes, status, bar, error, download, remove };
    }

    update(item, format) {
      const { sizes, status, bar, error, download } = this.#refs;
      const original = item.file.size;

      this.element.dataset.status = item.status;
      status.textContent = this.#i18n.t(`status_${item.status}`);
      status.className = `badge${item.status === "done" ? " badge--success" : item.status === "error" ? " badge--warning" : ""}`;
      bar.style.width = {
        pending: "0%",
        working: "55%",
        done: "100%",
        error: "100%",
      }[item.status];

      error.hidden = item.status !== "error";
      error.textContent = item.errorKey ? this.#i18n.t(item.errorKey) : "";

      if (item.result) {
        const after = item.result.blob.size;
        const change = Math.round((1 - after / original) * 100);
        sizes.textContent = `${format(original)} → ${format(after)}  (${change >= 0 ? "−" : "+"}${Math.abs(change)}%)`;
        sizes.classList.toggle("is-bigger", after >= original);
      } else {
        sizes.textContent = format(original);
        sizes.classList.remove("is-bigger");
      }
      download.disabled = item.status !== "done";
    }

    setBusy(isBusy) {
      this.#refs.remove.disabled = isBusy;
    }

    #createButton(className, action, labelKey) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.dataset.action = action;
      button.textContent = this.#i18n.t(labelKey);
      return button;
    }
  }

  /* ---------- Application ---------- */

  class ImageCompressorApp {
    #i18n = new I18n();
    #toast;
    #dom;
    #items = new Map(); // id -> { item, view }
    #seen = new Set();
    #isBusy = false;
    #lastOptions = null;

    async init() {
      this.#cacheDom();
      this.#toast = new Toast(this.#dom.toast);
      await this.#i18n.load();

      this.#bindEvents();
      this.#syncControls();
      this.#render();
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #cacheDom() {
      const byId = (id) => document.getElementById(id);
      this.#dom = {
        fileInput: byId("fileInput"),
        dropzone: byId("dropzone"),
        preview: byId("preview"),
        emptyState: byId("emptyState"),
        compress: byId("compressBtn"),
        zip: byId("zipBtn"),
        clear: byId("clearBtn"),
        summary: byId("summary"),
        stale: byId("staleHint"),
        quality: byId("quality"),
        qualityVal: byId("qualityVal"),
        qualityHint: byId("qualityHint"),
        maxDim: byId("maxDim"),
        format: byId("format"),
        toast: byId("toast"),
      };
    }

    #bindEvents() {
      const dom = this.#dom;

      dom.fileInput.addEventListener("change", () => {
        this.#addFiles(dom.fileInput.files);
        dom.fileInput.value = "";
      });

      for (const type of ["dragenter", "dragover"]) {
        dom.dropzone.addEventListener(type, (event) => {
          event.preventDefault();
          dom.dropzone.classList.add("is-dragover");
        });
      }
      for (const type of ["dragleave", "drop"]) {
        dom.dropzone.addEventListener(type, (event) => {
          event.preventDefault();
          dom.dropzone.classList.remove("is-dragover");
        });
      }
      dom.dropzone.addEventListener("drop", (event) =>
        this.#addFiles(event.dataTransfer.files),
      );

      dom.quality.addEventListener("input", () => this.#onOptionsChanged());
      dom.maxDim.addEventListener("input", () => this.#onOptionsChanged());
      dom.format.addEventListener("change", () => this.#onOptionsChanged());

      dom.compress.addEventListener("click", () => this.#compressAll());
      dom.zip.addEventListener("click", () => this.#downloadZip());
      dom.clear.addEventListener("click", () => this.#clearAll());

      dom.preview.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = Number(button.closest("[data-id]").dataset.id);
        if (button.dataset.action === "remove") this.#remove(id);
        else this.#downloadOne(id);
      });
    }

    /* ----- options ----- */

    get #options() {
      const { quality, maxDim, format } = this.#dom;
      return {
        quality: Number(quality.value),
        maxDimension: Math.max(0, Math.floor(Number(maxDim.value) || 0)),
        format: format.value,
      };
    }

    #onOptionsChanged() {
      this.#syncControls();
      const hasResults = [...this.#items.values()].some(
        ({ item }) => item.status === "done",
      );
      this.#dom.stale.hidden = !(
        hasResults && this.#lastOptions !== JSON.stringify(this.#options)
      );
    }

    #syncControls() {
      const isPng = this.#dom.format.value === "png";
      this.#dom.qualityVal.textContent = this.#dom.quality.value;
      this.#dom.quality.disabled = isPng;
      this.#dom.qualityHint.hidden = !isPng;
    }

    /* ----- actions ----- */

    #addFiles(fileList) {
      const files = [...fileList];
      const images = files.filter(FileNames.isImage);
      const ignored = files.length - images.length;

      for (const file of images) {
        const fingerprint = ImageItem.fingerprint(file);
        if (this.#seen.has(fingerprint)) continue;

        this.#seen.add(fingerprint);
        const item = new ImageItem(file);
        const view = new ItemView(item, this.#i18n);
        this.#items.set(item.id, { item, view });
        this.#dom.preview.append(view.element);
        view.update(item, (bytes) => this.#formatBytes(bytes));
      }

      if (ignored > 0)
        this.#toast.show(this.#i18n.t("toast_ignored", { count: ignored }));
      this.#render();
    }

    #remove(id) {
      const entry = this.#items.get(id);
      if (!entry) return;

      this.#seen.delete(ImageItem.fingerprint(entry.item.file));
      entry.item.dispose();
      entry.view.element.remove();
      this.#items.delete(id);
      this.#render();
    }

    #clearAll() {
      for (const { item, view } of this.#items.values()) {
        item.dispose();
        view.element.remove();
      }
      this.#items.clear();
      this.#seen.clear();
      this.#lastOptions = null;
      this.#dom.stale.hidden = true;
      this.#render();
    }

    async #compressAll() {
      if (this.#items.size === 0)
        return this.#toast.show(this.#i18n.t("toast_no_files"));

      const options = this.#options;
      this.#setBusy(true);

      for (const { item, view } of this.#items.values()) {
        item.status = "working";
        item.result = null;
        item.errorKey = "";
        view.update(item, (bytes) => this.#formatBytes(bytes));
        await new Promise((resolve) => requestAnimationFrame(resolve)); // let the UI paint

        try {
          item.result = await ImageCompressor.compress(item.file, options);
          item.status = "done";
        } catch (error) {
          console.warn("compress failed", item.file.name, error);
          item.status = "error";
          item.errorKey =
            error.message === "encode" ? "error_encode" : "error_decode";
        }
        view.update(item, (bytes) => this.#formatBytes(bytes));
      }

      this.#lastOptions = JSON.stringify(options);
      this.#dom.stale.hidden = true;
      this.#setBusy(false);
      this.#toast.show(this.#i18n.t("toast_done"));
    }

    #downloadOne(id) {
      const entry = this.#items.get(id);
      if (!entry?.item.result)
        return this.#toast.show(this.#i18n.t("toast_compress_first"));

      const { file } = entry.item;
      const { blob, extension } = entry.item.result;
      downloadBlob(blob, FileNames.withExtension(file.name, extension));
    }

    async #downloadZip() {
      const done = [...this.#items.values()].filter(({ item }) => item.result);
      if (done.length === 0) return;

      this.#dom.zip.disabled = true;
      try {
        const zip = new ZipWriter();
        const usedNames = new Set();

        for (const { item } of done) {
          const name = FileNames.unique(
            FileNames.withExtension(item.file.name, item.result.extension),
            usedNames,
          );
          zip.add(name, new Uint8Array(await item.result.blob.arrayBuffer()));
        }

        downloadBlob(zip.build(), `compressed_${Date.now()}.zip`);
        this.#toast.show(this.#i18n.t("toast_zip_ready"));
      } finally {
        this.#dom.zip.disabled = false;
      }
    }

    /* ----- rendering ----- */

    #setBusy(isBusy) {
      this.#isBusy = isBusy;
      const dom = this.#dom;
      dom.compress.disabled = isBusy;
      dom.clear.disabled = isBusy;
      dom.fileInput.disabled = isBusy;
      dom.preview.toggleAttribute("aria-busy", isBusy);
      for (const { view } of this.#items.values()) view.setBusy(isBusy);
      this.#render();
    }

    #render() {
      const entries = [...this.#items.values()];
      const done = entries.filter(({ item }) => item.result);

      this.#dom.emptyState.hidden = entries.length > 0;
      this.#dom.compress.disabled = this.#isBusy || entries.length === 0;
      this.#dom.zip.disabled = this.#isBusy || done.length === 0;
      this.#dom.clear.disabled = this.#isBusy || entries.length === 0;
      this.#dom.summary.textContent = this.#buildSummary(entries, done);
    }

    #buildSummary(entries, done) {
      const number = new Intl.NumberFormat(this.#i18n.locale);
      let text = this.#i18n.t("summary", {
        count: number.format(entries.length),
        done: number.format(done.length),
      });

      if (done.length > 0) {
        const before = done.reduce((sum, { item }) => sum + item.file.size, 0);
        const after = done.reduce(
          (sum, { item }) => sum + item.result.blob.size,
          0,
        );
        if (after < before) {
          const percent = new Intl.NumberFormat(this.#i18n.locale, {
            style: "percent",
          }).format(1 - after / before);
          text += this.#i18n.t("summary_saved", {
            percent,
            size: this.#formatBytes(before - after),
          });
        }
      }
      return text;
    }

    #formatBytes(bytes) {
      let value = bytes;
      let unit = 0;
      while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
        value /= 1024;
        unit++;
      }
      const digits =
        value < 10 && unit > 0 ? 2 : value < 100 && unit > 0 ? 1 : 0;
      return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value)} ${BYTE_UNITS[unit]}`;
    }
  }

  new ImageCompressorApp().init();
})();
