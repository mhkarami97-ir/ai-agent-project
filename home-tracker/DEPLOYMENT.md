# راهنمای انتشار در GitHub Pages

## مراحل انتشار

### 1. ایجاد Repository در GitHub

1. به [GitHub](https://github.com) بروید و لاگین کنید
2. روی دکمه **New** یا **+** در گوشه بالا کلیک کنید
3. **New repository** را انتخاب کنید
4. نام repository را وارد کنید (مثلاً `home-tracker`)
5. توضیح اختیاری بنویسید
6. **Public** را انتخاب کنید
7. روی **Create repository** کلیک کنید

### 2. آپلود فایل‌ها

#### روش اول: از طریق رابط وب GitHub

1. در صفحه repository خود، روی **uploading an existing file** کلیک کنید
2. فایل‌ها را Drag & Drop کنید یا انتخاب کنید:
   - `index.html`
   - پوشه `assets` با تمام محتویات آن
   - `README.md`
   - `.gitignore`
3. توضیحی برای commit بنویسید (مثلاً "Initial commit")
4. روی **Commit changes** کلیک کنید

#### روش دوم: از طریق Git (پیشرفته)

```bash
# در پوشه پروژه، این دستورات را اجرا کنید:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/[username]/[repository-name].git
git push -u origin main
```

### 3. فعال‌سازی GitHub Pages

1. به تنظیمات repository بروید (**Settings**)
2. در منوی سمت راست، **Pages** را پیدا کنید
3. در قسمت **Source**:
   - Branch: `main` (یا `master`) را انتخاب کنید
   - Folder: `/ (root)` را انتخاب کنید
4. روی **Save** کلیک کنید
5. صبر کنید تا GitHub Pages سایت را deploy کند (معمولاً 1-2 دقیقه)

### 4. مشاهده سایت

پس از deployment، سایت شما در آدرس زیر قابل دسترسی خواهد بود:

```
https://[username].github.io/[repository-name]/
```

مثال:
```
https://yourusername.github.io/home-tracker/
```

## نکات مهم

- ✅ Repository باید **Public** باشه
- ✅ فایل اصلی باید `index.html` باشه
- ✅ پس از هر تغییر، باید دوباره commit و push کنید
- ✅ تغییرات ممکن است چند دقیقه طول بکشه تا اعمال بشه

## به‌روزرسانی سایت

هر وقت تغییری دادید:

### از طریق رابط وب:
1. به فایل مورد نظر بروید
2. روی آیکن مداد (Edit) کلیک کنید
3. تغییرات را اعمال کنید
4. Commit کنید

### از طریق Git:
```bash
git add .
git commit -m "توضیحات تغییرات"
git push
```

## مشکلات رایج

### سایت نمایش داده نمی‌شود
- صبر کنید (تا 10 دقیقه)
- بررسی کنید که GitHub Pages فعال باشه
- Cache مرورگر را پاک کنید

### CSS یا JS کار نمی‌کنه
- بررسی کنید که مسیر فایل‌ها درست باشه
- مطمئن شوید پوشه `assets` آپلود شده

### خطای 404
- نام فایل‌ها را دقیق چک کنید
- مطمئن شوید `index.html` در root قرار داره

## لینک‌های مفید

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Git Tutorial](https://git-scm.com/docs/gittutorial)

---

موفق باشید! 🚀

