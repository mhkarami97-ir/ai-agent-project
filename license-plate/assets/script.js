(() => {
  "use strict";

  // Province plate codes and landline area codes
  const PROVINCES = [
    {
      name: "تهران",
      plateCode:
        "شهر تهران: ۱۱، ۲۲، ۳۳، ۴۴، ۵۵، ۶۶، ۷۷، ۸۸، ۹۹، ۱۰، ۲۰، ۳۰، ۴۰، ۵۰، ۶۰، ۷۰، ۸۰، ۹۰ | سایر شهرها: ۲۱، ۷۸، ۳۸",
      phoneCode: "۰۲۱",
      cities: "تهران، شمیرانات، ری، اسلامشهر، پاکدشت، شهریار",
    },
    {
      name: "اصفهان",
      plateCode: "شهر اصفهان: ۱۳، ۵۳، ۶۷ | سایر شهرها: ۲۳، ۴۳",
      phoneCode: "۰۳۱",
      cities: "اصفهان، کاشان، نجف‌آباد، خمینی‌شهر، شاهین‌شهر، فلاورجان",
    },
    {
      name: "فارس",
      plateCode: "شهر شیراز: ۶۳، ۹۳ | سایر شهرها: ۷۳، ۸۳",
      phoneCode: "۰۷۱",
      cities: "شیراز، مرودشت، کازرون، جهرم، لار، آباده",
    },
    {
      name: "خراسان رضوی",
      plateCode: "شهر مشهد: ۱۲، ۳۶، ۷۴ | سایر شهرها: ۳۲، ۴۲",
      phoneCode: "۰۵۱",
      cities: "مشهد، نیشابور، سبزوار، تربت حیدریه، قوچان، کاشمر",
    },
    {
      name: "آذربایجان شرقی",
      plateCode: "شهر تبریز: ۱۵ | سایر شهرها: ۲۵، ۳۵",
      phoneCode: "۰۴۱",
      cities: "تبریز، مراغه، مرند، اهر، بناب، میانه",
    },
    {
      name: "خوزستان",
      plateCode: "شهر اهواز: ۱۴ | سایر شهرها: ۲۴، ۳۴",
      phoneCode: "۰۶۱",
      cities: "اهواز، آبادان، خرمشهر، دزفول، بهبهان، ماهشهر",
    },
    {
      name: "مازندران",
      plateCode: "شهر ساری: ۶۲ | سایر شهرها: ۸۲، ۷۲، ۹۲",
      phoneCode: "۰۱۱",
      cities: "ساری، بابل، آمل، قائمشهر، بابلسر، نوشهر",
    },
    {
      name: "گیلان",
      plateCode: "شهر رشت: ۴۶ | سایر شهرها: ۷۶، ۵۶",
      phoneCode: "۰۱۳",
      cities: "رشت، انزلی، لاهیجان، لنگرود، رودسر، آستارا",
    },
    {
      name: "کرمان",
      plateCode: "شهر کرمان: ۴۵ | سایر شهرها: ۶۵، ۷۵",
      phoneCode: "۰۳۴",
      cities: "کرمان، رفسنجان، سیرجان، جیرفت، بم، زرند",
    },
    {
      name: "البرز",
      plateCode: "شهر کرج: ۶۸ | سایر شهرها: ۷۸ (با حرف ط)، ۲۱ (با حرف ص)",
      phoneCode: "۰۲۶",
      cities: "کرج، فردیس، هشتگرد، نظرآباد، طالقان، اشتهارد",
    },
    {
      name: "آذربایجان غربی",
      plateCode: "شهر ارومیه: ۱۷ | سایر شهرها: ۲۷، ۳۷",
      phoneCode: "۰۴۴",
      cities: "ارومیه، خوی، مهاباد، میاندوآب، بوکان، سلماس",
    },
    {
      name: "کرمانشاه",
      plateCode: "شهر کرمانشاه: ۱۹ | سایر شهرها: ۲۹، ۳۹",
      phoneCode: "۰۸۳",
      cities: "کرمانشاه، اسلام‌آبادغرب، سنقر، هرسین، کنگاور، پاوه",
    },
    {
      name: "همدان",
      plateCode: "شهر همدان: ۱۸ | سایر شهرها: ۲۸",
      phoneCode: "۰۸۱",
      cities: "همدان، ملایر، نهاوند، تویسرکان، اسدآباد، رزن",
    },
    {
      name: "قزوین",
      plateCode: "شهر قزوین: ۷۹ | سایر شهرها: ۸۹",
      phoneCode: "۰۲۸",
      cities: "قزوین، تاکستان، آبیک، بوئین‌زهرا، الوند",
    },
    {
      name: "قم",
      plateCode: "شهر قم: ۱۶",
      phoneCode: "۰۲۵",
      cities: "قم، سلفچگان، کهک، جعفریه",
    },
    {
      name: "مرکزی",
      plateCode: "شهر اراک: ۴۷ | سایر شهرها: ۵۷",
      phoneCode: "۰۸۶",
      cities: "اراک، ساوه، خمین، محلات، دلیجان، تفرش",
    },
    {
      name: "سیستان و بلوچستان",
      plateCode: "شهر زاهدان: ۸۵ | سایر شهرها: ۹۵",
      phoneCode: "۰۵۴",
      cities: "زاهدان، زابل، چابهار، ایرانشهر، سراوان، خاش",
    },
    {
      name: "یزد",
      plateCode: "شهر یزد: ۵۴ | سایر شهرها: ۶۴",
      phoneCode: "۰۳۵",
      cities: "یزد، میبد، اردکان، مهریز، بافق، تفت",
    },
    {
      name: "هرمزگان",
      plateCode: "شهر بندرعباس: ۸۴ | سایر شهرها: ۹۴",
      phoneCode: "۰۷۶",
      cities: "بندرعباس، قشم، کیش، بندرلنگه، میناب، جاسک",
    },
    {
      name: "لرستان",
      plateCode: "شهر خرم آباد: ۳۱ | سایر شهرها: ۴۱",
      phoneCode: "۰۶۶",
      cities: "خرم‌آباد، بروجرد، دورود، الیگودرز، کوهدشت، ازنا",
    },
    {
      name: "کردستان",
      plateCode: "شهر سنندج: ۵۱ | سایر شهرها: ۶۱",
      phoneCode: "۰۸۷",
      cities: "سنندج، سقز، مریوان، بانه، قروه، کامیاران",
    },
    {
      name: "سمنان",
      plateCode: "شهر سمنان: ۸۶ | سایر شهرها: ۹۶",
      phoneCode: "۰۲۳",
      cities: "سمنان، شاهرود، دامغان، گرمسار، مهدیشهر",
    },
    {
      name: "زنجان",
      plateCode: "شهر زنجان: ۸۷ | سایر شهرها: ۹۷",
      phoneCode: "۰۲۴",
      cities: "زنجان، ابهر، خدابنده، خرمدره، قیدار، ماه‌نشان",
    },
    {
      name: "اردبیل",
      plateCode: "شهر اردبیل: ۹۱",
      phoneCode: "۰۴۵",
      cities: "اردبیل، پارس‌آباد، خلخال، مشگین‌شهر، نمین، نیر",
    },
    {
      name: "بوشهر",
      plateCode: "شهر بوشهر: ۴۸ | سایر شهرها: ۵۸",
      phoneCode: "۰۷۷",
      cities: "بوشهر، برازجان، گناوه، دیلم، کنگان، دشتستان",
    },
    {
      name: "چهارمحال و بختیاری",
      plateCode: "شهر شهرکرد: ۷۱ | سایر شهرها: ۸۱",
      phoneCode: "۰۳۸",
      cities: "شهرکرد، بروجن، فارسان، لردگان، اردل، سامان",
    },
    {
      name: "کهگیلویه و بویراحمد",
      plateCode: "شهر یاسوج و سایر شهرها: ۴۹",
      phoneCode: "۰۷۴",
      cities: "یاسوج، دهدشت، دوگنبدان، سی‌سخت، دیشموک",
    },
    {
      name: "گلستان",
      plateCode: "شهر گرگان: ۵۹ | سایر شهرها: ۶۹ (با حرف ب)",
      phoneCode: "۰۱۷",
      cities: "گرگان، گنبد کاووس، علی‌آباد کتول، بندر ترکمن، آق‌قلا، کردکوی",
    },
    {
      name: "خراسان شمالی",
      plateCode: "شهر بجنورد: ۲۶ | سایر شهرها: ۷۴ (با حرف ج)",
      phoneCode: "۰۵۸",
      cities: "بجنورد، شیروان، اسفراین، جاجرم، فاروج",
    },
    {
      name: "خراسان جنوبی",
      plateCode: "شهر بیرجند: ۵۲",
      phoneCode: "۰۵۶",
      cities: "بیرجند، قائن، فردوس، طبس، نهبندان",
    },
    {
      name: "ایلام",
      plateCode: "شهر ایلام: ۹۸",
      phoneCode: "۰۸۴",
      cities: "ایلام، دهلران، ایوان، آبدانان، دره‌شهر",
    },
  ];

  // Mobile operators data
  const MOBILE_OPERATORS = [
    {
      operator: "همراه اول",
      codes: [
        "۰۹۱۰",
        "۰۹۱۱",
        "۰۹۱۲",
        "۰۹۱۳",
        "۰۹۱۴",
        "۰۹۱۵",
        "۰۹۱۶",
        "۰۹۱۷",
        "۰۹۱۸",
        "۰۹۱۹",
      ],
    },
    {
      operator: "ایرانسل",
      codes: [
        "۰۹۰۱",
        "۰۹۰۲",
        "۰۹۰۳",
        "۰۹۳۰",
        "۰۹۳۳",
        "۰۹۳۵",
        "۰۹۳۶",
        "۰۹۳۷",
        "۰۹۳۸",
        "۰۹۳۹",
      ],
    },
    {
      operator: "رایتل",
      codes: ["۰۹۲۰", "۰۹۲۱"],
    },
    {
      operator: "تله کیش",
      codes: ["۰۹۳۲"],
    },
    {
      operator: "اپراتور MVNO",
      codes: ["۰۹۰۴", "۰۹۰۵", "۰۹۴۱", "۰۹۹۴"],
    },
  ];

  const FALLBACK_LABELS = Object.freeze({
    label_plate: "کد پلاک",
    label_phone: "پیش‌شماره",
    label_cities: "شهرهای مهم",
  });

  const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

  /* ---------- Pure helpers ---------- */

  class TextNormalizer {
    static normalize(text) {
      return String(text)
        .replace(/[۰-۹]/g, (digit) => PERSIAN_DIGITS.indexOf(digit))
        .replace(/[٠-٩]/g, (digit) => ARABIC_DIGITS.indexOf(digit))
        .replace(/ي/g, "ی")
        .replace(/ك/g, "ک")
        .replace(/\u200c/g, " ")
        .replace(/\s+/g, " ")
        .toLowerCase()
        .trim();
    }

    static matches(haystack, query) {
      const tokens = TextNormalizer.normalize(query).split(" ").filter(Boolean);
      return tokens.every((token) => haystack.includes(token));
    }
  }

  class PlateParser {
    /** "شهر تهران: ۱۱، ۲۲ | سایر شهرها: ۲۱" -> [{ label, codes: [...] }] */
    static parse(plateCode) {
      return plateCode.split("|").map((segment) => {
        const separator = segment.indexOf(":");
        const label =
          separator === -1 ? "" : segment.slice(0, separator).trim();
        const codes = (
          separator === -1 ? segment : segment.slice(separator + 1)
        )
          .split("،")
          .map((code) => code.trim())
          .filter(Boolean);
        return { label, codes };
      });
    }
  }

  const createElement = (tag, className = "", text = "") => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

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

    t(key) {
      return (
        this.#translations[this.#lang]?.[key] ?? FALLBACK_LABELS[key] ?? null
      );
    }

    apply() {
      const html = document.documentElement;
      html.lang = this.#lang;
      html.dir = this.#lang === "fa" ? "rtl" : "ltr";

      for (const element of document.querySelectorAll("[data-i18n]")) {
        const text = this.t(element.dataset.i18n);
        if (text !== null) element.textContent = text;
      }
      for (const element of document.querySelectorAll(
        "[data-i18n-placeholder]",
      )) {
        const text = this.t(element.dataset.i18nPlaceholder);
        if (text !== null) element.placeholder = text;
      }
      for (const element of document.querySelectorAll("[data-i18n-label]")) {
        const text = this.t(element.dataset.i18nLabel);
        if (text !== null) element.setAttribute("aria-label", text);
      }

      const titleKey = document.querySelector("title")?.dataset.i18n;
      const title = titleKey ? this.t(titleKey) : null;
      if (title !== null) document.title = title;
    }
  }

  /** A list of cards that can be filtered without touching the DOM structure. */
  class CardList {
    #container;
    #entries;

    constructor(container, items, createCard, getSearchText) {
      this.#container = container;
      this.#entries = items.map((item) => ({
        element: createCard(item),
        haystack: TextNormalizer.normalize(getSearchText(item)),
      }));
      container.replaceChildren(...this.#entries.map((entry) => entry.element));
    }

    /** @returns {number} how many cards match */
    filter(query) {
      let visible = 0;
      for (const entry of this.#entries) {
        const isMatch = TextNormalizer.matches(entry.haystack, query);
        entry.element.hidden = !isMatch;
        if (isMatch) visible++;
      }
      return visible;
    }
  }

  /* ---------- Application ---------- */

  class PlateCodesApp {
    #i18n = new I18n();
    #lists = new Map();
    #tabs;
    #panels;
    #searchInput;
    #clearButton;
    #noResults;
    #activeTab = "provinces";

    async init() {
      this.#cacheDom();
      await this.#i18n.load();
      this.#buildLists();
      this.#bindEvents();
      this.#applyFilter();
      window.addEventListener("languageChanged", () =>
        window.location.reload(),
      );
    }

    #cacheDom() {
      this.#tabs = [...document.querySelectorAll('[role="tab"][data-tab]')];
      this.#panels = new Map(
        [...document.querySelectorAll('[role="tabpanel"][data-panel]')].map(
          (panel) => [panel.dataset.panel, panel],
        ),
      );
      this.#searchInput = document.getElementById("searchInput");
      this.#clearButton = document.getElementById("clearBtn");
      this.#noResults = document.getElementById("noResults");
    }

    #buildLists() {
      this.#lists.set(
        "provinces",
        new CardList(
          document.getElementById("provincesList"),
          PROVINCES,
          (province) => this.#createProvinceCard(province),
          (province) =>
            `${province.name} ${province.plateCode} ${province.phoneCode} ${province.cities}`,
        ),
      );
      this.#lists.set(
        "mobile",
        new CardList(
          document.getElementById("mobileCodesList"),
          MOBILE_OPERATORS,
          (operator) => this.#createOperatorCard(operator),
          (operator) => `${operator.operator} ${operator.codes.join(" ")}`,
        ),
      );
    }

    #bindEvents() {
      for (const tab of this.#tabs) {
        tab.addEventListener("click", () => this.#switchTab(tab.dataset.tab));
        tab.addEventListener("keydown", (event) => this.#onTabKeydown(event));
      }

      this.#searchInput.addEventListener("input", () => this.#applyFilter());
      this.#clearButton.addEventListener("click", () => {
        this.#searchInput.value = "";
        this.#applyFilter();
        this.#searchInput.focus();
      });
    }

    #onTabKeydown(event) {
      const index = this.#tabs.indexOf(event.currentTarget);
      const isRtl = document.documentElement.dir === "rtl";
      let next = index;

      if (event.key === "ArrowRight") next = isRtl ? index - 1 : index + 1;
      else if (event.key === "ArrowLeft") next = isRtl ? index + 1 : index - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = this.#tabs.length - 1;
      else return;

      event.preventDefault();
      const target = this.#tabs[(next + this.#tabs.length) % this.#tabs.length];
      target.focus();
      this.#switchTab(target.dataset.tab);
    }

    #switchTab(name) {
      this.#activeTab = name;
      for (const tab of this.#tabs) {
        const isActive = tab.dataset.tab === name;
        tab.setAttribute("aria-selected", String(isActive));
        tab.tabIndex = isActive ? 0 : -1;
      }
      for (const [panelName, panel] of this.#panels) {
        panel.hidden = panelName !== name;
      }
      this.#applyFilter();
    }

    #applyFilter() {
      const query = this.#searchInput.value;
      this.#clearButton.hidden = query === "";

      const visible = this.#lists.get(this.#activeTab).filter(query);
      this.#noResults.hidden = visible > 0;
    }

    #createFact(labelKey, content) {
      const fact = createElement("div", "fact");
      fact.append(
        createElement("span", "fact-label", this.#i18n.t(labelKey)),
        content,
      );
      return fact;
    }

    #createProvinceCard(province) {
      const card = createElement("article", "card card--hover province-card");
      card.append(createElement("h3", "province-name", province.name));

      const plates = createElement("div", "plate-groups");
      for (const { label, codes } of PlateParser.parse(province.plateCode)) {
        const group = createElement("div", "plate-group");
        if (label)
          group.append(createElement("span", "plate-group-label", label));

        const list = createElement("div", "code-list");
        list.append(
          ...codes.map((code) => createElement("span", "badge", code)),
        );
        group.append(list);
        plates.append(group);
      }

      const cities = createElement("div", "code-list");
      cities.append(
        ...province.cities
          .split("،")
          .map((city) => createElement("span", "chip", city.trim())),
      );

      card.append(
        this.#createFact("label_plate", plates),
        this.#createFact(
          "label_phone",
          createElement("span", "phone-code", province.phoneCode),
        ),
        this.#createFact("label_cities", cities),
      );
      return card;
    }

    #createOperatorCard(operator) {
      const card = createElement("article", "card card--hover operator-card");
      card.append(createElement("h3", "operator-name", operator.operator));

      const list = createElement("div", "code-list");
      list.append(
        ...operator.codes.map((code) => createElement("span", "badge", code)),
      );
      card.append(list);
      return card;
    }
  }

  new PlateCodesApp().init();
})();
