// واحدهای اندازه‌گیری
const units = {
    length: {
        name: 'طول',
        units: {
            'متر': 1,
            'کیلومتر': 0.001,
            'سانتی‌متر': 100,
            'میلی‌متر': 1000,
            'مایل': 0.000621371,
            'یارد': 1.09361,
            'فوت': 3.28084,
            'اینچ': 39.3701
        }
    },
    weight: {
        name: 'وزن',
        units: {
            'کیلوگرم': 1,
            'گرم': 1000,
            'میلی‌گرم': 1000000,
            'تن': 0.001,
            'پاند': 2.20462,
            'اونس': 35.274
        }
    },
    temperature: {
        name: 'دما',
        units: {
            'سلسیوس': 'celsius',
            'فارنهایت': 'fahrenheit',
            'کلوین': 'kelvin'
        }
    },
    speed: {
        name: 'سرعت',
        units: {
            'متر بر ثانیه': 1,
            'کیلومتر بر ساعت': 3.6,
            'مایل بر ساعت': 2.23694,
            'گره دریایی': 1.94384,
            'فوت بر ثانیه': 3.28084
        }
    }
};

// متغیرهای سراسری
let currentCategory = 'length';
let favorites = [];

// المنت‌های DOM
const categoryButtons = document.querySelectorAll('.tab-btn');
const fromUnitSelect = document.getElementById('fromUnit');
const toUnitSelect = document.getElementById('toUnit');
const inputValue = document.getElementById('inputValue');
const outputValue = document.getElementById('outputValue');
const convertBtn = document.getElementById('convertBtn');
const saveBtn = document.getElementById('saveBtn');
const swapBtn = document.getElementById('swapBtn');
const favoritesList = document.getElementById('favoritesList');
const clearAllBtn = document.getElementById('clearAllBtn');

// بارگذاری داده‌ها از LocalStorage
function loadFavorites() {
    const saved = localStorage.getItem('unitConverterFavorites');
    if (saved) {
        favorites = JSON.parse(saved);
    }
    renderFavorites();
}

// ذخیره داده‌ها در LocalStorage
function saveFavorites() {
    localStorage.setItem('unitConverterFavorites', JSON.stringify(favorites));
}

// پر کردن لیست واحدها
function populateUnits(category) {
    const unitList = units[category].units;
    const unitNames = Object.keys(unitList);
    
    fromUnitSelect.innerHTML = '';
    toUnitSelect.innerHTML = '';
    
    unitNames.forEach(unit => {
        const option1 = document.createElement('option');
        option1.value = unit;
        option1.textContent = unit;
        fromUnitSelect.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = unit;
        option2.textContent = unit;
        toUnitSelect.appendChild(option2);
    });
    
    // انتخاب پیش‌فرض
    if (unitNames.length > 1) {
        toUnitSelect.selectedIndex = 1;
    }
}

// تبدیل واحد
function convertUnit() {
    const value = parseFloat(inputValue.value);
    
    if (isNaN(value)) {
        outputValue.value = '';
        return;
    }
    
    const fromUnit = fromUnitSelect.value;
    const toUnit = toUnitSelect.value;
    
    let result;
    
    if (currentCategory === 'temperature') {
        result = convertTemperature(value, fromUnit, toUnit);
    } else {
        const fromFactor = units[currentCategory].units[fromUnit];
        const toFactor = units[currentCategory].units[toUnit];
        result = (value / fromFactor) * toFactor;
    }
    
    // نمایش نتیجه با دقت مناسب
    outputValue.value = formatNumber(result);
}

// تبدیل دما
function convertTemperature(value, from, to) {
    const fromType = units.temperature.units[from];
    const toType = units.temperature.units[to];
    
    // تبدیل به سلسیوس ابتدا
    let celsius;
    if (fromType === 'celsius') {
        celsius = value;
    } else if (fromType === 'fahrenheit') {
        celsius = (value - 32) * 5 / 9;
    } else if (fromType === 'kelvin') {
        celsius = value - 273.15;
    }
    
    // تبدیل از سلسیوس به واحد مورد نظر
    if (toType === 'celsius') {
        return celsius;
    } else if (toType === 'fahrenheit') {
        return (celsius * 9 / 5) + 32;
    } else if (toType === 'kelvin') {
        return celsius + 273.15;
    }
}

// فرمت کردن اعداد
function formatNumber(num) {
    if (Math.abs(num) < 0.0001 && num !== 0) {
        return num.toExponential(4);
    }
    
    // نمایش حداکثر 6 رقم اعشار
    const rounded = Math.round(num * 1000000) / 1000000;
    
    // حذف صفرهای اضافی
    return rounded.toString();
}

// تعویض واحدها
function swapUnits() {
    const temp = fromUnitSelect.value;
    fromUnitSelect.value = toUnitSelect.value;
    toUnitSelect.value = temp;
    
    const tempValue = inputValue.value;
    inputValue.value = outputValue.value;
    
    convertUnit();
}

// ذخیره در علاقه‌مندی‌ها
function saveToFavorites() {
    const value = parseFloat(inputValue.value);
    
    if (isNaN(value) || !outputValue.value) {
        alert('لطفاً ابتدا یک تبدیل انجام دهید');
        return;
    }
    
    const favorite = {
        id: Date.now(),
        category: currentCategory,
        categoryName: units[currentCategory].name,
        fromUnit: fromUnitSelect.value,
        toUnit: toUnitSelect.value,
        fromValue: inputValue.value,
        toValue: outputValue.value,
        timestamp: new Date().toISOString()
    };
    
    favorites.unshift(favorite);
    saveFavorites();
    renderFavorites();
    
    // نمایش پیام موفقیت
    showNotification('تبدیل با موفقیت ذخیره شد');
}

// نمایش نوتیفیکیشن
function showNotification(message) {
    // ایجاد یک المنت موقت برای نمایش پیام
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #48bb78;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-family: 'Vazirmatn', sans-serif;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// رندر کردن علاقه‌مندی‌ها
function renderFavorites() {
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-message">هیچ موردی در علاقه‌مندی‌ها وجود ندارد</p>';
        return;
    }
    
    favoritesList.innerHTML = favorites.map(fav => `
        <div class="favorite-item" data-id="${fav.id}">
            <div class="favorite-content">
                <div class="favorite-title">${fav.categoryName}</div>
                <div class="favorite-conversion">
                    ${fav.fromValue} ${fav.fromUnit} = ${fav.toValue} ${fav.toUnit}
                </div>
            </div>
            <div class="favorite-actions">
                <button class="btn-icon btn-load" onclick="loadFavorite(${fav.id})">بارگذاری</button>
                <button class="btn-icon btn-delete" onclick="deleteFavorite(${fav.id})">حذف</button>
            </div>
        </div>
    `).join('');
}

// بارگذاری علاقه‌مندی
function loadFavorite(id) {
    const favorite = favorites.find(f => f.id === id);
    if (!favorite) return;
    
    // تغییر دسته‌بندی اگر لازم است
    if (favorite.category !== currentCategory) {
        currentCategory = favorite.category;
        updateCategoryUI();
        populateUnits(currentCategory);
    }
    
    // تنظیم مقادیر
    fromUnitSelect.value = favorite.fromUnit;
    toUnitSelect.value = favorite.toUnit;
    inputValue.value = favorite.fromValue;
    
    // انجام تبدیل
    convertUnit();
    
    // اسکرول به بالا
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// حذف علاقه‌مندی
function deleteFavorite(id) {
    favorites = favorites.filter(f => f.id !== id);
    saveFavorites();
    renderFavorites();
    showNotification('مورد حذف شد');
}

// پاک کردن همه علاقه‌مندی‌ها
function clearAllFavorites() {
    if (favorites.length === 0) return;
    
    if (confirm('آیا مطمئن هستید که می‌خواهید همه علاقه‌مندی‌ها را حذف کنید؟')) {
        favorites = [];
        saveFavorites();
        renderFavorites();
        showNotification('همه موارد حذف شدند');
    }
}

// به‌روزرسانی UI دسته‌بندی
function updateCategoryUI() {
    categoryButtons.forEach(btn => {
        if (btn.dataset.category === currentCategory) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// تغییر دسته‌بندی
function changeCategory(category) {
    currentCategory = category;
    updateCategoryUI();
    populateUnits(category);
    inputValue.value = '';
    outputValue.value = '';
}

// Event Listeners
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        changeCategory(btn.dataset.category);
    });
});

convertBtn.addEventListener('click', convertUnit);
saveBtn.addEventListener('click', saveToFavorites);
swapBtn.addEventListener('click', swapUnits);
clearAllBtn.addEventListener('click', clearAllFavorites);

// تبدیل خودکار هنگام تایپ
inputValue.addEventListener('input', () => {
    if (inputValue.value) {
        convertUnit();
    } else {
        outputValue.value = '';
    }
});

// تبدیل هنگام تغییر واحد
fromUnitSelect.addEventListener('change', () => {
    if (inputValue.value) {
        convertUnit();
    }
});

toUnitSelect.addEventListener('change', () => {
    if (inputValue.value) {
        convertUnit();
    }
});

// تبدیل با کلید Enter
inputValue.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        convertUnit();
    }
});

// افزودن استایل برای انیمیشن‌ها
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// مقداردهی اولیه
populateUnits(currentCategory);
loadFavorites();

