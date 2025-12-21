# 🤝 راهنمای مشارکت | Contributing Guide

از اینکه قصد مشارکت در این پروژه را دارید بسیار خوشحالیم! 🎉

این راهنما به شما کمک می‌کند تا بهترین روش برای مشارکت در پروژه را بیاموزید.

---

## 📋 فهرست

- [چگونه می‌توانم کمک کنم؟](#چگونه-می‌توانم-کمک-کنم)
- [گزارش باگ](#-گزارش-باگ)
- [پیشنهاد ویژگی جدید](#-پیشنهاد-ویژگی-جدید)
- [افزودن ابزار جدید](#-افزودن-ابزار-جدید)
- [بهبود کد](#-بهبود-کد)
- [استانداردهای کد](#-استانداردهای-کد)
- [فرآیند Pull Request](#-فرآیند-pull-request)

---

## چگونه می‌توانم کمک کنم؟

راه‌های مختلفی برای کمک به این پروژه وجود دارد:

### 1. 🐛 گزارش باگ
اگر باگی پیدا کردید، لطفاً آن را گزارش دهید.

### 2. 💡 پیشنهاد ویژگی
ایده‌ای برای بهبود پروژه دارید؟ حتماً با ما در میان بگذارید.

### 3. 🛠️ افزودن ابزار جدید
ابزار جدیدی می‌خواهید؟ خودتان بسازید و اضافه کنید!

### 4. 📝 بهبود مستندات
کمک به بهتر شدن README، راهنماها و توضیحات.

### 5. 🎨 بهبود طراحی
بهبود UI/UX، رنگ‌ها، انیمیشن‌ها.

### 6. 🌍 ترجمه
اضافه کردن پشتیبانی از زبان‌های جدید.

---

## 🐛 گزارش باگ

قبل از گزارش باگ:

1. ✅ مطمئن شوید از آخرین نسخه استفاده می‌کنید
2. ✅ [Issues موجود](/issues) را جستجو کنید
3. ✅ مرورگر و سیستم عامل خود را مشخص کنید

### الگوی گزارش باگ

```markdown
## توضیح باگ
توضیح واضح و مختصر از باگ

## مراحل بازتولید
1. برو به '...'
2. کلیک کن روی '...'
3. اسکرول کن به '...'
4. خطا را ببین

## رفتار مورد انتظار
چه اتفاقی باید می‌افتاد

## رفتار واقعی
چه اتفاقی افتاد

## اسکرین‌شات
در صورت امکان اسکرین‌شات اضافه کنید

## محیط
- مرورگر: [e.g. Chrome 120]
- سیستم عامل: [e.g. Windows 11]
- نسخه: [e.g. 1.0]
```

---

## 💡 پیشنهاد ویژگی جدید

### الگوی پیشنهاد ویژگی

```markdown
## توضیح ویژگی
توضیح واضح از ویژگی پیشنهادی

## انگیزه
چرا این ویژگی مفید است؟

## راه‌حل پیشنهادی
چطور باید پیاده‌سازی شود؟

## جایگزین‌ها
آیا راه دیگری هم وجود دارد؟

## اطلاعات اضافی
هر چیز دیگری که مفید باشد
```

---

## 🛠️ افزودن ابزار جدید

برای افزودن ابزار جدید:

### 1. ساخت پوشه ابزار

```bash
mkdir my-new-tool
cd my-new-tool
```

### 2. ساخت فایل index.html

```html
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <link rel="icon" type="image/x-icon" href="/favicon.ico">
    <link rel="shortcut icon" type="image/x-icon" href="/favicon.ico">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>نام ابزار</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- محتوای ابزار -->
    <script src="script.js"></script>
</body>
</html>
```

### 3. ثبت در index.html اصلی

```javascript
// در آرایه tools اضافه کنید:
{
    path: 'my-new-tool',
    faName: 'نام فارسی',
    enName: 'English Name',
    faDesc: 'توضیح فارسی',
    enDesc: 'English description',
    icon: '🔧' // ایموجی مناسب
}
```

### 4. ساخت README.md برای ابزار (اختیاری)

```markdown
# نام ابزار

توضیح مختصر از ابزار

## ویژگی‌ها

- ویژگی 1
- ویژگی 2

## نحوه استفاده

1. مرحله 1
2. مرحله 2
```

---

## 🔧 بهبود کد

### راهنمای Fork و Clone

```bash
# 1. Fork کردن در GitHub (دکمه Fork در بالای صفحه)

# 2. کلون کردن Fork شما
git clone https://github.com/YOUR_USERNAME/ai-agent-project.git

# 3. رفتن به پوشه پروژه
cd ai-agent-project

# 4. اضافه کردن upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/ai-agent-project.git
```

### ساخت Branch جدید

```bash
# برای ویژگی جدید
git checkout -b feature/my-new-feature

# برای رفع باگ
git checkout -b fix/bug-description

# برای بهبود
git checkout -b improve/what-improved
```

### Commit کردن تغییرات

```bash
# اضافه کردن فایل‌ها
git add .

# Commit با پیام مناسب
git commit -m "Add: my new feature"

# Push کردن
git push origin feature/my-new-feature
```

---

## 📏 استانداردهای کد

### HTML

```html
<!-- ✅ خوب -->
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>عنوان صفحه</title>
</head>

<!-- ❌ بد -->
<html>
<head>
<title>عنوان
```

### CSS

```css
/* ✅ خوب - استفاده از متغیرها */
:root {
    --primary-color: #7c5cff;
    --spacing: 16px;
}

.button {
    background: var(--primary-color);
    padding: var(--spacing);
}

/* ❌ بد - مقادیر سخت‌کد شده */
.button {
    background: #7c5cff;
    padding: 16px;
}
```

### JavaScript

```javascript
// ✅ خوب - استفاده از const/let
const API_URL = 'https://api.example.com';
let userData = null;

// استفاده از توابع arrow
const getData = async () => {
    const response = await fetch(API_URL);
    return response.json();
};

// ❌ بد - استفاده از var
var API_URL = 'https://api.example.com';
var userData = null;

// استفاده از function قدیمی
function getData() {
    // ...
}
```

### قوانین نام‌گذاری

```javascript
// ✅ فایل‌ها: kebab-case
my-tool-name/
my-script.js

// ✅ متغیرها: camelCase
const userName = 'John';
let itemCount = 0;

// ✅ کلاس‌ها CSS: kebab-case
.main-container
.search-box

// ✅ توابع: camelCase
function calculateTotal() {}
const getUserData = () => {};

// ✅ ثابت‌ها: UPPER_SNAKE_CASE
const MAX_ITEMS = 100;
const API_URL = 'https://...';
```

---

## 📤 فرآیند Pull Request

### 1. قبل از ارسال PR

- [ ] کد شما بدون خطا اجرا می‌شود
- [ ] تمام ویژگی‌ها تست شده‌اند
- [ ] README در صورت نیاز به‌روزرسانی شده
- [ ] Commit های شما واضح و مشخص هستند

### 2. ارسال PR

1. به GitHub بروید
2. روی دکمه "New Pull Request" کلیک کنید
3. Base را `main` و Compare را branch خود انتخاب کنید
4. عنوان واضح بنویسید
5. توضیحات کامل بدهید

### 3. الگوی Pull Request

```markdown
## توضیحات
توضیح مختصر از تغییرات

## نوع تغییر
- [ ] رفع باگ
- [ ] ویژگی جدید
- [ ] بهبود کد
- [ ] تغییر مستندات

## چک‌لیست
- [ ] کد من بدون خطا اجرا می‌شود
- [ ] تست کرده‌ام
- [ ] README را به‌روزرسانی کرده‌ام
- [ ] تغییرات من backward-compatible هستند

## اسکرین‌شات (در صورت نیاز)
```

### 4. بعد از ارسال PR

- منتظر بررسی باشید
- به نظرات پاسخ دهید
- تغییرات درخواست شده را اعمال کنید
- صبور باشید 😊

---

## 🎨 استانداردهای طراحی

### رنگ‌ها

از متغیرهای CSS استفاده کنید:

```css
:root {
    --accent: #7c5cff;      /* بنفش */
    --accent2: #2ee9a6;     /* سبز */
    --text: rgba(255, 255, 255, .92);
    --muted: rgba(255, 255, 255, .72);
}
```

### فاصله‌گذاری

از واحد 4px استفاده کنید:

```css
/* ✅ خوب */
padding: 8px 16px;
margin: 12px 0;
gap: 16px;

/* ❌ بد */
padding: 7px 15px;
margin: 13px 0;
```

### Typography

```css
/* فونت فارسی */
font-family: 'Vazirmatn', sans-serif;

/* اندازه‌ها */
h1 { font-size: clamp(22px, 3vw, 32px); }
body { font-size: 16px; line-height: 1.5; }
small { font-size: 14px; }
```

---

## 🧪 تست

قبل از ارسال PR، ابزار خود را تست کنید:

### ✅ چک‌لیست تست

- [ ] در Chrome تست شده
- [ ] در Firefox تست شده
- [ ] در Safari تست شده (اگر دسترسی دارید)
- [ ] در موبایل تست شده
- [ ] در تبلت تست شده
- [ ] در Dark Mode تست شده
- [ ] در Light Mode تست شده
- [ ] با صفحه کلید قابل استفاده است
- [ ] برای Screen Reader مناسب است

---

## 📚 منابع مفید

- [MDN Web Docs](https://developer.mozilla.org/) - مرجع وب
- [CSS Tricks](https://css-tricks.com/) - ترفندهای CSS
- [Can I Use](https://caniuse.com/) - بررسی پشتیبانی مرورگرها
- [Web.dev](https://web.dev/) - بهترین شیوه‌ها

---

## ❓ سوالات؟

اگر سوالی دارید:

1. [Issues](../../issues) را جستجو کنید
2. [Discussions](../../discussions) را ببینید
3. Issue جدید بسازید

---

## 🙏 تشکر

از مشارکت شما متشکریم! 

هر مشارکتی، کوچک یا بزرگ، ارزشمند است. 💚

---

<div align="center">

**با ❤️ ساخته شده توسط جامعه**

</div>

