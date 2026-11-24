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


class OCRApp {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.loadHistory();
        this.worker = null;
        this.currentImage = null;
        this.networkAvailable = false;
        this.networkListenersAdded = false;
        
        this.checkConnectivity();
        
        // Test OCR capability on startup
        this.testOCRCapability();
    }

    async testOCRCapability() {
        // Silent test to see if OCR is actually working
        if (typeof Tesseract === 'undefined') {
            console.warn('⚠️ Tesseract.js not loaded - OCR will not work');
            return;
        }

        try {
            // Quick test with a timeout
            const testWorker = await Promise.race([
                Tesseract.createWorker(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10000))
            ]);
            
            console.log('✅ OCR test worker created successfully');
            await testWorker.terminate();
        } catch (error) {
            console.warn('⚠️ OCR test failed:', error.message);
        }
    }

    async checkConnectivity() {
        this.networkStatus.style.display = 'flex';
        const statusIndicator = this.networkStatus.querySelector('.status-indicator');
        const statusText = this.networkStatus.querySelector('.status-text');
        
        statusText.textContent = 'بررسی اتصال...';
        statusIndicator.className = 'status-indicator';
        
        const testUrls = [
            'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/package.json',
            'https://unpkg.com/tesseract.js@4.1.1/package.json',
            'https://tessdata.projectnaptha.com/4.0.0_best/eng.traineddata.gz'
        ];
        
        let connectionWorking = false;
        
        for (const testUrl of testUrls) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(testUrl, { 
                    method: 'HEAD', // Use HEAD to minimize data transfer
                    signal: controller.signal,
                    mode: 'no-cors' // Avoid CORS issues
                });
                
                clearTimeout(timeoutId);
                
                // For no-cors, we can't check response.ok, so we assume success if no error
                connectionWorking = true;
                console.log(`✅ Connection test passed with: ${testUrl}`);
                break;
                
            } catch (error) {
                console.warn(`❌ Connection test failed for: ${testUrl}`, error.message);
                // Continue to next URL
            }
        }
        
        if (connectionWorking) {
            this.networkAvailable = true;
            statusIndicator.className = 'status-indicator online';
            statusText.textContent = 'آنلاین - آماده استفاده';
            
            // Hide status after 3 seconds if connection is good
            setTimeout(() => {
                if (this.networkAvailable) {
                    this.networkStatus.style.display = 'none';
                }
            }, 3000);
        } else {
            this.networkAvailable = false;
            statusIndicator.className = 'status-indicator offline';
            statusText.textContent = 'مشکل در اتصال - حالت نمایشی فعال است';
            
            // Keep showing offline status but don't make it permanent
            setTimeout(() => {
                this.networkStatus.style.display = 'none';
            }, 10000);
            
            console.warn('❌ All network connectivity tests failed');
        }
        
        // Listen for online/offline events
        if (!this.networkListenersAdded) {
            this.networkListenersAdded = true;
            
            window.addEventListener('online', async () => {
                console.log('🌐 Network came online');
                await this.checkConnectivity();
            });
            
            window.addEventListener('offline', () => {
                console.log('📵 Network went offline');
                this.networkAvailable = false;
                this.networkStatus.style.display = 'flex';
                const statusIndicator = this.networkStatus.querySelector('.status-indicator');
                const statusText = this.networkStatus.querySelector('.status-text');
                statusIndicator.className = 'status-indicator offline';
                statusText.textContent = 'اتصال قطع شد - حالت نمایشی';
            });
        }
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.imageInput = document.getElementById('imageInput');
        this.languageSelect = document.getElementById('languageSelect');
        this.previewSection = document.getElementById('previewSection');
        this.previewImage = document.getElementById('previewImage');
        this.processBtn = document.getElementById('processBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultSection = document.getElementById('resultSection');
        this.resultText = document.getElementById('resultText');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.retryBtn = document.getElementById('retryBtn');
        this.historyContainer = document.getElementById('historyContainer');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        this.toast = document.getElementById('toast');
        this.networkStatus = document.getElementById('networkStatus');
    }

    bindEvents() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => {
            this.imageInput.click();
        });

        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });

        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });

        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageUpload(files[0]);
            }
        });

        // File input change
        this.imageInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });

        // Process button
        this.processBtn.addEventListener('click', () => {
            this.processImage();
        });

        // Result actions
        this.copyBtn.addEventListener('click', () => {
            this.copyText();
        });

        this.downloadBtn.addEventListener('click', () => {
            this.downloadText();
        });

        this.saveBtn.addEventListener('click', () => {
            this.saveToHistory();
        });

        // Retry button
        this.retryBtn.addEventListener('click', () => {
            this.retryOCR();
        });

        // Clear history
        this.clearHistoryBtn.addEventListener('click', () => {
            this.clearHistory();
        });
    }

    handleImageUpload(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showToast('لطفاً یک فایل تصویری انتخاب کنید', 'error');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            this.showToast('حجم فایل نباید بیشتر از 10 مگابایت باشد', 'error');
            return;
        }

        this.currentImage = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            this.previewImage.src = e.target.result;
            this.previewSection.style.display = 'block';
            this.previewSection.classList.add('fade-in');
            this.hideResults();
        };
        reader.readAsDataURL(file);
    }

    async processImage() {
        if (!this.currentImage) {
            this.showToast('لطفاً ابتدا تصویری انتخاب کنید', 'error');
            return;
        }

        this.showProgress();
        
        // Check internet connection first
        if (!this.networkAvailable) {
            this.showToast('در حال بررسی اتصال اینترنت...', 'warning');
            await this.checkConnectivity();
        }
        
        // If we have internet, try real OCR
        if (this.networkAvailable) {
            try {
                await this.processWithTesseract();
                return; // Success - exit here
            } catch (error) {
                console.error('Tesseract failed with internet available:', error);
                this.showToast('خطا در تشخیص متن. در حال تلاش مجدد...', 'warning');
                
                // Wait a bit and try once more
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                try {
                    await this.processWithTesseract();
                    return; // Success on retry
                } catch (retryError) {
                    console.error('Tesseract failed on retry:', retryError);
                    this.showToast('تشخیص واقعی متن ناموفق بود. در حال استفاده از حالت نمایشی...', 'error');
                }
            }
        }
        
        // Fall back to demo mode only if all else fails
        this.showToast('حالت نمایشی - برای تشخیص واقعی اتصال اینترنت لازم است', 'warning');
        this.demoMode();
    }

    async processWithTesseract() {
        // Check if Tesseract is available
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js is not available - CDN loading failed');
        }

        let worker = null;
        try {
            // Initialize Tesseract worker with retry mechanism
            worker = await this.createWorkerWithRetry();
            
            // Set language
            const language = this.languageSelect.value;
            
            if (language !== 'eng') {
                try {
                    await worker.loadLanguage(language);
                    await worker.initialize(language);
                } catch (langError) {
                    console.warn('Failed to load language, falling back to English:', langError);
                    await worker.loadLanguage('eng');
                    await worker.initialize('eng');
                    this.showToast('خطا در بارگذاری زبان انتخابی. از زبان انگلیسی استفاده می‌شود', 'warning');
                }
            } else {
                await worker.loadLanguage('eng');
                await worker.initialize('eng');
            }
            
            // Process image
            const { data: { text } } = await worker.recognize(this.currentImage, {
                logger: (m) => this.updateProgress(m)
            });
            
            // Clean up worker
            await worker.terminate();
            worker = null;
            
            // Show results
            this.showResults(text, false); // false indicates it's real OCR
            
        } catch (error) {
            // Clean up worker if it was created
            if (worker) {
                try {
                    await worker.terminate();
                } catch (terminateError) {
                    console.error('Error terminating worker:', terminateError);
                }
            }
            
            // Re-throw the error to be handled by the calling function
            throw error;
        }
    }

    demoMode() {
        // Simulate OCR processing for demo/testing
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5; // Random progress between 5-20%
            
            if (progress > 100) {
                progress = 100;
            }
            
            this.progressFill.style.width = `${progress}%`;
            
            if (progress <= 25) {
                this.progressText.textContent = `بارگذاری موتور تشخیص... (${Math.round(progress)}%)`;
            } else if (progress <= 50) {
                this.progressText.textContent = `راه‌اندازی... (${Math.round(progress)}%)`;
            } else if (progress <= 85) {
                this.progressText.textContent = `در حال تشخیص متن... (${Math.round(progress)}%)`;
            } else {
                this.progressText.textContent = `تکمیل... (${Math.round(progress)}%)`;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
                
                // Generate more realistic demo text based on image
                const fileType = this.currentImage.type;
                const fileSize = (this.currentImage.size / 1024).toFixed(2);
                const currentDate = new Date().toLocaleString('fa-IR');
                
                const demoTexts = [
                    `نمونه متن استخراج شده از تصویر

این متن به صورت خودکار تشخیص داده شده است.
کیفیت تشخیص بستگی به وضوح تصویر و نوع فونت دارد.

برای بهترین نتایج:
• از تصاویر با کیفیت بالا استفاده کنید
• متن را واضح و خوانا بنویسید  
• از نور مناسب برای عکس‌برداری استفاده کنید

تاریخ: ${currentDate}`,
                    
                    `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

نمونه متن ترکیبی:
این متن شامل زبان‌های مختلف است که به صورت آزمایشی تولید شده.

१२३४५६७८९०
Sample English text for demonstration.`,
                    
                    `عنوان: تست تشخیص متن

محتوای اصلی:
این برنامه قابلیت تشخیص متن از تصاویر را دارد.
از تکنولوژی OCR برای این کار استفاده می‌شود.

• پشتیبانی از زبان‌های مختلف
• رابط کاربری ساده و کاربردی
• قابلیت ذخیره تاریخچه

نتیجه: موفقیت‌آمیز`
                ];
                
                const randomText = demoTexts[Math.floor(Math.random() * demoTexts.length)];
                const finalDemoText = `${randomText}

──────────────────────────
اطلاعات فایل:
نام: ${this.currentImage.name}
نوع: ${fileType}
اندازه: ${fileSize} KB
──────────────────────────

🔧 وضعیت: حالت نمایشی
💡 این متن نمونه است، نه تشخیص واقعی
🌐 برای عملکرد کامل، اتصال پایدار اینترنت لازم است`;
                
                this.showResults(finalDemoText, true); // true indicates it's demo mode
            }
        }, 150 + Math.random() * 100); // Random interval between 150-250ms
    }

    async createWorkerWithRetry(maxRetries = 5) {
        const cdnConfigs = [
            // Default configuration with latest version
            {
                name: 'jsDelivr CDN (پیش‌فرض)',
                config: {
                    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.0.2/dist/worker.min.js',
                    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.0.0/tesseract-core-simd.js'
                }
            },
            // Older stable version
            {
                name: 'jsDelivr CDN (نسخه پایدار)',
                config: {
                    workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@4.1.1/dist/worker.min.js',
                    corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@4.0.2/tesseract-core.wasm.js'
                }
            },
            // unpkg CDN
            {
                name: 'unpkg CDN',
                config: {
                    workerPath: 'https://unpkg.com/tesseract.js@4.1.1/dist/worker.min.js',
                    corePath: 'https://unpkg.com/tesseract.js-core@4.0.2/tesseract-core.wasm.js'
                }
            },
            // Default Tesseract configuration (let it choose)
            {
                name: 'تنظیمات پیش‌فرض Tesseract',
                config: {}
            },
            // GitHub CDN alternative
            {
                name: 'GitHub Pages CDN',
                config: {
                    workerPath: 'https://cdn.jsdelivr.net/gh/naptha/tesseract.js@v4.1.1/dist/worker.min.js',
                    corePath: 'https://cdn.jsdelivr.net/gh/naptha/tesseract.js-core@v4.0.2/tesseract-core.wasm.js'
                }
            }
        ];

        let lastError = null;
        
        for (let i = 0; i < maxRetries; i++) {
            const cdnConfig = cdnConfigs[i % cdnConfigs.length];
            
            try {
                this.updateProgress({ 
                    status: i === 0 ? 'در حال راه‌اندازی موتور تشخیص...' : `تلاش ${i + 1}/${maxRetries} با ${cdnConfig.name}...`, 
                    progress: 0.1 + (i * 0.1)
                });
                
                // Add timeout for worker creation
                const workerPromise = Tesseract.createWorker(cdnConfig.config);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout creating worker')), 30000)
                );
                
                const worker = await Promise.race([workerPromise, timeoutPromise]);
                
                // Test the worker by trying to load English language
                await worker.loadLanguage('eng');
                
                console.log(`✅ Worker created successfully with ${cdnConfig.name}`);
                return worker;
                
            } catch (error) {
                lastError = error;
                console.error(`❌ Worker creation attempt ${i + 1} failed with ${cdnConfig.name}:`, error.message);
                
                if (i < maxRetries - 1) {
                    // Progressive delay: 1s, 2s, 3s, etc.
                    const delay = (i + 1) * 1000;
                    console.log(`⏳ Waiting ${delay}ms before next attempt...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        // If all attempts failed, throw the last error
        throw new Error(`تمام ${maxRetries} تلاش برای راه‌اندازی موتور تشخیص ناکام بود. آخرین خطا: ${lastError?.message || 'نامشخص'}`);
    }

    updateProgress(info) {
        if (info.status && info.progress !== undefined) {
            const progress = Math.round(info.progress * 100);
            this.progressFill.style.width = `${progress}%`;
            
            let statusText = '';
            switch (info.status) {
                case 'loading tesseract core':
                    statusText = 'در حال بارگذاری موتور تشخیص...';
                    break;
                case 'initializing tesseract':
                    statusText = 'در حال راه‌اندازی...';
                    break;
                case 'loading language traineddata':
                    statusText = 'در حال بارگذاری دیتای زبان...';
                    break;
                case 'initializing api':
                    statusText = 'در حال راه‌اندازی API...';
                    break;
                case 'recognizing text':
                    statusText = 'در حال تشخیص متن...';
                    break;
                default:
                    statusText = 'در حال پردازش...';
            }
            
            this.progressText.textContent = `${statusText} (${progress}%)`;
        }
    }

    showProgress() {
        this.processBtn.disabled = true;
        this.progressSection.style.display = 'block';
        this.progressSection.classList.add('fade-in');
        this.hideResults();
    }

    hideProgress() {
        this.progressSection.style.display = 'none';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'در حال پردازش...';
        this.processBtn.disabled = false;
    }

    showResults(text, isDemoMode = false) {
        this.hideProgress();
        this.resultText.value = text.trim();
        this.resultSection.style.display = 'block';
        this.resultSection.classList.add('fade-in');
        
        // Show or hide retry button based on demo mode
        if (isDemoMode) {
            this.retryBtn.style.display = 'inline-block';
            this.showToast('حالت نمایشی - دکمه "تلاش مجدد" برای تشخیص واقعی', 'warning');
        } else {
            this.retryBtn.style.display = 'none';
            if (text.trim()) {
                this.showToast('متن با موفقیت استخراج شد', 'success');
            } else {
                this.showToast('متنی در تصویر شناسایی نشد', 'error');
            }
        }
    }

    hideResults() {
        this.resultSection.style.display = 'none';
        this.resultText.value = '';
        this.retryBtn.style.display = 'none';
    }

    async retryOCR() {
        if (!this.currentImage) {
            this.showToast('تصویری برای پردازش مجدد وجود ندارد', 'error');
            return;
        }
        
        this.showToast('تلاش مجدد برای تشخیص واقعی متن...', 'success');
        this.hideResults();
        
        // Force network connectivity check
        await this.checkConnectivity();
        
        // Try OCR again
        await this.processImage();
    }

    copyText() {
        if (this.resultText.value.trim()) {
            navigator.clipboard.writeText(this.resultText.value)
                .then(() => {
                    this.showToast('متن کپی شد', 'success');
                })
                .catch(() => {
                    // Fallback for older browsers
                    this.resultText.select();
                    document.execCommand('copy');
                    this.showToast('متن کپی شد', 'success');
                });
        } else {
            this.showToast('متنی برای کپی وجود ندارد', 'error');
        }
    }

    downloadText() {
        if (this.resultText.value.trim()) {
            const blob = new Blob([this.resultText.value], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `extracted-text-${new Date().getTime()}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            this.showToast('فایل دانلود شد', 'success');
        } else {
            this.showToast('متنی برای دانلود وجود ندارد', 'error');
        }
    }

    saveToHistory() {
        if (!this.resultText.value.trim()) {
            this.showToast('متنی برای ذخیره وجود ندارد', 'error');
            return;
        }

        const historyItem = {
            id: Date.now(),
            date: new Date().toLocaleString('fa-IR'),
            language: this.getLanguageName(this.languageSelect.value),
            languageCode: this.languageSelect.value,
            text: this.resultText.value.trim()
        };

        // Get existing history
        let history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
        history.unshift(historyItem);
        
        // Keep only last 50 items
        history = history.slice(0, 50);
        
        // Save to localStorage
        localStorage.setItem('ocrHistory', JSON.stringify(history));
        
        // Update display
        this.loadHistory();
        this.showToast('در تاریخچه ذخیره شد', 'success');
    }

    loadHistory() {
        const history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
        
        if (history.length === 0) {
            this.historyContainer.innerHTML = '<p class="no-history">هیچ تاریخچه‌ای وجود ندارد</p>';
            this.clearHistoryBtn.style.display = 'none';
            return;
        }

        this.clearHistoryBtn.style.display = 'block';
        
        this.historyContainer.innerHTML = history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-header">
                    <span class="history-date">${item.date}</span>
                    <span class="history-language">${item.language}</span>
                </div>
                <div class="history-text">${this.escapeHtml(item.text)}</div>
                <div class="history-actions">
                    <button class="btn btn-secondary" onclick="app.copyHistoryText('${item.id}')">کپی</button>
                    <button class="btn btn-info" onclick="app.loadHistoryText('${item.id}')">بارگذاری</button>
                    <button class="btn btn-danger" onclick="app.deleteHistoryItem('${item.id}')">حذف</button>
                </div>
            </div>
        `).join('');
    }

    copyHistoryText(id) {
        const history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
        const item = history.find(h => h.id == id);
        
        if (item) {
            navigator.clipboard.writeText(item.text)
                .then(() => {
                    this.showToast('متن کپی شد', 'success');
                })
                .catch(() => {
                    this.showToast('خطا در کپی متن', 'error');
                });
        }
    }

    loadHistoryText(id) {
        const history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
        const item = history.find(h => h.id == id);
        
        if (item) {
            this.resultText.value = item.text;
            this.languageSelect.value = item.languageCode;
            this.resultSection.style.display = 'block';
            this.showToast('متن بارگذاری شد', 'success');
            
            // Scroll to result section
            this.resultSection.scrollIntoView({ behavior: 'smooth' });
        }
    }

    deleteHistoryItem(id) {
        if (confirm('آیا از حذف این مورد اطمینان دارید؟')) {
            let history = JSON.parse(localStorage.getItem('ocrHistory') || '[]');
            history = history.filter(item => item.id != id);
            localStorage.setItem('ocrHistory', JSON.stringify(history));
            this.loadHistory();
            this.showToast('مورد حذف شد', 'success');
        }
    }

    clearHistory() {
        if (confirm('آیا از پاک کردن تمام تاریخچه اطمینان دارید؟')) {
            localStorage.removeItem('ocrHistory');
            this.loadHistory();
            this.showToast('تاریخچه پاک شد', 'success');
        }
    }

    getLanguageName(code) {
        const languages = {
            'fas': 'فارسی',
            'eng': 'انگلیسی',
            'ara': 'عربی',
            'fra': 'فرانسوی',
            'deu': 'آلمانی',
            'spa': 'اسپانیولی',
            'tur': 'ترکی',
            'rus': 'روسی',
            'chi_sim': 'چینی ساده',
            'jpn': 'ژاپنی'
        };
        return languages[code] || code;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message, type = 'success') {
        this.toast.textContent = message;
        this.toast.className = `toast ${type}`;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new OCRApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.worker) {
        window.app.worker.terminate();
    }
});

