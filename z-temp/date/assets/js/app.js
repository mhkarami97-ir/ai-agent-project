// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// I18n System
class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('lang') || 'fa';
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const response = await fetch('assets/translations.json');
            this.translations = await response.json();
            this.applyTranslations();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value;
    }

    applyTranslations() {
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLang);
        html.setAttribute('dir', this.currentLang === 'fa' ? 'rtl' : 'ltr');
        
        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
    }
}

const i18n = new I18n();



// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


const form = document.getElementById("convert-form");
const resultBox = document.getElementById("conversion-result");
const ageForm = document.getElementById("age-form");
const ageResult = document.getElementById("age-result");
const saveBtn = document.getElementById("save-last");
const clearBtn = document.getElementById("clear-history");
const historyList = document.getElementById("history-list");

const STORAGE_KEY = "calendar-converter-history";
let lastResult = null;

const formatDate = (label, { yearKey = "y", monthKey = "m", dayKey = "d" } = {}) => (data) => {
  const y = data[label === "jalali" ? "jy" : label === "gregorian" ? "gy" : "hy"];
  const m = data[label === "jalali" ? "jm" : label === "gregorian" ? "gm" : "hm"];
  const d = data[label === "jalali" ? "jd" : label === "gregorian" ? "gd" : "hd"];
  return `${yearKey}: ${y} / ${monthKey}: ${m} / ${dayKey}: ${d}`;
};

const renderConversion = (conversion) => {
  const sections = [
    { name: "شمسی", key: "jalali" },
    { name: "میلادی", key: "gregorian" },
    { name: "قمری", key: "hijri" }
  ];
  resultBox.innerHTML = sections
    .map(({ name, key }) => `<div><strong>${name}:</strong> ${formatDate(key)(conversion[key])}</div>`)
    .join("");
};

const renderAge = (age) => {
  ageResult.innerHTML = `سن شما: <strong>${age.years}</strong> سال، <strong>${age.months}</strong> ماه، <strong>${age.days}</strong> روز`;
};

const showError = (target, message) => {
  target.innerHTML = `<span class="error">${message}</span>`;
};

const readHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch (e) {
    return [];
  }
};

const writeHistory = (records) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const renderHistory = () => {
  const records = readHistory();
  if (!records.length) {
    historyList.innerHTML = "<li>هنوز چیزی ذخیره نشده است.</li>";
    return;
  }
  historyList.innerHTML = records
    .map((record) => `<li><strong>${record.type}</strong> - ${record.text}<br/><small>${record.createdAt}</small></li>`)
    .join("");
};

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const calendar = document.getElementById("source-calendar").value;
  const year = document.getElementById("input-year").value;
  const month = document.getElementById("input-month").value;
  const day = document.getElementById("input-day").value;

  try {
    const conversion = converters.convert({ calendar, year, month, day });
    renderConversion(conversion);
    lastResult = { type: "تبدیل", text: resultBox.textContent };
  } catch (error) {
    showError(resultBox, error.message);
  }
});

ageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const calendar = document.getElementById("age-calendar").value;
  const year = document.getElementById("age-year").value;
  const month = document.getElementById("age-month").value;
  const day = document.getElementById("age-day").value;
  try {
    const age = converters.calcAge({ calendar, year, month, day });
    renderAge(age);
    lastResult = { type: "سن", text: ageResult.textContent };
  } catch (error) {
    showError(ageResult, error.message);
  }
});

saveBtn.addEventListener("click", () => {
  if (!lastResult) return alert("ابتدا یک نتیجه تولید کنید.");
  const records = readHistory();
  records.unshift({ ...lastResult, createdAt: new Date().toLocaleString("fa-IR") });
  writeHistory(records.slice(0, 20));
  renderHistory();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("مطمئن هستید؟")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

renderHistory();

