// Leitner System Application
// Data Structure:
// {
//   words: [{id, front, back, box, nextReview, correctCount, wrongCount}],
//   stats: {totalCorrect, totalWrong, lastReviewDate, streak}
// }

class LeitnerApp {
    constructor() {
        this.words = [];
        this.currentFilter = 'all';
        this.currentReviewSet = [];
        this.currentCardIndex = 0;
        this.todayCorrect = 0;
        this.todayWrong = 0;
        this.loadData();
        this.initializeEventListeners();
        this.updateAllStats();
        this.checkAndResetDaily();
    }

    // LocalStorage Methods
    loadData() {
        const stored = localStorage.getItem('leitnerData');
        if (stored) {
            const data = JSON.parse(stored);
            this.words = data.words || [];
            this.stats = data.stats || { totalCorrect: 0, totalWrong: 0, lastReviewDate: '', streak: 0 };
        } else {
            this.stats = { totalCorrect: 0, totalWrong: 0, lastReviewDate: '', streak: 0 };
        }
    }

    saveData() {
        const data = {
            words: this.words,
            stats: this.stats
        };
        localStorage.setItem('leitnerData', JSON.stringify(data));
    }

    // Check if it's a new day and reset daily stats
    checkAndResetDaily() {
        const today = new Date().toDateString();
        if (this.stats.lastReviewDate !== today) {
            // Check if yesterday was reviewed (for streak)
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (this.stats.lastReviewDate === yesterday.toDateString()) {
                // Continue streak
            } else if (this.stats.lastReviewDate !== '') {
                // Reset streak
                this.stats.streak = 0;
            }
        }
    }

    // Get today's date as string
    getTodayString() {
        return new Date().toDateString();
    }

    // Calculate next review date based on box number
    getNextReviewDate(box) {
        const today = new Date();
        const daysToAdd = Math.pow(2, box - 1); // Box 1: 1 day, Box 2: 2 days, Box 3: 4 days, Box 4: 8 days, Box 5: 16 days
        today.setDate(today.getDate() + daysToAdd);
        return today.toDateString();
    }

    // Add single word
    addWord(front, back) {
        if (!front.trim() || !back.trim()) {
            return false;
        }

        const word = {
            id: Date.now() + Math.random(),
            front: front.trim(),
            back: back.trim(),
            box: 1,
            nextReview: this.getTodayString(), // Available today
            correctCount: 0,
            wrongCount: 0
        };

        this.words.push(word);
        this.saveData();
        return true;
    }

    // Add bulk words
    addBulkWords(text) {
        const lines = text.split('\n');
        let added = 0;

        lines.forEach(line => {
            const parts = line.split('|');
            if (parts.length === 2) {
                const front = parts[0].trim();
                const back = parts[1].trim();
                if (front && back) {
                    this.addWord(front, back);
                    added++;
                }
            }
        });

        return added;
    }

    // Delete word
    deleteWord(id) {
        this.words = this.words.filter(w => w.id !== id);
        this.saveData();
    }

    // Get words due for review today
    getTodayWords() {
        const today = this.getTodayString();
        return this.words.filter(w => {
            const reviewDate = new Date(w.nextReview);
            const todayDate = new Date(today);
            return reviewDate <= todayDate;
        });
    }

    // Process card answer
    answerCard(isCorrect) {
        const currentWord = this.currentReviewSet[this.currentCardIndex];
        
        if (isCorrect) {
            this.todayCorrect++;
            currentWord.correctCount++;
            
            // Move to next box (max 5)
            if (currentWord.box < 5) {
                currentWord.box++;
            }
            currentWord.nextReview = this.getNextReviewDate(currentWord.box);
        } else {
            this.todayWrong++;
            currentWord.wrongCount++;
            
            // Move back to box 1
            currentWord.box = 1;
            currentWord.nextReview = this.getTodayString(); // Review again today (but not in this session)
        }

        this.saveData();
        this.currentCardIndex++;

        // Update stats
        this.stats.totalCorrect = isCorrect ? this.stats.totalCorrect + 1 : this.stats.totalCorrect;
        this.stats.totalWrong = !isCorrect ? this.stats.totalWrong + 1 : this.stats.totalWrong;
        this.stats.lastReviewDate = this.getTodayString();
        
        if (this.currentCardIndex === 1 && isCorrect) {
            this.stats.streak++;
        }
        
        this.saveData();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Add single word
        document.getElementById('addSingleBtn').addEventListener('click', () => {
            this.handleAddSingle();
        });

        // Add bulk words
        document.getElementById('addBulkBtn').addEventListener('click', () => {
            this.handleAddBulk();
        });

        // Review card controls
        document.getElementById('flipBtn').addEventListener('click', () => {
            this.flipCard();
        });

        document.getElementById('correctBtn').addEventListener('click', () => {
            this.handleAnswer(true);
        });

        document.getElementById('wrongBtn').addEventListener('click', () => {
            this.handleAnswer(false);
        });

        document.getElementById('backToStart').addEventListener('click', () => {
            this.resetReview();
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterWords(e.target.dataset.filter);
            });
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchWords(e.target.value);
        });

        // Clear all data
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllData();
        });

        // Enter key support for inputs
        document.getElementById('wordFront').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('wordBack').focus();
            }
        });

        document.getElementById('wordBack').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddSingle();
            }
        });
    }

    // Switch between tabs
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        // Load data for the tab
        if (tabName === 'review') {
            this.loadReviewTab();
        } else if (tabName === 'list') {
            this.loadListTab();
        } else if (tabName === 'stats') {
            this.loadStatsTab();
        }
    }

    // Load review tab
    loadReviewTab() {
        this.currentReviewSet = this.getTodayWords();
        this.currentCardIndex = 0;
        this.todayCorrect = 0;
        this.todayWrong = 0;

        // Shuffle cards
        this.currentReviewSet.sort(() => Math.random() - 0.5);

        this.updateReviewStats();

        if (this.currentReviewSet.length === 0) {
            document.getElementById('noCards').style.display = 'block';
            document.getElementById('cardDisplay').style.display = 'none';
            document.getElementById('completionMessage').style.display = 'none';
        } else {
            document.getElementById('noCards').style.display = 'none';
            document.getElementById('cardDisplay').style.display = 'flex';
            document.getElementById('completionMessage').style.display = 'none';
            this.showCurrentCard();
        }
    }

    // Show current card
    showCurrentCard() {
        if (this.currentCardIndex >= this.currentReviewSet.length) {
            this.showCompletion();
            return;
        }

        const card = this.currentReviewSet[this.currentCardIndex];
        
        document.getElementById('cardFront').textContent = card.front;
        document.getElementById('cardBack').textContent = card.back;
        document.getElementById('cardFrontSmall').textContent = card.front;
        document.getElementById('boxNumber').textContent = card.box;
        document.getElementById('boxNumberBack').textContent = card.box;

        // Show front, hide back
        document.querySelector('.card-front').style.display = 'block';
        document.querySelector('.card-back').style.display = 'none';

        this.updateReviewStats();
    }

    // Flip card
    flipCard() {
        document.querySelector('.card-front').style.display = 'none';
        document.querySelector('.card-back').style.display = 'block';
    }

    // Handle answer
    handleAnswer(isCorrect) {
        this.answerCard(isCorrect);
        this.showCurrentCard();
    }

    // Show completion message
    showCompletion() {
        document.getElementById('cardDisplay').style.display = 'none';
        document.getElementById('completionMessage').style.display = 'block';
        document.getElementById('finalCorrect').textContent = this.todayCorrect;
        document.getElementById('finalTotal').textContent = this.currentReviewSet.length;
        this.updateReviewStats();
    }

    // Reset review
    resetReview() {
        this.loadReviewTab();
    }

    // Update review stats
    updateReviewStats() {
        const total = this.currentReviewSet.length;
        const remaining = total - this.currentCardIndex;
        
        document.getElementById('todayCount').textContent = total;
        document.getElementById('remainingCount').textContent = remaining;
        document.getElementById('correctCount').textContent = this.todayCorrect;
    }

    // Handle add single word
    handleAddSingle() {
        const front = document.getElementById('wordFront').value;
        const back = document.getElementById('wordBack').value;

        if (this.addWord(front, back)) {
            this.showMessage('کلمه با موفقیت اضافه شد!', 'success');
            document.getElementById('wordFront').value = '';
            document.getElementById('wordBack').value = '';
            document.getElementById('wordFront').focus();
            this.updateAllStats();
        } else {
            this.showMessage('لطفاً هر دو فیلد را پر کنید.', 'error');
        }
    }

    // Handle add bulk words
    handleAddBulk() {
        const text = document.getElementById('bulkWords').value;
        const added = this.addBulkWords(text);

        if (added > 0) {
            this.showMessage(`${added} کلمه با موفقیت اضافه شد!`, 'success');
            document.getElementById('bulkWords').value = '';
            this.updateAllStats();
        } else {
            this.showMessage('فرمت ورودی صحیح نیست. هر خط: کلمه | معنی', 'error');
        }
    }

    // Show message
    showMessage(text, type) {
        const messageEl = document.getElementById('addMessage');
        messageEl.textContent = text;
        messageEl.className = `message ${type}`;
        messageEl.style.display = 'block';

        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }

    // Load list tab
    loadListTab() {
        this.filterWords(this.currentFilter);
        this.updateFilterCounts();
    }

    // Filter words
    filterWords(filter) {
        this.currentFilter = filter;

        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Filter and display
        let filtered = this.words;
        if (filter !== 'all') {
            const boxNum = parseInt(filter);
            filtered = this.words.filter(w => w.box === boxNum);
        }

        this.displayWords(filtered);
    }

    // Search words
    searchWords(query) {
        const filtered = this.words.filter(w => {
            const searchText = (w.front + ' ' + w.back).toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        this.displayWords(filtered);
    }

    // Display words
    displayWords(words) {
        const container = document.getElementById('wordsList');

        if (words.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>کلمه‌ای یافت نشد!</h3>
                    <p>فیلتر دیگری را انتخاب کنید یا کلمه جدید اضافه کنید.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = words.map(word => `
            <div class="word-item">
                <div class="word-content">
                    <div class="word-front">${this.escapeHtml(word.front)}</div>
                    <div class="word-back">${this.escapeHtml(word.back)}</div>
                </div>
                <div class="word-meta">
                    <div class="word-box">جعبه ${word.box}</div>
                    <div class="word-actions">
                        <button onclick="app.deleteWord(${word.id})">حذف</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Update filter counts
    updateFilterCounts() {
        document.getElementById('countAll').textContent = this.words.length;
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`countBox${i}`).textContent = this.words.filter(w => w.box === i).length;
        }
    }

    // Load stats tab
    loadStatsTab() {
        const totalWords = this.words.length;
        const todayReviewed = this.todayCorrect + this.todayWrong;
        const accuracyRate = todayReviewed > 0 
            ? Math.round((this.todayCorrect / todayReviewed) * 100) 
            : 0;

        document.getElementById('totalWords').textContent = totalWords;
        document.getElementById('totalReviewed').textContent = todayReviewed;
        document.getElementById('streakDays').textContent = this.stats.streak;
        document.getElementById('accuracyRate').textContent = `${accuracyRate}%`;

        // Box distribution
        const boxCounts = [0, 0, 0, 0, 0];
        this.words.forEach(w => {
            boxCounts[w.box - 1]++;
        });

        const maxCount = Math.max(...boxCounts, 1);

        for (let i = 0; i < 5; i++) {
            const percentage = (boxCounts[i] / maxCount) * 100;
            document.getElementById(`bar${i + 1}`).style.width = `${percentage}%`;
            document.getElementById(`statBox${i + 1}`).textContent = boxCounts[i];
        }
    }

    // Update all stats
    updateAllStats() {
        this.updateFilterCounts();
    }

    // Clear all data
    clearAllData() {
        if (confirm('آیا مطمئن هستید؟ تمام داده‌ها پاک خواهند شد!')) {
            localStorage.removeItem('leitnerData');
            this.words = [];
            this.stats = { totalCorrect: 0, totalWrong: 0, lastReviewDate: '', streak: 0 };
            this.currentReviewSet = [];
            this.currentCardIndex = 0;
            this.todayCorrect = 0;
            this.todayWrong = 0;
            this.updateAllStats();
            this.switchTab('add');
            alert('تمام داده‌ها پاک شدند.');
        }
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new LeitnerApp();
});

