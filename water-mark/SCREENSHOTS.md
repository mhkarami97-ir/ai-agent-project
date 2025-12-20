# نمونه تصاویر و اسکرین‌شات‌ها

برای بهبود README و جذاب‌تر کردن پروژه، می‌توانید اسکرین‌شات‌هایی از برنامه اضافه کنید.

## پیشنهاد ساختار

پوشه‌ای با نام `screenshots` ایجاد کنید و تصاویر زیر را اضافه کنید:

```
screenshots/
├── main-interface.png       # رابط اصلی برنامه
├── text-watermark.png       # مثال واترمارک متنی
├── image-watermark.png      # مثال واترمارک تصویری
├── mobile-view.png          # نمای موبایل
└── desktop-view.png         # نمای دسکتاپ
```

## افزودن به README

سپس می‌توانید در فایل README.md تصاویر را اضافه کنید:

```markdown
## تصاویر نمونه

### رابط اصلی
![رابط اصلی](screenshots/main-interface.png)

### واترمارک متنی
![واترمارک متنی](screenshots/text-watermark.png)

### واترمارک تصویری
![واترمارک تصویری](screenshots/image-watermark.png)

### نمای موبایل
<img src="screenshots/mobile-view.png" width="300" alt="نمای موبایل">
```

## نکات عکاسی

1. **کیفیت بالا**: از تصاویر با کیفیت بالا استفاده کنید (حداقل 1280×720)
2. **فرمت**: PNG برای اسکرین‌شات‌ها بهتر است
3. **اندازه**: سعی کنید حجم فایل‌ها را کم نگه دارید (زیر 500KB)
4. **محتوای مناسب**: از تصاویر نمونه زیبا و حرفه‌ای استفاده کنید
5. **حالت تاریک/روشن**: اگر امکان دارد، از هر دو حالت عکس بگیرید

## ابزارهای پیشنهادی

- **Windows**: Snipping Tool یا Snip & Sketch
- **Mac**: Screenshot utility (Cmd + Shift + 4)
- **Extensions**: Awesome Screenshot, Nimbus Screenshot
- **بهینه‌سازی**: TinyPNG.com برای کاهش حجم

## مثال استفاده در README

می‌توانید بخشی مثل این به README اضافه کنید:

```markdown
## 🖼️ پیش‌نمایش

<div align="center">
  <img src="screenshots/desktop-view.png" alt="نمای دسکتاپ" width="600">
  <p><em>نمای دسکتاپ برنامه</em></p>
</div>

### ویژگی‌ها در عمل

| واترمارک متنی | واترمارک تصویری |
|:---:|:---:|
| ![Text](screenshots/text-watermark.png) | ![Image](screenshots/image-watermark.png) |

### 📱 طراحی واکنش‌گرا

<img src="screenshots/mobile-view.png" alt="نمای موبایل" height="500">
```

## GIF متحرک

برای نمایش بهتر عملکرد، می‌توانید GIF متحرک ایجاد کنید:

### ابزارهای ساخت GIF
- **ScreenToGif** (Windows)
- **GIPHY Capture** (Mac)
- **LICEcap** (Cross-platform)
- **Recordit** (Online)

### مثال
```markdown
## 🎬 نحوه استفاده

![Demo](screenshots/demo.gif)
```

---

**نکته**: اسکرین‌شات‌ها اختیاری هستند اما به جذاب‌تر شدن پروژه کمک می‌کنند!

