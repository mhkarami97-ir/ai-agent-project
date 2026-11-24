// =============================================================================
// Web Tools - Core Script (v2.3.0)
// =============================================================================

const tools = [
  {
    path: "travel-time",
    category: "daily",
    faName: "محاسبه زمان رسیدن",
    enName: "Arrival Time Calculator",
    faDesc: "زمان رسیدن به مقصد با سرعت‌های مختلف",
    enDesc: "Travel time at different speeds",
    icon: "car",
  },
  {
    path: "used-price",
    category: "finance",
    faName: "قیمت دست دوم",
    enName: "Used Price Estimator",
    faDesc: "برآورد قیمت تقریبی کالای دست دوم",
    enDesc: "Estimate second-hand price",
    icon: "tag",
  },
  {
    path: "story-map",
    category: "project",
    faName: "نقشه داستان",
    enName: "Story Map",
    faDesc: "ساخت نقشه داستان برای پروژه‌ها",
    enDesc: "Create story maps for projects",
    icon: "story-map",
  },
  {
    path: "planning-poker",
    category: "project",
    faName: "پوکر برنامه‌ریزی",
    enName: "Planning Poker",
    faDesc: "ابزار تخمین زمان و تلاش پروژه‌ها",
    enDesc: "Estimate project time and effort",
    icon: "planning-poker",
  },
  {
    path: "opportunity-canvas",
    category: "project",
    faName: "بوم فرصت",
    enName: "Opportunity Canvas",
    faDesc: "ابزار تحلیل فرصت‌ها و ایده‌ها",
    enDesc: "Tool for analyzing opportunities and ideas",
    icon: "canvas",
  },
  {
    path: "planet",
    category: "home",
    faName: "مراقبت از گیاهان",
    enName: "Plant Care",
    faDesc: "راهنمای مراقبت از گیاهان خانگی",
    enDesc: "Guide to caring for houseplants",
    icon: "plant",
  },
  {
    path: "calculator",
    category: "daily",
    faName: "ماشین حساب",
    enName: "Calculator",
    faDesc: "ماشین حساب ساده و پیشرفته",
    enDesc: "Simple and advanced calculator",
    icon: "calculator",
  },
  {
    path: "voice-change",
    category: "media",
    faName: "تغییر صدا",
    enName: "Voice Changer",
    faDesc: "تغییر صدای ضبط شده",
    enDesc: "Change recorded voice",
    icon: "mic",
  },
  {
    path: "survival",
    category: "emergency",
    faName: "کیت بقا",
    enName: "Survival Kit",
    faDesc: "محاسبه نیازهای بقا در شرایط اضطراری",
    enDesc: "Calculate survival needs in emergencies",
    icon: "survival",
  },
  {
    path: "site-checker",
    category: "emergency",
    faName: "بررسی مسدود بودن سایت",
    enName: "Site Block Checker",
    faDesc: "بررسی مسدود بودن سایت‌ها در اینترنت",
    enDesc: "Check if websites are blocked on the internet",
    icon: "globe-check",
  },
  {
    path: "safe-zone-map",
    category: "emergency",
    faName: "نقاط امن",
    enName: "Safe Zone Map",
    faDesc: "ثبت و مشاهده نقاط امن در بلایای طبیعی",
    enDesc: "Register and view safe zones during natural disasters",
    icon: "shield-alert",
  },
  {
    path: "sleep-calculator",
    category: "daily",
    faName: "ساعت خواب و بیداری",
    enName: "Sleep Calculator",
    faDesc: "بهترین ساعت‌های خواب و بیدار شدن بر اساس چرخه خواب",
    enDesc: "Best sleep and wake times by sleep cycles",
    icon: "moon-stars",
  },
  {
    path: "event-logger",
    category: "dev",
    faName: "لاگ رویدادها",
    enName: "Event Logger",
    faDesc: "ثبت و نمایش رویدادها",
    enDesc: "Log and display events",
    icon: "terminal",
  },
  {
    path: "cryptography",
    category: "security",
    faName: "رمزنگاری متن",
    enName: "Cryptography",
    faDesc: "رمزنگاری متن با کلید خصوصی",
    enDesc: "Cryptography text",
    icon: "key",
  },
  {
    path: "license-plate",
    category: "daily",
    faName: "پلاک و شماره تلفن استانها",
    enName: "LicensePlate",
    faDesc: "نمایش جزئیات پلاک و شماره تلفن استانها",
    enDesc: "Show details of license plates and phone numbers of provinces",
    icon: "license-plate",
  },
  {
    path: "weather",
    category: "daily",
    faName: "وضعیت هوا",
    enName: "Weather",
    faDesc: "نمایش وضعیت آب و هوای امروز",
    enDesc: "Show today's weather",
    icon: "cloud-sun",
  },
  {
    path: "compress",
    category: "media",
    faName: "فشرده‌ساز تصویر",
    enName: "Image Compressor",
    faDesc: "فشرده‌سازی تصاویر در مرورگر",
    enDesc: "Compress images in browser",
    icon: "compress-img",
  },
  {
    path: "qr",
    category: "daily",
    faName: "کیوآر کد",
    enName: "QR Code",
    faDesc: "ساخت و اسکن کیوآر کد",
    enDesc: "Generate and scan QR code",
    icon: "qr",
  },
  {
    path: "color",
    category: "media",
    faName: "پالت رنگ",
    enName: "Color Palette",
    faDesc: "انتخاب و ساخت پالت رنگ هماهنگ",
    enDesc: "Choose and build color palette",
    icon: "palette",
  },
  {
    path: "json",
    category: "dev",
    faName: "JSON",
    enName: "JSON Formatter",
    faDesc: "فرمت و اعتبارسنجی JSON",
    enDesc: "Format and validate JSON",
    icon: "braces",
  },
  {
    path: "editor",
    category: "text",
    faName: "ویرایشگر متن",
    enName: "Text Editor",
    faDesc: "ویرایشگر متن پیشرفته",
    enDesc: "Advanced text editor",
    icon: "edit-pen",
  },
  {
    path: "text",
    category: "text",
    faName: "ژنراتور متن",
    enName: "Text Generator",
    faDesc: "تولید محتوای متنی و لورم ایپسوم",
    enDesc: "Generate text content",
    icon: "file-text",
  },
  {
    path: "text-counter",
    category: "text",
    faName: "شمارنده متن",
    enName: "Text Counter",
    faDesc: "شمارش کلمات و کاراکترها",
    enDesc: "Count words and characters",
    icon: "hash-counter",
  },
  {
    path: "text-formatter",
    category: "text",
    faName: "فرمت‌دهنده متن",
    enName: "Text Formatter",
    faDesc: "فرمت‌دهی و تبدیل متن",
    enDesc: "Format and transform text",
    icon: "text-format",
  },
  {
    path: "compare",
    category: "text",
    faName: "مقایسه متن",
    enName: "Text Compare",
    faDesc: "مقایسه زنده دو متن و نمایش تغییرات",
    enDesc: "Live comparison of two texts and show diff",
    icon: "compare",
  },
  {
    path: "encoder",
    category: "dev",
    faName: "رمزگذار",
    enName: "Encoder",
    faDesc: "رمزگذاری و رمزگشایی داده‌ها (Base64 و URL)",
    enDesc: "Encode and decode data",
    icon: "binary-lock",
  },
  {
    path: "password",
    category: "security",
    faName: "رمز عبور",
    enName: "Password Generator",
    faDesc: "تولید رمز عبور تصادفی و امن",
    enDesc: "Generate secure passwords",
    icon: "key-round",
  },
  {
    path: "secure-text",
    category: "security",
    faName: "متن امن",
    enName: "Secure Text",
    faDesc: "نگهداری متن‌های امن با کلید خصوصی",
    enDesc: "Secure text with private key",
    icon: "shield-lock",
  },
  {
    path: "mapper",
    category: "daily",
    faName: "تبدیل واحد",
    enName: "Unit Converter",
    faDesc: "تبدیل واحدهای مختلف اندازه‌گیری",
    enDesc: "Convert different measurement units",
    icon: "convert-units",
  },
  {
    path: "currency-conversion-calculator",
    category: "finance",
    faName: "تبدیل ارز",
    enName: "Currency Converter",
    faDesc: "تبدیل ارزهای مختلف به یکدیگر",
    enDesc: "Convert different currencies",
    icon: "coins",
  },
  {
    path: "time",
    category: "productivity",
    faName: "زمان",
    enName: "Time & Clock",
    faDesc: "ساعت و زمان محلی و جهانی",
    enDesc: "Local and world clock",
    icon: "clock",
  },
  {
    path: "time-tracker",
    category: "productivity",
    faName: "زمان‌سنج",
    enName: "Time Tracker",
    faDesc: "پیگیری زمان کارها و پروژه‌ها",
    enDesc: "Track time for tasks and projects",
    icon: "timer",
  },
  {
    path: "pomodoro-timer",
    category: "productivity",
    faName: "تایمر پومودورو",
    enName: "Pomodoro Timer",
    faDesc: "مدیریت زمان با روش تکنیک پومودورو",
    enDesc: "Time management with Pomodoro",
    icon: "hourglass",
  },
  {
    path: "daily-planner",
    category: "productivity",
    faName: "برنامه‌ریز روزانه",
    enName: "Daily Planner",
    faDesc: "برنامه‌ریزی وظایف و اهداف روزانه",
    enDesc: "Plan daily tasks and goals",
    icon: "calendar",
  },
  {
    path: "note",
    category: "productivity",
    faName: "یادداشت",
    enName: "Note",
    faDesc: "یادداشت‌برداری سریع و آسان",
    enDesc: "Quick notes",
    icon: "note",
  },
  {
    path: "check-list",
    category: "productivity",
    faName: "چک‌لیست",
    enName: "Checklist",
    faDesc: "مدیریت چک‌لیست‌های کاری و خرید",
    enDesc: "Manage checklists and todos",
    icon: "checklist",
  },
  {
    path: "habit",
    category: "productivity",
    faName: "ردیاب عادت",
    enName: "Habit Tracker",
    faDesc: "ردیابی و ثبت منظم عادت‌های روزانه",
    enDesc: "Track daily habits",
    icon: "target",
  },
  {
    path: "cost-divider",
    category: "finance",
    faName: "تقسیم هزینه",
    enName: "Cost Divider",
    faDesc: "محاسبه دنگ و تقسیم هزینه‌های مشترک",
    enDesc: "Split costs and calculate shares",
    icon: "split-costs",
  },
  {
    path: "debt",
    category: "finance",
    faName: "مدیریت بدهی",
    enName: "Debt Manager",
    faDesc: "مدیریت بدهی‌ها و مطالبات مالی",
    enDesc: "Manage debts and receivables",
    icon: "credit-card",
  },
  {
    path: "personal-budget-planner",
    category: "finance",
    faName: "بودجه شخصی",
    enName: "Budget Planner",
    faDesc: "برنامه‌ریزی درآمدها و هزینه‌های ماهانه",
    enDesc: "Monthly personal budget planning",
    icon: "wallet",
  },
  {
    path: "medicine",
    category: "home",
    faName: "مدیریت دارو",
    enName: "Medicine Manager",
    faDesc: "مدیریت و یادآوری زمان مصرف داروها",
    enDesc: "Manage and remind medications",
    icon: "pill",
  },
  {
    path: "warranty-management",
    category: "home",
    faName: "مدیریت گارانتی",
    enName: "Warranty Manager",
    faDesc: "ثبت و پیگیری اعتبار گارانتی کالاها",
    enDesc: "Track warranties and guarantees",
    icon: "badge-check",
  },
  {
    path: "home-tracker",
    category: "home",
    faName: "ردیاب خانه",
    enName: "Home Tracker",
    faDesc: "مدیریت وسایل و موجودی لوازم منزل",
    enDesc: "Manage home inventory",
    icon: "home",
  },
  {
    path: "travel",
    category: "daily",
    faName: "برنامه سفر",
    enName: "Travel Planner",
    faDesc: "برنامه‌ریزی، هزینه‌ها و چک‌لیست سفر",
    enDesc: "Travel planner and packing checklist",
    icon: "plane",
  },
  {
    path: "regex",
    category: "dev",
    faName: "رجکس",
    enName: "Regex Tester",
    faDesc: "تست و بررسی آنلاین عبارات باقاعده",
    enDesc: "Test and debug regular expressions",
    icon: "regex",
  },
  {
    path: "meta-data",
    category: "media",
    faName: "متادیتا",
    enName: "Metadata Viewer",
    faDesc: "مشاهده مشخصات فنی و متادیتای تصویر (EXIF)",
    enDesc: "View image metadata and EXIF",
    icon: "info-image",
  },
  {
    path: "water-mark",
    category: "media",
    faName: "واترمارک",
    enName: "Watermark",
    faDesc: "افزودن واترمارک متنی و تصویری به عکس",
    enDesc: "Add text/image watermark to photos",
    icon: "stamp",
  },
  {
    path: "favicon",
    category: "dev",
    faName: "فاویکون",
    enName: "Favicon Generator",
    faDesc: "تولید آیکون و فاویکون برای وبسایت",
    enDesc: "Generate favicons for websites",
    icon: "sparkle-grid",
  },
  {
    path: "cron",
    category: "dev",
    faName: "کران جاب",
    enName: "Cron Job",
    faDesc: "تولید و ترجمه فرمت زمان‌بندی Cron",
    enDesc: "Generate and translate Cron expressions",
    icon: "clock-cog",
  },
  {
    path: "log-analyzer",
    category: "dev",
    faName: "تحلیل لاگ",
    enName: "Log Analyzer",
    faDesc: "آنالیز و جستجو در فایل‌های لاگ سیستمی",
    enDesc: "Analyze and search log files",
    icon: "line-chart",
  },
  {
    path: "leitner",
    category: "learning",
    faName: "سیستم لایتنر",
    enName: "Leitner System",
    faDesc: "یادگیری با فلش‌کارت و تکرار فاصله‌دار",
    enDesc: "Learn with spaced repetition flashcards",
    icon: "graduation",
  },
  {
    path: "typing",
    category: "learning",
    faName: "تمرین تایپ",
    enName: "Typing Practice",
    faDesc: "بهبود سرعت و دقت تایپ فارسی و انگلیسی",
    enDesc: "Improve typing speed and accuracy",
    icon: "keyboard",
  },
  {
    path: "mind-map",
    category: "project",
    faName: "نقشه ذهنی",
    enName: "Mind Map",
    faDesc: "ترسیم نمودار و نقشه‌های ذهنی ایده‌ها",
    enDesc: "Draw mind maps and concept diagrams",
    icon: "brain-network",
  },
  {
    path: "metronome",
    category: "media",
    faName: "مترونوم",
    enName: "Metronome",
    faDesc: "حفظ ریتم، ضرب‌آهنگ و تمپوی موسیقی",
    enDesc: "Keep musical tempo and rhythm",
    icon: "metronome",
  },
];

// Additional lists (Cafe Bazaar apps, Telegram bots, channels, external sites)
const LIST_DATA = Object.freeze({
  apps: [
    {
      name: "جعبه ابزار",
      id: "mhk.webtools",
      category: "tools",
      icon: "/assets/icons/app/01.png",
    },
    {
      name: "بدن ساز",
      id: "mhk.sport",
      category: "health",
      icon: "/assets/icons/app/02.png",
    },
    {
      name: "تقویم شمسی",
      id: "mhk.calender",
      category: "time",
      icon: "/assets/icons/app/04.png",
    },
    {
      name: "شیردال مارکت",
      id: "mhk.shirdalmarket",
      category: "finance",
      icon: "/assets/icons/app/05.png",
    },
    {
      name: "مدیریت مالی",
      id: "mhk.finance",
      category: "finance",
      icon: "/assets/icons/app/06.png",
    },
    {
      name: "مدیریت کارها",
      id: "mhk.task",
      category: "tools",
      icon: "/assets/icons/app/07.png",
    },
    {
      name: "چاوشان",
      id: "mhk.chavooshan",
      category: "travel",
      icon: "/assets/icons/app/08.png",
    },
    {
      name: "زلف دوتا",
      id: "mhk.zolfdota",
      category: "business",
      icon: "/assets/icons/app/09.png",
    },
    {
      name: "دور گردون",
      id: "mhk.dorgardoon",
      category: "business",
      icon: "/assets/icons/app/10.png",
    },
    {
      name: "چک لیست",
      id: "mhk.checklist",
      category: "tools",
      icon: "/assets/icons/app/11.png",
    },
    {
      name: "ملک ری",
      id: "mhk.molkrey",
      category: "finance",
      icon: "/assets/icons/app/12.png",
    },
    {
      name: "زروان",
      id: "mhk.zoorvan",
      category: "business",
      icon: "/assets/icons/app/13.png",
    },
    {
      name: "زمانک",
      id: "mhk.zamaanak",
      category: "time",
      icon: "/assets/icons/app/14.png",
    },
    {
      name: "هنگام",
      id: "mhk.hengam",
      category: "time",
      icon: "/assets/icons/app/15.png",
    },
    {
      name: "فرمول یک",
      id: "mhk.f1",
      category: "motorsport",
      icon: "/assets/icons/app/16.png",
    },
    {
      name: "موتو جی‌پی",
      id: "mhk.motogp",
      category: "motorsport",
      icon: "/assets/icons/app/18.png",
    },
    {
      name: "شکسته",
      id: "mhk.shekaste",
      category: "culture",
      icon: "/assets/icons/app/17.png",
    },
    {
      name: "خرید‌یار",
      id: "mhk.buy",
      category: "finance",
      icon: "/assets/icons/app/19.png",
    },
    {
      name: "سرویس‌یار",
      id: "mhk.service",
      category: "travel",
      icon: "/assets/icons/app/20.png",
    },
    {
      name: "ماهک",
      id: "mhk.period",
      category: "health",
      icon: "/assets/icons/app/03.png",
    },
    {
      name: "سفربان",
      id: "mhk.safar",
      category: "travel",
      icon: "/assets/icons/app/21.png",
    },
    {
      name: "مدیر‌یار",
      id: "mhk.school",
      category: "tools",
      icon: "/assets/icons/app/22.png",
    },
    {
      name: "نرخ",
      id: "mhk.nerkh",
      category: "finance",
      icon: "/assets/icons/app/23.png",
    },
    {
      name: "جعبه بازی",
      id: "mhk.gamebox",
      category: "games",
      icon: "/assets/icons/game/01.png",
    },
    {
      name: "چیستا",
      id: "mhk.chista",
      category: "games",
      icon: "/assets/icons/game/02.png",
    },
    {
      name: "سلامت",
      id: "mhk.health",
      category: "health",
      icon: "/assets/icons/app/24.png",
    },
    {
      name: "آب و هوا",
      id: "mhk.weather",
      category: "tools",
      icon: "/assets/icons/app/25.png",
    },
    {
      name: "زبان انگلیسی",
      id: "mhk.english",
      category: "tools",
      icon: "/assets/icons/app/26.png",
    },
    {
      name: "خاطره‌نامه",
      id: "mhk.memory",
      category: "tools",
      icon: "/assets/icons/app/27.png",
    },
    {
      name: "هوش‌مصنوعی",
      id: "mhk.ai.tools",
      category: "tools",
      icon: "/assets/icons/app/28.png",
    },
    {
      name: "غزل",
      id: "mhk.ghazal",
      category: "culture",
      icon: "/assets/icons/app/29.png",
    },
    {
      name: "سینما",
      id: "mhk.movie",
      category: "culture",
      icon: "/assets/icons/app/30.png",
    },
    {
      name: "کاوش",
      id: "mhk.habit",
      category: "tools",
      icon: "/assets/icons/app/31.png",
    },
    {
      name: "پیوند",
      id: "crm.zamaanak",
      category: "business",
      icon: "/assets/icons/app/32.png",
    },
  ],
  bots: [
    {
      name: "قیمت لحظه‌ای طلا",
      id: "what_my_price_bot",
      category: "info",
      icon: "coins",
    },
    {
      name: "طالع بینی",
      id: "my_persian_fortune_telling_bot",
      category: "culture",
      icon: "fortune",
    },
    {
      name: "یادگیری زبان",
      id: "my_english_persian_learner_bot",
      category: "info",
      icon: "graduation",
    },
    {
      name: "شعر فارسی",
      id: "my_persian_poem_bot",
      category: "culture",
      icon: "poem",
    },
    {
      name: "تقویم شمسی",
      id: "my_persian_date_bot",
      category: "info",
      icon: "calendar",
    },
    {
      name: "آب و هوا",
      id: "what_my_weather_bot",
      category: "info",
      icon: "cloud-sun",
    },
    {
      name: "مبدل واحد",
      id: "my_unit_convert_bot",
      category: "tools",
      icon: "convert-units",
    },
    {
      name: "تغییر فونت",
      id: "my_font_changer_bot",
      category: "tools",
      icon: "text-format",
    },
    {
      name: "پیام ناشناس",
      id: "my_unknown_message_bot",
      category: "tools",
      icon: "ghost-message",
    },
  ],
  channels: [
    {
      name: "میم خنده‌دار",
      id: "griphin_meme",
      category: "lifestyle",
      icon: "meme",
    },
    {
      name: "پرامپ هوش مصنوعی",
      id: "griphin_prompt",
      category: "tech",
      icon: "prompt",
    },
    {
      name: "پروکسی تلگرام",
      id: "griphin_proxy",
      category: "tech",
      icon: "shield-lock",
    },
    {
      name: "شعر فارسی",
      id: "griphin_poem",
      category: "lifestyle",
      icon: "poem",
    },
    {
      name: "اخبار تکنولوژی",
      id: "karam97_dev",
      category: "tech",
      icon: "terminal",
    },
    {
      name: "سفرنامه",
      id: "karamtravel",
      category: "lifestyle",
      icon: "plane",
    },
  ],
  sites: [
    {
      name: "آی ترفند",
      description: "ترفندهای کاربردی حوضه تکنولوژی",
      icon: "/assets/icons/sites/09.png",
      id: "https://tarfand.mhkarami97.ir",
      category: "tech",
    },
    {
      name: "وبلاگ",
      description: "وبلاگ روزمرگی‌های برنامه‌نویسی",
      icon: "/assets/icons/sites/12.png",
      id: "https://blog.mhkarami97.ir",
      category: "tech",
    },
    {
      name: "کتابخانه",
      description: "کتاب‌های خوانده شده",
      icon: "/assets/icons/sites/03.png",
      id: "https://book.mhkarami97.ir",
      category: "culture",
    },
    {
      name: "فیلم‌خانه",
      description: "فیلم‌های دیده شده",
      icon: "/assets/icons/sites/05.png",
      id: "https://video.mhkarami97.ir",
      category: "culture",
    },
    {
      name: "سفرنامه",
      description: "سفرهای رفته",
      icon: "/assets/icons/sites/06.png",
      id: "https://travel.mhkarami97.ir",
      category: "travel",
    },
    {
      name: "کلیپ",
      description: "کلیپ سفرهای رفته شده",
      icon: "/assets/icons/sites/31.png",
      id: "https://trip.mhkarami97.ir",
      category: "travel",
    },
    {
      name: "شعر‌خانه",
      description: "شعرهای خوانده شده",
      icon: "/assets/icons/sites/11.png",
      id: "https://poem.mhkarami97.ir",
      category: "culture",
    },
    {
      name: "فوت‌و‌فن",
      description: "نکات کاربردی",
      icon: "/assets/icons/sites/16.png",
      id: "https://trick.mhkarami97.ir",
      category: "tech",
    },
    {
      name: "جملات انگیزشی",
      description: "جملات انگیزشی بزرگان",
      icon: "/assets/icons/sites/13.png",
      id: "https://sentence.mhkarami97.ir",
      category: "culture",
    },
    {
      name: "لینکدونی",
      description: "لینک سایت‌های کاربردی",
      icon: "/assets/icons/sites/02.png",
      id: "https://link.mhkarami97.ir",
      category: "tech",
    },
    {
      name: "ایونت",
      description: "ایونت‌های طبیعت‌گردی",
      icon: "/assets/icons/sites/14.png",
      id: "https://event.mhkarami97.ir",
      category: "travel",
    },
    {
      name: "فیلم آموزشی",
      description: "فیلم آموزش",
      icon: "/assets/icons/sites/04.png",
      id: "https://film.mhkarami97.ir",
      category: "learning",
    },
    {
      name: "تجربه",
      description: "تجربه",
      icon: "/assets/icons/sites/17.png",
      id: "https://experience.mhkarami97.ir",
      category: "learning",
    },
    {
      name: "کلاس",
      description: "کلاس درس",
      icon: "/assets/icons/sites/07.png",
      id: "https://learn.mhkarami97.ir",
      category: "learning",
    },
    {
      name: "دیکشنری",
      description: "لغات کاربردی",
      icon: "/assets/icons/sites/18.png",
      id: "https://dictionary.mhkarami97.ir",
      category: "learning",
    },
    {
      name: "الگوریتم",
      description: "سوالات الگوریتمی",
      icon: "/assets/icons/sites/20.png",
      id: "https://algorithm.mhkarami97.ir",
      category: "tech",
    },
    {
      name: "لایف لیست",
      description: "لایف لیست",
      icon: "/assets/icons/sites/22.png",
      id: "https://list.mhkarami97.ir",
      category: "knowledge",
    },
    {
      name: "پرامپ",
      description: "لیست پرامپت",
      icon: "/assets/icons/sites/23.png",
      id: "https://prompt.mhkarami97.ir",
      category: "tech",
    },
    {
      name: "تاریخ",
      description: "اتفاقات تاریخی",
      icon: "/assets/icons/sites/24.png",
      id: "https://date.mhkarami97.ir",
      category: "knowledge",
    },
    {
      name: "آموزش",
      description: "محتوای آموزشی",
      icon: "/assets/icons/sites/26.png",
      id: "https://teach.mhkarami97.ir",
      category: "learning",
    },
    {
      name: "اقتصاد",
      description: "اقتصاد به زبان ساده",
      icon: "/assets/icons/sites/29.png",
      id: "https://economy.mhkarami97.ir",
      category: "knowledge",
    },
    {
      name: "سیاست",
      description: "سیاست به زبان ساده",
      icon: "/assets/icons/sites/27.png",
      id: "https://politic.mhkarami97.ir",
      category: "knowledge",
    },
    {
      name: "علمی",
      description: "علم به زبان ساده",
      icon: "/assets/icons/sites/30.png",
      id: "https://science.mhkarami97.ir",
      category: "knowledge",
    },
    {
      name: "روانشناسی",
      description: "مطالب حوزه انسانی",
      icon: "/assets/icons/sites/28.png",
      id: "https://person.mhkarami97.ir",
      category: "knowledge",
    },
  ],
});

// Categories with modern SVG icons
const toolCategories = Object.freeze([
  { key: "daily", label: "ابزار روزمره", iconKey: "cat-daily" },
  { key: "productivity", label: "بهره‌وری و زمان", iconKey: "cat-productivity" },
  { key: "home", label: "خانه و سلامت", iconKey: "cat-home" },
  { key: "learning", label: "یادگیری", iconKey: "cat-learning" },
  { key: "finance", label: "مالی", iconKey: "cat-finance" },
  { key: "text", label: "متن", iconKey: "cat-text" },
  { key: "media", label: "تصویر و صدا", iconKey: "cat-media" },
  { key: "security", label: "امنیت و رمزنگاری", iconKey: "cat-security" },
  { key: "project", label: "مدیریت پروژه", iconKey: "cat-project" },
  { key: "dev", label: "ابزار توسعه‌دهنده", iconKey: "cat-dev" },
  { key: "emergency", label: "شبکه و اضطراری", iconKey: "cat-emergency" },
]);

const CATEGORY_DEFS = Object.freeze({
  tools: toolCategories,
  apps: [
    { key: "tools", label: "ابزار و بهره‌وری", iconKey: "cat-dev" },
    { key: "time", label: "زمان و تقویم", iconKey: "cat-productivity" },
    { key: "finance", label: "مالی و خرید", iconKey: "cat-finance" },
    { key: "health", label: "سلامت و ورزش", iconKey: "cat-home" },
    { key: "travel", label: "سفر و خودرو", iconKey: "cat-daily" },
    { key: "motorsport", label: "موتوراسپرت", iconKey: "cat-emergency" },
    { key: "culture", label: "ادبیات و هنر", iconKey: "cat-media" },
    { key: "business", label: "کسب‌و‌کار", iconKey: "cat-project" },
    { key: "games", label: "بازی و سرگرمی", iconKey: "cat-learning" },
  ],
  bots: [
    { key: "info", label: "اطلاعات و آموزش", iconKey: "cat-learning" },
    { key: "tools", label: "ابزار کاربردی", iconKey: "cat-dev" },
    { key: "culture", label: "ادبیات و سرگرمی", iconKey: "cat-media" },
  ],
  channels: [
    { key: "tech", label: "فناوری و هوش مصنوعی", iconKey: "cat-dev" },
    { key: "lifestyle", label: "سبک زندگی و سرگرمی", iconKey: "cat-daily" },
  ],
  sites: [
    { key: "tech", label: "تکنولوژی و برنامه‌نویسی", iconKey: "cat-dev" },
    { key: "culture", label: "فرهنگ و هنر", iconKey: "cat-media" },
    { key: "travel", label: "سفر و طبیعت", iconKey: "cat-daily" },
    { key: "learning", label: "آموزش و مهارت", iconKey: "cat-learning" },
    { key: "knowledge", label: "دانش و علوم", iconKey: "cat-project" },
  ],
});

// SVG Icons Dictionary
const SVG_ICONS = Object.freeze({
  // Tool Specific Icons
  "car": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M5 17h10"/></svg>',
  "tag": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/></svg>',
  "story-map": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  "planning-poker": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="18" x="5" y="3" rx="2"/><path d="M12 7l1.5 2.5L16 10l-2 2 .5 3-2.5-1.5L9.5 15l.5-3-2-2 2.5-.5z"/></svg>',
  "canvas": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
  "plant": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-9"/><path d="M12 13c-4.5 0-8-3.5-8-8 4.5 0 8 3.5 8 8Z"/><path d="M12 9c4.5 0 8-3.5 8-8-4.5 0-8 3.5-8 8Z"/></svg>',
  "calculator": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01M12 10h.01M8 10h.01M12 14h.01M8 14h.01M12 18h.01M8 18h.01"/></svg>',
  "mic": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>',
  "survival": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 12-8.5 8.5a2.12 2.12 0 1 1-3-3L11 9"/><path d="M15 13 9 7l4-4 6 6h3l-3 3"/></svg>',
  "globe-check": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/><path d="M12 2a14.5 14.5 0 0 0 0 20M2 12h20"/></svg>',
  "shield-alert": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
  "moon-stars": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4M21 5h-4"/></svg>',
  "terminal": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>',
  "key": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3"/></svg>',
  "license-plate": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="5" cy="9" r="1"/><circle cx="19" cy="9" r="1"/><path d="M8 12h8"/></svg>',
  "cloud-sun": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M15.95 9.5a5 5 0 0 0-6.45 2.5A4 4 0 0 0 5 16a4 4 0 0 0 4 4h10a4 4 0 0 0 .95-7.88 5 5 0 0 0-3.95-2.62z"/></svg>',
  "compress-img": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/><path d="m4 4 4 4M20 20l-4-4"/></svg>',
  "qr": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/></svg>',
  "palette": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.24-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9z"/></svg>',
  "braces": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>',
  "edit-pen": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
  "file-text": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/></svg>',
  "hash-counter": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>',
  "text-format": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>',
  "compare": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>',
  "binary-lock": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>',
  "key-round": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/></svg>',
  "shield-lock": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><rect width="8" height="6" x="8" y="10" rx="1"/><path d="M10 10V8a2 2 0 0 1 4 0v2"/></svg>',
  "convert-units": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/></svg>',
  "coins": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h2M7 10h2"/></svg>',
  "clock": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  "timer": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
  "hourglass": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/></svg>',
  "calendar": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
  "note": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v5h5"/></svg>',
  "checklist": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
  "target": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  "split-costs": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  "credit-card": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  "wallet": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>',
  "pill": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>',
  "badge-check": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
  "home": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  "plane": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
  "regex": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><path d="M11 8v6M8 11h6M9 9l4 4M13 9l-4 4"/></svg>',
  "info-image": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="12" cy="12" r="4"/><line x1="12" x2="12.01" y1="12" y2="12"/><line x1="12" x2="12" y1="9" y2="10"/></svg>',
  "stamp": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9.354a4 4 0 1 0 0 5.292"/></svg>',
  "sparkle-grid": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 8v8M8 12h8"/></svg>',
  "clock-cog": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 15 15"/><path d="M12 2v2M12 20v2"/></svg>',
  "line-chart": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
  "graduation": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  "keyboard": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>',
  "brain-network": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m7 7 3.5 3.5M17 7l-3.5 3.5M7 17l3.5-3.5M17 17l-3.5-3.5"/></svg>',
  "metronome": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 7 18H5z"/><path d="m12 10 4-6"/></svg>',
  "fortune": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
  "poem": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h6"/></svg>',
  "ghost-message": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10h.01M15 10h.01M12 2a8 8 0 0 0-8 8v12l3-2 2.5 2 2.5-2 2.5 2 2.5-2 3 2V10a8 8 0 0 0-8-8z"/></svg>',
  "meme": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>',
  "prompt": '<svg class="tool-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m8 9 3 3-3 3M13 15h3"/></svg>',

  // Tabs SVG Icons
  "tab-tools": '<svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  "tab-apps": '<svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>',
  "tab-bots": '<svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="12" x="3" y="6" rx="2"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M12 2v4M2 12h1M21 12h1"/></svg>',
  "tab-channels": '<svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5-5 18-4-6-9-7z"/></svg>',
  "tab-sites": '<svg class="tab-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',

  // Category Badge SVG Icons
  "cat-daily": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
  "cat-productivity": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  "cat-home": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  "cat-learning": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  "cat-finance": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>',
  "cat-text": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>',
  "cat-media": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>',
  "cat-security": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  "cat-project": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>',
  "cat-dev": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  "cat-emergency": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
  "chevron-left": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
  "external-link": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/></svg>',
});

class ListBrowser {
  static #categories = Object.freeze([
    { key: "tools", label: "ابزارها", iconKey: "tab-tools" },
    { key: "apps", label: "اپلیکیشن‌ها", iconKey: "tab-apps" },
    { key: "bots", label: "ربات‌ها", iconKey: "tab-bots" },
    { key: "channels", label: "کانال‌ها", iconKey: "tab-channels" },
    { key: "sites", label: "سایت‌ها", iconKey: "tab-sites" },
  ]);

  static #externalBuilders = Object.freeze({
    apps: { url: (id) => `https://cafebazaar.ir/app/${id}`, label: (id) => id },
    bots: { url: (id) => `https://t.me/${id}`, label: (id) => `@${id}` },
    channels: { url: (id) => `https://t.me/${id}`, label: (id) => `@${id}` },
    sites: { url: (id) => id, label: (item) => item.description },
  });

  static #groupDefs = new Map(
    Object.entries(CATEGORY_DEFS).map(([tabKey, list]) => [
      tabKey,
      new Map(list.map((c, index) => [c.key, { ...c, order: index }])),
    ]),
  );

  static #persianChars = Object.freeze({ "ي": "ی", "ك": "ک", "\u200c": " " });

  #entriesByKey = new Map();
  #activeKey = "tools";
  #viewMode = "grid"; // 'grid' | 'list'
  #visible = [];
  #query = "";
  #dom;

  constructor(toolItems, externalData) {
    this.#entriesByKey.set("tools", this.#buildToolEntries(toolItems));
    for (const key of Object.keys(ListBrowser.#externalBuilders)) {
      this.#entriesByKey.set(
        key,
        this.#buildExternalEntries(key, externalData[key]),
      );
    }
  }

  init() {
    this.#dom = {
      list: document.getElementById("toolsList"),
      noResults: document.getElementById("noResults"),
      total: document.getElementById("totalCount"),
      filtered: document.getElementById("filteredInfo"),
      search: document.getElementById("searchInput"),
      searchClear: document.getElementById("searchClearBtn"),
      resetSearch: document.getElementById("resetSearchBtn"),
      tabs: document.getElementById("tabs"),
      viewToggle: document.getElementById("viewToggleBtn"),
      bottomNav: document.getElementById("mobileBottomNav"),
    };

    this.#initViewMode();
    this.#renderTabs();
    this.#bindEvents();
    this.#activate(this.#readHash());
  }

  #initViewMode() {
    const saved = localStorage.getItem("tools_view_mode");
    this.#viewMode = saved === "list" ? "list" : "grid";
    this.#applyViewMode();
  }

  #applyViewMode() {
    const isGrid = this.#viewMode === "grid";
    this.#dom.list.classList.toggle("view-grid", isGrid);
    this.#dom.list.classList.toggle("view-list", !isGrid);

    const iconGrid = this.#dom.viewToggle?.querySelector(".icon-grid");
    const iconList = this.#dom.viewToggle?.querySelector(".icon-list");
    if (iconGrid && iconList) {
      iconGrid.classList.toggle("hidden", isGrid);
      iconList.classList.toggle("hidden", !isGrid);
    }

    // Sync with settings segmented control
    const viewSeg = document.getElementById("viewSegmented");
    if (viewSeg) {
      for (const btn of viewSeg.children) {
        btn.classList.toggle("active", btn.dataset.viewVal === this.#viewMode);
      }
    }
  }

  toggleViewMode(forcedMode) {
    this.#viewMode = forcedMode || (this.#viewMode === "grid" ? "list" : "grid");
    localStorage.setItem("tools_view_mode", this.#viewMode);
    this.#applyViewMode();
    if (this.#dom.list) {
      this.#dom.list.classList.remove("tab-transition");
      void this.#dom.list.offsetWidth;
      this.#dom.list.classList.add("tab-transition");
    }
    if (navigator.vibrate) navigator.vibrate(10);
  }

  #buildToolEntries(items) {
    return [...items]
      .sort((a, b) =>
        ListBrowser.#compareByGroup("tools", a, b, a.faName, b.faName),
      )
      .map((t) => ({
        group: t.category,
        name: t.faName,
        enName: t.enName,
        desc: t.faDesc,
        enDesc: t.enDesc,
        href: `/${t.path}/`,
        icon: t.icon,
        category: t.category,
        external: false,
        searchIndex: ListBrowser.#normalize(
          `${t.faName} ${t.enName} ${t.faDesc} ${t.enDesc} ${t.category}`,
        ),
      }));
  }

  #buildExternalEntries(tabKey, items) {
    const builder = ListBrowser.#externalBuilders[tabKey];
    return [...items]
      .sort((a, b) =>
        ListBrowser.#compareByGroup(tabKey, a, b, a.name, a.name),
      )
      .map((item) => {
        const url = builder.url(item.id);
        const label = builder.label(tabKey === "sites" ? item : item.id);
        const desc = item.description || label;
        return {
          group: item.category,
          name: item.name,
          enName: item.id || "",
          desc: desc,
          enDesc: label,
          href: url,
          icon: item.icon,
          category: item.category,
          external: true,
          telegramId: tabKey === "bots" || tabKey === "channels" ? item.id : null,
          searchIndex: ListBrowser.#normalize(
            `${item.name} ${item.id} ${desc} ${item.category}`,
          ),
        };
      });
  }

  static #compareByGroup(tabKey, a, b, nameA, nameB) {
    const groups = ListBrowser.#groupDefs.get(tabKey);
    const orderA = groups.get(a.category)?.order ?? 999;
    const orderB = groups.get(b.category)?.order ?? 999;
    return orderA !== orderB
      ? orderA - orderB
      : nameA.localeCompare(nameB, "fa");
  }

  static #normalize(text) {
    let result = text.toLowerCase();
    for (const [find, replace] of Object.entries(ListBrowser.#persianChars)) {
      result = result.replaceAll(find, replace);
    }
    return result.trim();
  }

  static #escape(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  }

  #bindEvents() {
    this.#dom.search.addEventListener("input", (e) => {
      this.#query = ListBrowser.#normalize(e.target.value);
      this.#dom.searchClear?.classList.toggle("hidden", !e.target.value);
      this.#filterAndRender();
    });

    this.#dom.search.addEventListener("focus", () => {
      document.getElementById("navSearchBtn")?.classList.add("active");
    });

    this.#dom.search.addEventListener("blur", () => {
      document.getElementById("navSearchBtn")?.classList.remove("active");
      this.#updateBottomNav(this.#activeKey);
    });

    this.#dom.searchClear?.addEventListener("click", () => {
      this.#dom.search.value = "";
      this.#dom.searchClear.classList.add("hidden");
      this.#query = "";
      this.#dom.search.focus();
      this.#filterAndRender();
    });

    this.#dom.resetSearch?.addEventListener("click", () => {
      this.#dom.search.value = "";
      this.#dom.searchClear?.classList.add("hidden");
      this.#query = "";
      this.#activate("tools");
      this.#dom.search.focus();
    });

    // Keyboard shortcuts (Ctrl+K or / to search, Escape to clear)
    window.addEventListener("keydown", (e) => {
      if ((e.key === "/" || (e.ctrlKey && e.key.toLowerCase() === "k")) && document.activeElement !== this.#dom.search) {
        e.preventDefault();
        this.#dom.search.focus();
        this.#dom.search.select();
      } else if (e.key === "Escape" && document.activeElement === this.#dom.search) {
        this.#dom.search.value = "";
        this.#dom.searchClear?.classList.add("hidden");
        this.#query = "";
        this.#dom.search.blur();
        this.#filterAndRender();
      }
    });

    this.#dom.tabs.addEventListener("click", (e) => {
      const tab = e.target.closest(".tab");
      if (!tab) return;
      const key = tab.dataset.category;
      window.location.hash = key;
      this.#activate(key);
      if (navigator.vibrate) navigator.vibrate(8);
    });

    this.#dom.viewToggle?.addEventListener("click", () => {
      this.toggleViewMode();
    });

    // Mobile Bottom Nav clicks
    this.#dom.bottomNav?.addEventListener("click", (e) => {
      const btn = e.target.closest(".bottom-nav-item");
      if (!btn) return;

      if (btn.id === "navToolsBtn") {
        this.#activate("tools");
        window.location.hash = "tools";
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (btn.id === "navAppsBtn") {
        this.#activate("apps");
        window.location.hash = "apps";
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (btn.id === "navSearchBtn") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        setTimeout(() => this.#dom.search.focus(), 200);
      } else if (btn.id === "navSettingsBtn") {
        settingsManager.open();
      }
      if (navigator.vibrate) navigator.vibrate(10);
    });

    window.addEventListener("hashchange", () =>
      this.#activate(this.#readHash()),
    );
  }

  #readHash() {
    const raw = window.location.hash.replace("#", "");
    return this.#entriesByKey.has(raw) ? raw : "tools";
  }

  #activate(key) {
    this.#activeKey = key;
    this.#updateTabs(key);
    this.#updateBottomNav(key);
    this.#filterAndRender();
    if (this.#dom.list) {
      this.#dom.list.classList.remove("tab-transition");
      void this.#dom.list.offsetWidth;
      this.#dom.list.classList.add("tab-transition");
    }
  }

  #renderTabs() {
    this.#dom.tabs.innerHTML = ListBrowser.#categories
      .map(({ key, label, iconKey }) => {
        const svg = SVG_ICONS[iconKey] || "";
        const count = this.#entriesByKey.get(key).length;
        return `
          <button type="button" role="tab" class="tab" data-category="${key}">
            ${svg}
            <span>${label}</span>
            <span class="tab-count">${count}</span>
          </button>`;
      })
      .join("");
  }

  #updateTabs(key) {
    for (const tab of this.#dom.tabs.children) {
      const isActive = tab.dataset.category === key;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive);
    }
  }

  #updateBottomNav(key) {
    const navTools = document.getElementById("navToolsBtn");
    const navApps = document.getElementById("navAppsBtn");
    if (navTools && navApps) {
      navTools.classList.toggle("active", key === "tools");
      navApps.classList.toggle("active", key === "apps");
    }
  }

  #filterAndRender() {
    const entries = this.#entriesByKey.get(this.#activeKey);
    this.#visible = this.#query
      ? entries.filter((e) => e.searchIndex.includes(this.#query))
      : entries;
    this.#render(entries.length);
  }

  #createIconHtml(iconIdentifier, categoryKey) {
    if (typeof iconIdentifier === "string" && (iconIdentifier.endsWith(".png") || iconIdentifier.startsWith("/"))) {
      return `
        <div class="tool-icon-box is-app-img">
          <img src="${iconIdentifier}" alt="icon" loading="lazy" />
        </div>`;
    }

    const catClass = `cat-${categoryKey || "dev"}`;
    const svg = SVG_ICONS[iconIdentifier] || SVG_ICONS["tab-tools"];
    return `
      <div class="tool-icon-box ${catClass}">
        ${svg}
      </div>`;
  }

  #createItemHtml(entry) {
    const esc = ListBrowser.#escape;
    const attrs = entry.external
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    const tg = entry.telegramId ? ` data-tg="${esc(entry.telegramId)}"` : "";
    const groupLabel = ListBrowser.#groupDefs.get(this.#activeKey)?.get(entry.group)?.label || "";

    return `
      <li>
        <a class="link" href="${esc(entry.href)}"${attrs}${tg}>
          <div class="card-top-row">
            ${this.#createIconHtml(entry.icon, entry.group)}
            <span class="badge-tag">${esc(groupLabel)}</span>
          </div>

          <div class="card-body">
            <div class="tool-name-wrap">
              <span class="tool-fa-name">${esc(entry.name)}</span>
              <span class="tool-en-name">${esc(entry.enName)}</span>
            </div>
            <p class="tool-desc">${esc(entry.desc)}</p>
          </div>

          <div class="card-footer">
            <span>${entry.external ? "مشاهده" : "استفاده از ابزار"}</span>
            ${entry.external ? SVG_ICONS["external-link"] : SVG_ICONS["chevron-left"]}
          </div>

          <div class="list-row-tail">
            <span class="badge-tag">${esc(groupLabel)}</span>
            ${entry.external ? SVG_ICONS["external-link"] : SVG_ICONS["chevron-left"]}
          </div>
        </a>
      </li>`;
  }

  #createGroupHtml(groupKey, count) {
    const group = ListBrowser.#groupDefs.get(this.#activeKey)?.get(groupKey);
    const label = group?.label || groupKey;
    const iconSvg = SVG_ICONS[group?.iconKey] || SVG_ICONS["cat-daily"];

    return `
      <li class="category-title">
        <div class="category-icon-wrap">${iconSvg}</div>
        <h2>${label}</h2>
        <span class="category-count">${count}</span>
      </li>`;
  }

  #countByGroup() {
    const counts = new Map();
    for (const entry of this.#visible) {
      counts.set(entry.group, (counts.get(entry.group) ?? 0) + 1);
    }
    return counts;
  }

  #render(totalInCategory) {
    const { list, noResults, total, filtered } = this.#dom;
    const hasItems = this.#visible.length > 0;
    const counts = this.#countByGroup();
    const html = [];
    let currentGroup = null;

    for (const entry of this.#visible) {
      if (entry.group !== currentGroup) {
        currentGroup = entry.group;
        html.push(
          this.#createGroupHtml(currentGroup, counts.get(currentGroup)),
        );
      }
      html.push(this.#createItemHtml(entry));
    }

    noResults.classList.toggle("hidden", hasItems);
    list.innerHTML = html.join("");
    total.textContent = totalInCategory;
    filtered.textContent =
      this.#visible.length < totalInCategory
        ? `نمایش ${this.#visible.length} مورد`
        : "";
  }
}

// =============================================================================
// Theme Controller
// =============================================================================
class ThemeManager {
  static #STORAGE_KEY = "theme";
  #current = "system";

  init() {
    const stored = localStorage.getItem(ThemeManager.#STORAGE_KEY);
    this.#current = stored || "system";
    this.apply(this.#current);

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (this.#current === "system") {
          this.#applyResolved(e.matches ? "dark" : "light");
        }
      });

    // Header Toggle Click
    document.getElementById("themeToggle")?.addEventListener("click", () => {
      const resolved = this.getResolvedTheme();
      const next = resolved === "dark" ? "light" : "dark";
      this.apply(next);
      if (navigator.vibrate) navigator.vibrate(8);
    });

    // Segmented Buttons inside Settings
    const themeSeg = document.getElementById("themeSegmented");
    themeSeg?.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      this.apply(btn.dataset.themeVal);
      if (navigator.vibrate) navigator.vibrate(8);
    });
  }

  getResolvedTheme() {
    if (this.#current === "dark" || this.#current === "light") {
      return this.#current;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  apply(mode) {
    this.#current = mode;
    if (mode === "system") {
      localStorage.removeItem(ThemeManager.#STORAGE_KEY);
      this.#applyResolved(
        window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      );
    } else {
      localStorage.setItem(ThemeManager.#STORAGE_KEY, mode);
      this.#applyResolved(mode);
    }

    // Update settings buttons
    const themeSeg = document.getElementById("themeSegmented");
    if (themeSeg) {
      for (const btn of themeSeg.children) {
        btn.classList.toggle("active", btn.dataset.themeVal === mode);
      }
    }
  }

  #applyResolved(theme) {
    document.body.setAttribute("data-theme", theme);
    const moon = document.querySelector("#themeToggle .icon-moon");
    const sun = document.querySelector("#themeToggle .icon-sun");
    if (moon && sun) {
      moon.classList.toggle("hidden", theme !== "dark");
      sun.classList.toggle("hidden", theme === "dark");
    }
  }
}

// =============================================================================
// Settings Modal Controller
// =============================================================================
class SettingsModalManager {
  #modal;
  #backdrop;
  #closeBtn;
  #browserRef;

  init(browser) {
    this.#browserRef = browser;
    this.#modal = document.getElementById("settingsModal");
    this.#backdrop = document.getElementById("settingsBackdrop");
    this.#closeBtn = document.getElementById("closeSettingsBtn");

    document.getElementById("openSettingsBtn")?.addEventListener("click", () => this.open("general"));
    document.getElementById("headerVersionTag")?.addEventListener("click", () => this.open("changelog"));
    this.#closeBtn?.addEventListener("click", () => this.close());
    this.#backdrop?.addEventListener("click", () => this.close());

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.#modal.hidden) {
        this.close();
      }
    });

    // Settings Tab Switching
    const tabBtns = this.#modal.querySelectorAll(".settings-tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        this.switchTab(btn.dataset.settingsTab);
        if (navigator.vibrate) navigator.vibrate(8);
      });
    });

    // View segmented buttons inside Settings
    document.getElementById("viewSegmented")?.addEventListener("click", (e) => {
      const btn = e.target.closest(".seg-btn");
      if (!btn) return;
      this.#browserRef.toggleViewMode(btn.dataset.viewVal);
    });

    // Check updates button
    document.getElementById("checkUpdatesBtn")?.addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      btn.classList.add("loading");
      btn.querySelector("span").textContent = "در حال بررسی...";

      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update();
          }
        }
      } catch (err) {
        console.log("Update check error:", err);
      }

      setTimeout(() => {
        btn.classList.remove("loading");
        btn.querySelector("span").textContent = "به‌روز است";
        setTimeout(() => {
          btn.querySelector("span").textContent = "بررسی آپدیت";
        }, 2500);
      }, 1200);
    });

    // Clear cache button
    document.getElementById("clearCacheBtn")?.addEventListener("click", async () => {
      if (confirm("آیا از پاکسازی حافظه کش و بارگذاری مجدد برنامه اطمینان دارید؟")) {
        try {
          if ("caches" in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
          localStorage.clear();
          window.location.reload(true);
        } catch (e) {
          window.location.reload();
        }
      }
    });

    this.#renderChangelog();
  }

  open(initialTab = "general") {
    this.switchTab(initialTab);
    this.#modal.hidden = false;
    requestAnimationFrame(() => this.#modal.classList.add("active"));
    document.body.style.overflow = "hidden";
  }

  switchTab(tabKey) {
    const tabBtns = this.#modal.querySelectorAll(".settings-tab-btn");
    tabBtns.forEach((b) => {
      const isMatch = b.dataset.settingsTab === tabKey;
      b.classList.toggle("active", isMatch);
      b.setAttribute("aria-selected", isMatch);
    });

    const panes = [
      { id: "paneSettingsGeneral", key: "general" },
      { id: "paneSettingsChangelog", key: "changelog" },
      { id: "paneSettingsAbout", key: "about" },
    ];

    panes.forEach(({ id, key }) => {
      const pane = document.getElementById(id);
      if (!pane) return;
      const isMatch = key === tabKey;
      pane.classList.toggle("hidden", !isMatch);
      if (isMatch) {
        pane.classList.remove("tab-transition");
        void pane.offsetWidth;
        pane.classList.add("tab-transition");
      }
    });
  }

  close() {
    this.#modal.classList.remove("active");
    setTimeout(() => {
      this.#modal.hidden = true;
      document.body.style.overflow = "";
    }, 250);
  }

  #renderChangelog() {
    const container = document.getElementById("changelogContainer");
    if (!container || !window.APP_CHANGELOG) return;

    container.innerHTML = window.APP_CHANGELOG.map((item) => {
      const currentBadge = item.isCurrent ? '<span class="current-badge">نسخه کنونی</span>' : '';
      const bullets = item.highlights.map((h) => `<li>${h}</li>`).join("");
      return `
        <div class="changelog-item ${item.isCurrent ? 'is-current' : ''}">
          <div class="changelog-head">
            <div class="changelog-ver">
              <span>نسخه ${item.version}</span>
              ${currentBadge}
            </div>
            <span class="changelog-date">${item.date}</span>
          </div>
          <div class="changelog-title">${item.title}</div>
          <ul class="changelog-bullets">
            ${bullets}
          </ul>
        </div>`;
    }).join("");
  }
}

// Initialize System
const appBrowser = new ListBrowser(tools, LIST_DATA);
appBrowser.init();

const themeManager = new ThemeManager();
themeManager.init();

const settingsManager = new SettingsModalManager();
settingsManager.init(appBrowser);
