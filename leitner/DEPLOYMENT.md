# راهنمای انتشار در GitHub Pages

این راهنما به شما کمک می‌کند تا برنامه لایتنر را به صورت رایگان در GitHub Pages منتشر کنید.

## پیش‌نیازها

- یک حساب کاربری GitHub
- نصب Git روی سیستم شما
- آشنایی اولیه با Git

## گام 1: ایجاد مخزن GitHub

1. به [GitHub](https://github.com) بروید
2. روی **New Repository** کلیک کنید
3. نام مخزن را وارد کنید (مثلاً `leitner`)
4. گزینه **Public** را انتخاب کنید
5. **Create Repository** را بزنید

## گام 2: آماده‌سازی پروژه

در ترمینال یا PowerShell، به پوشه پروژه بروید:

```powershell
cd D:\Local\my\ai-agent-project\leitner
```

## گام 3: مقداردهی اولیه Git

```bash
# مقداردهی اولیه Git
git init

# اضافه کردن تمام فایل‌ها (به جز .idea که در .gitignore است)
git add .

# Commit اولیه
git commit -m "Initial commit: Leitner Flashcard System"
```

## گام 4: اتصال به GitHub

```bash
# جایگزین کردن USERNAME با نام کاربری GitHub خود
git remote add origin https://github.com/USERNAME/leitner.git

# تغییر نام شاخه به main
git branch -M main

# Push به GitHub
git push -u origin main
```

## گام 5: فعال‌سازی GitHub Pages

1. به مخزن خود در GitHub بروید
2. روی تب **Settings** کلیک کنید
3. از منوی سمت چپ، **Pages** را انتخاب کنید
4. در قسمت **Source**:
   - Branch: `main` را انتخاب کنید
   - Folder: `/ (root)` را انتخاب کنید
5. روی **Save** کلیک کنید

## گام 6: دسترسی به سایت

بعد از چند دقیقه، سایت شما در آدرس زیر در دسترس خواهد بود:

```
https://USERNAME.github.io/leitner/
```

(USERNAME را با نام کاربری GitHub خود جایگزین کنید)

## به‌روزرسانی سایت

هر وقت تغییراتی در پروژه اعمال کردید:

```bash
# اضافه کردن فایل‌های تغییر یافته
git add .

# Commit با توضیحات
git commit -m "توضیح تغییرات"

# Push به GitHub
git push
```

بعد از چند دقیقه، تغییرات در سایت اعمال می‌شود.

## سفارشی‌سازی آدرس (اختیاری)

### استفاده از دامنه شخصی

1. یک فایل با نام `CNAME` در روت پروژه ایجاد کنید
2. دامنه خود را در آن بنویسید (مثلاً `leitner.example.com`)
3. در تنظیمات DNS دامنه، یک رکورد CNAME به `USERNAME.github.io` اضافه کنید

### استفاده از نام کاربری به عنوان دامنه اصلی

اگر نام مخزن را `USERNAME.github.io` قرار دهید، سایت در آدرس اصلی در دسترس خواهد بود:

```
https://USERNAME.github.io/
```

## رفع مشکلات رایج

### مشکل 1: سایت باز نمی‌شود
- صبر کنید 5-10 دقیقه برای اعمال تغییرات
- بررسی کنید که Branch به درستی تنظیم شده باشد
- مطمئن شوید مخزن Public است

### مشکل 2: استایل‌ها لود نمی‌شوند
- مسیرهای فایل‌ها را بررسی کنید (باید relative path باشد)
- Cache مرورگر را پاک کنید

### مشکل 3: تغییرات اعمال نمی‌شوند
- مطمئن شوید تغییرات را commit و push کرده‌اید
- صبر کنید چند دقیقه
- Cache CDN GitHub را پاک کنید: `Shift + F5`

## امنیت و حریم خصوصی

✅ **مزایا:**
- رایگان و نامحدود
- HTTPS رایگان
- سرعت بالا (CDN)
- پشتیبانی 24/7

⚠️ **نکات:**
- تمام کد منبع public است
- داده‌های کاربران در مرورگر خود ذخیره می‌شود (LocalStorage)
- هیچ داده‌ای به سرور ارسال نمی‌شود

## منابع بیشتر

- [مستندات GitHub Pages](https://docs.github.com/en/pages)
- [راهنمای Git](https://git-scm.com/book/fa/v2)
- [آموزش GitHub](https://guides.github.com/)

## پشتیبانی

در صورت بروز مشکل:
1. مستندات GitHub Pages را مطالعه کنید
2. در Issues مخزن سوال بپرسید
3. به انجمن‌های GitHub مراجعه کنید

---

**موفق باشید! 🚀**

