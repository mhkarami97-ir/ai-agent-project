# راهنمای استقرار در GitHub Pages

## مراحل استقرار:

### ۱. ایجاد مخزن GitHub

1. وارد حساب GitHub خود شوید
2. روی دکمه `+` در گوشه بالا سمت راست کلیک کنید
3. گزینه `New repository` را انتخاب کنید
4. نام مخزن را وارد کنید (مثلاً `typing-practice`)
5. توضیحی اختیاری اضافه کنید
6. روی `Create repository` کلیک کنید

### ۲. آپلود فایل‌ها

#### روش اول: با استفاده از رابط وب

1. روی `uploading an existing file` کلیک کنید
2. تمام فایل‌های پروژه را بکشید و در صفحه رها کنید
3. یک پیام commit بنویسید (مثلاً "Initial commit")
4. روی `Commit changes` کلیک کنید

#### روش دوم: با استفاده از Git

```bash
cd D:\Local\my\ai-agent-project\typing

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/typing-practice.git
git push -u origin main
```

### ۳. فعال‌سازی GitHub Pages

1. به صفحه مخزن خود در GitHub بروید
2. روی تب `Settings` کلیک کنید
3. در منوی سمت چپ، گزینه `Pages` را انتخاب کنید
4. در بخش `Source`:
   - Branch: `main` را انتخاب کنید
   - Folder: `/ (root)` را انتخاب کنید
5. روی `Save` کلیک کنید
6. چند دقیقه صبر کنید تا سایت شما منتشر شود

### ۴. مشاهده سایت

پس از چند دقیقه، سایت شما در آدرس زیر در دسترس خواهد بود:

```
https://YOUR-USERNAME.github.io/typing-practice/
```

## نکات مهم:

- ✅ نام پوشه `assets` باید دقیقاً با حروف کوچک باشد
- ✅ مطمئن شوید تمام فایل‌ها آپلود شده‌اند
- ✅ اگر تغییری دادید، فایل‌ها را دوباره push کنید
- ✅ برای اعمال تغییرات معمولاً ۱-۵ دقیقه زمان می‌برد

## به‌روزرسانی سایت:

برای به‌روزرسانی سایت، کافیست:

```bash
git add .
git commit -m "Update files"
git push
```

## حل مشکلات رایج:

### صفحه 404 نمایش داده می‌شود
- مطمئن شوید فایل `index.html` در ریشه مخزن قرار دارد
- منتظر بمانید تا GitHub Pages بیلد شود (۱-۵ دقیقه)

### استایل‌ها نمایش داده نمی‌شوند
- مطمئن شوید پوشه `assets` وجود دارد
- مسیرها را بررسی کنید (باید relative باشند)

### برای کمک بیشتر:
- [مستندات GitHub Pages](https://docs.github.com/en/pages)
- [راهنمای Git](https://git-scm.com/doc)

