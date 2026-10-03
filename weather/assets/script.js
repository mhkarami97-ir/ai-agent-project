(() => {
  "use strict";

  const API = Object.freeze({
    forecast: "https://api.open-meteo.com/v1/forecast",
    geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  });
  const STORAGE_KEYS = Object.freeze({
    location: "weather_location_v2",
    cache: "weather_cache_v2",
  });
  const CACHE_TTL_MS = 10 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 10_000;
  const MIN_QUERY_LENGTH = 2;
  const MAX_SUGGESTIONS = 6;

  const DEFAULT_LOCATION = Object.freeze({
    name: { fa: "تهران", en: "Tehran" },
    country: { fa: "ایران", en: "Iran" },
    latitude: 35.6892,
    longitude: 51.389,
    timezone: "Asia/Tehran",
  });

  /* ---------- Pure logic (no DOM) ---------- */

  class WeatherCodes {
    static #KNOWN = new Set([
      0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75,
      77, 80, 81, 82, 85, 86, 95, 96, 97, 99,
    ]);

    static labelKey(code) {
      return WeatherCodes.#KNOWN.has(code) ? `wmo_${code}` : "wmo_unknown";
    }

    /** Groups WMO codes into the icons/tones we can draw. */
    static group(code, isDay = true) {
      if (code === 0 || code === 1) return isDay ? "clear" : "night";
      if (code === 2) return isDay ? "partly" : "cloud";
      if (code === 3) return "cloud";
      if (code === 45 || code === 48) return "fog";
      if (code >= 51 && code <= 57) return "drizzle";
      if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82))
        return "rain";
      if ((code >= 71 && code <= 77) || code === 85 || code === 86)
        return "snow";
      if (code >= 95 && code <= 99) return "storm";
      return "cloud";
    }
  }

  class OpenMeteo {
    static geocodingUrl(query, lang) {
      const params = new URLSearchParams({
        name: query.trim(),
        count: String(MAX_SUGGESTIONS),
        language: lang,
        format: "json",
      });
      return `${API.geocoding}?${params}`;
    }

    static forecastUrl(latitude, longitude) {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current:
          "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m",
        daily:
          "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        timezone: "auto",
        forecast_days: "7",
      });
      return `${API.forecast}?${params}`;
    }

    static parseGeocoding(json) {
      if (!Array.isArray(json?.results)) return [];
      return json.results
        .filter(
          (item) =>
            Number.isFinite(item.latitude) && Number.isFinite(item.longitude),
        )
        .map((item) => ({
          name: item.name,
          region: item.admin1 ?? "",
          country: item.country ?? "",
          latitude: item.latitude,
          longitude: item.longitude,
          timezone: item.timezone ?? "",
        }));
    }

    static parseForecast(json) {
      const current = json?.current;
      const daily = json?.daily;
      if (!current || !Array.isArray(daily?.time))
        throw new TypeError("Unexpected forecast response");

      return {
        timezone: json.timezone ?? "",
        current: {
          time: current.time,
          temperature: current.temperature_2m ?? null,
          feelsLike: current.apparent_temperature ?? null,
          humidity: current.relative_humidity_2m ?? null,
          wind: current.wind_speed_10m ?? null,
          code: current.weather_code ?? null,
          isDay: current.is_day !== 0,
        },
        daily: daily.time.map((date, index) => ({
          date,
          code: daily.weather_code?.[index] ?? null,
          max: daily.temperature_2m_max?.[index] ?? null,
          min: daily.temperature_2m_min?.[index] ?? null,
          rainChance: daily.precipitation_probability_max?.[index] ?? null,
        })),
      };
    }

    /** "Karaj, Alborz, Iran" without repeating identical parts. */
    static describeLocation({ name, region, country }, separator = ", ") {
      return [name, region, country]
        .filter((part, index, all) => part && all.indexOf(part) === index)
        .join(separator);
    }
  }

  class WeatherCache {
    static key(latitude, longitude) {
      return `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    }

    read(key) {
      try {
        const entry = JSON.parse(localStorage.getItem(STORAGE_KEYS.cache))?.[
          key
        ];
        return entry && typeof entry.savedAt === "number" ? entry : null;
      } catch {
        return null;
      }
    }

    write(key, data) {
      try {
        // Only the latest place is kept: this cache is for flaky connections, not history
        localStorage.setItem(
          STORAGE_KEYS.cache,
          JSON.stringify({ [key]: { savedAt: Date.now(), data } }),
        );
      } catch {
        // storage full or blocked: caching is optional
      }
    }

    static isFresh(entry, now = Date.now()) {
      return now - entry.savedAt < CACHE_TTL_MS;
    }
  }

  /* ---------- Icons ---------- */

  const ICONS = Object.freeze({
    clear:
      '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    night: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    partly:
      '<path d="M12 2v2M4.9 4.9l1.4 1.4M20 12h2M19.1 4.9l-1.4 1.4"/><path d="M15.9 12.7a4 4 0 0 0-5.9-4.2"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6z"/>',
    cloud: '<path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    fog: '<path d="M17 9a5 5 0 0 0-9.8-1.2A4 4 0 0 0 7 16h10a3.5 3.5 0 0 0 0-7z"/><path d="M4 19h16M7 22.5h10"/>',
    drizzle:
      '<path d="M8 19v2M8 13v2M16 19v2M16 13v2M12 21v2M12 15v2"/><path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3"/>',
    rain: '<path d="M16 13v8M8 13v8M12 15v8"/><path d="M20 16.6A5 5 0 0 0 18 7h-1.3A8 8 0 1 0 4 15.3"/>',
    snow: '<path d="M20 17.6A5 5 0 0 0 18 8h-1.3A8 8 0 1 0 4 16.3"/><path d="M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01"/>',
    storm:
      '<path d="M19 16.9A5 5 0 0 0 18 7h-1.3a8 8 0 1 0-11.6 9"/><path d="m13 11-4 6h6l-4 6"/>',
  });

  const createIcon = (group, className = "wx-icon") => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("class", className);
    svg.innerHTML = ICONS[group] ?? ICONS.cloud; // constants above, never user input
    return svg;
  };

  /* ---------- Services ---------- */

  class I18n {
    #translations = {};
    #lang = localStorage.getItem("lang") || "fa";

    get lang() {
      return this.#lang;
    }

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

  const fetchJson = async (url, parentSignal) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    parentSignal?.addEventListener("abort", () => controller.abort(), {
      once: true,
    });

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  /* ---------- Application ---------- */

  class WeatherApp {
    #i18n = new I18n();
    #cache = new WeatherCache();
    #dom;
    #place = null;
    #request = null;

    async init() {
      this.#cacheDom();
      await this.#i18n.load();
      this.#bindEvents();
      await this.#loadWeather(this.#readSavedPlace());
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #cacheDom() {
      const byId = (id) => document.getElementById(id);
      this.#dom = {
        form: byId("searchForm"),
        input: byId("cityInput"),
        locate: byId("locateBtn"),
        suggestions: byId("suggestions"),
        status: byId("statusMessage"),
        retry: byId("retryBtn"),
        current: byId("current"),
        icon: byId("weatherIcon"),
        temperature: byId("temperature"),
        place: byId("cityName"),
        description: byId("description"),
        updated: byId("updated"),
        feelsLike: byId("feelsLike"),
        humidity: byId("humidity"),
        wind: byId("windSpeed"),
        rain: byId("rainChance"),
        forecastCard: byId("forecast"),
        forecast: byId("forecastList"),
      };
    }

    #bindEvents() {
      const dom = this.#dom;

      dom.form.addEventListener("submit", (event) => {
        event.preventDefault();
        this.#search(dom.input.value);
      });
      dom.locate.addEventListener("click", () => this.#useCurrentPosition());
      dom.retry.addEventListener("click", () => this.#loadWeather(this.#place));

      dom.suggestions.addEventListener("click", (event) => {
        const button = event.target.closest("button[data-index]");
        if (!button) return;
        const place = this.#suggestionPlaces[Number(button.dataset.index)];
        this.#hideSuggestions();
        dom.input.value = "";
        this.#loadWeather(place);
      });
    }

    /* ----- place handling ----- */

    #suggestionPlaces = [];

    #readSavedPlace() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.location));
        if (
          Number.isFinite(saved?.latitude) &&
          Number.isFinite(saved?.longitude)
        )
          return saved;
      } catch {
        // fall through to default
      }
      const lang = this.#i18n.lang;
      return {
        name: DEFAULT_LOCATION.name[lang],
        region: "",
        country: DEFAULT_LOCATION.country[lang],
        latitude: DEFAULT_LOCATION.latitude,
        longitude: DEFAULT_LOCATION.longitude,
        timezone: DEFAULT_LOCATION.timezone,
      };
    }

    async #search(rawQuery) {
      const query = rawQuery.trim();
      this.#hideSuggestions();
      if ([...query].length < MIN_QUERY_LENGTH)
        return this.#showStatus("error_short", "warning");

      this.#setLoading(true);
      try {
        const results = OpenMeteo.parseGeocoding(
          await fetchJson(OpenMeteo.geocodingUrl(query, this.#i18n.lang)),
        );

        if (results.length === 0) {
          this.#setLoading(false);
          return this.#showStatus("error_not_found", "warning");
        }
        if (results.length === 1) {
          this.#dom.input.value = "";
          return this.#loadWeather(results[0]);
        }
        this.#setLoading(false);
        this.#showSuggestions(results);
      } catch (error) {
        console.warn("geocoding failed", error);
        this.#setLoading(false);
        this.#showStatus("error_network", "danger");
      }
    }

    #useCurrentPosition() {
      if (!("geolocation" in navigator))
        return this.#showStatus("error_geolocation_unsupported", "warning");

      this.#setLoading(true);
      navigator.geolocation.getCurrentPosition(
        ({ coords }) =>
          this.#loadWeather({
            name: this.#i18n.t("my_location"),
            region: "",
            country: "",
            latitude: coords.latitude,
            longitude: coords.longitude,
            timezone: "",
          }),
        () => {
          this.#setLoading(false);
          this.#showStatus("error_geolocation_denied", "warning");
        },
        { timeout: 10_000, maximumAge: 10 * 60 * 1000 },
      );
    }

    #showSuggestions(places) {
      this.#suggestionPlaces = places;
      this.#dom.suggestions.replaceChildren(
        ...places.map((place, index) => {
          const item = document.createElement("li");
          const button = document.createElement("button");
          button.type = "button";
          button.className = "suggestion";
          button.dataset.index = String(index);

          const name = document.createElement("strong");
          name.textContent = place.name;
          const details = document.createElement("span");
          details.className = "muted";
          details.textContent = [place.region, place.country]
            .filter(Boolean)
            .join("، ");

          button.append(name, details);
          item.append(button);
          return item;
        }),
      );
      this.#dom.suggestions.hidden = false;
      this.#dom.suggestions.querySelector("button")?.focus();
    }

    #hideSuggestions() {
      this.#dom.suggestions.hidden = true;
      this.#dom.suggestions.replaceChildren();
      this.#suggestionPlaces = [];
    }

    /* ----- loading ----- */

    async #loadWeather(place) {
      this.#request?.abort();
      this.#request = new AbortController();
      const { signal } = this.#request;

      this.#place = place;
      this.#hideStatus();
      this.#setLoading(true);

      const key = WeatherCache.key(place.latitude, place.longitude);
      const cached = this.#cache.read(key);

      try {
        if (cached && WeatherCache.isFresh(cached)) {
          this.#render(place, cached.data);
        } else {
          const forecast = OpenMeteo.parseForecast(
            await fetchJson(
              OpenMeteo.forecastUrl(place.latitude, place.longitude),
              signal,
            ),
          );
          this.#cache.write(key, forecast);
          this.#render(place, forecast);
        }
        this.#savePlace(place);
      } catch (error) {
        if (signal.aborted) return; // superseded by a newer request
        console.warn("weather failed", error);

        if (cached) {
          this.#render(place, cached.data);
          this.#showStatus("offline_notice", "warning");
        } else {
          this.#showStatus("error_network", "danger", { canRetry: true });
        }
      } finally {
        if (this.#request.signal === signal) this.#setLoading(false);
      }
    }

    #savePlace(place) {
      try {
        localStorage.setItem(STORAGE_KEYS.location, JSON.stringify(place));
      } catch {
        // storage blocked: the app still works, it just forgets the last place
      }
    }

    #setLoading(isLoading) {
      this.#dom.current.toggleAttribute("aria-busy", isLoading);
      this.#dom.current.classList.toggle("is-loading", isLoading);
      this.#dom.locate.disabled = isLoading;
    }

    #showStatus(messageKey, variant, { canRetry = false } = {}) {
      this.#dom.status.className = `alert alert--${variant}`;
      this.#dom.status.firstElementChild.textContent = this.#i18n.t(messageKey);
      this.#dom.retry.hidden = !canRetry;
      this.#dom.status.hidden = false;
    }

    #hideStatus() {
      this.#dom.status.hidden = true;
    }

    /* ----- rendering ----- */

    #render(place, forecast) {
      const dom = this.#dom;
      const { current } = forecast;
      const number = new Intl.NumberFormat(this.#i18n.locale, {
        maximumFractionDigits: 0,
      });
      const percentSign = this.#i18n.lang === "fa" ? "٪" : "%";
      const degrees = (value) =>
        value === null ? "—" : `${number.format(Math.round(value))}°`;
      const percent = (value) =>
        value === null || value === undefined
          ? "—"
          : `${number.format(value)}${percentSign}`;
      const group = WeatherCodes.group(current.code, current.isDay);

      dom.current.hidden = false;
      dom.current.dataset.tone = group;
      dom.icon.replaceChildren(createIcon(group, "wx-icon wx-icon--hero"));
      dom.temperature.textContent = degrees(current.temperature);
      dom.place.textContent = OpenMeteo.describeLocation(
        place,
        this.#i18n.lang === "fa" ? "، " : ", ",
      );
      dom.description.textContent = this.#i18n.t(
        WeatherCodes.labelKey(current.code),
      );
      dom.updated.textContent = this.#i18n.t("updated", {
        time: this.#formatTime(current.time),
      });
      dom.feelsLike.textContent = degrees(current.feelsLike);
      dom.humidity.textContent = percent(current.humidity);
      dom.wind.textContent =
        current.wind === null
          ? "—"
          : `${number.format(Math.round(current.wind))} ${this.#i18n.t("unit_kmh")}`;

      dom.rain.textContent = percent(forecast.daily[0]?.rainChance);

      this.#renderForecast(forecast.daily, degrees);
    }

    #renderForecast(days, degrees) {
      const weekday = new Intl.DateTimeFormat(this.#i18n.locale, {
        weekday: "short",
        timeZone: "UTC",
      });

      this.#dom.forecastCard.hidden = days.length === 0;
      this.#dom.forecast.replaceChildren(
        ...days.map((day, index) => {
          const item = document.createElement("li");
          item.className = "day";

          const name = document.createElement("span");
          name.className = "day-name";
          name.textContent =
            index === 0
              ? this.#i18n.t("today")
              : weekday.format(new Date(`${day.date}T00:00:00Z`));

          const group = WeatherCodes.group(day.code ?? -1, true);
          const icon = createIcon(group, "wx-icon");
          icon.setAttribute("role", "img");
          icon.removeAttribute("aria-hidden");
          icon.setAttribute(
            "aria-label",
            this.#i18n.t(WeatherCodes.labelKey(day.code)),
          );

          const range = document.createElement("span");
          range.className = "day-range";
          const max = document.createElement("strong");
          max.textContent = degrees(day.max);
          const min = document.createElement("span");
          min.className = "muted";
          min.textContent = degrees(day.min);
          range.append(max, min);

          item.append(name, icon, range);
          return item;
        }),
      );
    }

    #formatTime(isoLocal) {
      // "2026-10-03T14:15" is already local time at the place, so format it as-is
      const date = new Date(`${isoLocal}:00Z`);
      if (Number.isNaN(date.getTime())) return "—";
      return new Intl.DateTimeFormat(this.#i18n.locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }).format(date);
    }
  }

  new WeatherApp().init();
})();
