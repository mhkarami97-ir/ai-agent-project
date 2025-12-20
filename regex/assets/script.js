// RegExp Playground JavaScript
class RegexPlayground {
    constructor() {
        this.initElements();
        this.initEventListeners();
        this.loadSnippets();
        this.initSampleData();
    }

    initElements() {
        // Input elements
        this.regexInput = document.getElementById('regex-input');
        this.testInput = document.getElementById('test-input');
        this.flagGlobal = document.getElementById('flag-global');
        this.flagCase = document.getElementById('flag-case');
        this.flagMultiline = document.getElementById('flag-multiline');

        // Button elements
        this.testBtn = document.getElementById('test-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.saveSnippetBtn = document.getElementById('save-snippet-btn');

        // Result containers
        this.matchesContainer = document.getElementById('matches-container');
        this.explanationContainer = document.getElementById('explanation-container');
        this.highlightedText = document.getElementById('highlighted-text');

        // Snippets
        this.snippetsContainer = document.getElementById('snippets-container');

        // Modal elements
        this.saveModal = document.getElementById('save-modal');
        this.snippetNameInput = document.getElementById('snippet-name');
        this.snippetDescriptionInput = document.getElementById('snippet-description');
        this.confirmSaveBtn = document.getElementById('confirm-save-btn');
        this.cancelSaveBtn = document.getElementById('cancel-save-btn');
        this.closeModal = document.querySelector('.close');

        // Quick patterns
        this.patternButtons = document.querySelectorAll('.pattern-btn');
    }

    initEventListeners() {
        // Test button
        this.testBtn.addEventListener('click', () => this.testRegex());

        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Save snippet button
        this.saveSnippetBtn.addEventListener('click', () => this.openSaveModal());

        // Modal events
        this.confirmSaveBtn.addEventListener('click', () => this.saveSnippet());
        this.cancelSaveBtn.addEventListener('click', () => this.closeSaveModal());
        this.closeModal.addEventListener('click', () => this.closeSaveModal());

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.saveModal) {
                this.closeSaveModal();
            }
        });

        // Auto-test on input change (debounced)
        let debounceTimer;
        const autoTest = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (this.regexInput.value.trim() && this.testInput.value.trim()) {
                    this.testRegex();
                }
            }, 500);
        };

        this.regexInput.addEventListener('input', autoTest);
        this.testInput.addEventListener('input', autoTest);
        this.flagGlobal.addEventListener('change', autoTest);
        this.flagCase.addEventListener('change', autoTest);
        this.flagMultiline.addEventListener('change', autoTest);

        // Quick pattern buttons
        this.patternButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const pattern = btn.getAttribute('data-pattern');
                this.regexInput.value = pattern;
                this.regexInput.focus();
                if (this.testInput.value.trim()) {
                    this.testRegex();
                }
            });
        });

        // Enter key shortcuts
        this.regexInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.testRegex();
            }
        });

        this.testInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.testRegex();
            }
        });
    }

    initSampleData() {
        // Set some sample data for demonstration
        this.testInput.value = `مثال برای تست:
شماره موبایل: 09123456789
ایمیل: test@example.com
تاریخ: 1402/05/15
متن فارسی: سلام دنیا
English text: Hello World
اعداد: 123، ۴۵۶، 789
کد ملی: 0123456789
وب‌سایت: https://example.com`;

        this.regexInput.value = '\\d+';
        // Auto test with sample data
        setTimeout(() => this.testRegex(), 100);
    }

    testRegex() {
        const pattern = this.regexInput.value.trim();
        const testText = this.testInput.value;

        if (!pattern) {
            this.showError('لطفاً عبارت منظم را وارد کنید');
            return;
        }

        try {
            const flags = this.getFlags();
            const regex = new RegExp(pattern, flags);
            
            this.displayMatches(regex, testText);
            this.displayExplanation(pattern, flags);
            this.highlightMatches(regex, testText);
            
        } catch (error) {
            this.showError(`خطا در عبارت منظم: ${error.message}`);
            this.clearResults();
        }
    }

    getFlags() {
        let flags = '';
        if (this.flagGlobal.checked) flags += 'g';
        if (this.flagCase.checked) flags += 'i';
        if (this.flagMultiline.checked) flags += 'm';
        return flags;
    }

    displayMatches(regex, text) {
        const matches = [...text.matchAll(regex)];
        
        if (matches.length === 0) {
            this.matchesContainer.innerHTML = '<p class="no-results">هیچ مطابقتی یافت نشد</p>';
            return;
        }

        let html = `<div class="success-state">تعداد مطابقت‌ها: ${matches.length}</div>`;
        
        matches.forEach((match, index) => {
            const matchText = match[0];
            const startIndex = match.index;
            const endIndex = startIndex + matchText.length;
            
            html += `
                <div class="match-item">
                    <div class="match-text">"${this.escapeHtml(matchText)}"</div>
                    <div class="match-info">
                        مطابقت ${index + 1}: موقعیت ${startIndex}-${endIndex}
                        ${match.length > 1 ? `<br>گروه‌ها: ${match.slice(1).map((g, i) => `$${i+1}: "${g || 'خالی'}"`).join(', ')}` : ''}
                    </div>
                </div>
            `;
        });

        this.matchesContainer.innerHTML = html;
    }

    displayExplanation(pattern, flags) {
        const explanation = this.explainRegex(pattern, flags);
        this.explanationContainer.innerHTML = `
            <div class="explanation">
                <h4>توضیح عبارت منظم:</h4>
                <p><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: monospace;">${this.escapeHtml(pattern)}</code></p>
                <div style="margin-top: 10px;">${explanation}</div>
                <div style="margin-top: 15px;">
                    <strong>پرچم‌های فعال:</strong>
                    <ul style="margin-top: 5px; padding-right: 20px;">
                        ${flags.includes('g') ? '<li>g: جستجوی سراسری (تمام مطابقت‌ها)</li>' : ''}
                        ${flags.includes('i') ? '<li>i: نادیده‌گیری حروف بزرگ/کوچک</li>' : ''}
                        ${flags.includes('m') ? '<li>m: حالت چند خطی</li>' : ''}
                        ${!flags ? '<li>هیچ پرچمی فعال نیست</li>' : ''}
                    </ul>
                </div>
            </div>
        `;
    }

    explainRegex(pattern, flags) {
        const explanations = {
            '\\d': 'اعداد (0-9)',
            '\\D': 'غیر از اعداد',
            '\\w': 'کاراکترهای کلمه (حروف، اعداد، _)',
            '\\W': 'غیر از کاراکترهای کلمه',
            '\\s': 'فاصله‌ها (space, tab, newline)',
            '\\S': 'غیر از فاصله‌ها',
            '.': 'هر کاراکتر (به جز newline)',
            '^': 'شروع خط',
            '$': 'پایان خط',
            '*': 'صفر یا بیشتر',
            '+': 'یک یا بیشتر',
            '?': 'صفر یا یک',
            '[': 'شروع مجموعه کاراکتر',
            ']': 'پایان مجموعه کاراکتر',
            '(': 'شروع گروه',
            ')': 'پایان گروه',
            '|': 'یا (OR)',
            '\\': 'کاراکتر فرار',
            '{': 'شروع تکرار مشخص',
            '}': 'پایان تکرار مشخص'
        };

        let explanation = '<ul style="padding-right: 20px;">';
        
        // Simple pattern analysis
        if (pattern.includes('\\d+')) {
            explanation += '<li>یک یا چند رقم پشت سر هم</li>';
        }
        if (pattern.includes('[a-zA-Z]+')) {
            explanation += '<li>یک یا چند حرف انگلیسی</li>';
        }
        if (pattern.includes('[\\u0600-\\u06FF]+')) {
            explanation += '<li>یک یا چند حرف فارسی</li>';
        }
        if (pattern.includes('@')) {
            explanation += '<li>شامل نماد @ (احتمالاً ایمیل)</li>';
        }
        if (pattern.includes('^') && pattern.includes('$')) {
            explanation += '<li>مطابقت کامل خط</li>';
        }

        // Add general explanations
        for (const [char, desc] of Object.entries(explanations)) {
            if (pattern.includes(char)) {
                explanation += `<li><code>${char}</code>: ${desc}</li>`;
            }
        }

        explanation += '</ul>';
        return explanation;
    }

    highlightMatches(regex, text) {
        if (!text) {
            this.highlightedText.innerHTML = '<p class="no-results">متن آزمایشی وارد کنید</p>';
            return;
        }

        let highlightedText = text;
        const matches = [...text.matchAll(regex)];
        
        if (matches.length > 0) {
            // Sort matches by index in descending order to avoid position shifts
            matches.sort((a, b) => b.index - a.index);
            
            matches.forEach(match => {
                const matchText = match[0];
                const startIndex = match.index;
                const endIndex = startIndex + matchText.length;
                
                const before = highlightedText.slice(0, startIndex);
                const highlighted = `<span class="highlight">${this.escapeHtml(matchText)}</span>`;
                const after = highlightedText.slice(endIndex);
                
                highlightedText = before + highlighted + after;
            });
        }

        this.highlightedText.innerHTML = highlightedText || '<p class="no-results">نتایج اینجا نمایش داده می‌شود</p>';
    }

    showError(message) {
        this.matchesContainer.innerHTML = `<div class="error-state">${message}</div>`;
        this.explanationContainer.innerHTML = '<p class="no-results">خطا در تجزیه عبارت منظم</p>';
        this.highlightedText.innerHTML = '<p class="no-results">خطا در نمایش نتایج</p>';
    }

    clearResults() {
        this.matchesContainer.innerHTML = '<p class="no-results">هنوز هیچ تستی انجام نشده است</p>';
        this.explanationContainer.innerHTML = '<p class="no-results">عبارت منظم را وارد کرده و تست کنید</p>';
        this.highlightedText.innerHTML = '<p class="no-results">نتایج اینجا نمایش داده می‌شود</p>';
    }

    clearAll() {
        this.regexInput.value = '';
        this.testInput.value = '';
        this.flagGlobal.checked = true;
        this.flagCase.checked = false;
        this.flagMultiline.checked = false;
        this.clearResults();
        this.regexInput.focus();
    }

    // Modal functions
    openSaveModal() {
        if (!this.regexInput.value.trim()) {
            alert('ابتدا عبارت منظم را وارد کنید');
            return;
        }
        this.saveModal.style.display = 'block';
        this.snippetNameInput.focus();
    }

    closeSaveModal() {
        this.saveModal.style.display = 'none';
        this.snippetNameInput.value = '';
        this.snippetDescriptionInput.value = '';
    }

    saveSnippet() {
        const name = this.snippetNameInput.value.trim();
        const description = this.snippetDescriptionInput.value.trim();
        const regex = this.regexInput.value.trim();
        const flags = this.getFlags();

        if (!name) {
            alert('نام snippet را وارد کنید');
            return;
        }

        if (!regex) {
            alert('عبارت منظم خالی است');
            return;
        }

        const snippet = {
            id: Date.now(),
            name,
            description,
            regex,
            flags,
            createdAt: new Date().toLocaleDateString('fa-IR')
        };

        this.addSnippet(snippet);
        this.closeSaveModal();
        this.showSuccessMessage('Snippet با موفقیت ذخیره شد');
    }

    addSnippet(snippet) {
        let snippets = this.getStoredSnippets();
        snippets.push(snippet);
        localStorage.setItem('regex-snippets', JSON.stringify(snippets));
        this.displaySnippets();
    }

    getStoredSnippets() {
        const stored = localStorage.getItem('regex-snippets');
        return stored ? JSON.parse(stored) : [];
    }

    loadSnippets() {
        this.displaySnippets();
    }

    displaySnippets() {
        const snippets = this.getStoredSnippets();
        
        if (snippets.length === 0) {
            this.snippetsContainer.innerHTML = '<p class="no-results">هنوز هیچ snippet ذخیره نشده است</p>';
            return;
        }

        const html = snippets.map(snippet => `
            <div class="snippet-item" data-id="${snippet.id}">
                <div class="snippet-name">${this.escapeHtml(snippet.name)}</div>
                <div class="snippet-regex">${this.escapeHtml(snippet.regex)}</div>
                ${snippet.description ? `<div class="snippet-description">${this.escapeHtml(snippet.description)}</div>` : ''}
                <div class="snippet-actions">
                    <button class="snippet-btn snippet-use-btn" onclick="regexPlayground.useSnippet(${snippet.id})">استفاده</button>
                    <button class="snippet-btn snippet-delete-btn" onclick="regexPlayground.deleteSnippet(${snippet.id})">حذف</button>
                </div>
                <small style="color: #718096;">ذخیره شده در: ${snippet.createdAt}</small>
            </div>
        `).join('');

        this.snippetsContainer.innerHTML = html;
    }

    useSnippet(id) {
        const snippets = this.getStoredSnippets();
        const snippet = snippets.find(s => s.id === id);
        
        if (snippet) {
            this.regexInput.value = snippet.regex;
            
            // Set flags
            this.flagGlobal.checked = snippet.flags.includes('g');
            this.flagCase.checked = snippet.flags.includes('i');
            this.flagMultiline.checked = snippet.flags.includes('m');
            
            // Auto test if there's test text
            if (this.testInput.value.trim()) {
                this.testRegex();
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    deleteSnippet(id) {
        if (confirm('آیا از حذف این snippet مطمئن هستید؟')) {
            let snippets = this.getStoredSnippets();
            snippets = snippets.filter(s => s.id !== id);
            localStorage.setItem('regex-snippets', JSON.stringify(snippets));
            this.displaySnippets();
            this.showSuccessMessage('Snippet حذف شد');
        }
    }

    showSuccessMessage(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-state';
        successDiv.textContent = message;
        successDiv.style.position = 'fixed';
        successDiv.style.top = '20px';
        successDiv.style.right = '20px';
        successDiv.style.zIndex = '1001';
        successDiv.style.minWidth = '250px';
        
        document.body.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.regexPlayground = new RegexPlayground();
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Note: Service worker would be implemented separately if needed
        console.log('Ready for PWA features');
    });
}

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RegexPlayground;
}
