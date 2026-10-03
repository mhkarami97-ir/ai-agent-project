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


const fileInput = document.getElementById('fileInput');
const formatSelect = document.getElementById('formatSelect');
const qualityRange = document.getElementById('qualityRange');
const qualityValue = document.getElementById('qualityValue');
const convertForm = document.getElementById('convertForm');
const outputContainer = document.getElementById('output');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');

const HISTORY_KEY = 'converter-history';
const MAX_HISTORY = 8;

qualityRange.addEventListener('input', () => {
    qualityValue.textContent = qualityRange.value;
});

function readHistory() {
    try {
        return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    } catch (err) {
        console.error('Reading history failed', err);
        return [];
    }
}

function saveHistory(entries) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
}

function renderHistory() {
    const entries = readHistory();
    historyList.innerHTML = '';

    if (!entries.length) {
        historyList.innerHTML = '<li class="hint">تاریخچه‌ای وجود ندارد.</li>';
        return;
    }

    entries.forEach(({ name, from, to, size, url, time }) => {
        const item = document.createElement('li');
        item.className = 'history-item';
        item.innerHTML = `
            <div>
                <strong>${name}</strong>
                <p class="hint">${from.toUpperCase()} → ${to.toUpperCase()} · ${size}</p>
                <p class="hint">${new Date(time).toLocaleString('fa-IR')}</p>
            </div>
            <button class="ghost" data-url="${url}" download="${name.replace(/\.[^.]+$/, '.' + to)}">دانلود</button>
        `;
        historyList.appendChild(item);
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function convertImage(file, format, quality) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve, reject) => {
        const mime = format === 'jpeg' ? 'image/jpeg' : `image/${format}`;
        canvas.toBlob(
            blob => {
                if (!blob) {
                    reject(new Error('Blobbing failed'));
                    return;
                }
                resolve(blob);
                URL.revokeObjectURL(url);
            },
            mime,
            format === 'png' || format === 'gif' ? undefined : Number(quality)
        );
    });
}

function showOutput(blob, name, format) {
    const convertedUrl = URL.createObjectURL(blob);
    const filename = name.replace(/\.[^.]+$/, '.' + format);

    outputContainer.innerHTML = `
        <div>
            <img src="${convertedUrl}" alt="${filename}" />
            <p>${filename} · ${formatBytes(blob.size)}</p>
            <a class="primary" href="${convertedUrl}" download="${filename}">دانلود فایل</a>
        </div>
    `;

    const history = readHistory();
    history.unshift({
        name,
        from: name.split('.').pop() || '',
        to: format,
        size: formatBytes(blob.size),
        url: convertedUrl,
        time: Date.now(),
    });
    saveHistory(history);
    renderHistory();
}

convertForm.addEventListener('submit', async event => {
    event.preventDefault();
    const file = fileInput.files[0];
    if (!file) {
        alert('لطفاً یک فایل انتخاب کنید.');
        return;
    }

    const format = formatSelect.value;
    const quality = qualityRange.value;

    convertForm.querySelector('button[type="submit"]').disabled = true;
    convertForm.querySelector('button[type="submit"]').textContent = 'در حال تبدیل...';

    try {
        const blob = await convertImage(file, format, quality);
        showOutput(blob, file.name, format);
    } catch (err) {
        console.error(err);
        alert('تبدیل فایل با خطا مواجه شد.');
    } finally {
        convertForm.querySelector('button[type="submit"]').disabled = false;
        convertForm.querySelector('button[type="submit"]').textContent = 'تبدیل کن';
    }
});

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
});

historyList.addEventListener('click', event => {
    if (event.target.matches('button[data-url]')) {
        const url = event.target.getAttribute('data-url');
        const link = document.createElement('a');
        link.href = url;
        link.download = '';
        link.click();
    }
});

renderHistory();

