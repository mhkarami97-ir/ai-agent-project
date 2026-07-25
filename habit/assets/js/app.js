// Theme Manager
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme();
    }

    applyTheme() {
        document.body.setAttribute('data-theme', this.currentTheme);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this.applyTheme();
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeManager = new ThemeManager();

// I18n System
class I18n {
    constructor() {
        this.translations = {};
        this.currentLang = localStorage.getItem('lang') || 'fa';
        this.loadTranslations();
    }

    async loadTranslations() {
        try {
            const response = await fetch('assets/translations.json');
            this.translations = await response.json();
            this.applyTranslations();
        } catch (error) {
            console.error('Failed to load translations:', error);
        }
    }

    t(key) {
        const keys = key.split('.');
        let value = this.translations[this.currentLang];
        
        for (const k of keys) {
            if (value && value[k]) {
                value = value[k];
            } else {
                return key;
            }
        }
        
        return value;
    }

    applyTranslations() {
        const html = document.documentElement;
        html.setAttribute('lang', this.currentLang);
        html.setAttribute('dir', this.currentLang === 'fa' ? 'rtl' : 'ltr');
        
        // Update all elements with data-i18n
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });
        
        // Update document title
        const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
        if (titleKey) {
            document.title = this.t(titleKey);
        }
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
    }
}

const i18n = new I18n();


const STORAGE_KEY = "habit_tracker_entries";

const defaultChartData = {
  labels: ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"],
  datasets: [
    {
      label: "تکمیل‌های روزانه",
      data: [0, 0, 0, 0, 0, 0, 0],
      backgroundColor: "rgba(99, 102, 241, 0.15)",
      borderColor: "#6366F1",
      borderWidth: 2,
      tension: 0.4,
    },
  ],
};

let habits = [];
let chart;

const form = document.getElementById("habitForm");
const habitList = document.getElementById("habitList");
const totalHabits = document.getElementById("totalHabits");
const weeklyCompletions = document.getElementById("weeklyCompletions");
const bestStreak = document.getElementById("bestStreak");
const reminderCount = document.getElementById("reminderCount");
const habitSummary = document.getElementById("habitSummary");
const reminderFeed = document.getElementById("reminderFeed");

function createHabitId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function getFieldValue(name) {
  const field = form.elements.namedItem(name);
  return field && "value" in field ? field.value.trim() : "";
}

function loadHabits() {
  const saved = localStorage.getItem(STORAGE_KEY);
  habits = saved ? JSON.parse(saved) : [];
}

function persistHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

function trackCompletion(habitId) {
  const today = new Date().getDay();
  const habit = habits.find((item) => item.id === habitId);
  if (!habit) return;

  const dayIndex = mapDayIndex(today);
  habit.histories[dayIndex] = (habit.histories[dayIndex] || 0) + 1;
  habit.streak = Math.max(habit.streak, habit.histories.reduce((a, b) => a + b, 0));

  persistHabits();
  renderHabits();
  updateChart();
}

function mapDayIndex(day) {
  return day === 0 ? 6 : day - 1;
}

function getWeeklySummary() {
  return habits.reduce((summary, habit) => {
    const completions = habit.histories.reduce((a, b) => a + b, 0);
    return summary + completions;
  }, 0);
}

function renderHabits() {
  if (!habits.length) {
    habitSummary.textContent = "هنوز عادت اضافه نشده.";
    habitList.innerHTML = "";
    return;
  }

  habitSummary.textContent = `${habits.length} عادت فعال`;
  habitList.innerHTML = "";

  habits.forEach((habit) => {
    const card = document.createElement("article");
    card.className = "habit-card";

    const topRow = document.createElement("div");
    topRow.className = "habit-card-space";

    const meta = document.createElement("p");
    meta.className = "habit-meta";
    meta.textContent = 
      `هدف روزانه: ${habit.target} · یادآوری: ${habit.reminder || "ثبت نشده"}`;

    const actions = document.createElement("div");
    actions.className = "habit-actions";

    const completeBtn = document.createElement("button");
    completeBtn.className = "primary-btn";
    completeBtn.textContent = "ثبت تکمیل";
    completeBtn.addEventListener("click", () => triggerCompletion(habit.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "secondary-btn";
    deleteBtn.textContent = "حذف";
    deleteBtn.addEventListener("click", () => removeHabit(habit.id));

    const cardTitle = document.createElement("h3");
    cardTitle.textContent = habit.title;

    const cardDesc = document.createElement("p");
    cardDesc.textContent = habit.description;

    topRow.append(cardTitle, actions);
    actions.append(completeBtn, deleteBtn);
    card.append(topRow, meta, cardDesc);

    habitList.append(card);
  });

  updateStats();
}

function updateStats() {
  totalHabits.textContent = habits.length;
  weeklyCompletions.textContent = getWeeklySummary();
  bestStreak.textContent = habits.reduce((max, habit) => Math.max(max, habit.streak), 0);
  reminderCount.textContent = habits.filter((item) => item.reminder).length;
}

function registerHabit(event) {
  event.preventDefault();
  const title = getFieldValue("title");
  if (!title) return;

  const newHabit = {
    id: createHabitId(),
    title,
    description: getFieldValue("description"),
    target: parseInt(getFieldValue("target"), 10) || 1,
    reminder: getFieldValue("reminder"),
    streak: 0,
    histories: Array(7).fill(0),
  };

  habits.push(newHabit);
  persistHabits();
  renderHabits();
  updateChart();
  form.reset();
}

function removeHabit(id) {
  habits = habits.filter((habit) => habit.id !== id);
  persistHabits();
  renderHabits();
  updateChart();
}

function triggerCompletion(id) {
  trackCompletion(id);
  showReminderMessage("تکمیل ثبت شد");
}

function showReminderMessage(message) {
  const note = document.createElement("p");
  note.textContent = message;
  reminderFeed.append(note);
  reminderFeed.scrollTop = reminderFeed.scrollHeight;
  if (reminderFeed.childElementCount > 4) {
    reminderFeed.firstChild.remove();
  }
}

function initChart() {
  const ctx = document.getElementById("progressChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: defaultChartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function updateChart() {
  const aggregated = Array(7).fill(0);
  habits.forEach((habit) => {
    habit.histories.forEach((count, index) => {
      aggregated[index] += count;
    });
  });

  chart.data.datasets[0].data = aggregated;
  chart.update();
}

function scheduleReminders() {
  if (!habits.length) return;

  const now = new Date();
  habits.forEach((habit) => {
    if (!habit.reminder) return;
    const [remHour, remMin] = habit.reminder.split(":").map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(remHour, remMin, 0, 0);

    if (now > reminderTime && now - reminderTime < 1000 * 60) {
      showReminderMessage(`یادآوری ${habit.title} فعال شد`);
    }
  });
}

form.addEventListener("submit", registerHabit);

loadHabits();
renderHabits();
initChart();
updateChart();
scheduleReminders();
setInterval(scheduleReminders, 60 * 1000);
