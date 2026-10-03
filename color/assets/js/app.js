(() => {
  "use strict";

  const TOAST_DURATION_MS = 1800;
  const SCHEME_OFFSETS = Object.freeze({
    complementary: [0, 180],
    triadic: [0, 120, 240],
    tetradic: [0, 90, 180, 270],
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  /* ---------- Pure logic (no DOM) ---------- */

  class Color {
    /** Accepts "#abc", "abc", "#AABBCC"; returns "#aabbcc" or null. */
    static normalize(value) {
      let hex = String(value ?? "")
        .trim()
        .replace(/^#/, "");
      if (/^[0-9a-f]{3}$/i.test(hex))
        hex = [...hex].map((char) => char + char).join("");
      return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
    }

    static hexToHsl(hex) {
      const [r, g, b] = [1, 3, 5].map(
        (start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255,
      );
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      const lightness = (max + min) / 2;

      if (delta === 0) return { h: 0, s: 0, l: lightness * 100 };

      const saturation = delta / (1 - Math.abs(2 * lightness - 1));
      let hue;
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;

      return {
        h: (hue * 60 + 360) % 360,
        s: saturation * 100,
        l: lightness * 100,
      };
    }

    static hslToHex({ h, s, l }) {
      const hue = ((h % 360) + 360) % 360;
      const saturation = clamp(s, 0, 100) / 100;
      const lightness = clamp(l, 0, 100) / 100;
      const amount = saturation * Math.min(lightness, 1 - lightness);
      const channel = (offset) => {
        const k = (offset + hue / 30) % 12;
        return lightness - amount * Math.max(-1, Math.min(k - 3, 9 - k, 1));
      };

      return `#${[0, 8, 4]
        .map((offset) =>
          Math.round(channel(offset) * 255)
            .toString(16)
            .padStart(2, "0"),
        )
        .join("")}`;
    }

    static random() {
      return Color.hslToHex({
        h: Math.random() * 360,
        s: 55 + Math.random() * 30,
        l: 40 + Math.random() * 20,
      });
    }
  }

  class PaletteGenerator {
    static get schemes() {
      return ["analogous", "monochromatic", ...Object.keys(SCHEME_OFFSETS)];
    }

    static generate(baseHex, count, scheme = "analogous") {
      const base = Color.hexToHsl(baseHex);
      const center = (count - 1) / 2;

      return Array.from({ length: count }, (_, index) => {
        if (scheme === "monochromatic") {
          const progress = count === 1 ? 0.5 : index / (count - 1);
          return Color.hslToHex({
            h: base.h,
            s: base.s,
            l: 18 + progress * 70,
          });
        }

        if (scheme === "analogous" || !SCHEME_OFFSETS[scheme]) {
          const shift = index - center;
          return Color.hslToHex({
            h: base.h + shift * 25,
            s: clamp(base.s + shift * 3, 10, 100),
            l: clamp(base.l + shift * 5, 15, 90),
          });
        }

        const offsets = SCHEME_OFFSETS[scheme];
        const cycle = Math.floor(index / offsets.length);
        const cycles = Math.ceil(count / offsets.length);
        return Color.hslToHex({
          h: base.h + offsets[index % offsets.length],
          s: base.s,
          l: clamp(base.l + (cycle - (cycles - 1) / 2) * 12, 15, 90),
        });
      });
    }
  }

  class PaletteStore {
    static #KEY = "palettes";
    static #MAX_ITEMS = 12;

    list() {
      try {
        const parsed = JSON.parse(
          localStorage.getItem(PaletteStore.#KEY) ?? "[]",
        );
        return Array.isArray(parsed)
          ? parsed.map(PaletteStore.#normalize).filter(Boolean)
          : [];
      } catch {
        return [];
      }
    }

    add(name, colors) {
      this.#save(
        [{ name, colors }, ...this.list()].slice(0, PaletteStore.#MAX_ITEMS),
      );
    }

    remove(index) {
      const items = this.list();
      items.splice(index, 1);
      this.#save(items);
    }

    static #normalize(raw) {
      const colors = Array.isArray(raw?.colors)
        ? raw.colors.map(Color.normalize).filter(Boolean)
        : [];
      if (colors.length === 0) return null;
      return {
        name: String(raw.name ?? "")
          .trim()
          .slice(0, 30),
        colors,
      };
    }

    #save(items) {
      localStorage.setItem(PaletteStore.#KEY, JSON.stringify(items));
    }
  }

  /* ---------- Services ---------- */

  class I18n {
    #translations = {};
    #lang = localStorage.getItem("lang") || "fa";

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
      for (const element of document.querySelectorAll(
        "[data-i18n-placeholder]",
      )) {
        element.placeholder = this.t(element.dataset.i18nPlaceholder);
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

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for insecure contexts and older WebViews
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.append(area);
      area.select();
      const isCopied = document.execCommand("copy");
      area.remove();
      return isCopied;
    }
  };

  /* ---------- Application ---------- */

  const ICON_TRASH =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

  class PaletteApp {
    #i18n = new I18n();
    #store = new PaletteStore();
    #toast;
    #dom;
    #palette = [];

    async init() {
      this.#cacheDom();
      this.#toast = new Toast(this.#dom.toast);
      await this.#i18n.load();

      this.#bindEvents();
      this.#setBaseColor(Color.random());
      this.#renderSaved();
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #cacheDom() {
      const byId = (id) => document.getElementById(id);
      this.#dom = {
        grid: byId("paletteDisplay"),
        randomize: byId("randomizeBtn"),
        copyCss: byId("copyCssBtn"),
        picker: byId("colorPicker"),
        code: byId("colorCode"),
        scheme: byId("schemeSelect"),
        range: byId("countRange"),
        count: byId("countIndicator"),
        name: byId("paletteName"),
        save: byId("savePaletteBtn"),
        saved: byId("savedPalettes"),
        emptySaved: byId("emptySaved"),
        toast: byId("toast"),
      };
    }

    #bindEvents() {
      const dom = this.#dom;

      dom.randomize.addEventListener("click", () =>
        this.#setBaseColor(Color.random()),
      );
      dom.picker.addEventListener("input", () =>
        this.#setBaseColor(dom.picker.value),
      );
      dom.code.addEventListener("input", () => this.#onCodeInput());
      dom.scheme.addEventListener("change", () => this.#refresh());
      dom.range.addEventListener("input", () => this.#refresh());

      dom.save.addEventListener("click", () => this.#savePalette());
      dom.copyCss.addEventListener("click", () =>
        this.#copy(this.#toCss(), "toast_css_copied"),
      );

      dom.grid.addEventListener("click", (event) => {
        const tile = event.target.closest("[data-color]");
        if (tile)
          this.#copy(tile.dataset.color, "toast_color_copied", {
            color: tile.dataset.color,
          });
      });

      dom.saved.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;

        const index = Number(button.closest("[data-index]").dataset.index);
        if (button.dataset.action === "load") this.#loadSaved(index);
        else this.#deleteSaved(index);
      });
    }

    /* ----- actions ----- */

    #onCodeInput() {
      const hex = Color.normalize(this.#dom.code.value);
      this.#dom.code.setAttribute("aria-invalid", String(hex === null));
      if (hex) {
        this.#dom.picker.value = hex;
        this.#refresh();
      }
    }

    #setBaseColor(hex) {
      this.#dom.picker.value = hex;
      this.#dom.code.value = hex;
      this.#dom.code.setAttribute("aria-invalid", "false");
      this.#refresh();
    }

    #refresh() {
      const count = Number.parseInt(this.#dom.range.value, 10);
      this.#dom.count.textContent = count;
      this.#palette = PaletteGenerator.generate(
        this.#dom.picker.value,
        count,
        this.#dom.scheme.value,
      );
      this.#renderPalette();
    }

    #savePalette() {
      const fallbackName = this.#i18n.t("saved_default_name", {
        n: this.#store.list().length + 1,
      });
      this.#store.add(
        this.#dom.name.value.trim() || fallbackName,
        this.#palette,
      );
      this.#dom.name.value = "";
      this.#renderSaved();
      this.#toast.show(this.#i18n.t("toast_saved"));
    }

    #loadSaved(index) {
      const item = this.#store.list()[index];
      if (!item) return;

      this.#palette = item.colors;
      this.#renderPalette();
      this.#toast.show(this.#i18n.t("toast_loaded"));
    }

    #deleteSaved(index) {
      this.#store.remove(index);
      this.#renderSaved();
      this.#toast.show(this.#i18n.t("toast_deleted"));
    }

    async #copy(text, successKey, params) {
      const isCopied = await copyText(text);
      this.#toast.show(
        this.#i18n.t(isCopied ? successKey : "toast_copy_failed", params),
      );
    }

    #toCss() {
      const variables = this.#palette.map(
        (color, index) => `  --accent-color-${index + 1}: ${color};`,
      );
      return `:root {\n${variables.join("\n")}\n}`;
    }

    /* ----- rendering ----- */

    #renderPalette() {
      this.#dom.grid.replaceChildren(
        ...this.#palette.map((color) => {
          const tile = document.createElement("button");
          tile.type = "button";
          tile.className = "swatch-tile";
          tile.dataset.color = color;
          tile.setAttribute(
            "aria-label",
            this.#i18n.t("copy_color_aria", { color }),
          );

          const fill = document.createElement("span");
          fill.className = "swatch-color";
          fill.style.backgroundColor = color;

          const label = document.createElement("span");
          label.className = "swatch-label";
          label.textContent = color.toUpperCase();

          tile.append(fill, label);
          return tile;
        }),
      );
    }

    #renderSaved() {
      const items = this.#store.list();
      this.#dom.emptySaved.hidden = items.length > 0;
      this.#dom.saved.replaceChildren(
        ...items.map((item, index) => this.#createSavedCard(item, index)),
      );
    }

    #createSavedCard(item, index) {
      const card = document.createElement("article");
      card.className = "card saved-card";
      card.dataset.index = String(index);

      const head = document.createElement("div");
      head.className = "saved-head";

      const title = document.createElement("strong");
      title.className = "saved-name";
      title.textContent = item.name;

      const actions = document.createElement("div");
      actions.className = "row saved-actions";
      actions.append(
        this.#createButton(
          "btn btn--secondary btn--sm",
          "load",
          this.#i18n.t("button_load"),
        ),
        this.#createIconButton(
          "delete",
          ICON_TRASH,
          this.#i18n.t("button_delete"),
        ),
      );
      head.append(title, actions);

      const swatches = document.createElement("div");
      swatches.className = "swatches";
      swatches.append(
        ...item.colors.map((color) => {
          const swatch = document.createElement("span");
          swatch.className = "swatch";
          swatch.style.backgroundColor = color;
          swatch.title = color.toUpperCase();
          return swatch;
        }),
      );

      card.append(head, swatches);
      return card;
    }

    #createButton(className, action, text) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.dataset.action = action;
      button.textContent = text;
      return button;
    }

    #createIconButton(action, icon, label) {
      const button = this.#createButton("btn btn--ghost btn--icon", action, "");
      button.title = label;
      button.setAttribute("aria-label", label);
      button.innerHTML = icon;
      return button;
    }
  }

  new PaletteApp().init();
})();
