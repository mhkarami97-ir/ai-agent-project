# 📋 چک‌لیست استقرار در GitHub Pages

## ✅ قبل از استقرار

- [x] فایل‌های HTML, CSS, JS ساخته شده‌اند
- [x] ساختار پوشه‌ها صحیح است (assets/)
- [x] فونت Vazirmatn اضافه شده
- [x] سایت RTL است
- [x] رسپانسیو بودن تست شده
- [x] README.md کامل است
- [x] .gitignore ساخته شده

## 📝 مراحل استقرار

### گام 1: آماده‌سازی مخزن محلی
```powershell
cd D:\Local\my\ai-agent-project\password
git init
git add .
git commit -m "Initial commit: Secure Password Generator"
git branch -M main
```

**وضعیت:** ☐ انجام نشده

---

### گام 2: ایجاد مخزن در GitHub
1. به https://github.com بروید
2. روی "New Repository" کلیک کنید
3. نام مخزن را وارد کنید (مثال: `password-generator`)
4. توضیحات: "تولید کننده رمز عبور امن - آفلاین"
5. Public را انتخاب کنید
6. **README را اضافه نکنید** (چون خودمان داریم)
7. Create Repository

**وضعیت:** ☐ انجام نشده

---

### گام 3: اتصال و Push
```powershell
git remote add origin https://github.com/YOUR_USERNAME/password-generator.git
git push -u origin main
```

> **نکته:** YOUR_USERNAME را با نام کاربری خود جایگزین کنید

**وضعیت:** ☐ انجام نشده

---

### گام 4: فعال‌سازی GitHub Pages
1. به مخزن در GitHub بروید
2. کلیک روی **Settings** (تنظیمات)
3. در منوی سمت چپ، **Pages** را پیدا کنید
4. در بخش **Source**:
   - Branch: `main` را انتخاب کنید
   - Folder: `/ (root)` را انتخاب کنید
5. روی **Save** کلیک کنید
6. صبر کنید (1-2 دقیقه)
7. صفحه را رفرش کنید تا لینک نمایش داده شود

**وضعیت:** ☐ انجام نشده

---

### گام 5: تأیید استقرار
بعد از چند دقیقه، سایت شما در این آدرس قابل دسترس است:
```
https://YOUR_USERNAME.github.io/password-generator
```

**چک‌لیست تست:**
- [ ] صفحه باز می‌شود
- [ ] فونت‌ها درست نمایش داده می‌شوند
- [ ] استایل‌ها اعمال شده‌اند
- [ ] دکمه تولید رمز کار می‌کند
- [ ] کپی کردن کار می‌کند
- [ ] تاریخچه ذخیره می‌شود
- [ ] روی موبایل درست نمایش داده می‌شود
- [ ] راست‌به‌چپ صحیح است

**وضعیت:** ☐ انجام نشده

---

## 🔧 در صورت بروز مشکل

### مشکل: صفحه 404
**راه حل:**
- مطمئن شوید فایل `index.html` در ریشه پروژه است
- در Settings → Pages، مطمئن شوید Source روی `main` است
- 5 دقیقه صبر کنید و دوباره امتحان کنید

### مشکل: استایل‌ها نمایش داده نمی‌شوند
**راه حل:**
- مسیر فایل CSS را چک کنید: `assets/style.css`
- کش مرورگر را پاک کنید (Ctrl+F5)
- در Developer Tools بررسی کنید که فایل لود شده است

### مشکل: فونت نمایش داده نمی‌شود
**راه حل:**
- مطمئن شوید لینک CDN فونت کار می‌کند
- بررسی کنید که اینترنت متصل است (اولین بار)
- Developer Tools → Network را چک کنید

### مشکل: اسکریپت کار نمی‌کند
**راه حل:**
- مسیر فایل JS را چک کنید: `assets/script.js`
- Developer Tools → Console را برای خطاها چک کنید
- مطمئن شوید مرورگر مدرن است (Chrome 57+, Firefox 52+)

---

## 📱 تست روی دستگاه‌های مختلف

### Desktop
- [ ] Chrome (ویندوز/مک/لینوکس)
- [ ] Firefox (ویندوز/مک/لینوکس)
- [ ] Edge (ویندوز)
- [ ] Safari (مک)

### Mobile
- [ ] Chrome Mobile (اندروید)
- [ ] Safari (iOS)
- [ ] Firefox Mobile

### Tablet
- [ ] iPad
- [ ] Android Tablet

---

## 🎉 بعد از استقرار موفق

### اشتراک‌گذاری
- لینک را با دوستان به اشتراک بگذارید
- در شبکه‌های اجتماعی منتشر کنید
- به README.md لینک زنده اضافه کنید

### بهبود SEO
در فایل `index.html` این تگ‌ها را اضافه کنید:
```html
<meta property="og:title" content="تولید کننده رمز عبور امن">
<meta property="og:description" content="ابزار آنلاین و آفلاین برای تولید رمزهای عبور قوی">
<meta property="og:url" content="https://YOUR_USERNAME.github.io/password-generator">
```

### آمارگیری (اختیاری)
می‌توانید Google Analytics اضافه کنید:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR_GA_ID"></script>
```

---

## 🔄 به‌روزرسانی آینده

برای اضافه کردن تغییرات جدید:
```powershell
git add .
git commit -m "توضیحات تغییرات"
git push
```

GitHub Pages به صورت خودکار به‌روزرسانی می‌شود (1-2 دقیقه).

---

## ✅ تمام!

وقتی تمام موارد بالا را علامت زدید، پروژه شما آماده و منتشر شده است! 🎉

**آدرس نهایی سایت:**
```
https://YOUR_USERNAME.github.io/password-generator
```

---

**یادداشت:** این فایل را می‌توانید به عنوان مرجع نگه دارید و به مرور که مراحل را انجام می‌دهید، آن‌ها را علامت بزنید.

