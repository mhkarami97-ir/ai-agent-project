# راهنمای استقرار در GitHub Pages

## گام اول: آماده‌سازی مخزن

1. وارد GitHub شوید و یک مخزن جدید ایجاد کنید
2. نام مخزن را مثلاً `compress-file` یا `code-formatter` انتخاب کنید
3. مخزن را Public تنظیم کنید (برای GitHub Pages رایگان)
4. بقیه تنظیمات را پیش‌فرض بگذارید و "Create repository" را بزنید

## گام دوم: آپلود فایل‌ها

### روش اول: استفاده از Git در ترمینال

```bash
# وارد پوشه پروژه شوید
cd D:\Local\my\ai-agent-project\compress-file

# Git را initialize کنید
git init

# فایل‌ها را به staging area اضافه کنید
git add .

# یک commit ایجاد کنید
git commit -m "Initial commit: Code formatter and compressor"

# branch را به main تغییر دهید (اگر master است)
git branch -M main

# remote repository را اضافه کنید
git remote add origin https://github.com/YOUR-USERNAME/compress-file.git

# فایل‌ها را push کنید
git push -u origin main
```

**نکته**: `YOUR-USERNAME` را با نام کاربری GitHub خود جایگزین کنید.

### روش دوم: استفاده از رابط وب GitHub

1. وارد مخزن ایجاد شده در GitHub شوید
2. روی "uploading an existing file" کلیک کنید
3. تمام فایل‌های پروژه را drag & drop کنید:
   - `index.html`
   - `README.md`
   - `.gitignore`
   - پوشه `assets/` با محتویاتش
4. یک commit message بنویسید مثلاً: "Add project files"
5. روی "Commit changes" کلیک کنید

## گام سوم: فعال‌سازی GitHub Pages

1. در صفحه مخزن، به تب **Settings** بروید
2. در منوی سمت راست، روی **Pages** کلیک کنید
3. در بخش **Source**:
   - Branch را روی `main` تنظیم کنید
   - Folder را روی `/ (root)` نگه دارید
4. روی **Save** کلیک کنید
5. صبر کنید تا GitHub Pages سایت را deploy کند (معمولاً 1-2 دقیقه)

## گام چهارم: مشاهده سایت

پس از deployment موفق، لینک سایت شما به این صورت خواهد بود:

```
https://YOUR-USERNAME.github.io/compress-file/
```

این لینک را در README یا در توضیحات مخزن قرار دهید.

## گام پنجم: تنظیمات اضافی (اختیاری)

### اضافه کردن Custom Domain

اگر دامنه شخصی دارید:

1. در بخش GitHub Pages Settings
2. در قسمت **Custom domain** دامنه خود را وارد کنید
3. یک CNAME record در DNS دامنه خود ایجاد کنید که به `YOUR-USERNAME.github.io` اشاره کند
4. **Enforce HTTPS** را فعال کنید

### اضافه کردن About Section

در صفحه اصلی مخزن:

1. روی آیکون تنظیمات (⚙️) در بخش About کلیک کنید
2. توضیحی کوتاه بنویسید: "ابزار فرمت و فشرده‌ساز کد HTML، CSS و JavaScript"
3. لینک وبسایت را اضافه کنید: `https://YOUR-USERNAME.github.io/compress-file/`
4. Topics مرتبط اضافه کنید: `html`, `css`, `javascript`, `formatter`, `compressor`, `persian`, `rtl`
5. **Save changes** را بزنید

## به‌روزرسانی سایت

هر بار که تغییری در فایل‌ها بدهید:

```bash
# تغییرات را add کنید
git add .

# commit ایجاد کنید
git commit -m "توضیح تغییرات"

# به GitHub push کنید
git push origin main
```

GitHub Pages به طور خودکار سایت را با آخرین تغییرات به‌روزرسانی می‌کند.

## رفع مشکلات متداول

### سایت نمایش داده نمی‌شود

- بررسی کنید که GitHub Pages در Settings فعال باشد
- مطمئن شوید branch و folder درست انتخاب شده‌اند
- صبر کنید چند دقیقه طول می‌کشد
- cache مرورگر را پاک کنید (Ctrl+Shift+Delete)

### فونت‌ها یا استایل‌ها load نمی‌شوند

- مسیرهای فایل‌ها را بررسی کنید (باید relative path باشند)
- Console مرورگر را چک کنید (F12)
- مطمئن شوید ساختار پوشه‌ها درست است

### تغییرات نمایش داده نمی‌شوند

- cache مرورگر را پاک کنید
- در حالت Incognito باز کنید
- صبر کنید تا GitHub Pages rebuild شود (2-3 دقیقه)

## اشتراک‌گذاری پروژه

پس از deployment موفق:

1. لینک را در شبکه‌های اجتماعی به اشتراک بگذارید
2. در README.md یک badge اضافه کنید:

```markdown
[![GitHub Pages](https://img.shields.io/badge/demo-online-green.svg)](https://YOUR-USERNAME.github.io/compress-file/)
```

3. یک screenshot از سایت بگیرید و در README قرار دهید
4. پروژه را در گروه‌های توسعه‌دهندگان معرفی کنید

## منابع مفید

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Learning Lab](https://lab.github.com/)

---

موفق باشید! 🚀

