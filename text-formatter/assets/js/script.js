// Text Formatter Application
// Main application logic for Persian/English text cleanup

// DOM Elements
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const inputCount = document.getElementById('inputCount');
const outputCount = document.getElementById('outputCount');
const notification = document.getElementById('notification');

// Buttons
const cleanAllBtn = document.getElementById('cleanAllBtn');
const removeZWNJBtn = document.getElementById('removeZWNJBtn');
const toEnglishNumberBtn = document.getElementById('toEnglishNumberBtn');
const toPersianNumberBtn = document.getElementById('toPersianNumberBtn');
const removeInvisibleBtn = document.getElementById('removeInvisibleBtn');
const smartTrimBtn = document.getElementById('smartTrimBtn');
const copyBtn = document.getElementById('copyBtn');
const replaceBtn = document.getElementById('replaceBtn');
const clearBtn = document.getElementById('clearBtn');

// Constants
const STORAGE_KEY = 'textFormatterInput';
const PERSIAN_NUMBERS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ENGLISH_NUMBERS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Initialize application
function init() {
    loadFromStorage();
    updateCharCount();
    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    // Text input events
    inputText.addEventListener('input', () => {
        updateCharCount();
        saveToStorage();
    });

    // Button events
    cleanAllBtn.addEventListener('click', () => processText(cleanAll));
    removeZWNJBtn.addEventListener('click', () => processText(removeProblematicZWNJ));
    toEnglishNumberBtn.addEventListener('click', () => processText(convertToEnglishNumbers));
    toPersianNumberBtn.addEventListener('click', () => processText(convertToPersianNumbers));
    removeInvisibleBtn.addEventListener('click', () => processText(removeInvisibleCharacters));
    smartTrimBtn.addEventListener('click', () => processText(smartTrim));
    
    copyBtn.addEventListener('click', copyToClipboard);
    replaceBtn.addEventListener('click', replaceInput);
    clearBtn.addEventListener('click', clearAll);
}

// Core Text Processing Functions

/**
 * Clean all issues in text
 */
function cleanAll(text) {
    text = removeInvisibleCharacters(text);
    text = removeProblematicZWNJ(text);
    text = smartTrim(text);
    return text;
}

/**
 * Remove problematic ZWNJ (Zero-Width Non-Joiner) characters
 * Keeps necessary ZWNJ for Persian compound words but removes excessive ones
 */
function removeProblematicZWNJ(text) {
    // Remove ZWNJ
    text = text.replace(/\u200C/g, '');
    
    // Remove ZWJ (Zero-Width Joiner)
    text = text.replace(/\u200D/g, '');
    
    // Add proper ZWNJ between Persian words with می prefix
    text = text.replace(/\bمی(\s+)([آ-ی])/g, 'می‌$2');
    
    // Add proper ZWNJ for common Persian prefixes
    const prefixes = ['می', 'نمی', 'بی', 'با', 'پیش', 'پس', 'هم', 'غیر', 'نا', 'بر', 'فرو', 'در', 'از'];
    prefixes.forEach(prefix => {
        const regex = new RegExp(`\\b${prefix}\\s+([آ-ی])`, 'g');
        text = text.replace(regex, `${prefix}‌$1`);
    });
    
    return text;
}

/**
 * Convert Persian numbers to English numbers
 */
function convertToEnglishNumbers(text) {
    for (let i = 0; i < 10; i++) {
        const regex = new RegExp(PERSIAN_NUMBERS[i], 'g');
        text = text.replace(regex, ENGLISH_NUMBERS[i]);
    }
    
    // Also convert Arabic-Indic numbers
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
        const regex = new RegExp(arabicNumbers[i], 'g');
        text = text.replace(regex, ENGLISH_NUMBERS[i]);
    }
    
    return text;
}

/**
 * Convert English numbers to Persian numbers
 */
function convertToPersianNumbers(text) {
    for (let i = 0; i < 10; i++) {
        const regex = new RegExp(ENGLISH_NUMBERS[i], 'g');
        text = text.replace(regex, PERSIAN_NUMBERS[i]);
    }
    
    // Also convert Arabic-Indic numbers
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    for (let i = 0; i < 10; i++) {
        const regex = new RegExp(arabicNumbers[i], 'g');
        text = text.replace(regex, PERSIAN_NUMBERS[i]);
    }
    
    return text;
}

/**
 * Remove invisible and problematic characters
 */
function removeInvisibleCharacters(text) {
    // Remove various invisible characters
    text = text.replace(/\u200B/g, ''); // Zero-Width Space
    text = text.replace(/\u200E/g, ''); // Left-to-Right Mark
    text = text.replace(/\u200F/g, ''); // Right-to-Left Mark
    text = text.replace(/\uFEFF/g, ''); // Zero-Width No-Break Space (BOM)
    text = text.replace(/\u202A/g, ''); // Left-to-Right Embedding
    text = text.replace(/\u202B/g, ''); // Right-to-Left Embedding
    text = text.replace(/\u202C/g, ''); // Pop Directional Formatting
    text = text.replace(/\u202D/g, ''); // Left-to-Right Override
    text = text.replace(/\u202E/g, ''); // Right-to-Left Override
    text = text.replace(/\u2060/g, ''); // Word Joiner
    text = text.replace(/\u2061/g, ''); // Function Application
    text = text.replace(/\u2062/g, ''); // Invisible Times
    text = text.replace(/\u2063/g, ''); // Invisible Separator
    text = text.replace(/\u2064/g, ''); // Invisible Plus
    text = text.replace(/\uFFF9/g, ''); // Interlinear Annotation Anchor
    text = text.replace(/\uFFFA/g, ''); // Interlinear Annotation Separator
    text = text.replace(/\uFFFB/g, ''); // Interlinear Annotation Terminator
    
    // Replace Arabic characters with Persian equivalents
    text = text.replace(/ك/g, 'ک'); // Arabic Kaf to Persian Kaf
    text = text.replace(/ي/g, 'ی'); // Arabic Yeh to Persian Yeh
    text = text.replace(/ى/g, 'ی'); // Alef Maksura to Persian Yeh
    text = text.replace(/ئ/g, 'ئ'); // Normalize Yeh with Hamza
    
    return text;
}

/**
 * Smart trim: remove extra whitespace, multiple spaces, and empty lines
 */
function smartTrim(text) {
    // Remove leading and trailing whitespace from each line
    text = text.split('\n').map(line => line.trim()).join('\n');
    
    // Replace multiple spaces with single space
    text = text.replace(/ {2,}/g, ' ');
    
    // Replace multiple tabs with single space
    text = text.replace(/\t+/g, ' ');
    
    // Remove spaces before punctuation
    text = text.replace(/ +([،,؛;:.!؟?»\]])/g, '$1');
    
    // Add space after punctuation if missing (for Persian)
    text = text.replace(/([،,؛;:.!؟?])([آ-یa-zA-Z0-9۰-۹])/g, '$1 $2');
    
    // Remove multiple consecutive empty lines (keep max 1 empty line)
    text = text.replace(/\n{3,}/g, '\n\n');
    
    // Trim the entire text
    text = text.trim();
    
    return text;
}

// Utility Functions

/**
 * Process text with given function and update output
 */
function processText(processingFunction) {
    const input = inputText.value;
    
    if (!input.trim()) {
        showNotification('لطفا ابتدا متنی را وارد کنید', 'error');
        return;
    }
    
    const result = processingFunction(input);
    outputText.value = result;
    updateCharCount();
    showNotification('پردازش با موفقیت انجام شد', 'success');
}

/**
 * Copy output text to clipboard
 */
function copyToClipboard() {
    const text = outputText.value;
    
    if (!text) {
        showNotification('هیچ متنی برای کپی کردن وجود ندارد', 'error');
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showNotification('متن با موفقیت کپی شد', 'success');
    }).catch(() => {
        // Fallback method
        outputText.select();
        document.execCommand('copy');
        showNotification('متن با موفقیت کپی شد', 'success');
    });
}

/**
 * Replace input text with output text
 */
function replaceInput() {
    const output = outputText.value;
    
    if (!output) {
        showNotification('هیچ متنی برای جایگزینی وجود ندارد', 'error');
        return;
    }
    
    inputText.value = output;
    outputText.value = '';
    updateCharCount();
    saveToStorage();
    showNotification('متن ورودی با موفقیت جایگزین شد', 'success');
}

/**
 * Clear all text
 */
function clearAll() {
    if (!inputText.value && !outputText.value) {
        showNotification('هیچ متنی برای پاک کردن وجود ندارد', 'error');
        return;
    }
    
    inputText.value = '';
    outputText.value = '';
    updateCharCount();
    saveToStorage();
    showNotification('تمام متن‌ها پاک شدند', 'success');
}

/**
 * Update character count displays
 */
function updateCharCount() {
    const inputLength = inputText.value.length;
    const outputLength = outputText.value.length;
    
    inputCount.textContent = `${inputLength.toLocaleString('fa-IR')} کاراکتر`;
    outputCount.textContent = `${outputLength.toLocaleString('fa-IR')} کاراکتر`;
}

/**
 * Show notification message
 */
function showNotification(message, type = 'success') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

/**
 * Save input text to localStorage
 */
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, inputText.value);
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
    }
}

/**
 * Load input text from localStorage
 */
function loadFromStorage() {
    try {
        const savedText = localStorage.getItem(STORAGE_KEY);
        if (savedText) {
            inputText.value = savedText;
        }
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

