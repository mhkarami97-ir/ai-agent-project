# 🚀 راهنمای آپلود به GitHub

این راهنما به شما کمک می‌کند پروژه را روی GitHub آپلود کنید.

---

## 📋 پیش‌نیازها

قبل از شروع مطمئن شوید که:

- [ ] Git روی سیستم شما نصب است
- [ ] حساب کاربری GitHub دارید
- [ ] تمام فایل‌ها را بررسی کرده‌اید

---

## 🔧 تنظیمات اولیه (یکبار)

اگر اولین بار است Git استفاده می‌کنید:

```bash
# تنظیم نام
git config --global user.name "Your Name"

# تنظیم ایمیل
git config --global user.email "your.email@example.com"
```

---

## 📤 روش 1: ریپازیتوری جدید

### مرحله 1: ساخت ریپازیتوری در GitHub

1. به [GitHub](https://github.com) بروید
2. روی دکمه **+** در بالا کلیک کنید
3. **New repository** را انتخاب کنید
4. نام ریپازیتوری را وارد کنید (مثلاً: `web-tools`)
5. توضیحات را اضافه کنید (از README کپی کنید)
6. **Public** یا **Private** را انتخاب کنید
7. **بدون** README, .gitignore, LICENSE ایجاد کنید (چون خودتان دارید)
8. **Create repository** را کلیک کنید

### مرحله 2: آپلود فایل‌ها

در پوشه پروژه (PowerShell یا CMD):

```bash
# 1. وارد پوشه پروژه شوید
cd D:\Local\my\ai-agent-project

# 2. مقداردهی Git (اگر قبلاً نکرده‌اید)
git init

# 3. اضافه کردن همه فایل‌ها
git add .

# 4. Commit اولیه
git commit -m "Initial commit: Add 49+ web tools with complete documentation"

# 5. تغییر نام branch به main (اگر master است)
git branch -M main

# 6. اضافه کردن remote (جایگزین YOUR_USERNAME و REPO_NAME کنید)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# 7. Push کردن
git push -u origin main
```

**⚠️ نکته**: در خط 6، `YOUR_USERNAME` و `REPO_NAME` را با اطلاعات خودتان جایگزین کنید.

---

## 🔄 روش 2: به‌روزرسانی ریپازیتوری موجود

اگر قبلاً ریپازیتوری دارید:

```bash
# 1. وارد پوشه پروژه شوید
cd D:\Local\my\ai-agent-project

# 2. بررسی وضعیت
git status

# 3. اضافه کردن فایل‌های جدید/تغییر یافته
git add .

# 4. Commit با پیام مناسب
git commit -m "Docs: Add complete documentation (README, CONTRIBUTING, CHANGELOG, LICENSE)"

# 5. Push کردن
git push origin main
```

---

## 📝 پیام‌های Commit پیشنهادی

### برای Commit اولیه:
```bash
git commit -m "Initial commit: Add 49+ web tools collection

- Add main index page with search and filters
- Add 49+ useful web tools
- Add PWA support (installable on mobile and desktop)
- Add dark/light theme toggle
- Add complete documentation (README, CONTRIBUTING, CHANGELOG)
- Add MIT License
- All tools are client-side, no backend needed"
```

### برای به‌روزرسانی مستندات:
```bash
git commit -m "Docs: Add comprehensive project documentation

- Add detailed README.md with 49+ tools list
- Add CONTRIBUTING.md with contribution guidelines
- Add CHANGELOG.md with version history
- Add LICENSE (MIT)
- Add bilingual support (Persian and English)
- Add installation and usage guides"
```

---

## 🎨 تنظیمات GitHub Repository

بعد از آپلود، این تنظیمات را انجام دهید:

### 1. About Section

در صفحه اصلی ریپازیتوری، روی ⚙️ در بخش About کلیک کنید:

```
Description:
🛠️ مجموعه 49+ ابزار آنلاین | Collection of 49+ Online Web Tools - Built with AI

Website:
https://yourusername.github.io/repo-name

Topics:
pwa, web-tools, persian, farsi, utilities, 
progressive-web-app, client-side, offline-first,
ai-generated, web-app, tools-collection,
dark-mode, responsive-design
```

### 2. GitHub Pages

Settings → Pages:
- **Source**: Deploy from a branch
- **Branch**: main
- **Folder**: / (root)
- **Save**

بعد از چند دقیقه، سایت شما در `https://yourusername.github.io/repo-name` در دسترس است.

### 3. Features

در Settings → General → Features:
- ✅ Issues
- ✅ Preserve this repository (اختیاری)
- ✅ Sponsorships (اختیاری)
- ✅ Discussions (اختیاری)

---

## 📂 فایل‌های مهم برای .gitignore

یک فایل `.gitignore` ایجاد کنید:

```gitignore
# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
desktop.ini

# Logs
*.log
npm-debug.log*

# Temporary files
*.tmp
*.temp
temp/
tmp/

# Personal files
.env
.env.local
notes.txt
TODO.md

# Build files (if you add build process later)
dist/
build/
node_modules/
```

---

## 🔒 فایل‌هایی که نباید Commit شوند

**هرگز این‌ها را commit نکنید:**
- کلیدهای API شخصی
- رمزهای عبور
- اطلاعات شخصی
- فایل‌های بزرگ (بیشتر از 100MB)
- فایل‌های backup

---

## ✅ چک‌لیست قبل از Push

- [ ] همه فایل‌های مهم commit شده‌اند
- [ ] README.md کامل است
- [ ] اطلاعات شخصی (username, email) به‌روز است
- [ ] LICENSE وجود دارد
- [ ] .gitignore تنظیم شده
- [ ] فایل‌های حساس حذف شده‌اند
- [ ] تمام لینک‌ها کار می‌کنند (قبل از push محلی تست کنید)

---

## 🔐 احراز هویت GitHub

### روش 1: HTTPS (ساده‌تر)

اولین بار که push می‌کنید، از شما username و password می‌خواهد.

**⚠️ نکته مهم**: بجای password، باید **Personal Access Token** استفاده کنید:

1. GitHub → Settings → Developer settings
2. Personal access tokens → Tokens (classic)
3. Generate new token (classic)
4. انتخاب scopes: `repo`, `workflow`
5. توکن را کپی کنید (فقط یکبار نشان داده می‌شود!)
6. هنگام push، بجای password، توکن را وارد کنید

### روش 2: SSH (امن‌تر)

راهنمای کامل: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

```bash
# 1. تولید SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"

# 2. کپی کردن public key
cat ~/.ssh/id_ed25519.pub

# 3. اضافه کردن به GitHub
# Settings → SSH and GPG keys → New SSH key

# 4. تست اتصال
ssh -T git@github.com

# 5. تغییر remote به SSH
git remote set-url origin git@github.com:YOUR_USERNAME/REPO_NAME.git
```

---

## 🐛 حل مشکلات رایج

### مشکل 1: Permission denied

```bash
# راه‌حل: استفاده از Personal Access Token یا SSH
```

### مشکل 2: فایل خیلی بزرگ است

```bash
# حذف فایل از Git history
git rm --cached large-file.zip
echo "large-file.zip" >> .gitignore
git commit -m "Remove large file"
```

### مشکل 3: Conflict در merge

```bash
# Pull کردن تغییرات جدید
git pull origin main

# رفع conflict در فایل‌ها
# سپس:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### مشکل 4: اشتباه commit کرده‌ام

```bash
# برگرداندن آخرین commit (فایل‌ها حفظ می‌شوند)
git reset --soft HEAD~1

# یا برگرداندن کامل (فایل‌ها هم حذف می‌شوند)
git reset --hard HEAD~1
```

---

## 📱 بعد از آپلود

### 1. تست سایت

سایت را در GitHub Pages باز کنید و تست کنید:
```
https://yourusername.github.io/repo-name
```

### 2. به اشتراک بگذارید

- LinkedIn
- Twitter
- Reddit (r/webdev, r/programming)
- Dev.to
- Hacker News

### 3. اضافه کردن بج‌ها

در README.md، لینک‌های زیر را به‌روزرسانی کنید:

```markdown
![GitHub stars](https://img.shields.io/github/stars/yourusername/repo-name?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/repo-name?style=social)
![GitHub issues](https://img.shields.io/github/issues/yourusername/repo-name)
![GitHub license](https://img.shields.io/github/license/yourusername/repo-name)
```

---

## 🎉 تبریک!

پروژه شما روی GitHub منتشر شد! 🎊

حالا می‌توانید:
- ✅ لینک را با دوستان به اشتراک بگذارید
- ✅ از طریق GitHub Pages استفاده کنید
- ✅ Pull Request دریافت کنید
- ✅ مشارکت‌کنندگان جدید جذب کنید

---

## 📚 منابع مفید

- [GitHub Docs](https://docs.github.com)
- [Git Handbook](https://guides.github.com/introduction/git-handbook/)
- [GitHub Pages Docs](https://docs.github.com/en/pages)
- [Pro Git Book](https://git-scm.com/book/en/v2) (رایگان)

---

## 💡 نکته نهایی

همیشه قبل از push:

```bash
# 1. Status را بررسی کنید
git status

# 2. فایل‌های commit شده را ببینید
git diff --staged

# 3. آخرین commit را بررسی کنید
git log -1
```

---

<div align="center">

**موفق باشید! 🚀**

اگر سوالی دارید، در Issues بپرسید.

</div>

