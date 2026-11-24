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


// State Management
const state = {
    currentLanguage: 'html',
    inputCode: '',
    outputCode: ''
};

// DOM Elements
const elements = {
    inputCode: document.getElementById('inputCode'),
    outputCode: document.getElementById('outputCode'),
    langBtns: document.querySelectorAll('.lang-btn'),
    formatBtn: document.getElementById('formatBtn'),
    compressBtn: document.getElementById('compressBtn'),
    pasteBtn: document.getElementById('pasteBtn'),
    copyBtn: document.getElementById('copyBtn'),
    clearInputBtn: document.getElementById('clearInputBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    fileInput: document.getElementById('fileInput'),
    inputStats: document.getElementById('inputStats'),
    outputStats: document.getElementById('outputStats'),
    compressionRatio: document.getElementById('compressionRatio'),
    removeComments: document.getElementById('removeComments'),
    removeWhitespace: document.getElementById('removeWhitespace'),
    indentSize: document.getElementById('indentSize'),
    notification: document.getElementById('notification')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    initEventListeners();
    updateStats();
});

// Event Listeners
function initEventListeners() {
    // Language selection
    elements.langBtns.forEach(btn => {
        btn.addEventListener('click', () => handleLanguageChange(btn.dataset.lang));
    });

    // Action buttons
    elements.formatBtn.addEventListener('click', handleFormat);
    elements.compressBtn.addEventListener('click', handleCompress);
    elements.pasteBtn.addEventListener('click', handlePaste);
    elements.copyBtn.addEventListener('click', handleCopy);
    elements.clearInputBtn.addEventListener('click', handleClearInput);
    elements.downloadBtn.addEventListener('click', handleDownload);
    elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileUpload);

    // Input change
    elements.inputCode.addEventListener('input', () => {
        state.inputCode = elements.inputCode.value;
        updateStats();
        saveToLocalStorage();
    });

    // Options change
    elements.removeComments.addEventListener('change', saveToLocalStorage);
    elements.removeWhitespace.addEventListener('change', saveToLocalStorage);
    elements.indentSize.addEventListener('change', saveToLocalStorage);
}

// Language Change Handler
function handleLanguageChange(lang) {
    state.currentLanguage = lang;
    elements.langBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    saveToLocalStorage();
}

// Format Handler
function handleFormat() {
    const input = elements.inputCode.value.trim();
    
    if (!input) {
        showNotification('لطفاً کدی وارد کنید', 'warning');
        return;
    }

    try {
        let formatted;
        const indentSize = parseInt(elements.indentSize.value);

        switch (state.currentLanguage) {
            case 'html':
                formatted = formatHTML(input, indentSize);
                break;
            case 'css':
                formatted = formatCSS(input, indentSize);
                break;
            case 'js':
                formatted = formatJS(input, indentSize);
                break;
        }

        elements.outputCode.value = formatted;
        state.outputCode = formatted;
        updateStats();
        showNotification('کد با موفقیت فرمت شد', 'success');
    } catch (error) {
        showNotification('خطا در فرمت‌دهی کد', 'error');
        console.error(error);
    }
}

// Compress Handler
function handleCompress() {
    const input = elements.inputCode.value.trim();
    
    if (!input) {
        showNotification('لطفاً کدی وارد کنید', 'warning');
        return;
    }

    try {
        let compressed;
        const removeComments = elements.removeComments.checked;
        const removeWhitespace = elements.removeWhitespace.checked;

        switch (state.currentLanguage) {
            case 'html':
                compressed = compressHTML(input, removeComments, removeWhitespace);
                break;
            case 'css':
                compressed = compressCSS(input, removeComments, removeWhitespace);
                break;
            case 'js':
                compressed = compressJS(input, removeComments, removeWhitespace);
                break;
        }

        elements.outputCode.value = compressed;
        state.outputCode = compressed;
        updateStats();
        showNotification('کد با موفقیت فشرده شد', 'success');
    } catch (error) {
        showNotification('خطا در فشرده‌سازی کد', 'error');
        console.error(error);
    }
}

// HTML Formatter
function formatHTML(html, indentSize) {
    const indent = ' '.repeat(indentSize);
    let formatted = '';
    let level = 0;
    const tokens = html.split(/(<[^>]+>)/g).filter(t => t.trim());

    tokens.forEach(token => {
        if (token.startsWith('</')) {
            level = Math.max(0, level - 1);
            formatted += indent.repeat(level) + token.trim() + '\n';
        } else if (token.startsWith('<')) {
            formatted += indent.repeat(level) + token.trim() + '\n';
            if (!token.match(/\/>$/) && !token.match(/^<(br|hr|img|input|meta|link)/i)) {
                level++;
            }
        } else {
            const text = token.trim();
            if (text) {
                formatted += indent.repeat(level) + text + '\n';
            }
        }
    });

    return formatted.trim();
}

// CSS Formatter
function formatCSS(css, indentSize) {
    const indent = ' '.repeat(indentSize);
    let formatted = '';
    let level = 0;

    // Remove existing formatting
    css = css.replace(/\s+/g, ' ').trim();

    // Add line breaks and indentation
    for (let i = 0; i < css.length; i++) {
        const char = css[i];
        const nextChar = css[i + 1];

        if (char === '{') {
            formatted += ' {\n';
            level++;
        } else if (char === '}') {
            level = Math.max(0, level - 1);
            formatted += '\n' + indent.repeat(level) + '}';
            if (nextChar && nextChar !== '}') {
                formatted += '\n\n';
            }
        } else if (char === ';' && level > 0) {
            formatted += ';\n' + indent.repeat(level);
        } else if (char === ' ' && formatted.endsWith('\n')) {
            // Skip leading spaces after newline
            continue;
        } else {
            formatted += char;
        }
    }

    // Clean up multiple newlines
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    // Add proper indentation
    const lines = formatted.split('\n');
    formatted = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        const currentLevel = line.match(/^(\s*)/)[0].length / indentSize;
        return indent.repeat(Math.floor(currentLevel)) + trimmed;
    }).join('\n');

    return formatted.trim();
}

// JS Formatter
function formatJS(js, indentSize) {
    const indent = ' '.repeat(indentSize);
    let formatted = '';
    let level = 0;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < js.length; i++) {
        const char = js[i];
        const prevChar = js[i - 1];
        const nextChar = js[i + 1];

        // Handle strings
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
            formatted += char;
            continue;
        }

        if (inString) {
            formatted += char;
            continue;
        }

        // Handle formatting
        if (char === '{') {
            formatted += ' {\n';
            level++;
            formatted += indent.repeat(level);
        } else if (char === '}') {
            level = Math.max(0, level - 1);
            formatted = formatted.trimEnd();
            formatted += '\n' + indent.repeat(level) + '}';
            if (nextChar && ![';', ',', '}', ')'].includes(nextChar)) {
                formatted += '\n' + indent.repeat(level);
            }
        } else if (char === ';') {
            formatted += ';\n' + indent.repeat(level);
        } else if (char === '\n' || char === '\r') {
            // Skip existing newlines
            continue;
        } else if (char === ' ' && prevChar === ' ') {
            // Skip multiple spaces
            continue;
        } else {
            formatted += char;
        }
    }

    // Clean up
    formatted = formatted
        .replace(/\n{3,}/g, '\n\n')
        .replace(/{\s+}/g, '{}')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .trim();

    return formatted;
}

// HTML Compressor
function compressHTML(html, removeComments, removeWhitespace) {
    let compressed = html;

    if (removeComments) {
        compressed = compressed.replace(/<!--[\s\S]*?-->/g, '');
    }

    if (removeWhitespace) {
        compressed = compressed
            .replace(/>\s+</g, '><')
            .replace(/\s+/g, ' ')
            .trim();
    }

    return compressed;
}

// CSS Compressor
function compressCSS(css, removeComments, removeWhitespace) {
    let compressed = css;

    if (removeComments) {
        compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    if (removeWhitespace) {
        compressed = compressed
            .replace(/\s+/g, ' ')
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*,\s*/g, ',')
            .trim();
    }

    return compressed;
}

// JS Compressor
function compressJS(js, removeComments, removeWhitespace) {
    let compressed = js;

    if (removeComments) {
        // Remove single-line comments
        compressed = compressed.replace(/\/\/.*$/gm, '');
        // Remove multi-line comments
        compressed = compressed.replace(/\/\*[\s\S]*?\*\//g, '');
    }

    if (removeWhitespace) {
        compressed = compressed
            .replace(/\s+/g, ' ')
            .replace(/\s*{\s*/g, '{')
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*;\s*/g, ';')
            .replace(/\s*:\s*/g, ':')
            .replace(/\s*,\s*/g, ',')
            .replace(/\s*\(\s*/g, '(')
            .replace(/\s*\)\s*/g, ')')
            .replace(/\s*=\s*/g, '=')
            .trim();
    }

    return compressed;
}

// Paste from Clipboard
async function handlePaste() {
    try {
        const text = await navigator.clipboard.readText();
        elements.inputCode.value = text;
        state.inputCode = text;
        updateStats();
        saveToLocalStorage();
        showNotification('متن از کلیپ‌بورد چسبانده شد', 'success');
    } catch (error) {
        showNotification('خطا در خواندن از کلیپ‌بورد', 'error');
    }
}

// Copy to Clipboard
async function handleCopy() {
    const output = elements.outputCode.value;
    
    if (!output) {
        showNotification('خروجی خالی است', 'warning');
        return;
    }

    try {
        await navigator.clipboard.writeText(output);
        showNotification('کد در کلیپ‌بورد کپی شد', 'success');
    } catch (error) {
        showNotification('خطا در کپی کردن', 'error');
    }
}

// Clear Input
function handleClearInput() {
    elements.inputCode.value = '';
    elements.outputCode.value = '';
    state.inputCode = '';
    state.outputCode = '';
    updateStats();
    saveToLocalStorage();
    showNotification('محتوا پاک شد', 'success');
}

// Download File
function handleDownload() {
    const output = elements.outputCode.value;
    
    if (!output) {
        showNotification('خروجی خالی است', 'warning');
        return;
    }

    const extensions = { html: 'html', css: 'css', js: 'js' };
    const filename = `output.${extensions[state.currentLanguage]}`;
    
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('فایل دانلود شد', 'success');
}

// File Upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        elements.inputCode.value = e.target.result;
        state.inputCode = e.target.result;
        updateStats();
        saveToLocalStorage();
        
        // Detect language from file extension
        const ext = file.name.split('.').pop().toLowerCase();
        if (['html', 'css', 'js'].includes(ext)) {
            handleLanguageChange(ext);
        }
        
        showNotification('فایل بارگذاری شد', 'success');
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Update Statistics
function updateStats() {
    const inputText = elements.inputCode.value;
    const outputText = elements.outputCode.value;
    
    // Input stats
    const inputSize = new Blob([inputText]).size;
    const inputLines = inputText ? inputText.split('\n').length : 0;
    elements.inputStats.textContent = `حجم: ${formatBytes(inputSize)} | خطوط: ${inputLines}`;
    
    // Output stats
    const outputSize = new Blob([outputText]).size;
    const outputLines = outputText ? outputText.split('\n').length : 0;
    elements.outputStats.textContent = `حجم: ${formatBytes(outputSize)} | خطوط: ${outputLines}`;
    
    // Compression ratio
    if (inputSize > 0 && outputSize > 0) {
        const ratio = ((1 - outputSize / inputSize) * 100).toFixed(1);
        elements.compressionRatio.textContent = `کاهش حجم: ${ratio}%`;
        elements.compressionRatio.style.display = 'inline';
    } else {
        elements.compressionRatio.style.display = 'none';
    }
}

// Format Bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Show Notification
function showNotification(message, type = 'success') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// LocalStorage Management
function saveToLocalStorage() {
    try {
        const data = {
            currentLanguage: state.currentLanguage,
            inputCode: state.inputCode,
            removeComments: elements.removeComments.checked,
            removeWhitespace: elements.removeWhitespace.checked,
            indentSize: elements.indentSize.value
        };
        localStorage.setItem('codeFormatterState', JSON.stringify(data));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem('codeFormatterState');
        if (data) {
            const parsed = JSON.parse(data);
            state.currentLanguage = parsed.currentLanguage || 'html';
            state.inputCode = parsed.inputCode || '';
            
            elements.inputCode.value = state.inputCode;
            elements.removeComments.checked = parsed.removeComments !== false;
            elements.removeWhitespace.checked = parsed.removeWhitespace !== false;
            elements.indentSize.value = parsed.indentSize || 2;
            
            handleLanguageChange(state.currentLanguage);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

