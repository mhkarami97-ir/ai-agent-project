# راهنمای استقرار در GitHub Pages

این راهنما مراحل استقرار پروژه "افزودن واترمارک به تصویر" در GitHub Pages را شرح می‌دهد.

## پیش‌نیازها

- یک حساب کاربری GitHub
- نصب Git بر روی سیستم شما
- یک مرورگر وب

## مراحل استقرار

### 1. ایجاد مخزن در GitHub

1. به [GitHub](https://github.com) بروید و وارد حساب خود شوید
2. روی دکمه **New** یا **+** در گوشه بالا سمت راست کلیک کنید
3. **New repository** را انتخاب کنید
4. نام مخزن را وارد کنید (مثلاً: `image-watermark`)
5. توضیح کوتاهی اضافه کنید
6. مخزن را **Public** تنظیم کنید
7. روی **Create repository** کلیک کنید

### 2. آپلود فایل‌ها به GitHub

#### روش 1: استفاده از Git (توصیه می‌شود)

در ترمینال یا Command Prompt:

```bash
cd D:\Local\my\ai-agent-project\water-mark
git init
git add .
git commit -m "Initial commit: Add image watermark application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

> **نکته**: `YOUR_USERNAME` و `YOUR_REPO_NAME` را با نام کاربری و نام مخزن خود جایگزین کنید.

#### روش 2: آپلود دستی

1. در صفحه مخزن خود روی **Add file** کلیک کنید
2. **Upload files** را انتخاب کنید
3. تمام فایل‌های پروژه را به جز پوشه `.idea` بکشید
4. روی **Commit changes** کلیک کنید

### 3. فعال‌سازی GitHub Pages

1. در صفحه مخزن خود به **Settings** بروید
2. از منوی سمت راست **Pages** را انتخاب کنید
3. در بخش **Source**:
   - **Branch**: `main` را انتخاب کنید
   - **Folder**: `/ (root)` را انتخاب کنید
4. روی **Save** کلیک کنید

### 4. دسترسی به سایت

پس از چند دقیقه، سایت شما در آدرس زیر قابل دسترسی خواهد بود:

```
https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/
```

مثال:
```
https://john-doe.github.io/image-watermark/
```

## بروزرسانی سایت

برای بروزرسانی سایت، کافی است تغییرات خود را به مخزن push کنید:

```bash
git add .
git commit -m "Update: Description of changes"
git push
```

GitHub Pages به صورت خودکار سایت را بروزرسانی می‌کند (ممکن است چند دقیقه طول بکشد).

## تنظیمات اختیاری

### افزودن دامنه سفارشی

1. در تنظیمات GitHub Pages، بخش **Custom domain** را پیدا کنید
2. دامنه خود را وارد کنید (مثلاً: `watermark.example.com`)
3. در تنظیمات DNS دامنه خود یک رکورد CNAME ایجاد کنید که به `YOUR_USERNAME.github.io` اشاره کند

### فعال‌سازی HTTPS

GitHub Pages به صورت پیش‌فرض از HTTPS پشتیبانی می‌کند. اگر دامنه سفارشی استفاده می‌کنید:

1. در تنظیمات GitHub Pages
2. گزینه **Enforce HTTPS** را فعال کنید

## عیب‌یابی

### سایت نمایش داده نمی‌شود

- مطمئن شوید که فایل `index.html` در ریشه مخزن قرار دارد
- صبر کنید تا GitHub Pages سایت را build کند (ممکن است تا 10 دقیقه طول بکشد)
- کش مرورگر را پاک کنید یا از حالت incognito استفاده کنید

### استایل‌ها یا اسکریپت‌ها کار نمی‌کنند

- مطمئن شوید که مسیرهای فایل‌ها نسبی هستند (مثل `assets/style.css`)
- Console مرورگر را بررسی کنید (F12) برای مشاهده خطاها

### تغییرات نمایش داده نمی‌شوند

- کش مرورگر را پاک کنید (Ctrl + F5)
- چند دقیقه صبر کنید تا GitHub Pages بروزرسانی شود
- مطمئن شوید که تغییرات را commit و push کرده‌اید

## منابع مفید

- [مستندات GitHub Pages](https://docs.github.com/en/pages)
- [راهنمای Git](https://git-scm.com/book/fa/v2)
- [آموزش GitHub](https://docs.github.com/en/get-started)

## سوالات متداول

**س: آیا GitHub Pages رایگان است؟**  
ج: بله، برای مخزن‌های عمومی کاملاً رایگان است.

**س: چند سایت می‌توانم داشته باشم؟**  
ج: می‌توانید برای هر مخزن یک سایت داشته باشید.

**س: آیا می‌توانم از بکند استفاده کنم؟**  
ج: GitHub Pages فقط برای سایت‌های استاتیک است. این پروژه نیازی به بکند ندارد.

**س: آیا می‌توانم آمار بازدید داشته باشم؟**  
ج: می‌توانید از سرویس‌هایی مثل Google Analytics استفاده کنید.

---

**موفق باشید!** 🚀

