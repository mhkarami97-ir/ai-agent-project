// Data Storage
const STORAGE_KEY = 'typingHistory';

// Text Collections
const persianTexts = [
    'برنامه‌نویسی یکی از مهارت‌های مهم در دنیای امروز است. یادگیری برنامه‌نویسی می‌تواند فرصت‌های شغلی زیادی را برای افراد فراهم کند. با تمرین و پشتکار می‌توان در این زمینه به موفقیت دست یافت.',
    'تایپ سریع و دقیق یکی از مهارت‌های کلیدی برای کار با کامپیوتر است. با تمرین منظم می‌توان سرعت تایپ خود را افزایش داد و در کار روزمره بهره‌وری بیشتری داشت.',
    'کتاب خواندن یکی از بهترین راه‌های توسعه فکری و افزایش دانش است. هر روز کمی وقت برای مطالعه اختصاص دهید تا از فواید آن بهره‌مند شوید.',
    'ورزش منظم برای سلامت جسمی و روحی بسیار مفید است. حتی پیاده‌روی روزانه نیز می‌تواند تاثیر زیادی در بهبود کیفیت زندگی داشته باشد.',
    'یادگیری زبان‌های جدید دیدگاه ما را نسبت به دنیا تغییر می‌دهد و فرصت‌های بیشتری برای ارتباط با مردم سراسر جهان فراهم می‌کند.'
];

const englishTexts = [
    'Programming is one of the most important skills in today\'s world. Learning to code can open up many career opportunities. With practice and persistence, anyone can succeed in this field.',
    'Fast and accurate typing is a key skill for working with computers. With regular practice, you can increase your typing speed and be more productive in your daily work.',
    'Reading books is one of the best ways to develop intellectually and increase knowledge. Dedicate some time each day to reading to benefit from its advantages.',
    'Regular exercise is very beneficial for physical and mental health. Even daily walking can have a significant impact on improving quality of life.',
    'Learning new languages changes our perspective on the world and provides more opportunities to connect with people around the globe.'
];

// State Management
let currentLanguage = 'fa';
let currentTextIndex = 0;
let startTime = null;
let timerInterval = null;
let isTyping = false;

// DOM Elements
const inputText = document.getElementById('input-text');
const referenceText = document.getElementById('reference-text');
const textSelect = document.getElementById('text-select');
const wpmDisplay = document.getElementById('wpm');
const accuracyDisplay = document.getElementById('accuracy');
const timerDisplay = document.getElementById('timer');
const resetBtn = document.getElementById('reset-btn');
const historyBtn = document.getElementById('history-btn');
const closeHistoryBtn = document.getElementById('close-history-btn');
const historySection = document.getElementById('history-section');
const historyList = document.getElementById('history-list');
const langButtons = document.querySelectorAll('.lang-btn');
const currentCharDisplay = document.getElementById('current-char-display');

// Chart
let chartInstance = null;

// Initialize
function init() {
    loadText();
    setupEventListeners();
    renderChart();
}

// Event Listeners
function setupEventListeners() {
    inputText.addEventListener('input', handleInput);
    textSelect.addEventListener('change', handleTextChange);
    resetBtn.addEventListener('click', resetExercise);
    historyBtn.addEventListener('click', toggleHistory);
    closeHistoryBtn.addEventListener('click', toggleHistory);
    
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => changeLanguage(btn.dataset.lang));
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && historySection.style.display !== 'none') {
            toggleHistory();
        }
    });
}

// Language Change
function changeLanguage(lang) {
    currentLanguage = lang;
    currentTextIndex = 0;
    
    langButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    
    // Update direction
    const isLTR = lang === 'en';
    document.documentElement.dir = isLTR ? 'ltr' : 'rtl';
    document.documentElement.lang = lang;
    inputText.classList.toggle('ltr', isLTR);
    referenceText.classList.toggle('ltr', isLTR);
    inputText.placeholder = isLTR ? 'Start typing...' : 'شروع به تایپ کنید...';
    
    // Update UI language
    updateUILanguage(lang);
    
    textSelect.value = '0';
    loadText();
    resetExercise();
}

// Update UI Language
function updateUILanguage(lang) {
    const translations = {
        fa: {
            accuracy: 'دقت',
            time: 'زمان',
            selectText: 'انتخاب متن:',
            text: 'متن',
            reset: 'شروع مجدد',
            viewHistory: 'مشاهده تاریخچه',
            close: 'بستن',
            chartTitle: 'نمودار پیشرفت',
            historyTitle: 'تاریخچه تمرین‌ها'
        },
        en: {
            accuracy: 'Accuracy',
            time: 'Time',
            selectText: 'Select Text:',
            text: 'Text',
            reset: 'Reset',
            viewHistory: 'View History',
            close: 'Close',
            chartTitle: 'Progress Chart',
            historyTitle: 'Exercise History'
        }
    };
    
    const t = translations[lang];
    
    document.getElementById('accuracy-label').textContent = t.accuracy;
    document.getElementById('timer-label').textContent = t.time;
    document.getElementById('text-select-label').textContent = t.selectText;
    document.getElementById('reset-btn').textContent = t.reset;
    document.getElementById('history-btn').textContent = t.viewHistory;
    document.getElementById('close-history-btn').textContent = t.close;
    document.getElementById('chart-title').textContent = t.chartTitle;
    document.getElementById('history-title').textContent = t.historyTitle;
    
    // Update select options
    const textSelect = document.getElementById('text-select');
    for (let i = 0; i < textSelect.options.length; i++) {
        textSelect.options[i].textContent = `${t.text} ${lang === 'fa' ? toFarsiNumber(i + 1) : i + 1}`;
    }
}

// Convert to Farsi numbers
function toFarsiNumber(num) {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return num.toString().replace(/\d/g, x => farsiDigits[x]);
}

// Load Text
function loadText() {
    const texts = currentLanguage === 'fa' ? persianTexts : englishTexts;
    const text = texts[currentTextIndex];
    referenceText.textContent = text;
    updateReferenceDisplay();
}

// Handle Text Change
function handleTextChange() {
    currentTextIndex = parseInt(textSelect.value);
    loadText();
    resetExercise();
}

// Handle Input
function handleInput() {
    if (!isTyping && inputText.value.length > 0) {
        startExercise();
    }
    
    // Visual feedback for last typed character
    const referenceString = referenceText.textContent;
    const userInput = inputText.value;
    if (userInput.length > 0) {
        const lastIndex = userInput.length - 1;
        if (lastIndex < referenceString.length) {
            if (userInput[lastIndex] === referenceString[lastIndex]) {
                inputText.classList.remove('incorrect-feedback');
                inputText.classList.add('correct-feedback');
            } else {
                inputText.classList.remove('correct-feedback');
                inputText.classList.add('incorrect-feedback');
            }
            setTimeout(() => {
                inputText.classList.remove('correct-feedback', 'incorrect-feedback');
            }, 300);
        }
    }
    
    updateReferenceDisplay();
    calculateStats();
}

// Start Exercise
function startExercise() {
    isTyping = true;
    startTime = Date.now();
    
    timerInterval = setInterval(updateTimer, 100);
}

// Update Timer
function updateTimer() {
    if (!startTime) return;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Update Reference Display
function updateReferenceDisplay() {
    const referenceString = referenceText.textContent;
    const userInput = inputText.value;
    let displayHTML = '';
    
    for (let i = 0; i < referenceString.length; i++) {
        const char = referenceString[i];
        
        if (i < userInput.length) {
            if (userInput[i] === char) {
                displayHTML += `<span class="correct">${char}</span>`;
            } else {
                displayHTML += `<span class="incorrect">${char}</span>`;
            }
        } else if (i === userInput.length) {
            displayHTML += `<span class="current">${char}</span>`;
        } else {
            displayHTML += char;
        }
    }
    
    referenceText.innerHTML = displayHTML;
    
    // Update current character display
    if (userInput.length < referenceString.length) {
        const nextChar = referenceString[userInput.length];
        const displayChar = nextChar === ' ' 
            ? (currentLanguage === 'fa' ? 'فاصله' : 'Space') 
            : nextChar;
        const charLabel = currentLanguage === 'fa' ? 'کاراکتر بعدی' : 'Next Character';
        currentCharDisplay.innerHTML = `${charLabel}: <strong>${displayChar}</strong>`;
    } else {
        currentCharDisplay.innerHTML = currentLanguage === 'fa' ? '✓ تمام شد!' : '✓ Completed!';
    }
    
    // Check if completed
    if (userInput.length === referenceString.length) {
        completeExercise();
    }
}

// Calculate Stats
function calculateStats() {
    if (!startTime) return;
    
    const referenceString = referenceText.textContent;
    const userInput = inputText.value;
    const timeInMinutes = (Date.now() - startTime) / 60000;
    
    // Calculate WPM
    const wordsTyped = userInput.trim().split(/\s+/).length;
    const wpm = timeInMinutes > 0 ? Math.round(wordsTyped / timeInMinutes) : 0;
    wpmDisplay.textContent = wpm;
    
    // Calculate Accuracy
    let correctChars = 0;
    for (let i = 0; i < userInput.length; i++) {
        if (userInput[i] === referenceString[i]) {
            correctChars++;
        }
    }
    const accuracy = userInput.length > 0 
        ? Math.round((correctChars / userInput.length) * 100) 
        : 100;
    accuracyDisplay.textContent = `${accuracy}%`;
}

// Complete Exercise
function completeExercise() {
    if (!isTyping) return;
    
    isTyping = false;
    clearInterval(timerInterval);
    
    const stats = {
        date: new Date().toISOString(),
        wpm: parseInt(wpmDisplay.textContent),
        accuracy: parseInt(accuracyDisplay.textContent),
        time: timerDisplay.textContent,
        language: currentLanguage,
        textIndex: currentTextIndex
    };
    
    saveToHistory(stats);
    renderChart();
    
    // Show completion message
    setTimeout(() => {
        const message = currentLanguage === 'fa' 
            ? 'تمرین تکمیل شد! آیا می‌خواهید دوباره تمرین کنید؟'
            : 'Exercise completed! Do you want to practice again?';
        if (confirm(message)) {
            resetExercise();
        }
    }, 500);
}

// Reset Exercise
function resetExercise() {
    inputText.value = '';
    startTime = null;
    isTyping = false;
    
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    wpmDisplay.textContent = '0';
    accuracyDisplay.textContent = '100%';
    timerDisplay.textContent = '0:00';
    
    loadText();
    inputText.focus();
}

// Save to History
function saveToHistory(stats) {
    let history = getHistory();
    history.unshift(stats);
    
    // Keep only last 20 records
    if (history.length > 20) {
        history = history.slice(0, 20);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// Get History
function getHistory() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Toggle History
function toggleHistory() {
    const isVisible = historySection.style.display !== 'none';
    historySection.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        renderHistory();
    }
}

// Render History
function renderHistory() {
    const history = getHistory();
    
    if (history.length === 0) {
        const noHistoryMsg = currentLanguage === 'fa' 
            ? 'هنوز تمرینی انجام نداده‌اید' 
            : 'No exercises completed yet';
        historyList.innerHTML = `<div class="no-history">${noHistoryMsg}</div>`;
        return;
    }
    
    historyList.innerHTML = history.map(item => {
        const date = new Date(item.date);
        const dateStr = currentLanguage === 'fa'
            ? date.toLocaleDateString('fa-IR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        
        const accuracyLabel = currentLanguage === 'fa' ? 'دقت' : 'Accuracy';
        const timeLabel = currentLanguage === 'fa' ? 'زمان' : 'Time';
        const langLabel = currentLanguage === 'fa' ? 'زبان' : 'Language';
        const langValue = item.language === 'fa' ? (currentLanguage === 'fa' ? 'فارسی' : 'Persian') : (currentLanguage === 'fa' ? 'انگلیسی' : 'English');
        
        return `
            <div class="history-item">
                <div class="history-item-info">
                    <div class="history-item-date">${dateStr}</div>
                    <div class="history-item-stats">
                        <span>WPM: ${item.wpm}</span>
                        <span>${accuracyLabel}: ${item.accuracy}%</span>
                        <span>${timeLabel}: ${item.time}</span>
                        <span>${langLabel}: ${langValue}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Chart
function renderChart() {
    const canvas = document.getElementById('progress-chart');
    const ctx = canvas.getContext('2d');
    const history = getHistory().slice(0, 10).reverse();
    
    if (history.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '16px Vazirmatn';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'center';
        const noDataMsg = currentLanguage === 'fa' 
            ? 'هنوز داده‌ای برای نمایش وجود ندارد' 
            : 'No data to display yet';
        ctx.fillText(noDataMsg, canvas.width / 2, canvas.height / 2);
        return;
    }
    
    // Destroy previous chart if exists
    if (chartInstance) {
        chartInstance = null;
    }
    
    // Setup
    const padding = 40;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get max WPM for scaling
    const maxWPM = Math.max(...history.map(item => item.wpm), 50);
    const wpmValues = history.map(item => item.wpm);
    const labels = history.map((_, index) => index + 1);
    
    // Draw axes
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (height - 2 * padding) * i / 5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        
        // Y-axis labels
        const value = Math.round(maxWPM * (5 - i) / 5);
        ctx.font = '12px Vazirmatn';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.fillText(value, padding - 5, y + 4);
    }
    
    // Draw line chart
    if (wpmValues.length > 0) {
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        wpmValues.forEach((wpm, index) => {
            const x = padding + (width - 2 * padding) * index / (wpmValues.length - 1 || 1);
            const y = height - padding - (height - 2 * padding) * wpm / maxWPM;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw points
        wpmValues.forEach((wpm, index) => {
            const x = padding + (width - 2 * padding) * index / (wpmValues.length - 1 || 1);
            const y = height - padding - (height - 2 * padding) * wpm / maxWPM;
            
            ctx.fillStyle = '#764ba2';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // X-axis labels
            ctx.font = '12px Vazirmatn';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText(labels[index], x, height - padding + 20);
        });
    }
    
    // Chart title
    ctx.font = 'bold 14px Vazirmatn';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    const chartLabel = currentLanguage === 'fa' ? 'سرعت تایپ (WPM)' : 'Typing Speed (WPM)';
    ctx.fillText(chartLabel, width / 2, 20);
}

// Resize chart on window resize
window.addEventListener('resize', () => {
    const canvas = document.getElementById('progress-chart');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 300;
    renderChart();
});

// Set initial canvas size
window.addEventListener('load', () => {
    const canvas = document.getElementById('progress-chart');
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = 300;
});

// Initialize app
init();

