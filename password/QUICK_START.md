# راهنمای سریع - تولید کننده رمز عبور

## 🎯 امکانات کلیدی

### ✅ تولید رمز عبور
- طول رمز: 4 تا 64 کاراکتر
- حروف بزرگ و کوچک انگلیسی
- اعداد و نمادهای خاص
- تولید امن با Web Crypto API

### ✅ تنظیمات امنیتی
- حذف کاراکترهای مشابه (مثل i, l, 1, O, 0)
- حذف نمادهای مبهم (مثل {}, [], <>, /)
- سنجش قدرت رمز عبور
- پیشنهادات امنیتی

### ✅ قابلیت‌های اضافی
- تاریخچه 10 رمز عبور آخر
- کپی سریع رمزها
- ذخیره خودکار در مرورگر
- کاملاً آفلاین

## 🚀 راه‌اندازی در GitHub Pages

```bash
# 1. ایجاد مخزن Git
git init

# 2. افزودن فایل‌ها
git add .

# 3. اولین Commit
git commit -m "Initial commit: Password Generator"

# 4. تنظیم برنچ اصلی
git branch -M main

# 5. اضافه کردن Remote
git remote add origin https://github.com/USERNAME/REPOSITORY.git

# 6. Push کردن
git push -u origin main
```

سپس در GitHub:
- Settings → Pages
- Source: main branch
- منتظر بمانید تا منتشر شود
- آدرس: `https://USERNAME.github.io/REPOSITORY`

## 📋 لیست بررسی

- ✅ HTML ساختار یافته و RTL
- ✅ CSS رسپانسیو و مدرن
- ✅ JavaScript با کلاس‌های ES6
- ✅ فونت Vazirmatn
- ✅ ذخیره‌سازی در localStorage
- ✅ Web Crypto API برای امنیت
- ✅ رابط کاربری فارسی
- ✅ README کامل
- ✅ .gitignore برای پروژه

## 🎨 نکات مهم

1. **امنیت**: تمام رمزها در مرورگر ذخیره می‌شوند
2. **آفلاین**: نیازی به اینترنت نیست
3. **رسپانسیو**: روی موبایل عالی کار می‌کند
4. **فارسی**: کامل RTL و فونت مناسب

## 🔧 سفارشی‌سازی سریع

### تغییر رنگ اصلی
فایل: `assets/style.css`
خط 12-13:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### تغییر تعداد تاریخچه
فایل: `assets/script.js`
خط 214:
```javascript
if (this.history.length > 10) { // تغییر 10 به عدد دلخواه
```

### تغییر محدوده طول رمز
فایل: `index.html`
خط 36:
```html
<input type="range" id="lengthSlider" min="4" max="64" value="16">
```

## 📱 تست شده روی

- ✅ Chrome Desktop & Mobile
- ✅ Firefox Desktop & Mobile
- ✅ Safari Desktop & iOS
- ✅ Edge Desktop
- ✅ Opera Desktop

---

**آماده استفاده و میزبانی! 🚀**

