// Data for Iranian provinces with license plate codes and phone codes
const provincesData = [
    {
        name: 'تهران',
        plateCode: 'شهر تهران: ۱۱، ۲۲، ۳۳، ۴۴، ۵۵، ۶۶، ۷۷، ۸۸، ۹۹، ۱۰، ۲۰، ۳۰، ۴۰، ۵۰، ۶۰، ۷۰، ۸۰، ۹۰ | سایر شهرها: ۲۱، ۷۸، ۳۸',
        phoneCode: '۰۲۱',
        cities: 'تهران، شمیرانات، ری، اسلامشهر، پاکدشت، شهریار'
    },
    {
        name: 'اصفهان',
        plateCode: 'شهر اصفهان: ۱۳، ۵۳، ۶۷ | سایر شهرها: ۲۳، ۴۳',
        phoneCode: '۰۳۱',
        cities: 'اصفهان، کاشان، نجف‌آباد، خمینی‌شهر، شاهین‌شهر، فلاورجان'
    },
    {
        name: 'فارس',
        plateCode: 'شهر شیراز: ۶۳، ۹۳ | سایر شهرها: ۷۳، ۸۳',
        phoneCode: '۰۷۱',
        cities: 'شیراز، مرودشت، کازرون، جهرم، لار، آباده'
    },
    {
        name: 'خراسان رضوی',
        plateCode: 'شهر مشهد: ۱۲، ۳۶، ۷۴ | سایر شهرها: ۳۲، ۴۲',
        phoneCode: '۰۵۱',
        cities: 'مشهد، نیشابور، سبزوار، تربت حیدریه، قوچان، کاشمر'
    },
    {
        name: 'آذربایجان شرقی',
        plateCode: 'شهر تبریز: ۱۵ | سایر شهرها: ۲۵، ۳۵',
        phoneCode: '۰۴۱',
        cities: 'تبریز، مراغه، مرند، اهر، بناب، میانه'
    },
    {
        name: 'خوزستان',
        plateCode: 'شهر اهواز: ۱۴ | سایر شهرها: ۲۴، ۳۴',
        phoneCode: '۰۶۱',
        cities: 'اهواز، آبادان، خرمشهر، دزفول، بهبهان، ماهشهر'
    },
    {
        name: 'مازندران',
        plateCode: 'شهر ساری: ۶۲ | سایر شهرها: ۸۲، ۷۲، ۹۲',
        phoneCode: '۰۱۱',
        cities: 'ساری، بابل، آمل، قائمشهر، بابلسر، نوشهر'
    },
    {
        name: 'گیلان',
        plateCode: 'شهر رشت: ۴۶ | سایر شهرها: ۷۶، ۵۶',
        phoneCode: '۰۱۳',
        cities: 'رشت، انزلی، لاهیجان، لنگرود، رودسر، آستارا'
    },
    {
        name: 'کرمان',
        plateCode: 'شهر کرمان: ۴۵ | سایر شهرها: ۶۵، ۷۵',
        phoneCode: '۰۳۴',
        cities: 'کرمان، رفسنجان، سیرجان، جیرفت، بم، زرند'
    },
    {
        name: 'البرز',
        plateCode: 'شهر کرج: ۶۸ | سایر شهرها: ۷۸ (با حرف ط)، ۲۱ (با حرف ص)',
        phoneCode: '۰۲۶',
        cities: 'کرج، فردیس، هشتگرد، نظرآباد، طالقان، اشتهارد'
    },
    {
        name: 'آذربایجان غربی',
        plateCode: 'شهر ارومیه: ۱۷ | سایر شهرها: ۲۷، ۳۷',
        phoneCode: '۰۴۴',
        cities: 'ارومیه، خوی، مهاباد، میاندوآب، بوکان، سلماس'
    },
    {
        name: 'کرمانشاه',
        plateCode: 'شهر کرمانشاه: ۱۹ | سایر شهرها: ۲۹، ۳۹',
        phoneCode: '۰۸۳',
        cities: 'کرمانشاه، اسلام‌آبادغرب، سنقر، هرسین، کنگاور، پاوه'
    },
    {
        name: 'همدان',
        plateCode: 'شهر همدان: ۱۸ | سایر شهرها: ۲۸',
        phoneCode: '۰۸۱',
        cities: 'همدان، ملایر، نهاوند، تویسرکان، اسدآباد، رزن'
    },
    {
        name: 'قزوین',
        plateCode: 'شهر قزوین: ۷۹ | سایر شهرها: ۸۹',
        phoneCode: '۰۲۸',
        cities: 'قزوین، تاکستان، آبیک، بوئین‌زهرا، الوند'
    },
    {
        name: 'قم',
        plateCode: 'شهر قم: ۱۶',
        phoneCode: '۰۲۵',
        cities: 'قم، سلفچگان، کهک، جعفریه'
    },
    {
        name: 'مرکزی',
        plateCode: 'شهر اراک: ۴۷ | سایر شهرها: ۵۷',
        phoneCode: '۰۸۶',
        cities: 'اراک، ساوه، خمین، محلات، دلیجان، تفرش'
    },
    {
        name: 'سیستان و بلوچستان',
        plateCode: 'شهر زاهدان: ۸۵ | سایر شهرها: ۹۵',
        phoneCode: '۰۵۴',
        cities: 'زاهدان، زابل، چابهار، ایرانشهر، سراوان، خاش'
    },
    {
        name: 'یزد',
        plateCode: 'شهر یزد: ۵۴ | سایر شهرها: ۶۴',
        phoneCode: '۰۳۵',
        cities: 'یزد، میبد، اردکان، مهریز، بافق، تفت'
    },
    {
        name: 'هرمزگان',
        plateCode: 'شهر بندرعباس: ۸۴ | سایر شهرها: ۹۴',
        phoneCode: '۰۷۶',
        cities: 'بندرعباس، قشم، کیش، بندرلنگه، میناب، جاسک'
    },
    {
        name: 'لرستان',
        plateCode: 'شهر خرم آباد: ۳۱ | سایر شهرها: ۴۱',
        phoneCode: '۰۶۶',
        cities: 'خرم‌آباد، بروجرد، دورود، الیگودرز، کوهدشت، ازنا'
    },
    {
        name: 'کردستان',
        plateCode: 'شهر سنندج: ۵۱ | سایر شهرها: ۶۱',
        phoneCode: '۰۸۷',
        cities: 'سنندج، سقز، مریوان، بانه، قروه، کامیاران'
    },
    {
        name: 'سمنان',
        plateCode: 'شهر سمنان: ۸۶ | سایر شهرها: ۹۶',
        phoneCode: '۰۲۳',
        cities: 'سمنان، شاهرود، دامغان، گرمسار، مهدیشهر'
    },
    {
        name: 'زنجان',
        plateCode: 'شهر زنجان: ۸۷ | سایر شهرها: ۹۷',
        phoneCode: '۰۲۴',
        cities: 'زنجان، ابهر، خدابنده، خرمدره، قیدار، ماه‌نشان'
    },
    {
        name: 'اردبیل',
        plateCode: 'شهر اردبیل: ۹۱',
        phoneCode: '۰۴۵',
        cities: 'اردبیل، پارس‌آباد، خلخال، مشگین‌شهر، نمین، نیر'
    },
    {
        name: 'بوشهر',
        plateCode: 'شهر بوشهر: ۴۸ | سایر شهرها: ۵۸',
        phoneCode: '۰۷۷',
        cities: 'بوشهر، برازجان، گناوه، دیلم، کنگان، دشتستان'
    },
    {
        name: 'چهارمحال و بختیاری',
        plateCode: 'شهر شهرکرد: ۷۱ | سایر شهرها: ۸۱',
        phoneCode: '۰۳۸',
        cities: 'شهرکرد، بروجن، فارسان، لردگان، اردل، سامان'
    },
    {
        name: 'کهگیلویه و بویراحمد',
        plateCode: 'شهر یاسوج و سایر شهرها: ۴۹',
        phoneCode: '۰۷۴',
        cities: 'یاسوج، دهدشت، دوگنبدان، سی‌سخت، دیشموک'
    },
    {
        name: 'گلستان',
        plateCode: 'شهر گرگان: ۵۹ | سایر شهرها: ۶۹ (با حرف ب)',
        phoneCode: '۰۱۷',
        cities: 'گرگان، گنبد کاووس، علی‌آباد کتول، بندر ترکمن، آق‌قلا، کردکوی'
    },
    {
        name: 'خراسان شمالی',
        plateCode: 'شهر بجنورد: ۲۶ | سایر شهرها: ۷۴ (با حرف ج)',
        phoneCode: '۰۵۸',
        cities: 'بجنورد، شیروان، اسفراین، جاجرم، فاروج'
    },
    {
        name: 'خراسان جنوبی',
        plateCode: 'شهر بیرجند: ۵۲',
        phoneCode: '۰۵۶',
        cities: 'بیرجند، قائن، فردوس، طبس، نهبندان'
    },
    {
        name: 'ایلام',
        plateCode: 'شهر ایلام: ۹۸',
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

