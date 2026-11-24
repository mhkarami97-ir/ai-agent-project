(function () {
  "use strict";

  const STORAGE_KEY = "sleepCalculatorSettings";
  const MINUTES_PER_DAY = 1440;
  const LIMITS = Object.freeze({
    minAge: 3,
    maxAge: 120,
    minCycle: 60,
    maxCycle: 120,
    maxLatency: 60,
    minCycles: 3,
    maxSleepHours: 14,
    saveDelayMs: 300,
  });
  const DEFAULT_SETTINGS = Object.freeze({
    mode: "bed",
    bedTime: "23:00",
    wakeTime: "07:00",
    age: 30,
    cycleMinutes: 90,
    latencyMinutes: 15,
  });
  const AGE_BANDS = Object.freeze([
    { maxAge: 5, min: 10, max: 13 },
    { maxAge: 13, min: 9, max: 11 },
    { maxAge: 17, min: 8, max: 10 },
    { maxAge: 64, min: 7, max: 9 },
    { maxAge: Infinity, min: 7, max: 8 },
  ]);
  const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

  class NumberParser {
    static parseInteger(text) {
      const normalized = String(text)
        .replace(/[۰-۹]/g, (d) => d.charCodeAt(0) - 0x06f0)
        .replace(/[٠-٩]/g, (d) => d.charCodeAt(0) - 0x0660)
        .trim();
      return /^\d+$/.test(normalized) ? Number(normalized) : NaN;
    }
  }

  class JsonStore {
    #key;

    constructor(key) {
      this.#key = key;
    }

    read() {
      try {
        return JSON.parse(localStorage.getItem(this.#key)) ?? {};
      } catch {
        return {};
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

    number(value) {
      return new Intl.NumberFormat(this.locale, { maximumFractionDigits: 1 }).format(value);
    }
  }

  class TimeOfDay {
    static toMinutes(text) {
      const match = TIME_PATTERN.exec(text);
      return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
    }

    static now() {
      const date = new Date();
      const pad = (value) => String(value).padStart(2, "0");
      return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }
  }

  class SleepGuidelines {
    static forAge(age) {
      const { min, max } = AGE_BANDS.find((band) => age <= band.maxAge);
      return { min, max };
    }
  }

  class SleepPlanner {
    static validate({ timeMinutes, age, cycleMinutes, latencyMinutes }) {
      if (!Number.isFinite(timeMinutes)) return "errTime";
      if (!Number.isFinite(age) || age < LIMITS.minAge || age > LIMITS.maxAge) return "errAge";
      if (!Number.isFinite(cycleMinutes) || cycleMinutes < LIMITS.minCycle || cycleMinutes > LIMITS.maxCycle) {
        return "errCycle";
      }
      if (!Number.isFinite(latencyMinutes) || latencyMinutes < 0 || latencyMinutes > LIMITS.maxLatency) {
        return "errLatency";
      }
      return null;
    }

    static plan({ mode, timeMinutes, cycleMinutes, latencyMinutes, range }) {
      const options = [];
      for (let cycles = LIMITS.minCycles; cycles * cycleMinutes <= LIMITS.maxSleepHours * 60; cycles++) {
        options.push(SleepPlanner.#buildOption({ mode, timeMinutes, cycleMinutes, latencyMinutes, range, cycles }));
      }
      SleepPlanner.#markBest(options, range);
      return options;
    }

    static #buildOption({ mode, timeMinutes, cycleMinutes, latencyMinutes, range, cycles }) {
      const sleepMinutes = cycles * cycleMinutes;
      const offset = sleepMinutes + latencyMinutes;
      const absolute = mode === "bed" ? timeMinutes + offset : timeMinutes - offset;
      const hours = sleepMinutes / 60;
      const status = hours < range.min ? "short" : hours > range.max ? "long" : "ok";

      return {
        cycles,
        sleepMinutes,
        status,
        isBest: false,
        dayShift: Math.floor(absolute / MINUTES_PER_DAY),
        minuteOfDay: ((absolute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY,
      };
    }

    static #markBest(options, range) {
      const target = (range.min + range.max) / 2;
      const inRange = options.filter((option) => option.status === "ok");
      if (inRange.length === 0) return;
      const best = inRange.reduce((closest, option) =>
        Math.abs(option.sleepMinutes / 60 - target) < Math.abs(closest.sleepMinutes / 60 - target) ? option : closest,
      );
      best.isBest = true;
    }
  }

  class SleepFormatter {
    #i18n;

    constructor(i18n) {
      this.#i18n = i18n;
    }

    time(minuteOfDay) {
      return new Intl.DateTimeFormat(this.#i18n.locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2000, 0, 1, 0, minuteOfDay)));
    }

    duration(totalMinutes) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      const parts = [];
      if (hours > 0) parts.push(this.#i18n.t("hours", { n: this.#i18n.number(hours) }));
      if (minutes > 0) parts.push(this.#i18n.t("minutes", { n: this.#i18n.number(minutes) }));
      return parts.join(this.#i18n.t("and"));
    }

    day(dayShift, mode) {
      if (dayShift === 0) return "";
      if (dayShift > 0) return this.#i18n.t("dayNext");
      return this.#i18n.t(mode === "bed" ? "dayPrev" : "nightBefore");
    }
  }

  class SleepApp {
    #i18n = new I18n();
    #formatter = new SleepFormatter(this.#i18n);
    #store = new JsonStore(STORAGE_KEY);
    #settings = { ...DEFAULT_SETTINGS };
    #saveTimer = 0;
    #toastTimer = 0;

    async init() {
      await this.#i18n.load("assets/translations.json");
      this.#settings = this.#loadSettings();
      this.#fillInputs();
      this.#bindEvents();
      this.#applyLanguage();
    }

    #$(id) {
      return document.getElementById(id);
    }

    #loadSettings() {
      const stored = this.#store.read();
      const settings = { ...DEFAULT_SETTINGS };
      if (stored.mode === "bed" || stored.mode === "wake") settings.mode = stored.mode;
      ["bedTime", "wakeTime"].forEach((key) => {
        if (TIME_PATTERN.test(stored[key])) settings[key] = stored[key];
      });
      ["age", "cycleMinutes", "latencyMinutes"].forEach((key) => {
        if (Number.isFinite(stored[key])) settings[key] = stored[key];
      });
      return settings;
    }

    #fillInputs() {
      this.#$("age").value = this.#settings.age;
      this.#$("cycleMinutes").value = this.#settings.cycleMinutes;
      this.#$("latencyMinutes").value = this.#settings.latencyMinutes;
      document.querySelector(`input[name="mode"][value="${this.#settings.mode}"]`).checked = true;
      this.#syncTimeInput();
    }

    #timeKey() {
      return this.#settings.mode === "bed" ? "bedTime" : "wakeTime";
    }

    #syncTimeInput() {
      this.#$("time").value = this.#settings[this.#timeKey()];
    }

    #bindEvents() {
      this.#$("form").addEventListener("input", (event) => this.#handleInput(event));
      this.#$("form").addEventListener("submit", (event) => event.preventDefault());
      this.#$("now").addEventListener("click", () => {
        this.#$("time").value = TimeOfDay.now();
        this.#handleInput({ target: this.#$("time") });
      });
      this.#$("resetAdvanced").addEventListener("click", () => {
        this.#$("cycleMinutes").value = DEFAULT_SETTINGS.cycleMinutes;
        this.#$("latencyMinutes").value = DEFAULT_SETTINGS.latencyMinutes;
        this.#handleInput({ target: this.#$("cycleMinutes") });
      });
      document.addEventListener("click", (event) => this.#toggleHelp(event));
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
      if (event.target.name === "mode") {
        this.#settings.mode = event.target.value;
        this.#syncTimeInput();
        this.#applyLanguage();
      }
      this.#collectSettings();
      this.#render();
      this.#scheduleSave();
    }

    #collectSettings() {
      const time = this.#$("time").value;
      if (TIME_PATTERN.test(time)) this.#settings[this.#timeKey()] = time;
      const numbers = {
        age: NumberParser.parseInteger(this.#$("age").value),
        cycleMinutes: NumberParser.parseInteger(this.#$("cycleMinutes").value),
        latencyMinutes: NumberParser.parseInteger(this.#$("latencyMinutes").value),
      };
      Object.entries(numbers).forEach(([key, value]) => {
        if (Number.isFinite(value)) this.#settings[key] = value;
      });
    }

    #readParams() {
      return {
        mode: this.#settings.mode,
        timeMinutes: TimeOfDay.toMinutes(this.#$("time").value),
        age: NumberParser.parseInteger(this.#$("age").value),
        cycleMinutes: NumberParser.parseInteger(this.#$("cycleMinutes").value),
        latencyMinutes: NumberParser.parseInteger(this.#$("latencyMinutes").value),
      };
    }

    #render() {
      const params = this.#readParams();
      const errorKey = SleepPlanner.validate(params);
      const errorBox = this.#$("error");
      errorBox.hidden = !errorKey;
      errorBox.textContent = errorKey ? this.#i18n.t(errorKey) : "";

      if (errorKey) {
        this.#$("options").replaceChildren();
        this.#$("summary").textContent = "";
        return;
      }

      const range = SleepGuidelines.forAge(params.age);
      const options = SleepPlanner.plan({ ...params, range });
      this.#$("summary").textContent = this.#i18n.t("summary", {
        age: this.#i18n.number(params.age),
        min: this.#i18n.number(range.min),
        max: this.#i18n.number(range.max),
        latency: this.#i18n.number(params.latencyMinutes),
      });
      this.#$("options").replaceChildren(...options.map((option) => this.#createOption(option)));
    }

    #createOption(option) {
      const item = document.createElement("li");
      item.className = `opt ${option.status}`;

      const time = document.createElement("div");
      const clock = document.createElement("span");
      clock.className = "opt-time num";
      clock.textContent = this.#formatter.time(option.minuteOfDay);
      time.append(clock);

      const dayText = this.#formatter.day(option.dayShift, this.#settings.mode);
      if (dayText) {
        const day = document.createElement("span");
        day.className = "opt-day";
        day.textContent = `(${dayText})`;
        time.append(day);
      }

      const meta = document.createElement("div");
      meta.className = "opt-meta";
      const sleep = document.createElement("span");
      sleep.className = "num";
      sleep.textContent = this.#i18n.t("sleepInfo", {
        c: this.#i18n.number(option.cycles),
        d: this.#formatter.duration(option.sleepMinutes),
      });
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = this.#i18n.t(`status_${option.status}`);
      meta.append(sleep, badge);

      if (option.isBest) {
        const best = document.createElement("span");
        best.className = "badge best";
        best.textContent = this.#i18n.t("best");
        meta.append(best);
      }

      item.append(time, meta);
      return item;
    }

    #scheduleSave() {
      clearTimeout(this.#saveTimer);
      this.#saveTimer = setTimeout(() => {
        if (!this.#store.write(this.#settings)) this.#toast(this.#i18n.t("errSave"));
      }, LIMITS.saveDelayMs);
    }

    #applyLanguage() {
      const isBed = this.#settings.mode === "bed";
      this.#$("label_time").dataset.i18n = isBed ? "timeBed" : "timeWake";
      this.#$("help_time").dataset.i18n = isBed ? "help_timeBed" : "help_timeWake";
      this.#$("resultsTitle").dataset.i18n = isBed ? "resultsBed" : "resultsWake";

      document.documentElement.lang = this.#i18n.lang;
      document.documentElement.dir = this.#i18n.lang === "fa" ? "rtl" : "ltr";
      document.title = this.#i18n.t("title");
      document
        .querySelectorAll("[data-i18n]")
        .forEach((element) => (element.textContent = this.#i18n.t(element.dataset.i18n)));
      document
        .querySelectorAll("[data-i18n-aria]")
        .forEach((element) => element.setAttribute("aria-label", this.#i18n.t(element.dataset.i18nAria)));
      this.#render();
    }

    #toast(text) {
      const element = this.#$("toast");
      element.textContent = text;
      element.hidden = false;
      clearTimeout(this.#toastTimer);
      this.#toastTimer = setTimeout(() => (element.hidden = true), 2500);
    }
  }

  document.addEventListener("DOMContentLoaded", () => new SleepApp().init());
})();
