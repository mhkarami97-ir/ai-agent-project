// Tools data
const tools = [
    {
        path: 'bluethooth-killer',
        faName: 'قطع کردن بلوتوث',
        enName: 'bluethooth Killer',
        faDesc: 'قطع کردن دستگاه‌های بلوتوث اطراف مثل اسپیکرها',
        enDesc: 'kill bluethooth devices nearby',
        icon: '📶'
    },
    {
        path: 'license-plate',
        faName: 'پلاک و شماره تلفن استانها',
        enName: 'LicensePlate',
        faDesc: 'نمایش جزئیات پلاک و شماره تلفن استانها',
        enDesc: 'Show details of license plates and phone numbers of provinces',
        icon: '🚗'
    },
    {
        path: 'weather',
        faName: 'وضعیت هوا',
        enName: 'Weather',
        faDesc: 'نمایش وضعیت آب و هوای امروز',
        enDesc: 'Show today\'s weather',
        icon: '🌤️'
    },
    {
        path: 'chat',
        faName: 'چت',
        enName: 'Chat',
        faDesc: 'سیستم چت آنلاین',
        enDesc: 'Online chat system',
        icon: '💬'
    },
    {
        path: 'compress',
        faName: 'فشرده‌ساز تصویر',
        enName: 'Image Compressor',
        faDesc: 'فشرده‌سازی تصاویر در مرورگر',
        enDesc: 'Compress images in browser',
        icon: '🗜️'
    },
    {
        path: 'compress-file',
        faName: 'فشرده‌ساز فایل',
        enName: 'File Compressor',
        faDesc: 'فشرده‌سازی HTML, CSS, JS',
        enDesc: 'Compress HTML, CSS, JS files',
        icon: '📦'
    },
    {
        path: 'qr',
        faName: 'کیوآر کد',
        enName: 'QR Code',
        faDesc: 'ساخت و خواندن کد QR',
        enDesc: 'Generate and read QR codes',
        icon: '📱'
    },
    {
        path: 'color',
        faName: 'پالت رنگ',
        enName: 'Color Palette',
        faDesc: 'ژنراتور پالت رنگ هماهنگ',
        enDesc: 'Harmonious color palette generator',
        icon: '🎨'
    },
    {
        path: 'json',
        faName: 'JSON',
        enName: 'JSON Formatter',
        faDesc: 'فرمت و اعتبارسنجی JSON',
        enDesc: 'Format and validate JSON',
        icon: '📋'
    },
    {
        path: 'editor',
        faName: 'ویرایشگر متن',
        enName: 'Text Editor',
        faDesc: 'ویرایشگر متن پیشرفته',
        enDesc: 'Advanced text editor',
        icon: '📝'
    },
    {
        path: 'text',
        faName: 'ژنراتور متن',
        enName: 'Text Generator',
        faDesc: 'تولید محتوای متنی',
        enDesc: 'Generate text content',
        icon: '✍️'
    },
    {
        path: 'text-counter',
        faName: 'شمارنده متن',
        enName: 'Text Counter',
        faDesc: 'شمارش کلمات و کاراکترها',
        enDesc: 'Count words and characters',
        icon: '🔢'
    },
    {
        path: 'text-formatter',
        faName: 'فرمت‌دهنده متن',
        enName: 'Text Formatter',
        faDesc: 'فرمت‌دهی و تبدیل متن',
        enDesc: 'Format and transform text',
        icon: '📄'
    },
    {
        path: 'encoder',
        faName: 'رمزگذار',
        enName: 'Encoder',
        faDesc: 'رمزگذاری و رمزگشایی داده',
        enDesc: 'Encode and decode data',
        icon: '🔐'
    },
    {
        path: 'password',
        faName: 'رمز عبور',
        enName: 'Password Generator',
        faDesc: 'تولید رمز عبور امن',
        enDesc: 'Generate secure passwords',
        icon: '🔑'
    },
    {
        path: 'secure-text',
        faName: 'متن امن',
        enName: 'Secure Text',
        faDesc: 'مدیریت متن‌های امن',
        enDesc: 'Manage secure texts',
        icon: '🔒'
    },
    {
        path: 'mapper',
        faName: 'تبدیل واحد',
        enName: 'Unit Converter',
        faDesc: 'تبدیل واحدهای مختلف',
        enDesc: 'Convert various units',
        icon: '🔄'
    },
    {
        path: 'currency-conversion-calculator',
        faName: 'تبدیل ارز',
        enName: 'Currency Converter',
        faDesc: 'تبدیل ارزهای مختلف',
        enDesc: 'Convert currencies',
        icon: '💱'
    },
    {
        path: 'date',
        faName: 'تاریخ',
        enName: 'Date Converter',
        faDesc: 'تبدیل و نمایش تاریخ',
        enDesc: 'Convert and display dates',
        icon: '📅'
    },
    {
        path: 'time',
        faName: 'زمان',
        enName: 'Time & Clock',
        faDesc: 'ساعت و زمان',
        enDesc: 'Clock and time',
        icon: '⏰'
    },
    {
        path: 'time-tracker',
        faName: 'زمان‌سنج',
        enName: 'Time Tracker',
        faDesc: 'ردیابی زمان کارها',
        enDesc: 'Track time for tasks',
        icon: '⏱️'
    },
    {
        path: 'pomodoro-timer',
        faName: 'تایمر پومودورو',
        enName: 'Pomodoro Timer',
        faDesc: 'مدیریت زمان با روش پومودورو',
        enDesc: 'Manage time with Pomodoro technique',
        icon: '🍅'
    },
    {
        path: 'daily-planner',
        faName: 'برنامه‌ریز روزانه',
        enName: 'Daily Planner',
        faDesc: 'برنامه‌ریزی وظایف روزانه',
        enDesc: 'Plan your daily tasks',
        icon: '📆'
    },
    {
        path: 'note',
        faName: 'یادداشت',
        enName: 'Note',
        faDesc: 'یادداشت‌برداری سریع',
        enDesc: 'Quick note-taking',
        icon: '📓'
    },
    {
        path: 'check-list',
        faName: 'چک‌لیست',
        enName: 'Checklist',
        faDesc: 'مدیریت چک‌لیست‌ها',
        enDesc: 'Manage checklists',
        icon: '✅'
    },
    {
        path: 'habit',
        faName: 'ردیاب عادت',
        enName: 'Habit Tracker',
        faDesc: 'ردیابی عادت‌های روزانه',
        enDesc: 'Track daily habits',
        icon: '🎯'
    },
    {
        path: 'cost-divider',
        faName: 'تقسیم هزینه',
        enName: 'Cost Divider',
        faDesc: 'تقسیم هزینه‌های مشترک',
        enDesc: 'Split shared expenses',
        icon: '💰'
    },
    {
        path: 'debt',
        faName: 'مدیریت بدهی',
        enName: 'Debt Manager',
        faDesc: 'مدیریت بدهی‌ها',
        enDesc: 'Manage debts',
        icon: '💳'
    },
    {
        path: 'personal-budget-planner',
        faName: 'بودجه شخصی',
        enName: 'Budget Planner',
        faDesc: 'برنامه‌ریزی بودجه شخصی',
        enDesc: 'Plan personal budget',
        icon: '💵'
    },
    {
        path: 'medicine',
        faName: 'مدیریت دارو',
        enName: 'Medicine Manager',
        faDesc: 'مدیریت داروها',
        enDesc: 'Manage medicines',
        icon: '💊'
    },
    {
        path: 'warranty-management',
        faName: 'مدیریت گارانتی',
        enName: 'Warranty Manager',
        faDesc: 'مدیریت گارانتی‌ها',
        enDesc: 'Manage warranties',
        icon: '📜'
    },
    {
        path: 'home-tracker',
        faName: 'ردیاب خانه',
        enName: 'Home Tracker',
        faDesc: 'مدیریت اشیاء منزل',
        enDesc: 'Manage home objects',
        icon: '🏠'
    },
    {
        path: 'travel',
        faName: 'برنامه سفر',
        enName: 'Travel Planner',
        faDesc: 'برنامه‌ریزی سفرها',
        enDesc: 'Plan your trips',
        icon: '✈️'
    },
    {
        path: 'meeting-finder',
        faName: 'جلسه‌یاب',
        enName: 'Meeting Finder',
        faDesc: 'زمان‌بندی جلسات',
        enDesc: 'Schedule meetings',
        icon: '🤝'
    },
    {
        path: 'regex',
        faName: 'رجکس',
        enName: 'Regex Tester',
        faDesc: 'تست عبارات منظم',
        enDesc: 'Test regular expressions',
        icon: '🔍'
    },
    {
        path: 'compare',
        faName: 'مقایسه متن',
        enName: 'Text Compare',
        faDesc: 'مقایسه متن‌ها',
        enDesc: 'Compare texts',
        icon: '🔀'
    },
    {
        path: 'mapper',
        faName: 'نقشه',
        enName: 'Mapper',
        faDesc: 'نقشه و مکان‌یابی',
        enDesc: 'Map and location',
        icon: '🗺️'
    },
    {
        path: 'downloader',
        faName: 'دانلودر',
        enName: 'Downloader',
        faDesc: 'دانلود فایل‌ها',
        enDesc: 'Download files',
        icon: '⬇️'
    },
    {
        path: 'meta-data',
        faName: 'متادیتا',
        enName: 'Metadata Viewer',
        faDesc: 'نمایش متادیتای تصاویر',
        enDesc: 'View image metadata',
        icon: '🖼️'
    },
    {
        path: 'water-mark',
        faName: 'واترمارک',
        enName: 'Watermark',
        faDesc: 'افزودن واترمارک به تصاویر',
        enDesc: 'Add watermark to images',
        icon: '©️'
    },
    {
        path: 'favicon',
        faName: 'فاویکون',
        enName: 'Favicon Generator',
        faDesc: 'ساخت فاویکون',
        enDesc: 'Generate favicon',
        icon: '🎴'
    },
    {
        path: 'cron',
        faName: 'کران جاب',
        enName: 'Cron Job',
        faDesc: 'زمان‌بند وظایف',
        enDesc: 'Task scheduler',
        icon: '⚙️'
    },
    {
        path: 'log-analyzer',
        faName: 'تحلیل لاگ',
        enName: 'Log Analyzer',
        faDesc: 'تحلیل فایل‌های لاگ',
        enDesc: 'Analyze log files',
        icon: '📊'
    },
    {
        path: 'leitner',
        faName: 'سیستم لایتنر',
        enName: 'Leitner System',
        faDesc: 'یادگیری با فلش کارت',
        enDesc: 'Learn with flashcards',
        icon: '🎓'
    },
    {
        path: 'typing',
        faName: 'تمرین تایپ',
        enName: 'Typing Practice',
        faDesc: 'بهبود سرعت تایپ',
        enDesc: 'Improve typing speed',
        icon: '⌨️'
    },
    {
        path: 'mime',
        faName: 'MIME',
        enName: 'MIME Types',
        faDesc: 'شناسایی نوع فایل',
        enDesc: 'Identify file types',
        icon: '📎'
    },
    {
        path: 'osint',
        faName: 'اطلاعات افراد',
        enName: 'OSINT',
        faDesc: 'جستجوی اطلاعات عمومی افراد',
        enDesc: 'Open source intelligence',
        icon: '🕵️'
    },
    {
        path: 'question-answer',
        faName: 'پرسش و پاسخ',
        enName: 'Q&A',
        faDesc: 'سیستم پرسش و پاسخ',
        enDesc: 'Question and answer system',
        icon: '❓'
    },
    {
        path: 'mind-map',
        faName: 'نقشه ذهنی',
        enName: 'Mind Map',
        faDesc: 'ساخت نقشه ذهنی',
        enDesc: 'Create mind maps',
        icon: '🧠'
    },
    {
        path: 'metronome',
        faName: 'مترونوم',
        enName: 'Metronome',
        faDesc: 'حفظ ریتم موسیقی',
        enDesc: 'Keep musical rhythm',
        icon: '🎵'
    }
];

// Sort tools alphabetically by Persian name
tools.sort((a, b) => a.faName.localeCompare(b.faName, 'fa'));

let filteredTools = [...tools];

// Render tools list
function renderTools() {
    const toolsList = document.getElementById('toolsList');
    const noResults = document.getElementById('noResults');

    if (filteredTools.length === 0) {
        toolsList.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    toolsList.innerHTML = filteredTools.map(tool => `
        <li>
            <a class="link" href="/${tool.path}/">
                <div class="icon">${tool.icon}</div>
                <div class="content">
                    <div class="lang-section fa">
                        <div class="name">${tool.faName}</div>
                        <div class="desc">${tool.faDesc}</div>
                    </div>
                    <div class="lang-section en">
                        <div class="name">${tool.enName}</div>
                        <div class="desc">${tool.enDesc}</div>
                    </div>
                </div>
            </a>
        </li>
    `).join('');

    updateStats();
}

// Update statistics
function updateStats() {
    const totalCount = document.getElementById('totalCount');
    const filteredInfo = document.getElementById('filteredInfo');

    totalCount.textContent = tools.length;

    if (filteredTools.length < tools.length) {
        filteredInfo.textContent = `نمایش ${filteredTools.length} مورد`;
    } else {
        filteredInfo.textContent = '';
    }
}

// Search functionality
function handleSearch(query) {
    const q = query.toLowerCase().trim();

    if (!q) {
        filteredTools = [...tools];
    } else {
        filteredTools = tools.filter(tool =>
            tool.faName.toLowerCase().includes(q) ||
            tool.enName.toLowerCase().includes(q) ||
            tool.faDesc.toLowerCase().includes(q) ||
            tool.enDesc.toLowerCase().includes(q) ||
            tool.path.toLowerCase().includes(q)
        );
    }

    renderTools();
}

// Event listeners
document.getElementById('searchInput').addEventListener('input', (e) => {
    handleSearch(e.target.value);
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Initial render
renderTools();

// Theme management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const body = document.body;

// Load saved theme or use system preference
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        body.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
    }
}

// Update theme icon based on current theme
function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
}

// Toggle theme
function toggleTheme() {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

// Event listeners for theme
themeToggle.addEventListener('click', toggleTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
        const theme = e.matches ? 'dark' : 'light';
        body.setAttribute('data-theme', theme);
        updateThemeIcon(theme);
    }
});

// Initialize theme
loadTheme();

// PWA Install Prompt
let deferredPrompt;
const installPromptDismissed = localStorage.getItem('installPromptDismissed');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    if (!installPromptDismissed) {
        showInstallPrompt();
    }
});

function showInstallPrompt() {
    const prompt = document.createElement('div');
    prompt.className = 'install-prompt';
    prompt.innerHTML = `
        <div class="install-prompt-text">
            <div class="install-prompt-title">📱 نصب اپلیکیشن</div>
        </div>
        <button class="install-btn" id="installBtn">نصب</button>
        <button class="close-install" id="closeInstall">✕</button>
    `;
    document.body.appendChild(prompt);

    document.getElementById('installBtn').addEventListener('click', async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const {outcome} = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }

        deferredPrompt = null;
        prompt.remove();
    });

    document.getElementById('closeInstall').addEventListener('click', () => {
        localStorage.setItem('installPromptDismissed', 'true');
        prompt.remove();
    });
}

// Register Service Worker
if ('serviceWorker' in navigator) {
    let newWorker;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered:', registration);

                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute

                // Listen for waiting worker
                registration.addEventListener('updatefound', () => {
                    newWorker = registration.installing;

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is ready
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch(err => {
                console.log('SW registration failed:', err);
            });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                showUpdateNotification();
            }
        });

        // Handle controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    });

    // Show update notification
    function showUpdateNotification() {
        const notification = document.getElementById('updateNotification');
        if (notification) {
            notification.classList.remove('hidden');
            notification.classList.add('show');
        }
    }

    // Handle update button click
    document.addEventListener('DOMContentLoaded', () => {
        const updateButton = document.getElementById('updateButton');
        const dismissButton = document.getElementById('dismissUpdate');
        const notification = document.getElementById('updateNotification');

        if (updateButton) {
            updateButton.addEventListener('click', () => {
                // Clear all caches and reload
                if ('caches' in window) {
                    caches.keys().then(names => {
                        names.forEach(name => {
                            caches.delete(name);
                        });
                    }).then(() => {
                        // Tell the service worker to skip waiting
                        if (newWorker) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                        } else {
                            window.location.reload();
                        }
                    });
                } else {
                    window.location.reload();
                }
            });
        }

        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                notification.classList.remove('show');
                notification.classList.add('hidden');
            });
        }
    });
}

// Handle app installation
window.addEventListener('appinstalled', () => {
    console.log('App installed successfully');
    deferredPrompt = null;
});

