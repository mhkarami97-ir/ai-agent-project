// Persian number conversion
const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

function toPersianNumber(num) {
    return num.toString().replace(/\d/g, x => persianNumbers[x]);
}

function toEnglishNumber(str) {
    return str.toString().replace(/[۰-۹]/g, x => persianNumbers.indexOf(x));
}

// Toast notification
function showToast(message, duration = 2000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('کپی شد! ✓');
    }).catch(err => {
        showToast('خطا در کپی کردن!');
    });
}

// Format date and time
function formatDateTime(date, timezone = null) {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    if (timezone) {
        options.timeZone = timezone;
    }
    
    return date.toLocaleString('en-US', options);
}

// Get timezone offset in hours
function getTimezoneOffset(date, timezone) {
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (tzDate - utcDate) / (1000 * 60 * 60);
    
    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.abs((offset % 1) * 60);
    const sign = offset >= 0 ? '+' : '-';
    
    return `UTC ${sign}${hours}:${minutes.toString().padStart(2, '0')}`;
}

// Update analog clock
function updateAnalogClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;
    
    const secondDeg = (seconds / 60) * 360;
    const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
    const hourDeg = (hours / 12) * 360 + (minutes / 60) * 30;
    
    document.getElementById('secondHand').style.transform = `rotate(${secondDeg}deg)`;
    document.getElementById('minuteHand').style.transform = `rotate(${minuteDeg}deg)`;
    document.getElementById('hourHand').style.transform = `rotate(${hourDeg}deg)`;
}

// Update digital clock
function updateDigitalClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const date = now.toLocaleDateString('fa-IR');
    
    document.getElementById('digitalTime').textContent = time;
    document.getElementById('digitalDate').textContent = date;
}

// Update current timestamp
function updateCurrentTimestamp() {
    const timestamp = Math.floor(Date.now() / 1000);
    document.getElementById('currentTimestamp').textContent = toPersianNumber(timestamp);
}

// Update timezone clocks
function updateTimezoneClocks() {
    const now = new Date();
    
    document.querySelectorAll('[data-tz-display]').forEach(element => {
        const timezone = element.getAttribute('data-tz-display');
        try {
            element.textContent = now.toLocaleTimeString('en-US', { 
                timeZone: timezone,
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch (e) {
            element.textContent = 'خطا';
        }
    });
    
    document.querySelectorAll('[data-tz-offset]').forEach(element => {
        const timezone = element.getAttribute('data-tz-offset');
        try {
            element.textContent = getTimezoneOffset(now, timezone);
        } catch (e) {
            element.textContent = 'خطا';
        }
    });
}

// Convert Unix to Date
function convertUnixToDate(timestamp) {
    if (!timestamp || isNaN(timestamp)) {
        showToast('لطفاً یک timestamp معتبر وارد کنید!');
        return;
    }
    
    const date = new Date(timestamp * 1000);
    
    if (isNaN(date.getTime())) {
        showToast('Timestamp نامعتبر است!');
        return;
    }
    
    const resultsDiv = document.getElementById('unixResults');
    resultsDiv.innerHTML = '';
    
    // Local time
    const localDateTime = formatDateTime(date);
    addResult(resultsDiv, 'زمان محلی', localDateTime);
    
    // UTC time
    const utcDateTime = formatDateTime(date, 'UTC');
    addResult(resultsDiv, 'زمان UTC', utcDateTime);
    
    // Persian date
    const persianDate = date.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
    addResult(resultsDiv, 'تاریخ شمسی', persianDate);
    
    // ISO format
    const isoDate = date.toISOString();
    addResult(resultsDiv, 'فرمت ISO', isoDate);
    
    // Tehran time
    const tehranTime = formatDateTime(date, 'Asia/Tehran');
    addResult(resultsDiv, 'زمان تهران', tehranTime);
    
    // Add to history
    addToHistory('تبدیل Unix', `${timestamp} → ${localDateTime}`);
}

// Add result item
function addResult(container, label, value) {
    const item = document.createElement('div');
    item.className = 'result-item';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'result-label';
    labelSpan.textContent = label + ':';
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'result-value';
    valueSpan.textContent = value;
    
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn-small';
    copyBtn.textContent = 'کپی';
    copyBtn.onclick = () => copyToClipboard(value);
    
    item.appendChild(labelSpan);
    item.appendChild(valueSpan);
    item.appendChild(copyBtn);
    
    container.appendChild(item);
}

// Convert Date to Unix
function convertDateToUnix() {
    const dateInput = document.getElementById('dateInput').value;
    const timeInput = document.getElementById('timeInput').value;
    const timezoneInput = document.getElementById('timezoneInput').value;
    
    if (!dateInput || !timeInput) {
        showToast('لطفاً تاریخ و ساعت را وارد کنید!');
        return;
    }
    
    let date;
    const dateTimeString = `${dateInput}T${timeInput}`;
    
    if (timezoneInput === 'utc') {
        date = new Date(dateTimeString + 'Z');
    } else {
        date = new Date(dateTimeString);
    }
    
    if (isNaN(date.getTime())) {
        showToast('تاریخ یا زمان نامعتبر است!');
        return;
    }
    
    const timestamp = Math.floor(date.getTime() / 1000);
    
    const resultsDiv = document.getElementById('dateResults');
    resultsDiv.innerHTML = '';
    
    addResult(resultsDiv, 'Unix Timestamp', toPersianNumber(timestamp));
    addResult(resultsDiv, 'Milliseconds', toPersianNumber(date.getTime()));
    
    // Add to history
    addToHistory('تبدیل تاریخ', `${dateTimeString} → ${timestamp}`);
}

// History management using localStorage
function addToHistory(type, content) {
    const history = getHistory();
    const item = {
        type,
        content,
        timestamp: Date.now()
    };
    
    history.unshift(item);
    
    // Keep only last 20 items
    if (history.length > 20) {
        history.pop();
    }
    
    localStorage.setItem('timestampHistory', JSON.stringify(history));
    displayHistory();
}

function getHistory() {
    try {
        const history = localStorage.getItem('timestampHistory');
        return history ? JSON.parse(history) : [];
    } catch (e) {
        return [];
    }
}

function displayHistory() {
    const historyList = document.getElementById('historyList');
    const history = getHistory();
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">هنوز تاریخچه‌ای وجود ندارد</div>';
        return;
    }
    
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const time = new Date(item.timestamp).toLocaleString('fa-IR');
        
        historyItem.innerHTML = `
            <div class="history-item-time">${item.type} - ${time}</div>
            <div class="history-item-content">${item.content}</div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

function clearHistory() {
    if (confirm('آیا مطمئن هستید که می‌خواهید تاریخچه را پاک کنید؟')) {
        localStorage.removeItem('timestampHistory');
        displayHistory();
        showToast('تاریخچه پاک شد');
    }
}

// Initialize timezone copy buttons
function initTimezoneCopyButtons() {
    document.querySelectorAll('[data-copy-tz]').forEach(button => {
        button.addEventListener('click', () => {
            const timezone = button.getAttribute('data-copy-tz');
            const now = new Date();
            const time = now.toLocaleString('en-US', { timeZone: timezone });
            copyToClipboard(time);
        });
    });
}

// Set current date and time to inputs
function setCurrentDateTime() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    
    document.getElementById('dateInput').value = dateStr;
    document.getElementById('timeInput').value = timeStr;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize clocks
    updateAnalogClock();
    updateDigitalClock();
    updateCurrentTimestamp();
    updateTimezoneClocks();
    displayHistory();
    initTimezoneCopyButtons();
    setCurrentDateTime();
    
    // Update clocks every second
    setInterval(() => {
        updateAnalogClock();
        updateDigitalClock();
        updateCurrentTimestamp();
        updateTimezoneClocks();
    }, 1000);
    
    // Copy current timestamp
    document.getElementById('copyCurrentTimestamp').addEventListener('click', () => {
        const timestamp = Math.floor(Date.now() / 1000);
        copyToClipboard(timestamp.toString());
    });
    
    // Convert Unix to Date
    document.getElementById('convertToDate').addEventListener('click', () => {
        const input = document.getElementById('unixInput').value;
        const timestamp = parseInt(toEnglishNumber(input));
        convertUnixToDate(timestamp);
    });
    
    // Use current timestamp
    document.getElementById('useCurrentTimestamp').addEventListener('click', () => {
        const timestamp = Math.floor(Date.now() / 1000);
        document.getElementById('unixInput').value = timestamp;
        convertUnixToDate(timestamp);
    });
    
    // Convert Date to Unix
    document.getElementById('convertToUnix').addEventListener('click', convertDateToUnix);
    
    // Clear history
    document.getElementById('clearHistory').addEventListener('click', clearHistory);
    
    // Enter key support for unix input
    document.getElementById('unixInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('convertToDate').click();
        }
    });
});

