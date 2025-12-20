# راهنمای استقرار در GitHub Pages

این راهنما شما را قدم به قدم در فرآیند استقرار پروژه تحلیلگر لاگ در GitHub Pages همراهی می‌کند.

## 📋 پیش‌نیازها

- حساب کاربری GitHub
- Git نصب شده روی سیستم شما (اختیاری - می‌توانید از رابط وب GitHub استفاده کنید)

## 🚀 مراحل استقرار

### روش 1: استفاده از رابط وب GitHub (ساده‌تر)

#### مرحله 1: ایجاد Repository جدید
1. به [GitHub](https://github.com) بروید و وارد حساب کاربری خود شوید
2. روی دکمه **+** در گوشه بالا سمت راست کلیک کنید و **New repository** را انتخاب کنید
3. نام repository را وارد کنید (مثلاً: `log-analyzer`)
4. توضیح کوتاهی بنویسید (اختیاری)
5. repository را **Public** قرار دهید
6. روی **Create repository** کلیک کنید

#### مرحله 2: آپلود فایل‌ها
1. در صفحه repository جدید، روی **uploading an existing file** کلیک کنید
2. تمام فایل‌های پروژه را بکشید و در ناحیه مشخص شده رها کنید:
   - `index.html`
   - پوشه `assets/` با تمام فایل‌های CSS و JS
   - `README.md`
   - `.gitignore`
   - `sample-log.txt` (اختیاری)
3. در قسمت "Commit changes"، پیام commit را وارد کنید (مثلاً: "Initial commit")
4. روی **Commit changes** کلیک کنید

#### مرحله 3: فعال‌سازی GitHub Pages
1. به تب **Settings** در repository خود بروید
2. در منوی سمت چپ، روی **Pages** کلیک کنید
3. در قسمت **Source**، branch را انتخاب کنید (معمولاً `main` یا `master`)
4. پوشه را روی **/ (root)** بگذارید
5. روی **Save** کلیک کنید
6. چند دقیقه صبر کنید تا سایت شما منتشر شود
7. لینک سایت شما در همان صفحه نمایش داده می‌شود: `https://[username].github.io/[repository-name]`

### روش 2: استفاده از Git Command Line

#### مرحله 1: ایجاد Repository در GitHub
همانند روش 1، مرحله 1

#### مرحله 2: آپلود از طریق Git
```bash
# در پوشه پروژه باز کنید
cd D:\Local\my\ai-agent-project\log-analyzer

# مقداردهی اولیه Git
git init

# اضافه کردن تمام فایل‌ها
git add .

# Commit کردن تغییرات
git commit -m "Initial commit: Log analyzer application"

# اضافه کردن repository از راه دور
git remote add origin https://github.com/[username]/[repository-name].git

# Push کردن به GitHub
git branch -M main
git push -u origin main
```

#### مرحله 3: فعال‌سازی GitHub Pages
همانند روش 1، مرحله 3

## ✅ تأیید استقرار

بعد از فعال‌سازی GitHub Pages:

1. به آدرس `https://[username].github.io/[repository-name]` بروید
2. باید صفحه تحلیلگر لاگ را ببینید
3. یک فایل لاگ نمونه آپلود کنید و عملکرد را تست کنید

## 🔧 عیب‌یابی

### مشکل: صفحه 404 نمایش داده می‌شود
- مطمئن شوید که فایل `index.html` در ریشه repository است
- چند دقیقه صبر کنید (گاهی استقرار زمان می‌برد)
- تنظیمات Pages را دوباره بررسی کنید

### مشکل: CSS یا JS لود نمی‌شود
- مطمئن شوید که ساختار پوشه‌ها درست است: `assets/css/` و `assets/js/`
- Cache مرورگر را پاک کنید (Ctrl+Shift+Delete)
- Developer Console مرورگر را بررسی کنید (F12)

### مشکل: فونت فارسی نمایش داده نمی‌شود
- اتصال اینترنت خود را بررسی کنید (فونت از CDN لود می‌شود)
- مرورگر خود را رفرش کنید

## 📝 بروزرسانی پروژه

### از طریق رابط وب:
1. به repository بروید
2. به فایل مورد نظر بروید
3. روی آیکون مداد (Edit) کلیک کنید
4. تغییرات را اعمال کنید
5. Commit کنید

### از طریق Git:
```bash
# تغییرات را اعمال کنید
git add .
git commit -m "توضیح تغییرات"
git push
```

## 🎯 نکات مهم

1. **Repository باید Public باشد** برای استفاده از GitHub Pages رایگان
2. **فایل index.html باید در ریشه باشد** - این فایل اول بارگذاری می‌شود
3. **بروزرسانی‌ها ممکن است 2-5 دقیقه طول بکشد** تا روی سایت اعمال شوند
4. **لینک سایت را در README.md قرار دهید** تا بازدیدکنندگان بتوانند به راحتی به سایت دسترسی داشته باشند

## 🌐 دامنه سفارشی (اختیاری)

اگر دامنه شخصی دارید:

1. در repository، فایلی به نام `CNAME` بسازید
2. نام دامنه خود را در آن بنویسید (مثلاً: `log-analyzer.example.com`)
3. در تنظیمات DNS دامنه، یک رکورد CNAME به `[username].github.io` اضافه کنید

## 📊 مثال Repository

مثال ساختار نهایی:

```
repository-root/
├── index.html
├── assets/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── README.md
├── DEPLOYMENT.md
├── .gitignore
└── sample-log.txt
```

## 🔗 منابع مفید

- [مستندات GitHub Pages](https://docs.github.com/pages)
- [راهنمای Git](https://git-scm.com/doc)
- [GitHub Desktop](https://desktop.github.com/) - رابط گرافیکی Git

---

**موفق باشید! 🎉**

اگر سؤالی دارید یا به مشکلی برخوردید، در بخش Issues پروژه مطرح کنید.

