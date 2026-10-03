(() => {
    'use strict';

    const KEYS = Object.freeze({ tasks: 'fh-time-tracker:v2', legacy: 'fh-time-tracker:tasks' });
    const REPORT_DAYS = 14;
    const REPORT_REFRESH_SECONDS = 30;
    const MAX_TEXT = 80;
    const TOAST_DURATION_MS = 1800;

    /* ---------- Pure logic (no DOM) ---------- */

    class Duration {
        /** 3725 -> "01:02:05" */
        static clock(totalSeconds) {
            const seconds = Math.max(0, Math.floor(totalSeconds));
            const pad = (value) => String(value).padStart(2, '0');
            return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;
        }

        static parts(totalMs) {
            const minutes = Math.floor(Math.max(0, totalMs) / 60_000);
            return { hours: Math.floor(minutes / 60), minutes: minutes % 60 };
        }
    }

    class DayKey {
        static of(ms) {
            const date = new Date(ms);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }

        static toDate(key) {
            const [year, month, day] = key.split('-').map(Number);
            return new Date(year, month - 1, day, 12);
        }

        /** The first millisecond of the next local day. */
        static nextMidnight(ms) {
            const date = new Date(ms);
            return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
        }
    }

    class Sessions {
        static isOpen(session) {
            return session.end === null;
        }

        static duration(session, now) {
            return Math.max(0, (session.end ?? now) - session.start);
        }

        /** Splits an interval at local midnights: [[dayKey, ms], ...] */
        static splitByDay(start, end) {
            const chunks = [];
            let cursor = start;
            while (cursor < end) {
                const limit = Math.min(end, DayKey.nextMidnight(cursor));
                chunks.push([DayKey.of(cursor), limit - cursor]);
                cursor = limit;
            }
            return chunks;
        }
    }

    class TaskMath {
        static isRunning(task) {
            return task.sessions.some(Sessions.isOpen);
        }

        static totalMs(task, now) {
            return task.legacySeconds * 1000 + task.sessions.reduce((sum, session) => sum + Sessions.duration(session, now), 0);
        }

        /** Time of one task that falls on one local day. */
        static msOnDay(task, dayKey, now) {
            let total = DayKey.of(task.createdAt) === dayKey ? task.legacySeconds * 1000 : 0;
            for (const session of task.sessions) {
                for (const [day, ms] of Sessions.splitByDay(session.start, session.end ?? now)) {
                    if (day === dayKey) total += ms;
                }
            }
            return total;
        }
    }

    class Report {
        /**
         * @returns {Array<{day: string, totalMs: number, categories: Array<[string, number]>}>} newest day first
         */
        static byDay(tasks, now, limit = REPORT_DAYS) {
            const days = new Map();
            const add = (day, category, ms) => {
                if (ms <= 0) return;
                const entry = days.get(day) ?? { day, totalMs: 0, categories: new Map() };
                entry.totalMs += ms;
                entry.categories.set(category, (entry.categories.get(category) ?? 0) + ms);
                days.set(day, entry);
            };

            for (const task of tasks) {
                add(DayKey.of(task.createdAt), task.category, task.legacySeconds * 1000);
                for (const session of task.sessions) {
                    for (const [day, ms] of Sessions.splitByDay(session.start, session.end ?? now)) {
                        add(day, task.category, ms);
                    }
                }
            }

            return [...days.values()]
                .sort((a, b) => (a.day < b.day ? 1 : -1))
                .slice(0, limit)
                .map((entry) => ({
                    day: entry.day,
                    totalMs: entry.totalMs,
                    categories: [...entry.categories].sort((a, b) => b[1] - a[1])
                }));
        }
    }

    class TaskStore {
        #tasks = [];

        get tasks() {
            return this.#tasks;
        }

        load(now = Date.now()) {
            try {
                const saved = JSON.parse(localStorage.getItem(KEYS.tasks));
                if (Array.isArray(saved)) {
                    this.#tasks = saved.map(TaskStore.#normalize).filter(Boolean);
                    return;
                }
            } catch {
                // fall through to the migration below
            }
            this.#tasks = this.#migrateLegacy(now);
            if (this.#tasks.length > 0) this.#save();
        }

        categories() {
            return [...new Set(this.#tasks.map((task) => task.category).filter(Boolean))].sort();
        }

        add({ title, category }, now = Date.now()) {
            const task = TaskStore.#normalize({
                id: TaskStore.#createId(), title, category, createdAt: now, sessions: [], legacySeconds: 0
            });
            if (!task) return null;

            this.#tasks.unshift(task);
            this.#save();
            return task;
        }

        /** Only one task runs at a time: starting one pauses the others. */
        start(id, now = Date.now()) {
            const task = this.#find(id);
            if (!task || TaskMath.isRunning(task)) return;

            for (const other of this.#tasks) this.#closeOpenSession(other, now);
            task.sessions.push({ start: now, end: null });
            this.#save();
        }

        pause(id, now = Date.now()) {
            const task = this.#find(id);
            if (!task) return;

            this.#closeOpenSession(task, now);
            this.#save();
        }

        update(id, { title, category }) {
            const task = this.#find(id);
            const next = TaskStore.#normalize({ ...task, title, category });
            if (!task || !next) return false;

            task.title = next.title;
            task.category = next.category;
            this.#save();
            return true;
        }

        remove(id) {
            this.#tasks = this.#tasks.filter((task) => task.id !== id);
            this.#save();
        }

        #find(id) {
            return this.#tasks.find((task) => task.id === id) ?? null;
        }

        #closeOpenSession(task, now) {
            for (const session of task.sessions) {
                if (Sessions.isOpen(session)) session.end = Math.max(now, session.start);
            }
        }

        static #createId() {
            return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        }

        static #normalize(raw) {
            const title = String(raw?.title ?? '').trim().slice(0, MAX_TEXT);
            if (!title) return null;

            const sessions = (Array.isArray(raw.sessions) ? raw.sessions : [])
                .map((session) => ({ start: Number(session?.start), end: session?.end === null ? null : Number(session?.end) }))
                .filter((session) => Number.isFinite(session.start) && (session.end === null || Number.isFinite(session.end)));

            // at most one open session per task
            let hasOpen = false;
            for (const session of sessions) {
                if (session.end === null && hasOpen) session.end = session.start;
                if (session.end === null) hasOpen = true;
            }

            return {
                id: typeof raw.id === 'string' && raw.id ? raw.id : TaskStore.#createId(),
                title,
                category: String(raw.category ?? '').trim().slice(0, MAX_TEXT),
                createdAt: Number.isFinite(Number(raw.createdAt)) ? Number(raw.createdAt) : Date.now(),
                sessions,
                legacySeconds: Math.max(0, Number(raw.legacySeconds) || 0)
            };
        }

        /**
         * The first version added the elapsed time to the total on every tick, so totals grew much
         * faster than real time. The old total is kept as "legacy time" (it is not trustworthy), and a
         * task that was running keeps its real start time.
         */
        #migrateLegacy(now) {
            try {
                const legacy = JSON.parse(localStorage.getItem(KEYS.legacy));
                if (!Array.isArray(legacy)) return [];

                return legacy.map((old) => TaskStore.#normalize({
                    id: old?.id,
                    title: old?.title,
                    category: old?.category,
                    createdAt: old?.createdAt,
                    legacySeconds: old?.total,
                    sessions: old?.status === 'running' && Number.isFinite(Number(old.startedAt))
                        ? [{ start: Math.min(Number(old.startedAt), now), end: null }]
                        : []
                })).filter(Boolean);
            } catch {
                return [];
            }
        }

        #save() {
            try {
                localStorage.setItem(KEYS.tasks, JSON.stringify(this.#tasks));
            } catch (error) {
                console.warn('Could not save tasks', error);
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
            for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
                element.placeholder = this.t(element.dataset.i18nPlaceholder);
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

    class EditDialog {
        #dialog;
        #title;
        #category;

        constructor(dialog) {
            this.#dialog = dialog;
            this.#title = dialog.querySelector('[name="title"]');
            this.#category = dialog.querySelector('[name="category"]');
            dialog.querySelector('[data-dialog-cancel]').addEventListener('click', () => dialog.close('cancel'));
            dialog.addEventListener('click', (event) => {
                if (event.target === dialog) dialog.close('cancel');
            });
        }

        /** @returns {Promise<{title: string, category: string}|null>} */
        ask({ title, category }) {
            this.#title.value = title;
            this.#category.value = category;

            return new Promise((resolve) => {
                this.#dialog.addEventListener('close', () => resolve(
                    this.#dialog.returnValue === 'ok'
                        ? { title: this.#title.value.trim(), category: this.#category.value.trim() }
                        : null
                ), { once: true });
                this.#dialog.returnValue = '';
                this.#dialog.showModal();
                this.#title.focus();
                this.#title.select();
            });
        }
    }

    /* ---------- Application ---------- */

    class TrackerApp {
        #i18n = new I18n();
        #store = new TaskStore();
        #toast;
        #confirm;
        #editor;
        #dom;
        #views = new Map();
        #timer = 0;
        #ticks = 0;

        async init() {
            this.#cacheDom();
            this.#toast = new Toast(this.#dom.toast);
            this.#confirm = new ConfirmDialog(this.#dom.confirmDialog);
            this.#editor = new EditDialog(this.#dom.editDialog);
            await this.#i18n.load();

            this.#store.load();
            this.#bindEvents();
            this.#renderAll();
            this.#schedule();
            window.addEventListener('languageChanged', () => window.location.reload());
        }

        #cacheDom() {
            const byId = (id) => document.getElementById(id);
            this.#dom = {
                form: byId('task-form'),
                title: byId('task-title'),
                category: byId('task-category'),
                categories: byId('category-list'),
                list: byId('task-list'),
                emptyTasks: byId('empty-tasks'),
                report: byId('report-list'),
                emptyReport: byId('empty-report'),
                todayTotal: byId('today-total'),
                runningLabel: byId('running-label'),
                toast: byId('toast'),
                confirmDialog: byId('confirmDialog'),
                editDialog: byId('editDialog')
            };
        }

        #bindEvents() {
            this.#dom.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.#addAndStart();
            });
            this.#dom.list.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-action]');
                if (!button) return;
                const id = button.closest('[data-id]').dataset.id;
                if (button.dataset.action === 'toggle') this.#toggle(id);
                else if (button.dataset.action === 'edit') this.#edit(id);
                else this.#delete(id);
            });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) return;
                this.#tick();
                this.#schedule();
            });
        }

        /* ----- actions ----- */

        #addAndStart() {
            const task = this.#store.add({ title: this.#dom.title.value, category: this.#dom.category.value });
            if (!task) return;

            this.#store.start(task.id);
            this.#dom.form.reset();
            this.#renderAll();
            this.#toast.show(this.#i18n.t('toast_started'));
        }

        #toggle(id) {
            const task = this.#store.tasks.find((item) => item.id === id);
            if (!task) return;

            if (TaskMath.isRunning(task)) this.#store.pause(id);
            else this.#store.start(id);
            this.#renderAll();
        }

        async #edit(id) {
            const task = this.#store.tasks.find((item) => item.id === id);
            if (!task) return;

            const result = await this.#editor.ask({ title: task.title, category: task.category });
            if (!result) return;

            if (!this.#store.update(id, result)) return this.#toast.show(this.#i18n.t('error_title'));
            this.#renderAll();
            this.#toast.show(this.#i18n.t('toast_saved'));
        }

        async #delete(id) {
            const task = this.#store.tasks.find((item) => item.id === id);
            if (!task) return;

            const isConfirmed = await this.#confirm.ask({
                title: this.#i18n.t('button_delete'),
                message: this.#i18n.t('confirm_delete', { title: task.title })
            });
            if (!isConfirmed) return;

            this.#store.remove(id);
            this.#renderAll();
            this.#toast.show(this.#i18n.t('toast_deleted'));
        }

        /* ----- clock ----- */

        #schedule() {
            clearTimeout(this.#timer);
            const delay = 1000 - (Date.now() % 1000) + 5; // land just after the next second starts
            this.#timer = setTimeout(() => {
                this.#tick();
                this.#schedule();
            }, delay);
        }

        #tick() {
            const now = Date.now();
            for (const task of this.#store.tasks) {
                const view = this.#views.get(task.id);
                if (view && TaskMath.isRunning(task)) view.time.textContent = Duration.clock(TaskMath.totalMs(task, now) / 1000);
            }
            this.#renderToday(now);
            if (++this.#ticks % REPORT_REFRESH_SECONDS === 0) this.#renderReport(now);
        }

        /* ----- rendering ----- */

        #renderAll() {
            const now = Date.now();
            this.#renderTasks(now);
            this.#renderReport(now);
            this.#renderToday(now);
            this.#dom.categories.replaceChildren(...this.#store.categories().map((name) => {
                const option = document.createElement('option');
                option.value = name;
                return option;
            }));
        }

        #renderToday(now) {
            const todayKey = DayKey.of(now);
            const totalMs = this.#store.tasks.reduce((sum, task) => sum + TaskMath.msOnDay(task, todayKey, now), 0);
            const { hours, minutes } = Duration.parts(totalMs);
            const number = new Intl.NumberFormat(this.#i18n.locale);
            this.#dom.todayTotal.textContent = this.#i18n.t('duration_hm', { h: number.format(hours), m: number.format(minutes) });

            const running = this.#store.tasks.find(TaskMath.isRunning);
            this.#dom.runningLabel.textContent = running
                ? this.#i18n.t('running_now', { title: running.title })
                : this.#i18n.t('nothing_running');
            document.title = running ? `▶ ${running.title}` : this.#i18n.t('title');
        }

        #renderTasks(now) {
            const tasks = this.#store.tasks;
            this.#dom.emptyTasks.hidden = tasks.length > 0;
            this.#views.clear();
            this.#dom.list.replaceChildren(...tasks.map((task) => this.#createTask(task, now)));
        }

        #createTask(task, now) {
            const isRunning = TaskMath.isRunning(task);

            const card = document.createElement('article');
            card.className = `card task${isRunning ? ' is-running' : ''}`;
            card.dataset.id = task.id;

            const info = document.createElement('div');
            info.className = 'task-info';
            const title = document.createElement('h3');
            title.className = 'task-title';
            title.textContent = task.title;
            const meta = document.createElement('div');
            meta.className = 'row task-meta';
            const category = document.createElement('span');
            category.className = 'badge';
            category.textContent = task.category || this.#i18n.t('no_category');
            const status = document.createElement('span');
            status.className = isRunning ? 'badge badge--success' : 'badge badge--muted';
            status.textContent = this.#i18n.t(isRunning ? 'status_running' : 'status_paused');
            meta.append(category, status);
            info.append(title, meta);

            const time = document.createElement('p');
            time.className = 'task-time';
            time.dir = 'ltr';
            time.textContent = Duration.clock(TaskMath.totalMs(task, now) / 1000);

            const actions = document.createElement('div');
            actions.className = 'row task-actions';
            actions.append(
                this.#createButton(isRunning ? 'btn btn--secondary' : 'btn btn--primary', 'toggle', this.#i18n.t(isRunning ? 'button_pause' : 'button_start')),
                this.#createButton('btn btn--ghost btn--sm', 'edit', this.#i18n.t('button_edit')),
                this.#createButton('btn btn--danger btn--sm', 'delete', this.#i18n.t('button_delete'))
            );

            card.append(info, time, actions);
            this.#views.set(task.id, { time });
            return card;
        }

        #createButton(className, action, text) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.dataset.action = action;
            button.textContent = text;
            return button;
        }

        #renderReport(now) {
            const rows = Report.byDay(this.#store.tasks, now);
            const number = new Intl.NumberFormat(this.#i18n.locale);
            const dateFormat = new Intl.DateTimeFormat(this.#i18n.locale, { dateStyle: 'full' });
            const maxMs = Math.max(1, ...rows.map((row) => row.totalMs));

            this.#dom.emptyReport.hidden = rows.length > 0;
            this.#dom.report.replaceChildren(...rows.map((row) => {
                const { hours, minutes } = Duration.parts(row.totalMs);

                const card = document.createElement('article');
                card.className = 'day';

                const head = document.createElement('div');
                head.className = 'day-head';
                const date = document.createElement('strong');
                date.textContent = dateFormat.format(DayKey.toDate(row.day));
                const total = document.createElement('span');
                total.className = 'day-total';
                total.textContent = this.#i18n.t('duration_hm', { h: number.format(hours), m: number.format(minutes) });
                head.append(date, total);

                const bar = document.createElement('div');
                bar.className = 'progress';
                const fill = document.createElement('div');
                fill.className = 'progress-bar';
                fill.style.width = `${Math.round((row.totalMs / maxMs) * 100)}%`;
                bar.append(fill);

                const chips = document.createElement('div');
                chips.className = 'row day-categories';
                chips.append(...row.categories.map(([name, ms]) => {
                    const parts = Duration.parts(ms);
                    const chip = document.createElement('span');
                    chip.className = 'chip';
                    chip.textContent = this.#i18n.t('category_time', {
                        name: name || this.#i18n.t('no_category'),
                        h: number.format(parts.hours),
                        m: number.format(parts.minutes)
                    });
                    return chip;
                }));

                card.append(head, bar, chips);
                return card;
            }));
        }
    }

    new TrackerApp().init();
})();
