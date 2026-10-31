(function () {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    settings: "travelTimeSettings",
    history: "travelTimeHistory",
  });
  const LIMITS = Object.freeze({
    maxRows: 500,
    maxHistory: 50,
    maxSpeed: 400,
    maxDistance: 100000,
    legalSpeed: 120,
    saveDelayMs: 300,
  });
  const DEFAULT_SETTINGS = Object.freeze({
    distance: 100,
    minSpeed: 20,
    maxSpeed: 150,
    step: 5,
  });
  const FIELDS = Object.freeze(["distance", "minSpeed", "maxSpeed", "step"]);

  class NumberParser {
    static parse(text) {
      const normalized = String(text)
        .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0)
        .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
        .replace(/[٫,]/g, ".")
        .trim();
      return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : NaN;
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

    formatNumber(value) {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 2 }).format(value);
    }

    formatDate(timestamp) {
      return new Date(timestamp).toLocaleString(this.locale);
    }
  }

  class SpeedTable {
    static validate(params) {
      const { distance, minSpeed, maxSpeed, step } = params;
      if (![distance, minSpeed, maxSpeed, step].every(Number.isFinite)) return "errNumber";
      if (distance <= 0 || distance > LIMITS.maxDistance) return "errDistance";
      if (minSpeed <= 0 || maxSpeed > LIMITS.maxSpeed) return "errSpeedRange";
      if (minSpeed > maxSpeed) return "errMinMax";
      if (step <= 0) return "errStep";
      if (SpeedTable.rowCount(params) > LIMITS.maxRows) return "errTooMany";
      return null;
    }

    static rowCount({ minSpeed, maxSpeed, step }) {
      return Math.floor((maxSpeed - minSpeed) / step + 1e-9) + 1;
    }

    static build(params) {
      const count = SpeedTable.rowCount(params);
      const rows = Array.from({ length: count }, (_, index) => {
        const speed = Math.round((params.minSpeed + index * params.step) * 100) / 100;
        return {
          speed,
          minutes: Math.round((params.distance / speed) * 60),
          overLimit: speed > LIMITS.legalSpeed,
        };
      });
      rows.reverse();
      return rows.map((row, index) => ({
        ...row,
        deltaMinutes: index === 0 ? null : row.minutes - rows[index - 1].minutes,
      }));
    }
  }

  class DurationFormatter {
    #i18n;

    constructor(i18n) {
      this.#i18n = i18n;
    }

    format(totalMinutes) {
      if (totalMinutes < 1) return this.#i18n.t("lessThanMinute");
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const parts = [];
      if (hours > 0) parts.push(this.#i18n.t("hours", { n: this.#i18n.formatNumber(hours) }));
      if (minutes > 0) parts.push(this.#i18n.t("minutes", { n: this.#i18n.formatNumber(minutes) }));
      return parts.join(this.#i18n.t("and"));
    }

    formatDelta(deltaMinutes) {
      if (deltaMinutes === null) return "—";
      if (deltaMinutes <= 0) return this.#i18n.t("noDiff");
      return this.#i18n.t("diffValue", { t: this.format(deltaMinutes) });
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
      return item && FIELDS.every((field) => Number.isFinite(item[field])) && Number.isFinite(item.ts);
    }

    static #sameParams(a, b) {
      return FIELDS.every((field) => a[field] === b[field]);
    }

    get items() {
      return this.#items;
    }

    add(params) {
      this.#items = this.#items.filter((item) => !HistoryRepository.#sameParams(item, params));
      this.#items.unshift({ ...params, id: `${Date.now()}`, ts: Date.now() });
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

  class TravelTimeApp {
    #i18n = new I18n();
    #formatter = new DurationFormatter(this.#i18n);
    #settingsStore = new JsonStore(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    #history = new HistoryRepository();
    #inputs = {};
    #saveTimer = 0;
    #toastTimer = 0;

    async init() {
      await this.#i18n.load("assets/translations.json");
      FIELDS.forEach((field) => (this.#inputs[field] = this.#$(field)));
      this.#fillInputs(this.#loadSettings());
      this.#bindEvents();
      this.#applyLanguage();
    }

    #$(id) {
      return document.getElementById(id);
    }

    #loadSettings() {
      const merged = { ...DEFAULT_SETTINGS, ...this.#settingsStore.read() };
      return FIELDS.every((field) => Number.isFinite(merged[field])) ? merged : { ...DEFAULT_SETTINGS };
    }

    #fillInputs(settings) {
      FIELDS.forEach((field) => (this.#inputs[field].value = settings[field]));
    }

    #readInputs() {
      return Object.fromEntries(
        FIELDS.map((field) => [field, NumberParser.parse(this.#inputs[field].value)]),
      );
    }

    #bindEvents() {
      const form = this.#$("form");
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        this.#commit();
      });
      form.addEventListener("input", () => this.#refresh({ persist: true }));
      form.addEventListener("click", (event) => this.#handleStepper(event));
      document.addEventListener("click", (event) => this.#toggleHelp(event));
      this.#$("resetDefaults").addEventListener("click", () => {
        this.#fillInputs(DEFAULT_SETTINGS);
        this.#refresh({ persist: true });
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

    #handleStepper(event) {
      const button = event.target.closest("[data-field]");
      if (!button) return;
      const field = button.dataset.field;
      const direction = Number(button.dataset.dir);
      const current = this.#readInputs();
      const delta = field === "step" ? 1 : current.step > 0 ? current.step : DEFAULT_SETTINGS.step;
      const base = Number.isFinite(current[field]) ? current[field] : DEFAULT_SETTINGS[field];
      this.#inputs[field].value = Math.max(1, Math.round((base + direction * delta) * 100) / 100);
      this.#refresh({ persist: true });
    }

    #handleHistoryClick(event) {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const item = this.#history.items.find((entry) => entry.id === button.dataset.id);
      if (!item) return;

      if (button.dataset.action === "restore") {
        this.#fillInputs(item);
        this.#refresh({ persist: true });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        this.#history.remove(item.id);
        this.#renderHistory();
      }
    }

    async #clearHistory() {
      if (!(await this.#confirm(this.#i18n.t("confirmHistory")))) return;
      this.#history.clear();
      this.#renderHistory();
    }

    #commit() {
      const params = this.#readInputs();
      const errorKey = SpeedTable.validate(params);
      if (errorKey) return this.#showError(errorKey);

      this.#saveSettings(params);
      if (!this.#history.add(params)) this.#toast(this.#i18n.t("errSave"), true);
      this.#refresh();
      this.#renderHistory();
      this.#toast(this.#i18n.t("saved"));
    }

    #refresh({ persist = false } = {}) {
      const params = this.#readInputs();
      const errorKey = SpeedTable.validate(params);
      this.#showError(errorKey);
      if (errorKey) return;

      this.#renderTable(params);
      if (persist) this.#scheduleSave(params);
    }

    #scheduleSave(params) {
      clearTimeout(this.#saveTimer);
      this.#saveTimer = setTimeout(() => this.#saveSettings(params), LIMITS.saveDelayMs);
    }

    #saveSettings(params) {
      if (!this.#settingsStore.write(params)) this.#toast(this.#i18n.t("errSave"), true);
    }

    #showError(errorKey) {
      const box = this.#$("error");
      box.hidden = !errorKey;
      box.textContent = errorKey ? this.#i18n.t(errorKey) : "";
      if (errorKey) {
        this.#$("rows").textContent = "";
        this.#$("summary").textContent = "";
        this.#$("warning").hidden = true;
      }
    }

    #renderTable(params) {
      const rows = SpeedTable.build(params);
      const fragment = document.createDocumentFragment();

      rows.forEach((row) => fragment.append(this.#createRow(row)));

      this.#$("rows").replaceChildren(fragment);
      this.#$("summary").textContent = this.#i18n.t("summary", {
        d: this.#i18n.formatNumber(params.distance),
        c: this.#i18n.formatNumber(rows.length),
      });

      const warning = this.#$("warning");
      warning.hidden = !rows.some((row) => row.overLimit);
      warning.textContent = this.#i18n.t("warning", {
        limit: this.#i18n.formatNumber(LIMITS.legalSpeed),
      });
    }

    #createRow({ speed, minutes, deltaMinutes, overLimit }) {
      const tr = document.createElement("tr");
      tr.classList.toggle("over", overLimit);

      const speedCell = document.createElement("td");
      speedCell.className = "num";
      speedCell.textContent = this.#i18n.t("speedValue", { n: this.#i18n.formatNumber(speed) });
      if (overLimit) {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = this.#i18n.t("badge");
        speedCell.append(badge);
      }

      const timeCell = document.createElement("td");
      timeCell.className = "num";
      timeCell.textContent = this.#formatter.format(minutes);

      const diffCell = document.createElement("td");
      diffCell.className = "num diff";
      diffCell.textContent = this.#formatter.formatDelta(deltaMinutes);

      tr.append(speedCell, timeCell, diffCell);
      return tr;
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
        d: this.#i18n.formatNumber(item.distance),
        a: this.#i18n.formatNumber(item.minSpeed),
        b: this.#i18n.formatNumber(item.maxSpeed),
        s: this.#i18n.formatNumber(item.step),
      });

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = this.#i18n.formatDate(item.ts);

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
      this.#refresh();
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

  document.addEventListener("DOMContentLoaded", () => new TravelTimeApp().init());
})();
