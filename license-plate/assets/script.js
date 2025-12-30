// Data for Iranian provinces with license plate codes and phone codes
const provincesData = [
    {
        name: 'تهران',
        plateCode: '۱۱، ۲۲، ۳۳، ۴۴، ۵۵، ۶۶، ۷۷، ۸۸، ۹۹',
        phoneCode: '۰۲۱',
        cities: 'تهران، شمیرانات، ری، اسلامشهر، پاکدشت، شهریار'
    },
    {
        name: 'اصفهان',
        plateCode: '۱۵، ۱۶، ۱۷، ۱۸',
        phoneCode: '۰۳۱',
        cities: 'اصفهان، کاشان، نجف‌آباد، خمینی‌شهر، شاهین‌شهر، فلاورجان'
    },
    {
        name: 'فارس',
        plateCode: '۱۹، ۲۰، ۲۱',
        phoneCode: '۰۷۱',
        cities: 'شیراز، مرودشت، کازرون، جهرم، لار، آباده'
    },
    {
        name: 'خراسان رضوی',
        plateCode: '۲۳، ۲۴، ۲۵',
        phoneCode: '۰۵۱',
        cities: 'مشهد، نیشابور، سبزوار، تربت حیدریه، قوچان، کاشمر'
    },
    {
        name: 'آذربایجان شرقی',
        plateCode: '۱۲، ۱۳، ۱۴',
        phoneCode: '۰۴۱',
        cities: 'تبریز، مراغه، مرند، اهر، بناب، میانه'
    },
    {
        name: 'خوزستان',
        plateCode: '۳۵، ۳۶، ۳۷، ۳۸',
        phoneCode: '۰۶۱',
        cities: 'اهواز، آبادان، خرمشهر، دزفول، بهبهان، ماهشهر'
    },
    {
        name: 'مازندران',
        plateCode: '۲۶، ۲۷، ۲۸',
        phoneCode: '۰۱۱',
        cities: 'ساری، بابل، آمل، قائمشهر، بابلسر، نوشهر'
    },
    {
        name: 'گیلان',
        plateCode: '۴۱، ۴۲',
        phoneCode: '۰۱۳',
        cities: 'رشت، انزلی، لاهیجان، لنگرود، رودسر، آستارا'
    },
    {
        name: 'کرمان',
        plateCode: '۷۱، ۷۲',
        phoneCode: '۰۳۴',
        cities: 'کرمان، رفسنجان، سیرجان، جیرفت، بم، زرند'
    },
    {
        name: 'البرز',
        plateCode: '۶۸',
        phoneCode: '۰۲۶',
        cities: 'کرج، فردیس، هشتگرد، نظرآباد، طالقان، اشتهارد'
    },
    {
        name: 'آذربایجان غربی',
        plateCode: '۴۳، ۴۴',
        phoneCode: '۰۴۴',
        cities: 'ارومیه، خوی، مهاباد، میاندوآب، بوکان، سلماس'
    },
    {
        name: 'کرمانشاه',
        plateCode: '۶۱، ۶۲',
        phoneCode: '۰۸۳',
        cities: 'کرمانشاه، اسلام‌آبادغرب، سنقر، هرسین، کنگاور، پاوه'
    },
    {
        name: 'همدان',
        plateCode: '۶۵',
        phoneCode: '۰۸۱',
        cities: 'همدان، ملایر، نهاوند، تویسرکان، اسدآباد، رزن'
    },
    {
        name: 'قزوین',
        plateCode: '۴۵',
        phoneCode: '۰۲۸',
        cities: 'قزوین، تاکستان، آبیک، بوئین‌زهرا، الوند'
    },
    {
        name: 'قم',
        plateCode: '۵۵',
        phoneCode: '۰۲۵',
        cities: 'قم، سلفچگان، کهک، جعفریه'
    },
    {
        name: 'مرکزی',
        phoneCode: '۰۸۶',
        plateCode: '۵۶، ۵۷',
        cities: 'اراک، ساوه، خمین، محلات، دلیجان، تفرش'
    },
    {
        name: 'سیستان و بلوچستان',
        plateCode: '۷۳، ۷۴',
        phoneCode: '۰۵۴',
        cities: 'زاهدان، زابل، چابهار، ایرانشهر، سراوان، خاش'
    },
    {
        name: 'یزد',
        plateCode: '۷۵',
        phoneCode: '۰۳۵',
        cities: 'یزد، میبد، اردکان، مهریز، بافق، تفت'
    },
    {
        name: 'هرمزگان',
        plateCode: '۷۶، ۷۷',
        phoneCode: '۰۷۶',
        cities: 'بندرعباس، قشم، کیش، بندرلنگه، میناب، جاسک'
    },
    {
        name: 'لرستان',
        plateCode: '۶۳',
        phoneCode: '۰۶۶',
        cities: 'خرم‌آباد، بروجرد، دورود، الیگودرز، کوهدشت، ازنا'
    },
    {
        name: 'کردستان',
        plateCode: '۴۶',
        phoneCode: '۰۸۷',
        cities: 'سنندج، سقز، مریوان، بانه، قروه، کامیاران'
    },
    {
        name: 'سمنان',
        plateCode: '۵۴',
        phoneCode: '۰۲۳',
        cities: 'سمنان، شاهرود، دامغان، گرمسار، مهدیشهر'
    },
    {
        name: 'زنجان',
        plateCode: '۴۷، ۴۸',
        phoneCode: '۰۲۴',
        cities: 'زنجان، ابهر، خدابنده، خرمدره، قیدار، ماه‌نشان'
    },
    {
        name: 'اردبیل',
        plateCode: '۵۱، ۵۲',
        phoneCode: '۰۴۵',
        cities: 'اردبیل، پارس‌آباد، خلخال، مشگین‌شهر، نمین، نیر'
    },
    {
        name: 'بوشهر',
        plateCode: '۷۸',
        phoneCode: '۰۷۷',
        cities: 'بوشهر، برازجان، گناوه، دیلم، کنگان، دشتستان'
    },
    {
        name: 'چهارمحال و بختیاری',
        plateCode: '۵۸',
        phoneCode: '۰۳۸',
        cities: 'شهرکرد، بروجن، فارسان، لردگان، اردل، سامان'
    },
    {
        name: 'کهگیلویه و بویراحمد',
        plateCode: '۶۷',
        phoneCode: '۰۷۴',
        cities: 'یاسوج، دهدشت، دوگنبدان، سی‌سخت، دیشموک'
    },
    {
        name: 'گلستان',
        plateCode: '۳۱، ۳۲',
        phoneCode: '۰۱۷',
        cities: 'گرگان، گنبد کاووس، علی‌آباد کتول، بندر ترکمن، آق‌قلا، کردکوی'
    },
    {
        name: 'خراسان شمالی',
        plateCode: '۸۱',
        phoneCode: '۰۵۸',
        cities: 'بجنورد، شیروان، اسفراین، جاجرم، فاروج'
    },
    {
        name: 'خراسان جنوبی',
        plateCode: '۸۲',
        phoneCode: '۰۵۶',
        cities: 'بیرجند، قائن، فردوس، طبس، نهبندان'
    },
    {
        name: 'ایلام',
        plateCode: '۸۳',
        phoneCode: '۰۸۴',
        cities: 'ایلام، دهلران، ایوان، آبدانان، دره‌شهر'
    }
];

// Mobile operators data
const mobileOperatorsData = [
    {
        operator: 'همراه اول',
        codes: ['۰۹۱۰', '۰۹۱۱', '۰۹۱۲', '۰۹۱۳', '۰۹۱۴', '۰۹۱۵', '۰۹۱۶', '۰۹۱۷', '۰۹۱۸', '۰۹۱۹']
    },
    {
        operator: 'ایرانسل',
        codes: ['۰۹۰۱', '۰۹۰۲', '۰۹۰۳', '۰۹۳۰', '۰۹۳۳', '۰۹۳۵', '۰۹۳۶', '۰۹۳۷', '۰۹۳۸', '۰۹۳۹']
    },
    {
        operator: 'رایتل',
        codes: ['۰۹۲۰', '۰۹۲۱']
    },
    {
        operator: 'تله کیش',
        codes: ['۰۹۳۲']
    },
    {
        operator: 'اپراتور MVNO',
        codes: ['۰۹۰۴', '۰۹۰۵', '۰۹۴۱', '۰۹۹۴']
    }
];

// DOM Elements
const searchInput = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const provincesList = document.getElementById('provincesList');
const mobileCodesList = document.getElementById('mobileCodesList');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Initialize the app
function init() {
    renderProvinces();
    renderMobileCodes();
    setupEventListeners();
}

// Render provinces cards
function renderProvinces() {
    provincesList.innerHTML = provincesData.map(province => `
        <div class="province-card" data-search="${province.name} ${province.plateCode} ${province.phoneCode} ${province.cities}">
            <div class="province-name">${province.name}</div>
            <div class="province-info">
                <div class="info-row">
                    <span class="info-label">کد پلاک:</span>
                    <span class="info-value plate-code">${province.plateCode}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">پیش‌شماره:</span>
                    <span class="info-value phone-code">${province.phoneCode}</span>
                </div>
                <div class="cities-list">
                    <div class="cities-label">شهرهای مهم:</div>
                    <div class="cities">${province.cities}</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render mobile codes
function renderMobileCodes() {
    mobileCodesList.innerHTML = mobileOperatorsData.map(operator => `
        <div class="mobile-code-card" data-search="${operator.operator} ${operator.codes.join(' ')}">
            <div class="operator-name">${operator.operator}</div>
            <div class="codes-list">
                ${operator.codes.map(code => `<span class="code-badge">${code}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update tab contents
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

