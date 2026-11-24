(function () {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    settings: "usedPriceSettings",
    history: "usedPriceHistory",
  });
  const LIMITS = Object.freeze({
    maxHistory: 50,
    maxPrice: 1e13,
    maxYears: 100,
    minMarket: -90,
    maxMarket: 1000,
    roundTo: 1000,
    saveDelayMs: 300,
  });
  const GROUPS = Object.freeze({"electronics": {"fa": "لوازم دیجیتال و برقی", "en": "Electronics"}, "home": {"fa": "خانه", "en": "Home"}, "vehicle": {"fa": "وسیله نقلیه", "en": "Vehicles"}, "other": {"fa": "سایر", "en": "Other"}});
  const CATEGORIES = Object.freeze([{"key": "mobile", "group": "electronics", "fa": "موبایل", "en": "Mobile phone", "rate": 35}, {"key": "laptop", "group": "electronics", "fa": "لپ‌تاپ", "en": "Laptop", "rate": 30}, {"key": "desktop", "group": "electronics", "fa": "کامپیوتر رومیزی", "en": "Desktop PC", "rate": 25}, {"key": "tablet", "group": "electronics", "fa": "تبلت", "en": "Tablet", "rate": 25}, {"key": "smartwatch", "group": "electronics", "fa": "ساعت هوشمند", "en": "Smartwatch", "rate": 30}, {"key": "headphone", "group": "electronics", "fa": "هدفون و اسپیکر", "en": "Headphones & speakers", "rate": 30}, {"key": "console", "group": "electronics", "fa": "کنسول بازی", "en": "Game console", "rate": 15}, {"key": "camera", "group": "electronics", "fa": "دوربین", "en": "Camera", "rate": 15}, {"key": "tv", "group": "electronics", "fa": "تلویزیون", "en": "TV", "rate": 15}, {"key": "monitor", "group": "electronics", "fa": "مانیتور", "en": "Monitor", "rate": 15}, {"key": "appliance_large", "group": "home", "fa": "لوازم خانگی بزرگ (یخچال، لباسشویی)", "en": "Large appliance (fridge, washer)", "rate": 10}, {"key": "appliance_small", "group": "home", "fa": "لوازم خانگی کوچک", "en": "Small appliance", "rate": 15}, {"key": "furniture", "group": "home", "fa": "مبلمان و دکور", "en": "Furniture & decor", "rate": 12}, {"key": "car_foreign", "group": "vehicle", "fa": "خودرو خارجی / وارداتی", "en": "Car (foreign / imported)", "rate": 17}, {"key": "car_domestic", "group": "vehicle", "fa": "خودرو داخلی", "en": "Car (domestic)", "rate": 5}, {"key": "motorcycle", "group": "vehicle", "fa": "موتورسیکلت", "en": "Motorcycle", "rate": 12}, {"key": "bicycle", "group": "vehicle", "fa": "دوچرخه", "en": "Bicycle", "rate": 12}, {"key": "sport", "group": "other", "fa": "وسایل ورزشی", "en": "Sports equipment", "rate": 10}, {"key": "tools", "group": "other", "fa": "ابزار برقی و کارگاهی", "en": "Power & workshop tools", "rate": 12}, {"key": "instrument", "group": "other", "fa": "ساز موسیقی", "en": "Musical instrument", "rate": 8}, {"key": "other", "group": "other", "fa": "سایر", "en": "Other", "rate": 15}]);
  const DEFAULT_SETTINGS = Object.freeze({
    category: "mobile",
    market: 0,
    floor: 10,
    rates: Object.freeze(
      Object.fromEntries(CATEGORIES.map(({ key, rate }) => [key, rate])),
    ),
  });

  class NumberParser {
    static parse(text, { signed = false } = {}) {
      const normalized = String(text)
        .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0)
        .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
        .replace(/[٬,\s]/g, "")
        .replace(/٫/g, ".")
        .replace(/[−–]/g, "-");
      const pattern = signed ? /^-?\d+(\.\d+)?$/ : /^\d+(\.\d+)?$/;
      return pattern.test(normalized) ? Number(normalized) : NaN;
    }
  }

  class ThousandsInput {
    static attach(input) {
      input.addEventListener("input", () => ThousandsInput.#reformat(input));
    }

    static #reformat(input) {
      const caret = input.selectionStart ?? input.value.length;
      const digitsBeforeCaret = ThousandsInput.#digits(input.value.slice(0, caret)).length;
      const formatted = ThousandsInput.#digits(input.value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      input.value = formatted;

      let position = 0;
      let seen = 0;
      while (position < formatted.length && seen < digitsBeforeCaret) {
        if (formatted[position] !== ",") seen++;
        position++;
      }
      input.setSelectionRange(position, position);
    }

    static #digits(text) {
      return String(text)
        .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0)
        .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
        .replace(/\D/g, "")
        .replace(/^0+(?=\d)/, "");
    }
  }

  class JsonStore {
    #key;
    #fallback;

    constructor(key, fallback) {
      this.#key = key;
      this.#fallback = fallback;
    }

    read() {
      try {
        const raw = localStorage.getItem(this.#key);
        return raw === null ? this.#fallback : JSON.parse(raw);
      } catch {
        return this.#fallback;
      }
    }

    write(value) {
      try {
        localStorage.setItem(this.#key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  }

  class I18n {
    #dict = {};
    #lang = "fa";

    constructor() {
      try {
        this.#lang = localStorage.getItem("lang") === "en" ? "en" : "fa";
      } catch {}
    }

    get lang() {
      return this.#lang;
    }

    get locale() {
      return this.#lang === "fa" ? "fa-IR" : "en-US";
    }

    async load(url) {
      try {
        this.#dict = await (await fetch(url)).json();
      } catch (error) {
        console.error("Could not load translations:", error);
      }
    }

    setLang(lang) {
      this.#lang = lang === "en" ? "en" : "fa";
    }

    t(key, vars = {}) {
      const table = this.#dict[this.#lang] ?? this.#dict.fa ?? {};
      return Object.entries(vars).reduce(
        (text, [name, value]) => text.replaceAll(`{${name}}`, value),
        table[key] ?? key,
      );
    }

    number(value, maximumFractionDigits = 2) {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits }).format(value);
    }

    date(timestamp) {
      return new Date(timestamp).toLocaleString(this.locale);
    }

    #pick(item) {
      return this.#lang === "fa" ? item.fa : item.en;
    }

    categoryName(key) {
      const item = CATEGORIES.find((category) => category.key === key);
      return item ? this.#pick(item) : key;
    }

    groupName(key) {
      return this.#pick(GROUPS[key]);
    }
  }

  class PriceEstimator {
    static validate({ newPrice, years, market, rate, floor }) {
      if (!Number.isFinite(newPrice) || newPrice <= 0 || newPrice > LIMITS.maxPrice) return "errPrice";
      if (!Number.isFinite(years) || years > LIMITS.maxYears) return "errYears";
      if (!Number.isFinite(market) || market < LIMITS.minMarket || market > LIMITS.maxMarket) return "errMarket";
      if (!Number.isFinite(rate) || rate >= 100) return "errRate";
      if (!Number.isFinite(floor) || floor >= 100) return "errFloor";
      return null;
    }

    static estimate({ newPrice, years, market, rate, floor }) {
      const retained = Math.max((1 - rate / 100) ** years, floor / 100);
      const raw = newPrice * retained * (1 + market / 100);
      const price = Math.round(raw / LIMITS.roundTo) * LIMITS.roundTo;
      return { price, retainedPercent: retained * 100 };
    }
  }

  class HistoryRepository {
    #store = new JsonStore(STORAGE_KEYS.history, []);
    #items;

    constructor() {
      const raw = this.#store.read();
      this.#items = Array.isArray(raw) ? raw.filter(HistoryRepository.#isValid) : [];
    }

    static #isValid(item) {
      return (
        item &&
        typeof item.category === "string" &&
        ["newPrice", "years", "market", "rate", "price", "ts"].every((field) =>
          Number.isFinite(item[field]),
        )
      );
    }

    get items() {
      return this.#items;
    }

    add(entry) {
      this.#items.unshift({ ...entry, id: `${Date.now()}`, ts: Date.now() });
      this.#items.length = Math.min(this.#items.length, LIMITS.maxHistory);
      return this.#persist();
    }

    remove(id) {
      this.#items = this.#items.filter((item) => item.id !== id);
      return this.#persist();
    }

    clear() {
      this.#items = [];
      return this.#persist();
    }

    #persist() {
      return this.#store.write(this.#items);
    }
  }

  class SettingsRepository {
    #store = new JsonStore(STORAGE_KEYS.settings, {});

    load() {
      const stored = this.#store.read() ?? {};
      const rates = { ...DEFAULT_SETTINGS.rates };
      Object.keys(rates).forEach((key) => {
        const value = stored.rates?.[key];
        if (Number.isFinite(value) && value >= 0 && value < 100) rates[key] = value;
      });
      const known = CATEGORIES.some((category) => category.key === stored.category);
      return {
        category: known ? stored.category : DEFAULT_SETTINGS.category,
        market: Number.isFinite(stored.market) ? stored.market : DEFAULT_SETTINGS.market,
        floor: Number.isFinite(stored.floor) ? stored.floor : DEFAULT_SETTINGS.floor,
        rates,
      };
    }

    save(settings) {
      const overrides = Object.fromEntries(
        Object.entries(settings.rates).filter(([key, value]) => value !== DEFAULT_SETTINGS.rates[key]),
      );
      return this.#store.write({ ...settings, rates: overrides });
    }
  }

  class UsedPriceApp {
    #i18n = new I18n();
    #settingsRepo = new SettingsRepository();
    #history = new HistoryRepository();
    #settings;
    #saveTimer = 0;
    #toastTimer = 0;

    async init() {
      await this.#i18n.load("assets/translations.json");
      this.#settings = this.#settingsRepo.load();
      ThousandsInput.attach(this.#$("newPrice"));
      this.#$("market").value = this.#settings.market;
      this.#$("floor").value = this.#settings.floor;
      this.#bindEvents();
      this.#applyLanguage();
    }

    #$(id) {
      return document.getElementById(id);
    }

    #bindEvents() {
      const form = this.#$("form");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        this.#commit();
      });
      form.addEventListener("input", (event) => this.#handleInput(event));
      form.addEventListener("click", (event) => this.#toggleHelp(event));
      this.#$("category").addEventListener("change", () => {
        this.#settings.category = this.#$("category").value;
        this.#syncRateInput();
        this.#recalculate({ persist: true });
      });
      this.#$("resetRates").addEventListener("click", () => {
        this.#settings.rates = { ...DEFAULT_SETTINGS.rates };
        this.#$("floor").value = DEFAULT_SETTINGS.floor;
        this.#syncRateInput();
        this.#recalculate({ persist: true });
      });
      this.#$("clearHistory").addEventListener("click", () => this.#clearHistory());
      this.#$("history").addEventListener("click", (event) => this.#handleHistoryClick(event));
      this.#$("confirm").addEventListener("click", (event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      });
      window.addEventListener("languageChanged", (event) => {
        this.#i18n.setLang(event.detail);
        this.#applyLanguage();
      });
    }

    #toggleHelp(event) {
      const button = event.target.closest(".help");
      if (!button) return;
      const panel = this.#$(button.getAttribute("aria-controls"));
      const open = panel.hidden;
      panel.hidden = !open;
      button.setAttribute("aria-expanded", String(open));
    }

    #handleInput(event) {
      if (event.target.id === "rate") {
        const rate = NumberParser.parse(event.target.value);
        if (Number.isFinite(rate)) this.#settings.rates[this.#settings.category] = rate;
      }
      this.#recalculate({ persist: true });
    }

    #syncRateInput() {
      this.#$("rate").value = this.#settings.rates[this.#settings.category];
    }

    #fillCategories() {
      const select = this.#$("category");
      const groups = Object.keys(GROUPS).map((groupKey) => {
        const group = document.createElement("optgroup");
        group.label = this.#i18n.groupName(groupKey);
        CATEGORIES.filter((category) => category.group === groupKey).forEach(({ key }) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = this.#i18n.categoryName(key);
          group.append(option);
        });
        return group;
      });
      select.replaceChildren(...groups);
      select.value = this.#settings.category;
    }

    #readParams() {
      const marketText = this.#$("market").value.trim();
      return {
        category: this.#$("category").value,
        newPrice: NumberParser.parse(this.#$("newPrice").value),
        years: NumberParser.parse(this.#$("years").value),
        market: marketText === "" ? 0 : NumberParser.parse(marketText, { signed: true }),
        rate: NumberParser.parse(this.#$("rate").value),
        floor: NumberParser.parse(this.#$("floor").value),
      };
    }

    #recalculate({ persist = false } = {}) {
      const params = this.#readParams();
      const hasInput = this.#$("newPrice").value !== "" && this.#$("years").value !== "";
      const errorKey = hasInput ? PriceEstimator.validate(params) : null;
      this.#showError(errorKey);

      if (!hasInput || errorKey) {
        this.#$("result").textContent = "—";
        this.#$("detail").textContent = "";
      } else {
        const { price, retainedPercent } = PriceEstimator.estimate(params);
        this.#$("result").textContent = this.#i18n.t("toman", { n: this.#i18n.number(price, 0) });
        this.#$("detail").textContent = this.#i18n.t("detail", {
          p: this.#i18n.number(retainedPercent, 1),
        });
      }
      if (persist) this.#scheduleSave(params);
      return { params, errorKey: hasInput ? errorKey : "errPrice" };
    }

    #scheduleSave(params) {
      clearTimeout(this.#saveTimer);
      this.#saveTimer = setTimeout(() => {
        this.#settings.market = Number.isFinite(params.market) ? params.market : 0;
        this.#settings.floor = Number.isFinite(params.floor) ? params.floor : DEFAULT_SETTINGS.floor;
        if (!this.#settingsRepo.save(this.#settings)) this.#toast(this.#i18n.t("errSave"), true);
      }, LIMITS.saveDelayMs);
    }

    #commit() {
      const { params, errorKey } = this.#recalculate({ persist: true });
      if (errorKey) return this.#showError(errorKey);

      const { price } = PriceEstimator.estimate(params);
      if (!this.#history.add({ ...params, price })) this.#toast(this.#i18n.t("errSave"), true);
      this.#renderHistory();
      this.#toast(this.#i18n.t("saved"));
    }

    #showError(errorKey) {
      const box = this.#$("error");
      box.hidden = !errorKey;
      box.textContent = errorKey ? this.#i18n.t(errorKey) : "";
    }

    #handleHistoryClick(event) {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const item = this.#history.items.find((entry) => entry.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "restore") {
        this.#restore(item);
      } else {
        this.#history.remove(item.id);
        this.#renderHistory();
      }
    }

    #restore(item) {
      if (!CATEGORIES.some((category) => category.key === item.category)) return;
      this.#settings.category = item.category;
      this.#settings.rates[item.category] = item.rate;
      this.#$("category").value = item.category;
      this.#$("newPrice").value = new Intl.NumberFormat("en-US").format(item.newPrice);
      this.#$("years").value = item.years;
      this.#$("market").value = item.market;
      this.#$("floor").value = Number.isFinite(item.floor) ? item.floor : this.#settings.floor;
      this.#syncRateInput();
      this.#recalculate({ persist: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    async #clearHistory() {
      if (!(await this.#confirm(this.#i18n.t("confirmHistory")))) return;
      this.#history.clear();
      this.#renderHistory();
    }

    #renderHistory() {
      const container = this.#$("history");
      const items = this.#history.items;

      if (items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "none";
        empty.textContent = this.#i18n.t("emptyHistory");
        container.replaceChildren(empty);
        return;
      }
      container.replaceChildren(...items.map((item) => this.#createHistoryItem(item)));
    }

    #createHistoryItem(item) {
      const root = document.createElement("div");
      root.className = "hist";

      const main = document.createElement("div");
      main.className = "main";
      main.textContent = this.#i18n.t("historyMain", {
        c: this.#i18n.categoryName(item.category),
        n: this.#i18n.number(item.newPrice, 0),
        y: this.#i18n.number(item.years),
        p: this.#i18n.number(item.price, 0),
      });

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = this.#i18n.date(item.ts);

      const actions = document.createElement("div");
      actions.className = "acts";
      actions.append(
        this.#createButton("restore", item.id, "restore", "btn small"),
        this.#createButton("remove", item.id, "delete", "btn small danger"),
      );

      root.append(main, meta, actions);
      return root;
    }

    #createButton(action, id, labelKey, className) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.dataset.action = action;
      button.dataset.id = id;
      button.textContent = this.#i18n.t(labelKey);
      return button;
    }

    #applyLanguage() {
      document.documentElement.lang = this.#i18n.lang;
      document.documentElement.dir = this.#i18n.lang === "fa" ? "rtl" : "ltr";
      document.title = this.#i18n.t("title");
      document
        .querySelectorAll("[data-i18n]")
        .forEach((element) => (element.textContent = this.#i18n.t(element.dataset.i18n)));
      document
        .querySelectorAll("[data-i18n-aria]")
        .forEach((element) => element.setAttribute("aria-label", this.#i18n.t(element.dataset.i18nAria)));
      this.#fillCategories();
      this.#syncRateInput();
      this.#recalculate();
      this.#renderHistory();
    }

    #confirm(text) {
      const dialog = this.#$("confirm");
      this.#$("confirmText").textContent = text;
      return new Promise((resolve) => {
        const onClose = () => {
          dialog.removeEventListener("close", onClose);
          resolve(dialog.returnValue === "yes");
        };
        dialog.addEventListener("close", onClose);
        dialog.showModal();
      });
    }

    #toast(text, isError = false) {
      const element = this.#$("toast");
      element.textContent = text;
      element.style.background = isError ? "#b91c1c" : "#111827";
      element.hidden = false;
      clearTimeout(this.#toastTimer);
      this.#toastTimer = setTimeout(() => (element.hidden = true), 2500);
    }
  }

  document.addEventListener("DOMContentLoaded", () => new UsedPriceApp().init());
})();
