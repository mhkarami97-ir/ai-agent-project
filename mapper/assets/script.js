(() => {
  "use strict";

  const FAVORITES_KEY = "unitConverterFavorites";
  const MAX_FAVORITES = 30;
  const TOAST_DURATION_MS = 1800;
  const ABSOLUTE_ZERO_CELSIUS = -273.15;

  /* ---------- Unit catalog ---------- */

  // Linear categories store "factor": how many base units one of this unit equals.
  // Factors are the exact international definitions (1 in = 0.0254 m, 1 lb = 0.45359237 kg, 1 knot = 1852 m/h ...).
  const CATALOG = Object.freeze({
    length: {
      base: "m",
      units: [
        { id: "m", factor: 1, fa: "متر", en: "Meter" },
        { id: "km", factor: 1000, fa: "کیلومتر", en: "Kilometer" },
        { id: "cm", factor: 0.01, fa: "سانتی‌متر", en: "Centimeter" },
        { id: "mm", factor: 0.001, fa: "میلی‌متر", en: "Millimeter" },
        { id: "mi", factor: 1609.344, fa: "مایل", en: "Mile" },
        { id: "yd", factor: 0.9144, fa: "یارد", en: "Yard" },
        { id: "ft", factor: 0.3048, fa: "فوت", en: "Foot" },
        { id: "in", factor: 0.0254, fa: "اینچ", en: "Inch" },
      ],
    },
    weight: {
      base: "kg",
      units: [
        { id: "kg", factor: 1, fa: "کیلوگرم", en: "Kilogram" },
        { id: "g", factor: 0.001, fa: "گرم", en: "Gram" },
        { id: "mg", factor: 0.000001, fa: "میلی‌گرم", en: "Milligram" },
        { id: "t", factor: 1000, fa: "تن", en: "Tonne" },
        { id: "lb", factor: 0.45359237, fa: "پاند", en: "Pound" },
        { id: "oz", factor: 0.028349523125, fa: "اونس", en: "Ounce" },
      ],
    },
    temperature: {
      units: [
        { id: "celsius", fa: "سلسیوس", en: "Celsius" },
        { id: "fahrenheit", fa: "فارنهایت", en: "Fahrenheit" },
        { id: "kelvin", fa: "کلوین", en: "Kelvin" },
      ],
    },
    speed: {
      base: "m/s",
      units: [
        { id: "mps", factor: 1, fa: "متر بر ثانیه", en: "Meter/second" },
        {
          id: "kmh",
          factor: 1000 / 3600,
          fa: "کیلومتر بر ساعت",
          en: "Kilometer/hour",
        },
        { id: "mph", factor: 0.44704, fa: "مایل بر ساعت", en: "Mile/hour" },
        { id: "kn", factor: 1852 / 3600, fa: "گره دریایی", en: "Knot" },
        { id: "fps", factor: 0.3048, fa: "فوت بر ثانیه", en: "Foot/second" },
      ],
    },
  });

  const CATEGORY_IDS = Object.freeze(Object.keys(CATALOG));

  const TO_CELSIUS = Object.freeze({
    celsius: (value) => value,
    fahrenheit: (value) => ((value - 32) * 5) / 9,
    kelvin: (value) => value + ABSOLUTE_ZERO_CELSIUS,
  });
  const FROM_CELSIUS = Object.freeze({
    celsius: (value) => value,
    fahrenheit: (value) => (value * 9) / 5 + 32,
    kelvin: (value) => value - ABSOLUTE_ZERO_CELSIUS,
  });

  /* ---------- Pure logic (no DOM) ---------- */

  class UnitConverter {
    static unit(categoryId, unitId) {
      return (
        CATALOG[categoryId]?.units.find((unit) => unit.id === unitId) ?? null
      );
    }

    /** @throws {RangeError} when a temperature is below absolute zero */
    static convert(categoryId, fromId, toId, value) {
      const from = UnitConverter.unit(categoryId, fromId);
      const to = UnitConverter.unit(categoryId, toId);
      if (!from || !to) throw new TypeError("Unknown unit");

      if (categoryId === "temperature") {
        const celsius = TO_CELSIUS[fromId](value);
        if (celsius < ABSOLUTE_ZERO_CELSIUS - 1e-9)
          throw new RangeError("Below absolute zero");
        return FROM_CELSIUS[toId](celsius);
      }
      return (value * from.factor) / to.factor;
    }
  }

  class NumberText {
    static #DIGITS = Object.freeze({
      "۰": "0",
      "۱": "1",
      "۲": "2",
      "۳": "3",
      "۴": "4",
      "۵": "5",
      "۶": "6",
      "۷": "7",
      "۸": "8",
      "۹": "9",
      "٠": "0",
      "١": "1",
      "٢": "2",
      "٣": "3",
      "٤": "4",
      "٥": "5",
      "٦": "6",
      "٧": "7",
      "٨": "8",
      "٩": "9",
    });

    /** Understands Persian/Arabic digits, "٫" as decimal point and ","/"٬"/"،" as digit grouping. */
    static parse(text) {
      const normalized = String(text)
        .replace(/[۰-۹٠-٩]/g, (digit) => NumberText.#DIGITS[digit])
        .replace(/٫/g, ".")
        .replace(/[,٬،\s]/g, "");

      return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(normalized)
        ? Number(normalized)
        : Number.NaN;
    }

    static format(value) {
      if (!Number.isFinite(value)) return "";
      if (value === 0) return "0";

      const magnitude = Math.abs(value);
      if (magnitude >= 1e15 || magnitude < 1e-6) {
        return value.toExponential(6).replace(/\.?0+e/, "e");
      }
      return String(Number(value.toPrecision(10)));
    }
  }

  class FavoritesStore {
    list() {
      try {
        const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? "[]");
        return Array.isArray(parsed)
          ? parsed.map(FavoritesStore.#normalize).filter(Boolean)
          : [];
      } catch {
        return [];
      }
    }

    add(favorite) {
      const items = this.list();
      // Date.now() alone can repeat when two items are saved within the same millisecond
      const id = Math.max(Date.now(), (items[0]?.id ?? 0) + 1);
      this.#save(
        [
          { ...favorite, id, timestamp: new Date().toISOString() },
          ...items,
        ].slice(0, MAX_FAVORITES),
      );
    }

    remove(id) {
      this.#save(this.list().filter((favorite) => favorite.id !== id));
    }

    clear() {
      this.#save([]);
    }

    /** Accepts the current shape and the old one (unit names stored as Persian labels). */
    static #normalize(raw) {
      if (!raw || !CATEGORY_IDS.includes(raw.category)) return null;

      const resolve = (value) =>
        UnitConverter.unit(raw.category, value)?.id ??
        CATALOG[raw.category].units.find((unit) => unit.fa === value)?.id ??
        null;

      const from = resolve(raw.from ?? raw.fromUnit);
      const to = resolve(raw.to ?? raw.toUnit);
      if (!from || !to) return null;

      return {
        id: Number(raw.id) || Date.now(),
        category: raw.category,
        from,
        to,
        fromValue: String(raw.fromValue ?? ""),
        toValue: String(raw.toValue ?? ""),
        timestamp: raw.timestamp ?? "",
      };
    }

    #save(items) {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
    }
  }

  /* ---------- Services ---------- */

  class I18n {
    #translations = {};
    #lang = localStorage.getItem("lang") || "fa";

    get lang() {
      return this.#lang;
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

    unitLabel(categoryId, unitId) {
      return UnitConverter.unit(categoryId, unitId)?.[this.#lang] ?? unitId;
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
      for (const element of document.querySelectorAll("[data-i18n-label]")) {
        const label = this.t(element.dataset.i18nLabel);
        element.setAttribute("aria-label", label);
        element.title = label;
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

  class ConfirmDialog {
    #dialog;

    constructor(dialog) {
      this.#dialog = dialog;
      dialog
        .querySelector("[data-dialog-cancel]")
        .addEventListener("click", () => dialog.close("cancel"));
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) dialog.close("cancel");
      });
    }

    ask({ title, message }) {
      this.#dialog.querySelector("[data-dialog-title]").textContent = title;
      this.#dialog.querySelector("[data-dialog-message]").textContent = message;

      return new Promise((resolve) => {
        this.#dialog.addEventListener(
          "close",
          () => resolve(this.#dialog.returnValue === "ok"),
          { once: true },
        );
        this.#dialog.returnValue = "";
        this.#dialog.showModal();
      });
    }
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
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

  class UnitConverterApp {
    #i18n = new I18n();
    #favorites = new FavoritesStore();
    #toast;
    #confirm;
    #dom;
    #category = "length";

    async init() {
      this.#cacheDom();
      this.#toast = new Toast(this.#dom.toast);
      this.#confirm = new ConfirmDialog(this.#dom.dialog);
      await this.#i18n.load();

      this.#populateUnits();
      this.#bindEvents();
      this.#renderFavorites();
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #cacheDom() {
      const byId = (id) => document.getElementById(id);
      this.#dom = {
        tabs: [...document.querySelectorAll('[role="tab"][data-category]')],
        from: byId("fromUnit"),
        to: byId("toUnit"),
        input: byId("inputValue"),
        output: byId("outputValue"),
        hint: byId("resultHint"),
        swap: byId("swapBtn"),
        convert: byId("convertBtn"),
        copy: byId("copyBtn"),
        save: byId("saveBtn"),
        favorites: byId("favoritesList"),
        empty: byId("emptyFavorites"),
        clearAll: byId("clearAllBtn"),
        toast: byId("toast"),
        dialog: byId("confirmDialog"),
      };
    }

    #bindEvents() {
      const dom = this.#dom;

      for (const tab of dom.tabs) {
        tab.addEventListener("click", () =>
          this.#changeCategory(tab.dataset.category),
        );
        tab.addEventListener("keydown", (event) => this.#onTabKeydown(event));
      }

      dom.input.addEventListener("input", () => this.#convert());
      dom.from.addEventListener("change", () => this.#convert());
      dom.to.addEventListener("change", () => this.#convert());
      dom.convert.addEventListener("click", () => this.#convert());
      dom.swap.addEventListener("click", () => this.#swap());
      dom.copy.addEventListener("click", () => this.#copyResult());
      dom.save.addEventListener("click", () => this.#saveFavorite());
      dom.clearAll.addEventListener("click", () => this.#clearFavorites());

      dom.favorites.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const id = Number(button.closest("[data-id]").dataset.id);
        if (button.dataset.action === "load") this.#loadFavorite(id);
        else this.#deleteFavorite(id);
      });
    }

    /* ----- categories & units ----- */

    #onTabKeydown(event) {
      const tabs = this.#dom.tabs;
      const index = tabs.indexOf(event.currentTarget);
      const isRtl = document.documentElement.dir === "rtl";
      let next = index;

      if (event.key === "ArrowRight") next = isRtl ? index - 1 : index + 1;
      else if (event.key === "ArrowLeft") next = isRtl ? index + 1 : index - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;

      event.preventDefault();
      const target = tabs[(next + tabs.length) % tabs.length];
      target.focus();
      this.#changeCategory(target.dataset.category);
    }

    #changeCategory(category) {
      this.#category = category;
      for (const tab of this.#dom.tabs) {
        const isActive = tab.dataset.category === category;
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      }
      this.#populateUnits();
      this.#dom.input.value = "";
      this.#convert();
    }

    #populateUnits() {
      const { units } = CATALOG[this.#category];
      for (const select of [this.#dom.from, this.#dom.to]) {
        select.replaceChildren(
          ...units.map((unit) => {
            const option = document.createElement("option");
            option.value = unit.id;
            option.textContent = unit[this.#i18n.lang];
            return option;
          }),
        );
      }
      if (units.length > 1) this.#dom.to.selectedIndex = 1;
    }

    /* ----- conversion ----- */

    /** @returns {boolean} true when the output holds a valid result */
    #convert() {
      const { input, output, hint, from, to } = this.#dom;
      hint.hidden = true;

      if (input.value.trim() === "") {
        output.value = "";
        return false;
      }

      const value = NumberText.parse(input.value);
      if (Number.isNaN(value)) {
        output.value = "";
        this.#showHint("error_invalid_number");
        return false;
      }

      try {
        output.value = NumberText.format(
          UnitConverter.convert(this.#category, from.value, to.value, value),
        );
        return true;
      } catch (error) {
        output.value = "";
        this.#showHint(
          error instanceof RangeError
            ? "error_absolute_zero"
            : "error_invalid_number",
        );
        return false;
      }
    }

    #showHint(key) {
      this.#dom.hint.textContent = this.#i18n.t(key);
      this.#dom.hint.hidden = false;
    }

    #swap() {
      const { from, to, input, output } = this.#dom;
      [from.value, to.value] = [to.value, from.value];
      if (output.value) input.value = output.value;
      this.#convert();
    }

    async #copyResult() {
      const { output } = this.#dom;
      if (!output.value) return;

      const isCopied = await copyText(output.value);
      this.#toast.show(
        this.#i18n.t(isCopied ? "toast_copied" : "toast_copy_failed"),
      );
    }

    /* ----- favorites ----- */

    #saveFavorite() {
      const { from, to, input, output } = this.#dom;
      if (!this.#convert())
        return this.#toast.show(this.#i18n.t("toast_need_conversion"));

      this.#favorites.add({
        category: this.#category,
        from: from.value,
        to: to.value,
        fromValue: input.value.trim(),
        toValue: output.value,
      });
      this.#renderFavorites();
      this.#toast.show(this.#i18n.t("toast_saved"));
    }

    #loadFavorite(id) {
      const favorite = this.#favorites.list().find((item) => item.id === id);
      if (!favorite) return;

      if (favorite.category !== this.#category)
        this.#changeCategory(favorite.category);
      this.#dom.from.value = favorite.from;
      this.#dom.to.value = favorite.to;
      this.#dom.input.value = favorite.fromValue;
      this.#convert();
      this.#dom.input.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    #deleteFavorite(id) {
      this.#favorites.remove(id);
      this.#renderFavorites();
      this.#toast.show(this.#i18n.t("toast_deleted"));
    }

    async #clearFavorites() {
      if (this.#favorites.list().length === 0) return;

      const isConfirmed = await this.#confirm.ask({
        title: this.#i18n.t("button_7"),
        message: this.#i18n.t("confirm_clear"),
      });
      if (!isConfirmed) return;

      this.#favorites.clear();
      this.#renderFavorites();
      this.#toast.show(this.#i18n.t("toast_cleared"));
    }

    #renderFavorites() {
      const items = this.#favorites.list();
      this.#dom.empty.hidden = items.length > 0;
      this.#dom.clearAll.hidden = items.length === 0;
      this.#dom.favorites.replaceChildren(
        ...items.map((favorite) => this.#createFavorite(favorite)),
      );
    }

    #createFavorite(favorite) {
      const item = document.createElement("li");
      item.className = "favorite";
      item.dataset.id = String(favorite.id);

      const category = this.#dom.tabs.find(
        (tab) => tab.dataset.category === favorite.category,
      );

      const title = document.createElement("div");
      title.className = "favorite-title";
      title.textContent = category?.textContent ?? favorite.category;

      const conversion = document.createElement("div");
      conversion.className = "favorite-conversion";
      conversion.dir = "auto";
      conversion.textContent =
        `${favorite.fromValue} ${this.#i18n.unitLabel(favorite.category, favorite.from)} = ` +
        `${favorite.toValue} ${this.#i18n.unitLabel(favorite.category, favorite.to)}`;

      const content = document.createElement("div");
      content.className = "favorite-content";
      content.append(title, conversion);

      const actions = document.createElement("div");
      actions.className = "row favorite-actions";
      actions.append(
        this.#createButton(
          "btn btn--secondary btn--sm",
          "load",
          this.#i18n.t("button_load"),
        ),
        this.#createButton(
          "btn btn--danger btn--sm",
          "delete",
          this.#i18n.t("button_delete"),
        ),
      );

      item.append(content, actions);
      return item;
    }

    #createButton(className, action, text) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.dataset.action = action;
      button.textContent = text;
      return button;
    }
  }

  new UnitConverterApp().init();
})();
