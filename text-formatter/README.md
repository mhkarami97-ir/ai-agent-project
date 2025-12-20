# پاک‌سازی متن | Text Formatter

ابزار تحت وب برای پاک‌سازی و بهینه‌سازی متن‌های فارسی و انگلیسی

## 🌟 ویژگی‌ها

### پردازش متن
- **حذف نیم‌فاصله‌های خراب**: پاک‌سازی و اصلاح ZWNJ (نیم‌فاصله) در متن‌های فارسی
- **تبدیل اعداد**: تبدیل اعداد فارسی به انگلیسی و بالعکس
- **حذف کاراکترهای نامرئی**: حذف کاراکترهای مشکل‌ساز و نامرئی که در کپی‌پیست ایجاد می‌شوند
- **حذف هوشمند فضاها**: پاک‌سازی فاصله‌های اضافی، خط‌های خالی و فرمت‌بندی نادرست
- **پاک‌سازی کامل**: اعمال همه‌ی عملیات پاک‌سازی با یک کلیک

### قابلیت‌های کاربردی
- ✅ رابط کاربری ساده و کاربرپسند
- ✅ طراحی ریسپانسیو برای موبایل، تبلت و دسکتاپ
- ✅ پشتیبانی کامل از زبان فارسی (RTL)
- ✅ شمارش تعداد کاراکترها
- ✅ کپی سریع نتیجه
- ✅ ذخیره خودکار متن در مرورگر
- ✅ بدون نیاز به سرور یا بک‌اند

## 🚀 نحوه استفاده

### استفاده آنلاین
برای استفاده از نسخه آنلاین، به لینک زیر مراجعه کنید:
```
https://[username].github.io/text-formatter/
```

### اجرای لوکال

1. این مخزن را کلون کنید:
```bash
git clone https://github.com/[username]/text-formatter.git
cd text-formatter
```

2. فایل `index.html` را در مرورگر باز کنید:
   - روی فایل دابل‌کلیک کنید، یا
   - از یک سرور محلی استفاده کنید (پیشنهادی):
   ```bash
   # با Python
   python -m http.server 8000
   
   # یا با Node.js
   npx serve
   ```

3. مرورگر را باز کنید و به آدرس زیر بروید:
```
http://localhost:8000
```

## 📁 ساختار پروژه

```
text-formatter/
│
├── index.html              # فایل HTML اصلی
├── assets/
│   ├── css/
│   │   └── style.css       # استایل‌های CSS
│   └── js/
│       └── script.js       # منطق JavaScript
├── README.md               # مستندات پروژه
└── .gitignore             # فایل‌های نادیده‌گرفته شده توسط Git
```

## 🛠️ تکنولوژی‌ها

- **HTML5**: ساختار صفحه
- **CSS3**: طراحی و استایل‌دهی (با استفاده از Flexbox و Grid)
- **JavaScript (Vanilla)**: منطق برنامه بدون استفاده از کتابخانه‌های خارجی
- **Vazirmatn Font**: فونت فارسی مدرن و زیبا
- **LocalStorage API**: ذخیره‌سازی داده در مرورگر

## 🌐 استقرار در GitHub Pages

### روش اول: از طریق تنظیمات مخزن

1. مخزن را در GitHub ایجاد کنید
2. فایل‌های پروژه را push کنید:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[username]/text-formatter.git
git push -u origin main
```

3. به تنظیمات مخزن بروید (Settings)
4. در بخش "Pages" گزینه Source را روی "main" branch تنظیم کنید
5. صفحه شما در چند دقیقه در آدرس زیر منتشر می‌شود:
```
https://[username].github.io/text-formatter/
```

### روش دوم: با استفاده از GitHub Actions

یک فایل workflow در `.github/workflows/deploy.yml` ایجاد کنید:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

## 🔧 توسعه و سفارشی‌سازی

### اضافه کردن قابلیت جدید

1. تابع پردازش متن را در `assets/js/script.js` اضافه کنید:
```javascript
function myNewFunction(text) {
    // پردازش متن
    return processedText;
}
```

2. دکمه مربوطه را در `index.html` اضافه کنید:
```html
<button id="myBtn" class="btn btn-secondary">
    <span class="icon">🔥</span>
    قابلیت جدید
</button>
```

3. Event listener را اضافه کنید:
```javascript
const myBtn = document.getElementById('myBtn');
myBtn.addEventListener('click', () => processText(myNewFunction));
```

### تغییر رنگ‌ها

رنگ‌های اصلی در فایل `assets/css/style.css` در بخش `:root` قابل تغییر هستند:
```css
:root {
    --primary-color: #6366f1;
    --success-color: #10b981;
    /* سایر رنگ‌ها */
}
```

## 📝 جزئیات فنی

### پردازش نیم‌فاصله (ZWNJ)
- حذف تمام ZWNJ و ZWJ موجود
- اضافه کردن ZWNJ صحیح ��رای پیشوندهای فارسی (می، نمی، بی و...)
- رعایت قواعد تایپوگرافی فارسی

### تبدیل اعداد
- پشتیبانی از اعداد فارسی (۰-۹)
- پشتیبانی از اعداد انگلیسی (0-9)
- پشتیبانی از اعداد عربی-هندی (٠-٩)

### کاراکترهای نامرئی
حذف کاراکترهای زیر:
- Zero-Width Space (U+200B)
- Zero-Width Non-Joiner (U+200C)
- Zero-Width Joiner (U+200D)
- Left-to-Right/Right-to-Left Marks
- Byte Order Mark (BOM)
- و سایر کاراکترهای کنترلی

### ذخیره‌سازی
- استفاده از LocalStorage API
- ذخیره خودکار متن ورودی
- بازیابی خودکار هنگام بازگشت به صفحه

## 🤝 مشارکت

مشارکت شما در بهبود این پروژه خوشایند است! لطفاً:

1. این مخزن را Fork کنید
2. یک Branch جدید بسازید (`git checkout -b feature/AmazingFeature`)
3. تغییرات خود را Commit کنید (`git commit -m 'Add some AmazingFeature'`)
4. Branch خود را Push کنید (`git push origin feature/AmazingFeature`)
5. یک Pull Request ایجاد کنید

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است. برای اطلاعات بیشتر فایل `LICENSE` را مشاهده کنید.

## 📧 تماس و پشتیبانی

اگر سوال یا پیشنهادی دارید، از طریق Issues در GitHub با ما در ارتباط باشید.

---

**نکته**: این پروژه به صورت کامل Client-Side است و نیازی به سرور یا Backend ندارد. تمام پردازش‌ها در مرورگر کاربر انجام می‌شود.

## 🔒 حریم خصوصی

- هیچ داده‌ای به سرور ارسال نمی‌شود
- تمام پردازش‌ها در مرورگر شما انجام می‌شود
- داده‌ها فقط در LocalStorage مرورگر شما ذخیره می‌شوند
- هیچ اطلاعاتی جمع‌آوری یا ذخیره نمی‌شود

---

ساخته شده با ❤️ برای جامعه فارسی‌زبان

