// وضعیت برنامه
const state = {
    bpm: 120,
    beatsPerMeasure: 4,
    currentBeat: 0,
    isPlaying: false,
    accentFirst: true,
    intervalId: null,
    audioContext: null,
    
    // تایمر
    timerDuration: 0,
    timerRemaining: 0,
    timerIntervalId: null,
    isTimerRunning: false,
    timerStartTime: null,
    timerPausedTime: 0
};

// المنت‌ها
const elements = {
    bpmValue: document.getElementById('bpmValue'),
    bpmSlider: document.getElementById('bpmSlider'),
    decreaseBpm: document.getElementById('decreaseBpm'),
    increaseBpm: document.getElementById('increaseBpm'),
    quickBpmButtons: document.querySelectorAll('.btn-quick'),
    beatsButtons: document.querySelectorAll('.btn-beats'),
    accentFirst: document.getElementById('accentFirst'),
    playBtn: document.getElementById('playBtn'),
    beatDots: document.getElementById('beatDots'),
    
    // تایمر
    timerDisplay: document.getElementById('timerDisplay'),
    presetButtons: document.querySelectorAll('.btn-preset'),
    customMinutes: document.getElementById('customMinutes'),
    setCustomTimer: document.getElementById('setCustomTimer'),
    startTimer: document.getElementById('startTimer'),
    pauseTimer: document.getElementById('pauseTimer'),
    resetTimer: document.getElementById('resetTimer'),
    sessionNote: document.getElementById('sessionNote'),
    
    // تاریخچه
    historyList: document.getElementById('historyList'),
    clearHistory: document.getElementById('clearHistory'),
    todayTotal: document.getElementById('todayTotal'),
    totalTime: document.getElementById('totalTime'),
    sessionCount: document.getElementById('sessionCount')
};

// ایجاد AudioContext
function initAudio() {
    if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// پخش صدای کلیک
function playClick(isAccent = false) {
    if (!state.audioContext) return;
    
    const oscillator = state.audioContext.createOscillator();
    const gainNode = state.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(state.audioContext.destination);
    
    if (isAccent) {
        oscillator.frequency.value = 1000;
        gainNode.gain.value = 0.3;
    } else {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.2;
    }
    
    oscillator.start(state.audioContext.currentTime);
    oscillator.stop(state.audioContext.currentTime + 0.1);
}

// به‌روزرسانی نمایش BPM
function updateBpmDisplay() {
    elements.bpmValue.textContent = state.bpm;
    elements.bpmSlider.value = state.bpm;
}

// تغییر BPM
function changeBpm(newBpm) {
    state.bpm = Math.max(40, Math.min(240, newBpm));
    updateBpmDisplay();
    
    if (state.isPlaying) {
        stopMetronome();
        startMetronome();
    }
}

// تغییر تعداد ضربات
function changeBeats(beats) {
    state.beatsPerMeasure = beats;
    state.currentBeat = 0;
    updateBeatDots();
    
    elements.beatsButtons.forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.beats) === beats) {
            btn.classList.add('active');
        }
    });
}

// ایجاد نقاط ضربه
function updateBeatDots() {
    elements.beatDots.innerHTML = '';
    for (let i = 0; i < state.beatsPerMeasure; i++) {
        const dot = document.createElement('div');
        dot.className = 'beat-dot';
        dot.dataset.beat = i;
        elements.beatDots.appendChild(dot);
    }
}

// به‌روزرسانی نشانگر ضربه
function updateBeatIndicator() {
    const dots = elements.beatDots.querySelectorAll('.beat-dot');
    dots.forEach((dot, index) => {
        dot.classList.remove('active', 'accent');
        if (index === state.currentBeat) {
            dot.classList.add('active');
            if (index === 0 && state.accentFirst) {
                dot.classList.add('accent');
            }
        }
    });
}

// شروع مترونوم
function startMetronome() {
    initAudio();
    state.isPlaying = true;
    state.currentBeat = 0;
    
    const interval = (60 / state.bpm) * 1000;
    
    // ضربه اول
    playBeat();
    
    state.intervalId = setInterval(() => {
        playBeat();
    }, interval);
    
    elements.playBtn.classList.add('playing');
    elements.playBtn.querySelector('.play-icon').textContent = '⏸';
    elements.playBtn.querySelector('.play-text').textContent = 'توقف';
}

// پخش یک ضربه
function playBeat() {
    const isAccent = state.currentBeat === 0 && state.accentFirst;
    playClick(isAccent);
    updateBeatIndicator();
    
    state.currentBeat = (state.currentBeat + 1) % state.beatsPerMeasure;
}

// توقف مترونوم
function stopMetronome() {
    state.isPlaying = false;
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
    
    state.currentBeat = 0;
    updateBeatIndicator();
    
    elements.playBtn.classList.remove('playing');
    elements.playBtn.querySelector('.play-icon').textContent = '▶';
    elements.playBtn.querySelector('.play-text').textContent = 'شروع';
}

// تنظیم تایمر
function setTimer(minutes) {
    state.timerDuration = minutes * 60;
    state.timerRemaining = state.timerDuration;
    state.timerPausedTime = 0;
    updateTimerDisplay();
}

// به‌روزرسانی نمایش تایمر
function updateTimerDisplay() {
    const minutes = Math.floor(state.timerRemaining / 60);
    const seconds = state.timerRemaining % 60;
    elements.timerDisplay.textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// شروع تایمر
function startTimerCountdown() {
    if (state.timerDuration === 0) {
        alert('لطفاً ابتدا یک زمان انتخاب کنید');
        return;
    }
    
    state.isTimerRunning = true;
    state.timerStartTime = Date.now();
    
    state.timerIntervalId = setInterval(() => {
        state.timerRemaining--;
        updateTimerDisplay();
        
        if (state.timerRemaining <= 0) {
            timerComplete();
        }
    }, 1000);
    
    elements.startTimer.disabled = true;
    elements.pauseTimer.disabled = false;
    elements.resetTimer.disabled = false;
}

// توقف موقت تایمر
function pauseTimer() {
    state.isTimerRunning = false;
    if (state.timerIntervalId) {
        clearInterval(state.timerIntervalId);
        state.timerIntervalId = null;
    }
    
    state.timerPausedTime += Date.now() - state.timerStartTime;
    
    elements.startTimer.disabled = false;
    elements.pauseTimer.disabled = true;
}

// ریست تایمر
function resetTimer() {
    pauseTimer();
    state.timerRemaining = state.timerDuration;
    state.timerPausedTime = 0;
    updateTimerDisplay();
    
    elements.startTimer.disabled = false;
    elements.pauseTimer.disabled = true;
    elements.resetTimer.disabled = false;
}

// تکمیل تایمر
function timerComplete() {
    pauseTimer();
    
    // ذخیره در تاریخچه
    const practiceTime = Math.floor(state.timerDuration / 60);
    const note = elements.sessionNote.value.trim();
    saveSession(practiceTime, state.bpm, note);
    
    // پخش صدای اتمام
    if (state.audioContext) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => playClick(true), i * 200);
        }
    }
    
    alert('زمان تمرین به پایان رسید! 🎉');
    
    elements.sessionNote.value = '';
    resetTimer();
}

// ذخیره جلسه تمرین
function saveSession(minutes, bpm, note = '') {
    const session = {
        id: Date.now(),
        date: new Date().toISOString(),
        duration: minutes,
        bpm: bpm,
        note: note
    };
    
    const sessions = getSessions();
    sessions.unshift(session);
    localStorage.setItem('practiceSessions', JSON.stringify(sessions));
    
    updateHistory();
}

// دریافت جلسات
function getSessions() {
    const data = localStorage.getItem('practiceSessions');
    return data ? JSON.parse(data) : [];
}

// حذف جلسه
function deleteSession(id) {
    const sessions = getSessions().filter(s => s.id !== id);
    localStorage.setItem('practiceSessions', JSON.stringify(sessions));
    updateHistory();
}

// پاک کردن تاریخچه
function clearHistory() {
    if (confirm('آیا مطمئن هستید که می‌خواهید تمام تاریخچه را پاک کنید؟')) {
        localStorage.removeItem('practiceSessions');
        updateHistory();
    }
}

// به‌روزرسانی نمایش تاریخچه
function updateHistory() {
    const sessions = getSessions();
    
    if (sessions.length === 0) {
        elements.historyList.innerHTML = '<div class="empty-state">هنوز تمرینی ثبت نشده است</div>';
        elements.todayTotal.textContent = '0 دقیقه';
        elements.totalTime.textContent = '0 دقیقه';
        elements.sessionCount.textContent = '0';
        return;
    }
    
    // محاسبه آمار
    const today = new Date().toDateString();
    let todayTotal = 0;
    let totalTime = 0;
    
    sessions.forEach(session => {
        totalTime += session.duration;
        const sessionDate = new Date(session.date).toDateString();
        if (sessionDate === today) {
            todayTotal += session.duration;
        }
    });
    
    elements.todayTotal.textContent = `${todayTotal} دقیقه`;
    elements.totalTime.textContent = `${totalTime} دقیقه`;
    elements.sessionCount.textContent = sessions.length;
    
    // نمایش لیست
    elements.historyList.innerHTML = sessions.map(session => {
        const date = new Date(session.date);
        const dateStr = date.toLocaleDateString('fa-IR');
        const timeStr = date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="history-item">
                <div class="history-date">${dateStr} - ${timeStr}</div>
                <div class="history-details">
                    <div class="history-time">⏱️ ${session.duration} دقیقه</div>
                    <div class="history-bpm">🎵 ${session.bpm} BPM</div>
                    <button class="btn-delete" onclick="deleteSession(${session.id})">حذف</button>
                </div>
                ${session.note ? `<div class="history-note">📝 ${session.note}</div>` : ''}
            </div>
        `;
    }).join('');
}

// Event Listeners
elements.decreaseBpm.addEventListener('click', () => changeBpm(state.bpm - 1));
elements.increaseBpm.addEventListener('click', () => changeBpm(state.bpm + 1));
elements.bpmSlider.addEventListener('input', (e) => changeBpm(parseInt(e.target.value)));

elements.quickBpmButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        changeBpm(parseInt(btn.dataset.bpm));
    });
});

elements.beatsButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        changeBeats(parseInt(btn.dataset.beats));
    });
});

elements.accentFirst.addEventListener('change', (e) => {
    state.accentFirst = e.target.checked;
});

elements.playBtn.addEventListener('click', () => {
    if (state.isPlaying) {
        stopMetronome();
    } else {
        startMetronome();
    }
});

elements.presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setTimer(parseInt(btn.dataset.minutes));
    });
});

elements.setCustomTimer.addEventListener('click', () => {
    const minutes = parseInt(elements.customMinutes.value);
    if (minutes > 0 && minutes <= 180) {
        setTimer(minutes);
        elements.customMinutes.value = '';
    } else {
        alert('لطفاً یک عدد بین 1 تا 180 وارد کنید');
    }
});

elements.startTimer.addEventListener('click', startTimerCountdown);
elements.pauseTimer.addEventListener('click', pauseTimer);
elements.resetTimer.addEventListener('click', resetTimer);
elements.clearHistory.addEventListener('click', clearHistory);

// مدیریت کلیدهای صفحه کلید
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (state.isPlaying) {
            stopMetronome();
        } else {
            startMetronome();
        }
    } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        changeBpm(state.bpm + 1);
    } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        changeBpm(state.bpm - 1);
    }
});

// راه‌اندازی اولیه
function init() {
    updateBpmDisplay();
    changeBeats(state.beatsPerMeasure);
    updateHistory();
}

init();

// export برای استفاده در HTML
window.deleteSession = deleteSession;

