# 🎨 سازنده آیکون (Favicon & PWA Icons Generator)

یک ابزار وب ساده و کاربردی برای تولید آیکون‌های Favicon و PWA با سایزهای مختلف

## ✨ ویژگی‌ها

- 📤 آپلود تصویر با کشیدن و رها کردن (Drag & Drop)
- 🎨 تنظیم رنگ پس‌زمینه یا استفاده از پس‌زمینه شفاف
- 📏 تنظیم فاصله از حاشیه (Padding)
- 🖼️ تولید فایل ICO (شامل 16x16, 32x32, 48x48)
- 📦 تولید ۱۳ سایز مختلف PNG:
  - **Favicon**: 16x16, 32x32, 48x48, 64x64
  - **PWA Icons**: 128x128, 144x144, 152x152, 167x167, 180x180, 192x192, 256x256, 384x384, 512x512
- 💾 دانلود فایل ICO یا تک‌تک PNG یا دانلود همه در یک فایل ZIP
- 📜 ذخیره تاریخچه آیکون‌های تولید شده
- 📱 طراحی واکنش‌گرا (Responsive) و سازگار با موبایل
- 🌐 کار در سمت کلاینت بدون نیاز به سرور

## 🚀 استفاده

### نصب محلی

1. فایل‌های پروژه را دانلود کنید
2. فایل `index.html` را در مرورگر باز کنید

### استفاده در GitHub Pages

1. پروژه را در GitHub آپلود کنید
2. به تنظیمات مخزن بروید
3. در بخش Pages، شاخه `main` و پوشه root را انتخاب کنید
4. لینک سایت شما آماده است!

## 📁 ساختار پروژه

```
favicon/
├── index.html          # صفحه اصلی
├── assets/
│   ├── style.css       # استایل‌ها
│   └── script.js       # منطق برنامه
└── README.md           # مستندات
```

## 🎯 نحوه استفاده از آیکون‌های تولید شده

### Favicon ICO (پیشنهادی)

فایل `favicon.ico` در روت سایت خود قرار دهید و در `<head>` اضافه کنید:

```html
<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
```

### Favicon PNG

آیکون‌های Favicon را در بخش `<head>` صفحه HTML خود قرار دهید:

```html
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicons/favicon-48x48.png">
```

### PWA Icons

یک فایل `manifest.json` ایجاد کنید و آیکون‌ها را به آن اضافه کنید:

```json
{
  "name": "نام برنامه شما",
  "short_name": "نام کوتاه",
  "icons": [
    {
      "src": "/pwa-icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa-icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#6366f1",
  "background_color": "#ffffff",
  "display": "standalone"
}
```

سپس در `<head>` صفحه HTML خود:

```html
<link rel="manifest" href="/manifest.json">
```

## 🛠️ تکنولوژی‌ها

- HTML5
- CSS3 (با متغیرهای CSS)
- JavaScript (Vanilla JS)
- Canvas API (برای پردازش تصاویر)
- IndexedDB (برای ذخیره تاریخچه)
- JSZip (برای ایجاد فایل ZIP)

## 📝 ویژگی‌های فنی

- ✅ بدون نیاز به سرور
- ✅ ذخیره‌سازی محلی با IndexedDB
- ✅ پردازش تصویر در سمت کلاینت
- ✅ طراحی RTL با فونت Vazirmatn
- ✅ سازگار با تمام مرورگرهای مدرن
- ✅ بدون نیاز به نصب یا پیکربندی

## 🎨 سفارشی‌سازی

### تغییر رنگ‌ها

در فایل `assets/style.css`، متغیرهای CSS را ویرایش کنید:

```css
:root {
    --primary-color: #6366f1;
    --success-color: #10b981;
    /* سایر رنگ‌ها */
}
```

### افزودن سایزهای جدید

در فایل `assets/script.js`، به آرایه `ICON_SIZES` سایز جدید اضافه کنید:

```javascript
const ICON_SIZES = [
    { size: 96, name: 'icon-96x96.png', type: 'Custom' },
    // سایر سایزها
];
```

## 🌐 مرورگرهای پشتیبانی شده

- ✅ Chrome/Edge (نسخه 90+)
- ✅ Firefox (نسخه 88+)
- ✅ Safari (نسخه 14+)
- ✅ Opera (نسخه 76+)

## 📄 مجوز

این پروژه تحت مجوز MIT منتشر شده است. می‌توانید آزادانه از آن استفاده، تغییر و توزیع کنید.

## 🤝 مشارکت

پیشنهادات و بهبودها همیشه خوش‌آمدند! برای مشارکت:

1. پروژه را Fork کنید
2. تغییرات خود را اعمال کنید
3. یک Pull Request ارسال کنید

## 💡 نکات

- برای بهترین نتیجه، از تصاویر با کیفیت بالا و نسبت ابعاد مربعی (1:1) استفاده کنید
- فرمت‌های PNG و SVG برای شفافیت بهترین گزینه هستند
- برای لوگوهای متنی، از فاصله حاشیه کمتر استفاده کنید
- آیکون‌های PWA معمولاً باید در سایزهای 192x192 و 512x512 موجود باشند

## 📞 تماس و پشتیبانی

در صورت داشتن سوال یا مشکل، می‌توانید Issue ایجاد کنید.

---

**ساخته شده با ❤️ برای توسعه‌دهندگان**

