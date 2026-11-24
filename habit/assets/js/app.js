(() => {
    'use strict';

    const KEYS = Object.freeze({
        habits: 'habit_tracker_v2',
        legacyHabits: 'habit_tracker_entries',
        reminders: 'habit_tracker_reminders_v1'
    });

    const MAX_TARGET = 50;
    const MAX_TITLE = 60;
    const CHART_DAYS = 7;
    const FEED_LIMIT = 5;
    const REMINDER_WINDOW_MS = 10 * 60 * 1000;
    const REMINDER_CHECK_MS = 20 * 1000;
    const TOAST_DURATION_MS = 1800;
    const MAX_STREAK_LOOKBACK_DAYS = 3660;

    /* ---------- Pure logic (no DOM) ---------- */

    class NumberText {
        static parse(text) {
            const digits = { '۰': 0, '۱': 1, '۲': 2, '۳': 3, '۴': 4, '۵': 5, '۶': 6, '۷': 7, '۸': 8, '۹': 9,
                '٠': 0, '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9 };
            const normalized = String(text).replace(/[۰-۹٠-٩]/g, (digit) => digits[digit]).trim();
            return /^\d+$/.test(normalized) ? Number(normalized) : Number.NaN;
        }
    }

    class DayKey {
        /** Local calendar day as "YYYY-MM-DD" (sortable as plain text). */
        static of(date = new Date()) {
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        static toDate(key) {
            const [year, month, day] = key.split('-').map(Number);
            return new Date(year, month - 1, day, 12);
        }

        static addDays(key, days) {
            const date = DayKey.toDate(key);
            date.setDate(date.getDate() + days);
            return DayKey.of(date);
        }

        /** The last `count` days ending at `today`, oldest first. */
        static lastDays(count, today) {
            return Array.from({ length: count }, (_, index) => DayKey.addDays(today, index - (count - 1)));
        }
    }

    class HabitStats {
        static count(habit, day) {
            return habit.log[day] ?? 0;
        }

        static isDone(habit, day) {
            return HabitStats.count(habit, day) >= habit.target;
        }

        /**
         * Consecutive finished days. A streak is still alive if today is not finished yet,
         * as long as yesterday was, because the day is not over.
         */
        static currentStreak(habit, today) {
            let day = HabitStats.isDone(habit, today) ? today : DayKey.addDays(today, -1);
            let streak = 0;

            for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS && HabitStats.isDone(habit, day); i++) {
                streak++;
                day = DayKey.addDays(day, -1);
            }
            return streak;
        }

        static bestStreak(habit) {
            const doneDays = Object.keys(habit.log).filter((day) => HabitStats.isDone(habit, day)).sort();
            let best = 0;
            let run = 0;
            let previous = null;

            for (const day of doneDays) {
                run = previous !== null && DayKey.addDays(previous, 1) === day ? run + 1 : 1;
                best = Math.max(best, run);
                previous = day;
            }
            return best;
        }

        static totalsByDay(habits, days) {
            return days.map((day) => habits.reduce((sum, habit) => sum + HabitStats.count(habit, day), 0));
        }
    }

    class HabitStore {
        #habits = [];

        get habits() {
            return this.#habits;
        }

        load() {
            try {
                const saved = JSON.parse(localStorage.getItem(KEYS.habits));
                if (Array.isArray(saved)) {
                    this.#habits = saved.map(HabitStore.#normalize).filter(Boolean);
                    return;
                }
            } catch {
                // fall through to the migration below
            }
            this.#habits = this.#migrateLegacy();
            if (this.#habits.length > 0) this.#save();
        }

        add({ title, description, target, reminder }, today) {
            const habit = HabitStore.#normalize({
                id: HabitStore.#createId(), title, description, target, reminder, createdAt: today, log: {}
            });
            if (!habit) return null;

            this.#habits.push(habit);
            this.#save();
            return habit;
        }

        remove(id) {
            this.#habits = this.#habits.filter((habit) => habit.id !== id);
            this.#save();
        }

        /** @returns {number} the new count for that day */
        adjust(id, day, delta) {
            const habit = this.#habits.find((item) => item.id === id);
            if (!habit) return 0;

            const next = Math.max(0, HabitStats.count(habit, day) + delta);
            if (next === 0) delete habit.log[day];
            else habit.log[day] = next;
            this.#save();
            return next;
        }

        static #createId() {
            return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        }

        static #normalize(raw) {
            const title = String(raw?.title ?? '').trim().slice(0, MAX_TITLE);
            if (!title) return null;

            const target = Number(raw.target);
            const reminder = /^([01]\d|2[0-3]):[0-5]\d$/.test(raw.reminder ?? '') ? raw.reminder : '';
            const log = {};
            for (const [day, count] of Object.entries(raw.log ?? {})) {
                if (/^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(count) && count > 0) log[day] = Math.floor(count);
            }

            return {
                id: typeof raw.id === 'string' && raw.id ? raw.id : HabitStore.#createId(),
                title,
                description: String(raw.description ?? '').trim().slice(0, 300),
                target: Number.isFinite(target) ? Math.min(MAX_TARGET, Math.max(1, Math.floor(target))) : 1,
                reminder,
                createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : '',
                log
            };
        }

        /**
         * The first version only kept per-weekday counters that were never reset and could not be
         * dated, so only the habits themselves are carried over.
         */
        #migrateLegacy() {
            try {
                const legacy = JSON.parse(localStorage.getItem(KEYS.legacyHabits));
                return Array.isArray(legacy) ? legacy.map(HabitStore.#normalize).filter(Boolean) : [];
            } catch {
                return [];
            }
        }

        #save() {
            try {
                localStorage.setItem(KEYS.habits, JSON.stringify(this.#habits));
            } catch (error) {
                console.warn('Could not save habits', error);
            }
        }
    }

    class ReminderState {
        /** Remembers the last day a reminder fired, so it fires once per day. */
        read() {
            try {
                const saved = JSON.parse(localStorage.getItem(KEYS.reminders));
                return saved && typeof saved === 'object' ? saved : {};
            } catch {
                return {};
            }
        }

        mark(habitId, day) {
            try {
                localStorage.setItem(KEYS.reminders, JSON.stringify({ ...this.read(), [habitId]: day }));
            } catch {
                // storage blocked: a reminder may repeat, which is harmless
            }
        }
    }

    class ReminderRules {
        /** Due from the reminder time until 10 minutes later; once a day; never for finished habits. */
        static isDue(habit, now, lastFiredDay) {
            if (!habit.reminder) return false;

            const today = DayKey.of(now);
            if (lastFiredDay === today || HabitStats.isDone(habit, today)) return false;

            const [hours, minutes] = habit.reminder.split(':').map(Number);
            const dueAt = new Date(now);
            dueAt.setHours(hours, minutes, 0, 0);
            const elapsed = now.getTime() - dueAt.getTime();
            return elapsed >= 0 && elapsed < REMINDER_WINDOW_MS;
        }
    }

    /* ---------- Services ---------- */

    class I18n {
        #translations = {};
        #lang = localStorage.getItem('lang') || 'fa';

        get locale() {
            return this.#lang === 'fa' ? 'fa-IR' : 'en-US';
        }

        async load() {
            try {
                const response = await fetch('assets/translations.json');
                this.#translations = await response.json();
            } catch (error) {
                console.error('Failed to load translations:', error);
            }
            this.apply();
        }

        t(key, params = {}) {
            const template = this.#translations[this.#lang]?.[key] ?? key;
            return template.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match);
        }

        apply() {
            const html = document.documentElement;
            html.lang = this.#lang;
            html.dir = this.#lang === 'fa' ? 'rtl' : 'ltr';

            for (const element of document.querySelectorAll('[data-i18n]')) {
                element.textContent = this.t(element.dataset.i18n);
            }
            for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
                element.placeholder = this.t(element.dataset.i18nPlaceholder);
            }
            for (const element of document.querySelectorAll('[data-i18n-label]')) {
                element.setAttribute('aria-label', this.t(element.dataset.i18nLabel));
            }

            const titleKey = document.querySelector('title')?.dataset.i18n;
            if (titleKey) document.title = this.t(titleKey);
        }
    }

    class Toast {
        #element;
        #timer = 0;

        constructor(element) {
            this.#element = element;
        }

        show(message, duration = TOAST_DURATION_MS) {
            clearTimeout(this.#timer);
            this.#element.textContent = message;
            this.#element.hidden = false;
            this.#timer = setTimeout(() => {
                this.#element.hidden = true;
            }, duration);
        }
    }

    class ConfirmDialog {
        #dialog;

        constructor(dialog) {
            this.#dialog = dialog;
            dialog.querySelector('[data-dialog-cancel]').addEventListener('click', () => dialog.close('cancel'));
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) dialog.close('cancel');
            });
        }

        ask({ title, message }) {
            this.#dialog.querySelector('[data-dialog-title]').textContent = title;
            this.#dialog.querySelector('[data-dialog-message]').textContent = message;

            return new Promise((resolve) => {
                this.#dialog.addEventListener('close', () => resolve(this.#dialog.returnValue === 'ok'), { once: true });
                this.#dialog.returnValue = '';
                this.#dialog.showModal();
            });
        }
    }

    /** System notifications. They only arrive while the page or installed app is alive. */
    class Notifier {
        static get isSupported() {
            return 'Notification' in window;
        }

        static get permission() {
            return Notifier.isSupported ? Notification.permission : 'unsupported';
        }

        static async requestPermission() {
            return Notifier.isSupported ? Notification.requestPermission() : 'unsupported';
        }

        static async show(title, body) {
            if (Notifier.permission !== 'granted') return false;
            try {
                // Android Chrome only allows notifications created through a service worker
                const registration = await navigator.serviceWorker?.getRegistration();
                if (registration) await registration.showNotification(title, { body, icon: '/favicon.png', tag: title });
                else new Notification(title, { body, icon: '/favicon.png' });
                return true;
            } catch {
                return false;
            }
        }
    }

    /* ---------- Application ---------- */

    class HabitApp {
        #i18n = new I18n();
        #store = new HabitStore();
        #reminderState = new ReminderState();
        #toast;
        #confirm;
        #dom;
        #feed = [];

        async init() {
            this.#cacheDom();
            this.#toast = new Toast(this.#dom.toast);
            this.#confirm = new ConfirmDialog(this.#dom.dialog);
            await this.#i18n.load();

            this.#store.load();
            this.#bindEvents();
            this.#renderAll();
            this.#renderPermission();
            this.#checkReminders();
            setInterval(() => this.#checkReminders(), REMINDER_CHECK_MS);
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) return;
                this.#renderAll();
                this.#checkReminders();
            });
            window.addEventListener('languageChanged', () => window.location.reload());
        }

        #cacheDom() {
            const byId = (id) => document.getElementById(id);
            this.#dom = {
                form: byId('habitForm'),
                list: byId('habitList'),
                summary: byId('habitSummary'),
                empty: byId('emptyHabits'),
                total: byId('totalHabits'),
                week: byId('weeklyCompletions'),
                streak: byId('bestStreak'),
                reminders: byId('reminderCount'),
                chart: byId('weekChart'),
                feed: byId('reminderFeed'),
                enable: byId('enableNotifications'),
                permission: byId('permissionStatus'),
                toast: byId('toast'),
                dialog: byId('confirmDialog')
            };
        }

        #bindEvents() {
            const dom = this.#dom;

            dom.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.#addHabit();
            });
            dom.list.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-action]');
                if (!button) return;
                const id = button.closest('[data-id]').dataset.id;
                if (button.dataset.action === 'delete') this.#deleteHabit(id);
                else this.#adjust(id, button.dataset.action === 'plus' ? 1 : -1);
            });
            dom.enable.addEventListener('click', async () => {
                await Notifier.requestPermission();
                this.#renderPermission();
            });
        }

        get #today() {
            return DayKey.of();
        }

        /* ----- actions ----- */

        #addHabit() {
            const data = new FormData(this.#dom.form);
            const title = String(data.get('title')).trim();
            const target = NumberText.parse(data.get('target'));

            if (!title || !(target >= 1)) return this.#toast.show(this.#i18n.t('error_form'));

            this.#store.add({
                title,
                description: String(data.get('description')),
                target,
                reminder: String(data.get('reminder'))
            }, this.#today);
            this.#dom.form.reset();
            this.#dom.form.elements.namedItem('target').value = '1';
            this.#renderAll();
            this.#toast.show(this.#i18n.t('toast_added'));
        }

        #adjust(id, delta) {
            const habit = this.#store.habits.find((item) => item.id === id);
            if (!habit) return;

            const wasDone = HabitStats.isDone(habit, this.#today);
            this.#store.adjust(id, this.#today, delta);
            this.#renderAll();

            if (delta > 0) {
                const isDone = HabitStats.isDone(habit, this.#today);
                this.#pushFeed(this.#i18n.t(isDone && !wasDone ? 'feed_done' : 'feed_logged', { title: habit.title }));
            }
        }

        async #deleteHabit(id) {
            const habit = this.#store.habits.find((item) => item.id === id);
            if (!habit) return;

            const isConfirmed = await this.#confirm.ask({
                title: this.#i18n.t('button_delete'),
                message: this.#i18n.t('confirm_delete', { title: habit.title })
            });
            if (!isConfirmed) return;

            this.#store.remove(id);
            this.#renderAll();
            this.#toast.show(this.#i18n.t('toast_deleted'));
        }

        /* ----- reminders ----- */

        #checkReminders() {
            const now = new Date();
            const fired = this.#reminderState.read();

            for (const habit of this.#store.habits) {
                if (!ReminderRules.isDue(habit, now, fired[habit.id])) continue;

                this.#reminderState.mark(habit.id, DayKey.of(now));
                const message = this.#i18n.t('feed_reminder', { title: habit.title });
                this.#pushFeed(message);
                Notifier.show(this.#i18n.t('title'), message);
            }
        }

        #pushFeed(message) {
            const time = new Intl.DateTimeFormat(this.#i18n.locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
            this.#feed = [{ message, time }, ...this.#feed].slice(0, FEED_LIMIT);
            this.#renderFeed();
        }

        /* ----- rendering ----- */

        #renderAll() {
            this.#renderHabits();
            this.#renderStats();
            this.#renderChart();
            this.#renderFeed();
        }

        #renderStats() {
            const number = new Intl.NumberFormat(this.#i18n.locale);
            const habits = this.#store.habits;
            const days = DayKey.lastDays(CHART_DAYS, this.#today);

            this.#dom.total.textContent = number.format(habits.length);
            this.#dom.week.textContent = number.format(HabitStats.totalsByDay(habits, days).reduce((a, b) => a + b, 0));
            this.#dom.streak.textContent = number.format(Math.max(0, ...habits.map(HabitStats.bestStreak)));
            this.#dom.reminders.textContent = number.format(habits.filter((habit) => habit.reminder).length);
        }

        #renderHabits() {
            const habits = this.#store.habits;
            const number = new Intl.NumberFormat(this.#i18n.locale);

            this.#dom.empty.hidden = habits.length > 0;
            this.#dom.summary.textContent = habits.length
                ? this.#i18n.t('summary_count', { n: number.format(habits.length) })
                : this.#i18n.t('summary_none');
            this.#dom.list.replaceChildren(...habits.map((habit) => this.#createCard(habit, number)));
        }

        #createCard(habit, number) {
            const today = this.#today;
            const count = HabitStats.count(habit, today);
            const isDone = count >= habit.target;
            const weekday = new Intl.DateTimeFormat(this.#i18n.locale, { weekday: 'narrow' });

            const card = document.createElement('article');
            card.className = `card habit${isDone ? ' is-done' : ''}`;
            card.dataset.id = habit.id;

            const head = document.createElement('div');
            head.className = 'habit-head';
            const title = document.createElement('h3');
            title.className = 'habit-title';
            title.textContent = habit.title;
            const remove = this.#createButton('btn btn--ghost btn--icon', 'delete', '', this.#i18n.t('button_delete'));
            remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="m19 6-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';
            head.append(title, remove);
            card.append(head);

            if (habit.description) {
                const description = document.createElement('p');
                description.className = 'muted habit-description';
                description.textContent = habit.description;
                card.append(description);
            }

            const badges = document.createElement('div');
            badges.className = 'row habit-badges';
            badges.append(
                this.#createBadge('badge', this.#i18n.t('badge_target', { n: number.format(habit.target) })),
                this.#createBadge('badge', habit.reminder
                    ? this.#i18n.t('badge_reminder', { time: this.#formatTime(habit.reminder) })
                    : this.#i18n.t('badge_no_reminder')),
                this.#createBadge('badge badge--warning', this.#i18n.t('badge_streak', { n: number.format(HabitStats.currentStreak(habit, today)) }))
            );
            card.append(badges);

            const progress = document.createElement('div');
            progress.className = 'progress';
            progress.setAttribute('role', 'progressbar');
            progress.setAttribute('aria-valuemin', '0');
            progress.setAttribute('aria-valuemax', String(habit.target));
            progress.setAttribute('aria-valuenow', String(Math.min(count, habit.target)));
            const bar = document.createElement('div');
            bar.className = 'progress-bar';
            bar.style.width = `${Math.min(100, Math.round((count / habit.target) * 100))}%`;
            progress.append(bar);

            const today_ = document.createElement('p');
            today_.className = 'habit-today';
            today_.textContent = this.#i18n.t(isDone ? 'today_done' : 'today_progress', {
                done: number.format(count), target: number.format(habit.target)
            });
            card.append(progress, today_);

            const week = document.createElement('ol');
            week.className = 'week-dots';
            week.setAttribute('aria-label', this.#i18n.t('label_week'));
            week.append(...DayKey.lastDays(CHART_DAYS, today).map((day) => {
                const dot = document.createElement('li');
                dot.className = `dot${HabitStats.isDone(habit, day) ? ' is-on' : ''}${day === today ? ' is-today' : ''}`;
                dot.textContent = weekday.format(DayKey.toDate(day));
                return dot;
            }));
            card.append(week);

            const actions = document.createElement('div');
            actions.className = 'row habit-actions';
            const plus = this.#createButton('btn btn--primary', 'plus', this.#i18n.t('button_log'));
            const minus = this.#createButton('btn btn--secondary', 'minus', this.#i18n.t('button_undo'));
            minus.disabled = count === 0;
            actions.append(plus, minus);
            card.append(actions);

            return card;
        }

        #createButton(className, action, text, label = '') {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.dataset.action = action;
            button.textContent = text;
            if (label) {
                button.title = label;
                button.setAttribute('aria-label', label);
            }
            return button;
        }

        #createBadge(className, text) {
            const badge = document.createElement('span');
            badge.className = className;
            badge.textContent = text;
            return badge;
        }

        #formatTime(hhmm) {
            const [hours, minutes] = hhmm.split(':').map(Number);
            return new Intl.DateTimeFormat(this.#i18n.locale, { hour: '2-digit', minute: '2-digit', hour12: false })
                .format(new Date(2000, 0, 1, hours, minutes));
        }

        #renderChart() {
            const days = DayKey.lastDays(CHART_DAYS, this.#today);
            const totals = HabitStats.totalsByDay(this.#store.habits, days);
            const max = Math.max(1, ...totals);
            const number = new Intl.NumberFormat(this.#i18n.locale);
            const weekday = new Intl.DateTimeFormat(this.#i18n.locale, { weekday: 'short' });

            this.#dom.chart.replaceChildren(...days.map((day, index) => {
                const column = document.createElement('li');
                column.className = 'bar-column';

                const value = document.createElement('span');
                value.className = 'bar-value';
                value.textContent = number.format(totals[index]);

                const track = document.createElement('span');
                track.className = 'bar-track';
                const fill = document.createElement('span');
                fill.className = `bar-fill${day === this.#today ? ' is-today' : ''}`;
                fill.style.height = `${Math.round((totals[index] / max) * 100)}%`;
                track.append(fill);

                const label = document.createElement('span');
                label.className = 'bar-label';
                label.textContent = weekday.format(DayKey.toDate(day));

                column.append(value, track, label);
                return column;
            }));
        }

        #renderFeed() {
            const dom = this.#dom;
            if (this.#feed.length === 0) {
                const placeholder = document.createElement('li');
                placeholder.className = 'muted';
                placeholder.textContent = this.#i18n.t('text_placeholder_10');
                dom.feed.replaceChildren(placeholder);
                return;
            }
            dom.feed.replaceChildren(...this.#feed.map((entry) => {
                const item = document.createElement('li');
                item.className = 'feed-item';
                const time = document.createElement('span');
                time.className = 'muted feed-time';
                time.textContent = entry.time;
                const text = document.createElement('span');
                text.textContent = entry.message;
                item.append(time, text);
                return item;
            }));
        }

        #renderPermission() {
            const permission = Notifier.permission;
            this.#dom.enable.hidden = permission !== 'default';
            this.#dom.permission.textContent = this.#i18n.t(`permission_${permission}`);
        }
    }

    new HabitApp().init();
})();
