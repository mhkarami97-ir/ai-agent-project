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
    location.reload();
});

const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const topTextInput = document.getElementById('topText');
const bottomTextInput = document.getElementById('bottomText');
const textColorInput = document.getElementById('textColor');
const fontSizeInput = document.getElementById('fontSize');
const imageUploadInput = document.getElementById('imageUpload');
const downloadButton = document.getElementById('downloadButton');
const resetButton = document.getElementById('resetButton');
const templateButtons = document.querySelectorAll('.template-card');
const statusMessage = document.getElementById('statusMessage');
const STORAGE_KEY = 'persianMemeState';

canvas.width = 750;
canvas.height = 600;

let currentImage = new Image();
currentImage.crossOrigin = 'anonymous';

function drawMeme() {
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (currentImage.src) {
    ctx.drawImage(currentImage, 0, 0, canvas.width, canvas.height);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = textColorInput.value;
  ctx.font = `${fontSizeInput.value}px Vazirmt`;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 6;
  ctx.lineJoin = 'round';

  const padding = 24;
  const topY = padding + parseInt(fontSizeInput.value, 10);
  ctx.strokeText(topTextInput.value.toUpperCase(), canvas.width - padding, topY);
  ctx.fillText(topTextInput.value.toUpperCase(), canvas.width - padding, topY);

  const bottomY = canvas.height - padding;
  ctx.strokeText(bottomTextInput.value.toUpperCase(), canvas.width - padding, bottomY);
  ctx.fillText(bottomTextInput.value.toUpperCase(), canvas.width - padding, bottomY);
}

function saveState() {
  const state = {
    topText: topTextInput.value,
    bottomText: bottomTextInput.value,
    color: textColorInput.value,
    size: fontSizeInput.value,
    image: currentImage.src,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const state = JSON.parse(saved);
    topTextInput.value = state.topText || '';
    bottomTextInput.value = state.bottomText || '';
    textColorInput.value = state.color || '#ffffff';
    fontSizeInput.value = state.size || 48;
    if (state.image) {
      currentImage.src = state.image;
      currentImage.onload = drawMeme;
    }
  }
}

function handleTemplateClick(event) {
  const card = event.currentTarget;
  const src = card.dataset.src;
  currentImage.src = src;
  currentImage.onload = () => {
    drawMeme();
    saveState();
  };
  statusMessage.textContent = 'قالب جدید بارگذاری شد.';
}

function handleUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    currentImage.src = reader.result;
    currentImage.onload = () => {
      drawMeme();
      saveState();
    };
    statusMessage.textContent = 'تصویر بارگذاری شد.';
  };
  reader.readAsDataURL(file);
}

function handleInputChange() {
  drawMeme();
  saveState();
  statusMessage.textContent = 'تغییرات ذخیره شد.';
}

templateButtons.forEach((btn) => btn.addEventListener('click', handleTemplateClick));
imageUploadInput.addEventListener('change', handleUpload);
topTextInput.addEventListener('input', handleInputChange);
bottomTextInput.addEventListener('input', handleInputChange);
textColorInput.addEventListener('input', handleInputChange);
fontSizeInput.addEventListener('input', handleInputChange);

downloadButton.addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = 'memeru.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

resetButton.addEventListener('click', () => {
  topTextInput.value = '';
  bottomTextInput.value = '';
  textColorInput.value = '#ffffff';
  fontSizeInput.value = 48;
  currentImage = new Image();
  currentImage.crossOrigin = 'anonymous';
  drawMeme();
  localStorage.removeItem(STORAGE_KEY);
  statusMessage.textContent = 'شروع دوباره انجام شد.';
});

loadState();
drawMeme();

