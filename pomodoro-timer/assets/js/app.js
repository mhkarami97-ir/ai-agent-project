(() => {
    'use strict';

    const KEYS = Object.freeze({
        settings: 'pomodoro_settings_v1',
        timer: 'pomodoro_timer_v1',
        stats: 'pomodoro_daily_stats_v2',
        legacyStats: 'pomodoro_daily_stats_v1'
    });

    const LIMITS = Object.freeze({
        focus: { min: 10, max: 60 },
        short: { min: 3, max: 20 },
        long: { min: 10, max: 40 },
        interval: { min: 2, max: 6 }
    });
    const DEFAULT_SETTINGS = Object.freeze({ focus: 25, short: 5, long: 15, interval: 4, alert: true, keepAwake: true });
    const MODES = Object.freeze(['focus', 'short', 'long']);
    const HISTORY_DAYS = 7;
    const TICK_MS = 250;
    const TOAST_DURATION_MS = 1800;
    const RING_RADIUS = 52;
    const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    /* ---------- Pure logic (no DOM) ---------- */

    class NumberText {
        static parse(text) {
            const digits = { '۰': 0, '۱': 1, '۲': 2, '۳': 3, '۴': 4, '۵': 5, '۶': 6, '۷': 7, '۸': 8, '۹': 9,
                '٠': 0, '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9 };
            const normalized = String(text).replace(/[۰-۹٠-٩]/g, (digit) => digits[digit]).trim();
            return /^\d+$/.test(normalized) ? Number(normalized) : Number.NaN;
        }
    }

    class JalaliDate {
        /** Jalali (Persian calendar) to Gregorian. Algorithm used by jdf.js; valid for the 1200s-1600s. */
        static toGregorian(jy, jm, jd) {
            const year = jy + 1595;
            let days = -355668 + 365 * year + Math.floor(year / 33) * 8 + Math.floor(((year % 33) + 3) / 4) + jd +
                (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

            let gy = 400 * Math.floor(days / 146097);
            days %= 146097;
            if (days > 36524) {
                gy += 100 * Math.floor(--days / 36524);
                days %= 36524;
                if (days >= 365) days++;
            }
            gy += 4 * Math.floor(days / 1461);
            days %= 1461;
            if (days > 365) {
                gy += Math.floor((days - 1) / 365);
                days = (days - 1) % 365;
            }

            let gd = days + 1;
            const monthLengths = [0, 31, (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
                31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            let gm = 0;
            while (gm < 13 && gd > monthLengths[gm]) gd -= monthLengths[gm++];
            return [gy, gm, gd];
        }

        /** "۱۴۰۵/۷/۱۱" -> "2026-10-03", or null when the text is not a Jalali date. */
        static legacyKeyToIso(key) {
            const parts = String(key).split(/[\/\-]/).map(NumberText.parse);
            if (parts.length !== 3 || parts.some(Number.isNaN) || parts[0] < 1200 || parts[0] > 1600) return null;

            const [gy, gm, gd] = JalaliDate.toGregorian(...parts);
            return DayKey.format(gy, gm, gd);
        }
    }

    class DayKey {
        static format(year, month, day) {
            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }

        /** Local calendar day as "YYYY-MM-DD" (sortable as plain text). */
        static of(date = new Date()) {
            return DayKey.format(date.getFullYear(), date.getMonth() + 1, date.getDate());
        }

        static toDate(key) {
            const [year, month, day] = key.split('-').map(Number);
            return new Date(year, month - 1, day, 12);
        }
    }

    /**
     * Pomodoro state machine. It never touches the DOM and takes the current time as an argument,
     * so it keeps correct time even when the browser throttles timers in a background tab.
     */
    class PomodoroTimer {
        mode = 'focus';
        cycle = 1;
        running = false;
        remainingMs = 0;
        endsAt = 0;
        config;

        constructor(config) {
            this.config = { ...config };
            this.remainingMs = this.durationMs(this.mode);
        }

        durationMs(mode) {
            return this.config[mode] * 60_000;
        }

        secondsLeft(now) {
            const ms = this.running ? Math.max(0, this.endsAt - now) : this.remainingMs;
            return Math.ceil(ms / 1000);
        }

        /** 0 at the start of a phase, 1 when it is over. */
        progress(now) {
            const total = this.durationMs(this.mode);
            const left = this.running ? Math.max(0, this.endsAt - now) : this.remainingMs;
            return total === 0 ? 0 : clamp(1 - left / total, 0, 1);
        }

        start(now) {
            if (this.running) return;
            this.running = true;
            this.endsAt = now + this.remainingMs;
        }

        pause(now) {
            if (!this.running) return;
            this.remainingMs = Math.max(0, this.endsAt - now);
            this.running = false;
        }

        reset() {
            this.running = false;
            this.remainingMs = this.durationMs(this.mode);
        }

        selectMode(mode) {
            this.mode = mode;
            this.reset();
        }

        applyConfig(config) {
            this.config = { ...config };
            this.cycle = 1;
            this.selectMode('focus');
        }

        /** Moves to the next phase without counting the current one. */
        skip() {
            if (this.mode === 'focus') {
                this.mode = this.cycle % this.config.interval === 0 ? 'long' : 'short';
            } else {
                this.cycle = this.mode === 'long' ? 1 : this.cycle + 1;
                this.mode = 'focus';
            }
            this.reset();
        }

        /** @returns {{mode: string, minutes: number}|null} the finished phase, once its time is up */
        tick(now) {
            if (!this.running || now < this.endsAt) return null;

            const finished = { mode: this.mode, minutes: this.config[this.mode] };
            this.skip();
            return finished;
        }

        toJSON() {
            return { mode: this.mode, cycle: this.cycle, running: this.running, remainingMs: this.remainingMs, endsAt: this.endsAt };
        }

        /** Restores a saved timer. Returns true if the running phase ended while the page was closed. */
        restore(saved, now) {
            if (!saved || !MODES.includes(saved.mode)) return false;

            this.mode = saved.mode;
            this.cycle = clamp(Number(saved.cycle) || 1, 1, this.config.interval);
            this.remainingMs = clamp(Number(saved.remainingMs) || this.durationMs(this.mode), 0, this.durationMs(this.mode));
            this.running = false;

            if (!saved.running) return false;
            if (now >= Number(saved.endsAt)) {
                this.skip();
                return true;
            }
            this.remainingMs = Number(saved.endsAt) - now;
            this.start(now);
            return false;
        }
    }

    class SettingsStore {
        static sanitize(raw) {
            const source = raw && typeof raw === 'object' ? raw : {};
            const number = (name) => {
                const value = Number(source[name]);
                return Number.isFinite(value) ? clamp(Math.round(value), LIMITS[name].min, LIMITS[name].max) : DEFAULT_SETTINGS[name];
            };
            return {
                focus: number('focus'),
                short: number('short'),
                long: number('long'),
                interval: number('interval'),
                alert: typeof source.alert === 'boolean' ? source.alert : DEFAULT_SETTINGS.alert,
                keepAwake: typeof source.keepAwake === 'boolean' ? source.keepAwake : DEFAULT_SETTINGS.keepAwake
            };
        }

        load() {
            try {
                return SettingsStore.sanitize(JSON.parse(localStorage.getItem(KEYS.settings)));
            } catch {
                return { ...DEFAULT_SETTINGS };
            }
        }

        save(settings) {
            this.#write(KEYS.settings, settings);
        }

        #write(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch {
                // storage blocked: settings are a convenience only
            }
        }
    }

    class StatsStore {
        #empty = () => ({ focusSessions: 0, focusMinutes: 0, breakMinutes: 0 });

        #read() {
            try {
                const parsed = JSON.parse(localStorage.getItem(KEYS.stats));
                if (parsed && typeof parsed === 'object') return parsed;
            } catch {
                // fall through to the migration below
            }
            return this.#migrateLegacy();
        }

        #write(all) {
            try {
                localStorage.setItem(KEYS.stats, JSON.stringify(all));
            } catch (error) {
                console.warn('Could not save statistics', error);
            }
        }

        /** The old version keyed days by Persian-digit dates, which could not be sorted. */
        #migrateLegacy() {
            const migrated = {};
            try {
                const legacy = JSON.parse(localStorage.getItem(KEYS.legacyStats) ?? '{}');
                for (const [oldKey, stats] of Object.entries(legacy)) {
                    const key = JalaliDate.legacyKeyToIso(oldKey);
                    if (!key) continue;
                    const target = (migrated[key] ??= this.#empty());
                    target.focusSessions += Number(stats?.focusSessions) || 0;
                    target.focusMinutes += Number(stats?.focusMinutes) || 0;
                    target.breakMinutes += Number(stats?.breakMinutes) || 0;
                }
            } catch {
                return {};
            }
            if (Object.keys(migrated).length > 0) this.#write(migrated);
            return migrated;
        }

        today(date = new Date()) {
            return { ...this.#empty(), ...this.#read()[DayKey.of(date)] };
        }

        /** Counts one finished phase. */
        record({ mode, minutes }, date = new Date()) {
            const all = this.#read();
            const key = DayKey.of(date);
            const day = (all[key] = { ...this.#empty(), ...all[key] });

            if (mode === 'focus') {
                day.focusSessions += 1;
                day.focusMinutes += minutes;
            } else {
                day.breakMinutes += minutes;
            }
            this.#write(all);
        }

        history(limit = HISTORY_DAYS) {
            return Object.entries(this.#read())
                .filter(([key]) => /^\d{4}-\d{2}-\d{2}$/.test(key))
                .sort(([a], [b]) => (a < b ? 1 : -1))
                .slice(0, limit)
                .map(([date, stats]) => ({ date, ...this.#empty(), ...stats }));
        }

        clear() {
            this.#write({});
        }
    }

    class TimerStateStore {
        load() {
            try {
                return JSON.parse(localStorage.getItem(KEYS.timer));
            } catch {
                return null;
            }
        }

        save(state) {
            try {
                localStorage.setItem(KEYS.timer, JSON.stringify(state));
            } catch {
                // storage blocked: the timer just will not survive a reload
            }
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

    /** Beeps and vibrates when a phase ends. The AudioContext must be unlocked by a user gesture. */
    class PhaseAlert {
        #context = null;

        unlock() {
            try {
                this.#context ??= new (window.AudioContext ?? window.webkitAudioContext)();
                if (this.#context.state === 'suspended') this.#context.resume();
            } catch {
                // no audio support: vibration and the title still work
            }
        }

        play() {
            navigator.vibrate?.([200, 100, 200, 100, 300]);
            if (!this.#context) return;

            const start = this.#context.currentTime;
            [0, 0.28, 0.56].forEach((offset) => {
                const oscillator = this.#context.createOscillator();
                const gain = this.#context.createGain();
                oscillator.type = 'sine';
                oscillator.frequency.value = 880;
                gain.gain.setValueAtTime(0.0001, start + offset);
                gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.22);
                oscillator.connect(gain).connect(this.#context.destination);
                oscillator.start(start + offset);
                oscillator.stop(start + offset + 0.25);
            });
        }
    }

    /** Keeps the screen on while the timer runs, where the browser supports it. */
    class WakeLock {
        #sentinel = null;

        async acquire() {
            if (!('wakeLock' in navigator) || this.#sentinel) return;
            try {
                this.#sentinel = await navigator.wakeLock.request('screen');
                this.#sentinel.addEventListener('release', () => {
                    this.#sentinel = null;
                });
            } catch {
                // denied (battery saver, hidden tab): not essential
            }
        }

        async release() {
            await this.#sentinel?.release();
            this.#sentinel = null;
        }
    }

    /* ---------- Application ---------- */

    class PomodoroApp {
        #i18n = new I18n();
        #settingsStore = new SettingsStore();
        #stats = new StatsStore();
        #timerStore = new TimerStateStore();
        #alert = new PhaseAlert();
        #wakeLock = new WakeLock();
        #settings;
        #timer;
        #toast;
        #confirm;
        #dom;
        #interval = 0;
        #lastSecond = -1;

        async init() {
            this.#cacheDom();
            this.#toast = new Toast(this.#dom.toast);
            this.#confirm = new ConfirmDialog(this.#dom.dialog);
            await this.#i18n.load();

            this.#settings = this.#settingsStore.load();
            this.#timer = new PomodoroTimer(this.#settings);
            const expired = this.#timer.restore(this.#timerStore.load(), Date.now());

            this.#fillForm();
            this.#bindEvents();
            this.#renderStats();
            this.#render();
            if (this.#timer.running) this.#startLoop();
            if (expired) this.#setStatus('status_expired');
            window.addEventListener('languageChanged', () => window.location.reload());
        }

        #cacheDom() {
            const byId = (id) => document.getElementById(id);
            this.#dom = {
                card: byId('timerCard'),
                tabs: [...document.querySelectorAll('[role="tab"][data-mode]')],
                time: byId('time-text'),
                modeLabel: byId('mode-label'),
                cycleLabel: byId('cycle-label'),
                ring: byId('ring-progress'),
                start: byId('start-pause'),
                reset: byId('reset'),
                skip: byId('skip'),
                status: byId('phase-status'),
                form: byId('settings-form'),
                resetStats: byId('reset-stats'),
                todayDate: byId('today-date'),
                todayFocus: byId('today-focus'),
                todayFocusMinutes: byId('today-focus-minutes'),
                todayBreakMinutes: byId('today-break-minutes'),
                history: byId('history-list'),
                historyEmpty: byId('history-empty'),
                toast: byId('toast'),
                dialog: byId('confirmDialog')
            };
            this.#dom.ring.style.strokeDasharray = String(RING_LENGTH);
        }

        #bindEvents() {
            const dom = this.#dom;

            for (const tab of dom.tabs) {
                tab.addEventListener('click', () => this.#selectMode(tab.dataset.mode));
            }
            dom.start.addEventListener('click', () => this.#toggle());
            dom.reset.addEventListener('click', () => this.#selectMode(this.#timer.mode));
            dom.skip.addEventListener('click', () => this.#skip());
            dom.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.#saveSettings();
            });
            dom.resetStats.addEventListener('click', () => this.#clearStats());

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) return;
                this.#tick();
                if (this.#timer.running && this.#settings.keepAwake) this.#wakeLock.acquire();
            });
            window.addEventListener('pagehide', () => this.#persist());
        }

        /* ----- timer control ----- */

        #toggle() {
            const timer = this.#timer;
            this.#alert.unlock();

            if (timer.running) {
                timer.pause(Date.now());
                this.#stopLoop();
            } else {
                timer.start(Date.now());
                this.#startLoop();
            }
            this.#setStatus('');
            this.#persist();
            this.#render();
        }

        #selectMode(mode) {
            this.#timer.selectMode(mode);
            this.#stopLoop();
            this.#setStatus('');
            this.#persist();
            this.#render();
        }

        #skip() {
            this.#timer.skip();
            this.#stopLoop();
            this.#setStatus('');
            this.#persist();
            this.#render();
        }

        #startLoop() {
            clearInterval(this.#interval);
            this.#interval = setInterval(() => this.#tick(), TICK_MS);
            if (this.#settings.keepAwake) this.#wakeLock.acquire();
        }

        #stopLoop() {
            clearInterval(this.#interval);
            this.#interval = 0;
            this.#wakeLock.release();
        }

        #tick() {
            const finished = this.#timer.tick(Date.now());
            if (finished) {
                this.#stopLoop();
                this.#stats.record(finished);
                this.#renderStats();
                this.#persist();
                if (this.#settings.alert) this.#alert.play();
                this.#setStatus(finished.mode === 'focus' ? 'status_focus_done' : 'status_break_done');
                this.#render();
                return;
            }

            // The text only changes once per second: avoid touching the DOM on every 250ms tick
            const seconds = this.#timer.secondsLeft(Date.now());
            if (seconds !== this.#lastSecond) this.#render();
        }

        #persist() {
            this.#timerStore.save(this.#timer.toJSON());
        }

        /* ----- settings & stats ----- */

        #fillForm() {
            const form = this.#dom.form.elements;
            for (const name of ['focus', 'short', 'long', 'interval']) form.namedItem(name).value = this.#settings[name];
            form.namedItem('alert').checked = this.#settings.alert;
            form.namedItem('keepAwake').checked = this.#settings.keepAwake;
        }

        #saveSettings() {
            const form = this.#dom.form.elements;
            const raw = { alert: form.namedItem('alert').checked, keepAwake: form.namedItem('keepAwake').checked };
            for (const name of ['focus', 'short', 'long', 'interval']) raw[name] = NumberText.parse(form.namedItem(name).value);

            this.#settings = SettingsStore.sanitize(raw);
            this.#settingsStore.save(this.#settings);
            this.#fillForm();

            this.#timer.applyConfig(this.#settings);
            this.#stopLoop();
            this.#persist();
            this.#render();
            this.#toast.show(this.#i18n.t('toast_settings_saved'));
        }

        async #clearStats() {
            const isConfirmed = await this.#confirm.ask({
                title: this.#i18n.t('button_7'),
                message: this.#i18n.t('confirm_clear_stats')
            });
            if (!isConfirmed) return;

            this.#stats.clear();
            this.#renderStats();
            this.#toast.show(this.#i18n.t('toast_stats_cleared'));
        }

        /* ----- rendering ----- */

        #setStatus(key) {
            this.#dom.status.textContent = key ? this.#i18n.t(key) : '';
        }

        #render() {
            const dom = this.#dom;
            const timer = this.#timer;
            const now = Date.now();
            const seconds = timer.secondsLeft(now);
            const number = new Intl.NumberFormat(this.#i18n.locale, { minimumIntegerDigits: 2, useGrouping: false });
            const text = `${number.format(Math.floor(seconds / 60))}:${number.format(seconds % 60)}`;
            const plainText = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
            const modeLabel = this.#i18n.t(`mode_${timer.mode}_active`);

            this.#lastSecond = seconds;
            dom.card.dataset.mode = timer.mode;
            dom.time.textContent = text;
            dom.modeLabel.textContent = modeLabel;
            dom.cycleLabel.textContent = this.#i18n.t('cycle_label', {
                n: new Intl.NumberFormat(this.#i18n.locale).format(timer.cycle),
                total: new Intl.NumberFormat(this.#i18n.locale).format(timer.config.interval)
            });
            dom.ring.style.strokeDashoffset = String(RING_LENGTH * (1 - timer.progress(now)));
            dom.start.textContent = this.#i18n.t(timer.running ? 'button_pause' : 'button_3');
            dom.start.setAttribute('aria-pressed', String(timer.running));
            document.title = timer.running ? `${plainText} · ${modeLabel}` : this.#i18n.t('title');

            for (const tab of dom.tabs) {
                const isActive = tab.dataset.mode === timer.mode;
                tab.setAttribute('aria-selected', String(isActive));
                tab.tabIndex = isActive ? 0 : -1;
            }
        }

        #renderStats() {
            const dom = this.#dom;
            const number = new Intl.NumberFormat(this.#i18n.locale);
            const today = this.#stats.today();
            const dateFormat = new Intl.DateTimeFormat(this.#i18n.locale, { dateStyle: 'medium' });

            dom.todayDate.textContent = dateFormat.format(new Date());
            dom.todayFocus.textContent = number.format(today.focusSessions);
            dom.todayFocusMinutes.textContent = number.format(today.focusMinutes);
            dom.todayBreakMinutes.textContent = number.format(today.breakMinutes);

            const entries = this.#stats.history();
            const maxMinutes = Math.max(1, ...entries.map((entry) => entry.focusMinutes));
            dom.historyEmpty.hidden = entries.length > 0;
            dom.history.replaceChildren(...entries.map((entry) => {
                const item = document.createElement('li');
                item.className = 'day';

                const date = document.createElement('strong');
                date.textContent = dateFormat.format(DayKey.toDate(entry.date));

                const bar = document.createElement('span');
                bar.className = 'day-bar';
                const fill = document.createElement('span');
                fill.style.width = `${Math.round((entry.focusMinutes / maxMinutes) * 100)}%`;
                bar.append(fill);

                const details = document.createElement('span');
                details.className = 'day-details muted';
                details.textContent = this.#i18n.t('history_line', {
                    sessions: number.format(entry.focusSessions),
                    focus: number.format(entry.focusMinutes),
                    rest: number.format(entry.breakMinutes)
                });

                item.append(date, bar, details);
                return item;
            }));
        }
    }

    new PomodoroApp().init();
})();
