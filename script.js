const tools = [
  {
    path: "story-map",
    category: "project",
    faName: "نقشه داستان",
    enName: "Story Map",
    faDesc: "ساخت نقشه داستان برای پروژه‌ها",
    enDesc: "Create story maps for projects",
    icon: "🗂️",
  },
  {
    path: "planning-poker",
    category: "project",
    faName: "پوکر برنامه‌ریزی",
    enName: "Planning Poker",
    faDesc: "ابزار تخمین زمان و تلاش پروژه‌ها",
    enDesc: "Estimate project time and effort",
    icon: "🃏",
  },
  {
    path: "opportunity-canvas",
    category: "project",
    faName: "بوم فرصت",
    enName: "Opportunity Canvas",
    faDesc: "ابزار تحلیل فرصت‌ها و ایده‌ها",
    enDesc: "Tool for analyzing opportunities and ideas",
    icon: "📊",
  },
  {
    path: "planet",
    category: "home",
    faName: "مراقبت از گیاهان",
    enName: "Plant Care",
    faDesc: "راهنمای مراقبت از گیاهان خانگی",
    enDesc: "Guide to caring for houseplants",
    icon: "🌿",
  },
  {
    path: "calculator",
    category: "daily",
    faName: "ماشین حساب",
    enName: "Calculator",
    faDesc: "ماشین حساب ساده و پیشرفته",
    enDesc: "Simple and advanced calculator",
    icon: "🧮",
  },
  {
    path: "voice-change",
    category: "media",
    faName: "تغییر صدا",
    enName: "Voice Changer",
    faDesc: "تغییر صدای ضبط شده",
    enDesc: "Change recorded voice",
    icon: "🎤",
  },
  {
    path: "survival",
    category: "emergency",
    faName: "کیت بقا",
    enName: "Survival Kit",
    faDesc: "محاسبه نیازهای بقا در شرایط اضطراری",
    enDesc: "Calculate survival needs in emergencies",
    icon: "🧰",
  },
  {
    path: "site-checker",
    category: "emergency",
    faName: "بررسی مسدود بودن سایت",
    enName: "Site Block Checker",
    faDesc: "بررسی مسدود بودن سایت‌ها در اینترنت",
    enDesc: "Check if websites are blocked on the internet",
    icon: "🌐",
  },
  {
    path: "safe-zone-map",
    category: "emergency",
    faName: "نقاط امن",
    enName: "Safe Zone Map",
    faDesc: "ثبت و مشاهده نقاط امن در بلایای طبیعی",
    enDesc: "Register and view safe zones during natural disasters",
    icon: "🆘",
  },
  {
    path: "event-logger",
    category: "dev",
    faName: "لاگ رویدادها",
    enName: "Event Logger",
    faDesc: "ثبت و نمایش رویدادها",
    enDesc: "Log and display events",
    icon: "📝",
  },
  {
    path: "cryptography",
    category: "security",
    faName: "رمزنگاری متن",
    enName: "Cryptography",
    faDesc: "رمزنگاری متن با کلید خصوصی",
    enDesc: "Cryptography text",
    icon: "💀",
  },
  {
    path: "bluethooth-killer",
    category: "emergency",
    faName: "قطع کردن بلوتوث",
    enName: "bluethooth Killer",
    faDesc: "قطع کردن دستگاه‌های بلوتوث اطراف مثل اسپیکرها",
    enDesc: "kill bluethooth devices nearby",
    icon: "📶",
  },
  {
    path: "license-plate",
    category: "daily",
    faName: "پلاک و شماره تلفن استانها",
    enName: "LicensePlate",
    faDesc: "نمایش جزئیات پلاک و شماره تلفن استانها",
    enDesc: "Show details of license plates and phone numbers of provinces",
    icon: "🚗",
  },
  {
    path: "weather",
    category: "daily",
    faName: "وضعیت هوا",
    enName: "Weather",
    faDesc: "نمایش وضعیت آب و هوای امروز",
    enDesc: "Show today's weather",
    icon: "🌤️",
  },
  {
    path: "compress",
    category: "media",
    faName: "فشرده‌ساز تصویر",
    enName: "Image Compressor",
    faDesc: "فشرده‌سازی تصاویر در مرورگر",
    enDesc: "Compress images in browser",
    icon: "🗜️",
  },
  {
    path: "compress-file",
    category: "dev",
    faName: "فشرده‌ساز فایل",
    enName: "File Compressor",
    faDesc: "فشرده‌سازی HTML, CSS, JS",
    enDesc: "Compress HTML, CSS, JS files",
    icon: "📦",
  },
  {
    path: "qr",
    category: "daily",
    faName: "کیوآر کد",
    enName: "QR Code",
    faDesc: "ساخت و خواندن کد QR",
    enDesc: "Generate and read QR codes",
    icon: "📱",
  },
  {
    path: "color",
    category: "media",
    faName: "پالت رنگ",
    enName: "Color Palette",
    faDesc: "ژنراتور پالت رنگ هماهنگ",
    enDesc: "Harmonious color palette generator",
    icon: "🎨",
  },
  {
    path: "json",
    category: "dev",
    faName: "JSON",
    enName: "JSON Formatter",
    faDesc: "فرمت و اعتبارسنجی JSON",
    enDesc: "Format and validate JSON",
    icon: "📋",
  },
  {
    path: "editor",
    category: "text",
    faName: "ویرایشگر متن",
    enName: "Text Editor",
    faDesc: "ویرایشگر متن پیشرفته",
    enDesc: "Advanced text editor",
    icon: "📝",
  },
  {
    path: "text",
    category: "text",
    faName: "ژنراتور متن",
    enName: "Text Generator",
    faDesc: "تولید محتوای متنی",
    enDesc: "Generate text content",
    icon: "✍️",
  },
  {
    path: "text-counter",
    category: "text",
    faName: "شمارنده متن",
    enName: "Text Counter",
    faDesc: "شمارش کلمات و کاراکترها",
    enDesc: "Count words and characters",
    icon: "🔢",
  },
  {
    path: "text-formatter",
    category: "text",
    faName: "فرمت‌دهنده متن",
    enName: "Text Formatter",
    faDesc: "فرمت‌دهی و تبدیل متن",
    enDesc: "Format and transform text",
    icon: "📄",
  },
  {
    path: "encoder",
    category: "dev",
    faName: "رمزگذار",
    enName: "Encoder",
    faDesc: "رمزگذاری و رمزگشایی داده",
    enDesc: "Encode and decode data",
    icon: "🔐",
  },
  {
    path: "password",
    category: "security",
    faName: "رمز عبور",
    enName: "Password Generator",
    faDesc: "تولید رمز عبور امن",
    enDesc: "Generate secure passwords",
    icon: "🔑",
  },
  {
    path: "secure-text",
    category: "security",
    faName: "متن امن",
    enName: "Secure Text",
    faDesc: "مدیریت متن‌های امن",
    enDesc: "Manage secure texts",
    icon: "🔒",
  },
  {
    path: "mapper",
    category: "daily",
    faName: "تبدیل واحد",
    enName: "Unit Converter",
    faDesc: "تبدیل واحدهای مختلف",
    enDesc: "Convert various units",
    icon: "🔄",
  },
  {
    path: "currency-conversion-calculator",
    category: "finance",
    faName: "تبدیل ارز",
    enName: "Currency Converter",
    faDesc: "تبدیل ارزهای مختلف",
    enDesc: "Convert currencies",
    icon: "💱",
  },
  {
    path: "time",
    category: "productivity",
    faName: "زمان",
    enName: "Time & Clock",
    faDesc: "ساعت و زمان",
    enDesc: "Clock and time",
    icon: "⏰",
  },
  {
    path: "time-tracker",
    category: "productivity",
    faName: "زمان‌سنج",
    enName: "Time Tracker",
    faDesc: "ردیابی زمان کارها",
    enDesc: "Track time for tasks",
    icon: "⏱️",
  },
  {
    path: "pomodoro-timer",
    category: "productivity",
    faName: "تایمر پومودورو",
    enName: "Pomodoro Timer",
    faDesc: "مدیریت زمان با روش پومودورو",
    enDesc: "Manage time with Pomodoro technique",
    icon: "🍅",
  },
  {
    path: "daily-planner",
    category: "productivity",
    faName: "برنامه‌ریز روزانه",
    enName: "Daily Planner",
    faDesc: "برنامه‌ریزی وظایف روزانه",
    enDesc: "Plan your daily tasks",
    icon: "📆",
  },
  {
    path: "note",
    category: "productivity",
    faName: "یادداشت",
    enName: "Note",
    faDesc: "یادداشت‌برداری سریع",
    enDesc: "Quick note-taking",
    icon: "📓",
  },
  {
    path: "check-list",
    category: "productivity",
    faName: "چک‌لیست",
    enName: "Checklist",
    faDesc: "مدیریت چک‌لیست‌ها",
    enDesc: "Manage checklists",
    icon: "✅",
  },
  {
    path: "habit",
    category: "productivity",
    faName: "ردیاب عادت",
    enName: "Habit Tracker",
    faDesc: "ردیابی عادت‌های روزانه",
    enDesc: "Track daily habits",
    icon: "🎯",
  },
  {
    path: "cost-divider",
    category: "finance",
    faName: "تقسیم هزینه",
    enName: "Cost Divider",
    faDesc: "تقسیم هزینه‌های مشترک",
    enDesc: "Split shared expenses",
    icon: "💰",
  },
  {
    path: "debt",
    category: "finance",
    faName: "مدیریت بدهی",
    enName: "Debt Manager",
    faDesc: "مدیریت بدهی‌ها",
    enDesc: "Manage debts",
    icon: "💳",
  },
  {
    path: "personal-budget-planner",
    category: "finance",
    faName: "بودجه شخصی",
    enName: "Budget Planner",
    faDesc: "برنامه‌ریزی بودجه شخصی",
    enDesc: "Plan personal budget",
    icon: "💵",
  },
  {
    path: "medicine",
    category: "home",
    faName: "مدیریت دارو",
    enName: "Medicine Manager",
    faDesc: "مدیریت داروها",
    enDesc: "Manage medicines",
    icon: "💊",
  },
  {
    path: "warranty-management",
    category: "home",
    faName: "مدیریت گارانتی",
    enName: "Warranty Manager",
    faDesc: "مدیریت گارانتی‌ها",
    enDesc: "Manage warranties",
    icon: "📜",
  },
  {
    path: "home-tracker",
    category: "home",
    faName: "ردیاب خانه",
    enName: "Home Tracker",
    faDesc: "مدیریت اشیاء منزل",
    enDesc: "Manage home objects",
    icon: "🏠",
  },
  {
    path: "travel",
    category: "daily",
    faName: "برنامه سفر",
    enName: "Travel Planner",
    faDesc: "برنامه‌ریزی سفرها",
    enDesc: "Plan your trips",
    icon: "✈️",
  },
  {
    path: "regex",
    category: "dev",
    faName: "رجکس",
    enName: "Regex Tester",
    faDesc: "تست عبارات منظم",
    enDesc: "Test regular expressions",
    icon: "🔍",
  },
  {
    path: "compare",
    category: "dev",
    faName: "مقایسه متن",
    enName: "Text Compare",
    faDesc: "مقایسه متن‌ها",
    enDesc: "Compare texts",
    icon: "🔀",
  },
  {
    path: "meta-data",
    category: "media",
    faName: "متادیتا",
    enName: "Metadata Viewer",
    faDesc: "نمایش متادیتای تصاویر",
    enDesc: "View image metadata",
    icon: "🖼️",
  },
  {
    path: "water-mark",
    category: "media",
    faName: "واترمارک",
    enName: "Watermark",
    faDesc: "افزودن واترمارک به تصاویر",
    enDesc: "Add watermark to images",
    icon: "©️",
  },
  {
    path: "favicon",
    category: "dev",
    faName: "فاویکون",
    enName: "Favicon Generator",
    faDesc: "ساخت فاویکون",
    enDesc: "Generate favicon",
    icon: "🎴",
  },
  {
    path: "cron",
    category: "dev",
    faName: "کران جاب",
    enName: "Cron Job",
    faDesc: "زمان‌بند وظایف",
    enDesc: "Task scheduler",
    icon: "⚙️",
  },
  {
    path: "log-analyzer",
    category: "dev",
    faName: "تحلیل لاگ",
    enName: "Log Analyzer",
    faDesc: "تحلیل فایل‌های لاگ",
    enDesc: "Analyze log files",
    icon: "📊",
  },
  {
    path: "leitner",
    category: "learning",
    faName: "سیستم لایتنر",
    enName: "Leitner System",
    faDesc: "یادگیری با فلش کارت",
    enDesc: "Learn with flashcards",
    icon: "🎓",
  },
  {
    path: "typing",
    category: "learning",
    faName: "تمرین تایپ",
    enName: "Typing Practice",
    faDesc: "بهبود سرعت تایپ",
    enDesc: "Improve typing speed",
    icon: "⌨️",
  },
  {
    path: "mind-map",
    category: "project",
    faName: "نقشه ذهنی",
    enName: "Mind Map",
    faDesc: "ساخت نقشه ذهنی",
    enDesc: "Create mind maps",
    icon: "🧠",
  },
  {
    path: "metronome",
    category: "media",
    faName: "مترونوم",
    enName: "Metronome",
    faDesc: "حفظ ریتم موسیقی",
    enDesc: "Keep musical rhythm",
    icon: "🎵",
  },
];

// Additional lists (Cafe Bazaar apps, Telegram bots and channels)
const LIST_DATA = Object.freeze({
  apps: [
    {
      name: "جعبه ابزار",
      id: "mhk.webtools",
      category: "tools",
      icon: "/icons/app/01.png",
    },
    {
      name: "بدن ساز",
      id: "mhk.sport",
      category: "health",
      icon: "/icons/app/02.png",
    },
    {
      name: "تقویم شمسی",
      id: "mhk.calender",
      category: "time",
      icon: "/icons/app/04.png",
    },
    {
      name: "شیردال مارکت",
      id: "mhk.shirdalmarket",
      category: "finance",
      icon: "/icons/app/05.png",
    },
    {
      name: "مدیریت مالی",
      id: "mhk.finance",
      category: "finance",
      icon: "/icons/app/06.png",
    },
    {
      name: "مدیریت کارها",
      id: "mhk.task",
      category: "tools",
      icon: "/icons/app/07.png",
    },
    {
      name: "چاوشان",
      id: "mhk.chavooshan",
      category: "culture",
      icon: "/icons/app/08.png",
    },
    {
      name: "زلف دوتا",
      id: "mhk.zolfdota",
      category: "culture",
      icon: "/icons/app/09.png",
    },
    {
      name: "دور گردون",
      id: "mhk.dorgardoon",
      category: "culture",
      icon: "/icons/app/10.png",
    },
    {
      name: "چک لیست",
      id: "mhk.checklist",
      category: "tools",
      icon: "/icons/app/11.png",
    },
    {
      name: "ملک ری",
      id: "mhk.molkrey",
      category: "travel",
      icon: "/icons/app/12.png",
    },
    {
      name: "زروان",
      id: "mhk.zoorvan",
      category: "time",
      icon: "/icons/app/13.png",
    },
    {
      name: "زمانک",
      id: "mhk.zamaanak",
      category: "time",
      icon: "/icons/app/14.png",
    },
    {
      name: "هنگام",
      id: "mhk.hengam",
      category: "time",
      icon: "/icons/app/15.png",
    },
    {
      name: "فرمول یک",
      id: "mhk.f1",
      category: "motorsport",
      icon: "/icons/app/16.png",
    },
    {
      name: "موتو جی‌پی",
      id: "mhk.motogp",
      category: "motorsport",
      icon: "/icons/app/18.png",
    },
    {
      name: "شکسته",
      id: "mhk.shekaste",
      category: "culture",
      icon: "/icons/app/17.png",
    },
    {
      name: "خرید‌یار",
      id: "mhk.buy",
      category: "finance",
      icon: "/icons/app/19.png",
    },
    {
      name: "سرویس‌یار",
      id: "mhk.service",
      category: "travel",
      icon: "/icons/app/20.png",
    },
    {
      name: "ماهک",
      id: "mhk.period",
      category: "health",
      icon: "/icons/app/03.png",
    },
    {
      name: "سفربان",
      id: "mhk.safar",
      category: "travel",
      icon: "/icons/app/21.png",
    },
    {
      name: "مدیر‌یار",
      id: "mhk.school",
      category: "tools",
      icon: "/icons/app/22.png",
    },
    {
      name: "نرخ",
      id: "mhk.nerkh",
      category: "finance",
      icon: "/icons/app/23.png",
    },
    {
      name: "جعبه بازی",
      id: "mhk.gamebox",
      category: "games",
      icon: "/icons/game/01.png",
    },
    {
      name: "چیستا",
      id: "mhk.chista",
      category: "games",
      icon: "/icons/game/02.png",
    },
  ],
  bots: [
    {
      name: "قیمت لحظه‌ای طلا",
      id: "what_my_price_bot",
      category: "info",
      icon: "💰",
    },
    {
      name: "طالع بینی",
      id: "my_persian_fortune_telling_bot",
      category: "culture",
      icon: "🔮",
    },
    {
      name: "یادگیری زبان",
      id: "my_english_persian_learner_bot",
      category: "info",
      icon: "🎓",
    },
    {
      name: "شعر فارسی",
      id: "my_persian_poem_bot",
      category: "culture",
      icon: "📜",
    },
    {
      name: "تقویم شمسی",
      id: "my_persian_date_bot",
      category: "info",
      icon: "📅",
    },
    {
      name: "آب و هوا",
      id: "what_my_weather_bot",
      category: "info",
      icon: "🌤️",
    },
    {
      name: "مبدل واحد",
      id: "my_unit_convert_bot",
      category: "tools",
      icon: "🔄",
    },
    {
      name: "تغییر فونت",
      id: "my_font_changer_bot",
      category: "tools",
      icon: "🔤",
    },
    {
      name: "پیام ناشناس",
      id: "my_unknown_message_bot",
      category: "tools",
      icon: "🕵️",
    },
  ],
  channels: [
    {
      name: "میم خنده‌دار",
      id: "griphin_meme",
      category: "lifestyle",
      icon: "😂",
    },
    {
      name: "پرامپ هوش مصنوعی",
      id: "griphin_prompt",
      category: "tech",
      icon: "🤖",
    },
    {
      name: "پروکسی تلگرام",
      id: "griphin_proxy",
      category: "tech",
      icon: "🛡️",
    },
    {
      name: "شعر فارسی",
      id: "griphin_poem",
      category: "lifestyle",
      icon: "📜",
    },
    { name: "اخبار تکنولوژی", id: "karam97_dev", category: "tech", icon: "📰" },
    { name: "سفرنامه", id: "karamtravel", category: "lifestyle", icon: "🧳" },
  ],
});

const toolCategories = Object.freeze([
  { key: "daily", label: "ابزار روزمره", icon: "🧮" },
  { key: "productivity", label: "بهره‌وری و زمان", icon: "⏱️" },
  { key: "home", label: "خانه و سلامت", icon: "🏠" },
  { key: "learning", label: "یادگیری", icon: "🎓" },
  { key: "finance", label: "مالی", icon: "💰" },
  { key: "text", label: "متن", icon: "✍️" },
  { key: "media", label: "تصویر و صدا", icon: "🎨" },    
  { key: "security", label: "امنیت و رمزنگاری", icon: "🔐" },
  { key: "project", label: "مدیریت پروژه", icon: "🗂️" },
  { key: "dev", label: "ابزار توسعه‌دهنده", icon: "🛠️" },
  { key: "emergency", label: "شبکه و شرایط اضطراری", icon: "🆘" },
]);

const CATEGORY_DEFS = Object.freeze({
  tools: toolCategories,
  apps: [
    { key: "tools", label: "ابزار و بهره‌وری", icon: "🧰" },
    { key: "time", label: "زمان و تقویم", icon: "🕰️" },
    { key: "finance", label: "مالی و خرید", icon: "💰" },
    { key: "health", label: "سلامت و ورزش", icon: "💪" },
    { key: "travel", label: "سفر و خودرو", icon: "🚗" },
    { key: "motorsport", label: "موتوراسپرت", icon: "🏁" },
    { key: "culture", label: "ادبیات و موسیقی", icon: "📜" },
    { key: "games", label: "بازی", icon: "🎮" },
  ],
  bots: [
    { key: "info", label: "اطلاعات و آموزش", icon: "📊" },
    { key: "tools", label: "ابزار", icon: "🧰" },
    { key: "culture", label: "ادبیات و سرگرمی", icon: "🎭" },
  ],
  channels: [
    { key: "tech", label: "فناوری و هوش مصنوعی", icon: "💻" },
    { key: "lifestyle", label: "سبک زندگی و سرگرمی", icon: "🎭" },
  ],
});

class ListBrowser {
  static #categories = Object.freeze([
    { key: "tools", label: "ابزارها" },
    { key: "apps", label: "اپلیکیشن‌ها" },
    { key: "bots", label: "ربات‌ها" },
    { key: "channels", label: "کانال‌ها" },
  ]);

  static #externalBuilders = Object.freeze({
    apps: { url: (id) => `https://cafebazaar.ir/app/${id}`, label: (id) => id },
    bots: { url: (id) => `https://t.me/${id}`, label: (id) => `@${id}` },
    channels: { url: (id) => `https://t.me/${id}`, label: (id) => `@${id}` },
  });

  static #groupDefs = new Map(
    Object.entries(CATEGORY_DEFS).map(([tabKey, list]) => [
      tabKey,
      new Map(list.map((c, index) => [c.key, { ...c, order: index }])),
    ]),
  );

  static #persianChars = Object.freeze({ ي: "ی", ك: "ک", "\u200c": " " });

  #entriesByKey = new Map();
  #activeKey = "tools";
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
      tabs: document.getElementById("tabs"),
    };

    this.#renderTabs();
    this.#bindEvents();
    this.#activate(this.#readHash());
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
        external: false,
        searchText: ListBrowser.#normalize(
          `${t.faName} ${t.enName} ${t.faDesc} ${t.enDesc} ${t.path}`,
        ),
      }));
  }

  #buildExternalEntries(key, items) {
    const builder = ListBrowser.#externalBuilders[key];
    return [...items]
      .sort((a, b) => ListBrowser.#compareByGroup(key, a, b, a.name, b.name))
      .map((i) => {
        const label = builder.label(i.id);
        return {
          name: i.name,
          enName: i.name,
          desc: label,
          enDesc: label,
          href: builder.url(i.id),
          icon: i.icon,
          external: true,
          group: i.category,
          searchText: ListBrowser.#normalize(`${i.name} ${i.id}`),
        };
      });
  }

  static #compareByGroup(tabKey, a, b, nameA, nameB) {
    const groups = ListBrowser.#groupDefs.get(tabKey);
    return (
      groups.get(a.category).order - groups.get(b.category).order ||
      nameA.localeCompare(nameB, "fa")
    );
  }

  static #normalize(text) {
    return text
      .replace(/[يك\u200c]/g, (ch) => ListBrowser.#persianChars[ch])
      .toLowerCase()
      .trim();
  }

  static #escape(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  #readHash() {
    const key = location.hash.slice(1);
    return ListBrowser.#categories.some((c) => c.key === key) ? key : "tools";
  }

  #bindEvents() {
    this.#dom.search.addEventListener("input", (e) => {
      this.#query = ListBrowser.#normalize(e.target.value);
      this.#applyFilter();
    });

    this.#dom.tabs.addEventListener("click", (e) => {
      const button = e.target.closest("[data-category]");
      if (button) location.hash = button.dataset.category;
    });

    window.addEventListener("hashchange", () =>
      this.#activate(this.#readHash()),
    );

    document.addEventListener("keydown", (e) => {
      if (e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        this.#dom.search.focus();
      }
    });
  }

  #renderTabs() {
    this.#dom.tabs.innerHTML = ListBrowser.#categories
      .map(
        ({ key, label }) => `
                <button type="button" role="tab" class="tab" data-category="${key}">
                    ${label}<span class="tab-count">${this.#entriesByKey.get(key).length}</span>
                </button>`,
      )
      .join("");
  }

  #activate(key) {
    this.#activeKey = key;
    for (const tab of this.#dom.tabs.children) {
      const isActive = tab.dataset.category === key;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive);
    }
    this.#applyFilter();
  }

  #applyFilter() {
    const entries = this.#entriesByKey.get(this.#activeKey);
    this.#visible = this.#query
      ? entries.filter((e) => e.searchText.includes(this.#query))
      : entries;
    this.#render(entries.length);
  }

  #createIconHtml(icon) {
    const isImage = icon.startsWith("/") || icon.startsWith("http");
    return isImage
      ? `<img src="${ListBrowser.#escape(icon)}" alt="" width="48" height="48" loading="lazy" decoding="async">`
      : icon;
  }

  #createItemHtml(entry) {
    const esc = ListBrowser.#escape;
    const attrs = entry.external
      ? ' target="_blank" rel="noopener noreferrer"'
      : "";
    const dir = entry.external ? ' dir="ltr"' : "";

    return `
            <li>
                <a class="link" href="${esc(entry.href)}"${attrs}>
                    <div class="icon">${this.#createIconHtml(entry.icon)}</div>
                    <div class="content">
                        <div class="lang-section fa">
                            <div class="name">${esc(entry.name)}</div>
                            <div class="desc"${dir}>${esc(entry.desc)}</div>
                        </div>
                        <div class="lang-section en">
                            <div class="name">${esc(entry.enName)}</div>
                            <div class="desc"${dir}>${esc(entry.enDesc)}</div>
                        </div>
                    </div>
                </a>
            </li>`;
  }

  #createGroupHtml(groupKey, count) {
    const { icon, label } = ListBrowser.#groupDefs
      .get(this.#activeKey)
      .get(groupKey);
    return `
            <li class="category-title">
                <span class="category-icon" aria-hidden="true">${icon}</span>
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

new ListBrowser(tools, LIST_DATA).init();

// Theme management
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const body = document.body;

// Load saved theme or use system preference
function loadTheme() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    body.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const theme = prefersDark ? "dark" : "light";
    body.setAttribute("data-theme", theme);
    updateThemeIcon(theme);
  }
}

// Update theme icon based on current theme
function updateThemeIcon(theme) {
  themeIcon.textContent = theme === "dark" ? "🌙" : "☀️";
}

// Toggle theme
function toggleTheme() {
  const currentTheme = body.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  body.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  updateThemeIcon(newTheme);
}

// Event listeners for theme
themeToggle.addEventListener("click", toggleTheme);

// Listen for system theme changes
window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) {
      const theme = e.matches ? "dark" : "light";
      body.setAttribute("data-theme", theme);
      updateThemeIcon(theme);
    }
  });

// Initialize theme
loadTheme();

// PWA Install Prompt
let deferredPrompt;
const installPromptDismissed = localStorage.getItem("installPromptDismissed");

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

// Handle app installation
window.addEventListener("appinstalled", () => {
  console.log("App installed successfully");
  deferredPrompt = null;
});
