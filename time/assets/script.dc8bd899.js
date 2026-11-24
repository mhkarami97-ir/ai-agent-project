(() => {
    'use strict';

    const KEYS = Object.freeze({ history: 'timestampHistory', zones: 'time_custom_zones_v1' });
    const MAX_HISTORY = 20;
    const MAX_ABS_MS = 8.64e15;
    const TOAST_DURATION_MS = 1800;
    const DEFAULT_ZONES = Object.freeze([
        'Asia/Tehran', 'UTC', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Tokyo', 'Australia/Sydney'
    ]);
    const CONVERT_ZONES = Object.freeze(['local', 'UTC', 'Asia/Tehran', 'America/New_York', 'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Tokyo', 'Australia/Sydney']);
    const UNIT_FACTORS = Object.freeze({ s: 1000, ms: 1, us: 0.001, ns: 0.000001 });
    const SVG_NS = 'http://www.w3.org/2000/svg';

    /* ---------- Pure logic (no DOM) ---------- */

    class NumberText {
        static #DIGITS = Object.freeze({
            '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
            '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
        });

        /** Persian/Arabic digits to Latin ones. */
        static latinDigits(text) {
            return String(text).replace(/[۰-۹٠-٩]/g, (digit) => NumberText.#DIGITS[digit]);
        }
    }

    class UnixTimestamp {
        /**
         * Understands "1703073600", "1703073600123", "۱۷۰۳۰۷۳۶۰۰", "1_703_073_600.5".
         * With unit "auto" the size of the number decides: below 1e11 seconds, below 1e14 milliseconds,
         * below 1e17 microseconds, otherwise nanoseconds.
         * @returns {{ms: number, unit: string}|null}
         */
        static parse(text, unit = 'auto') {
            const cleaned = NumberText.latinDigits(text).replace(/[\s,_٬]/g, '').replace(/٫/g, '.');
            if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;

            const value = Number(cleaned);
            const resolved = unit === 'auto' ? UnixTimestamp.detectUnit(value) : unit;
            const factor = UNIT_FACTORS[resolved];
            if (factor === undefined) return null;

            const ms = value * factor;
            return Number.isFinite(ms) && Math.abs(ms) <= MAX_ABS_MS ? { ms, unit: resolved } : null;
        }

        static detectUnit(value) {
            const magnitude = Math.abs(value);
            if (magnitude < 1e11) return 's';
            if (magnitude < 1e14) return 'ms';
            if (magnitude < 1e17) return 'us';
            return 'ns';
        }
    }

    class TimeZones {
        static #formatters = new Map();

        static isValid(zone) {
            if (zone === 'local') return true;
            try {
                new Intl.DateTimeFormat('en-US', { timeZone: zone });
                return true;
            } catch {
                return false;
            }
        }

        static #formatter(zone) {
            if (!TimeZones.#formatters.has(zone)) {
                TimeZones.#formatters.set(zone, new Intl.DateTimeFormat('en-US', {
                    timeZone: zone === 'local' ? undefined : zone,
                    hourCycle: 'h23',
                    year: 'numeric', month: '2-digit', day: '2-digit',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }));
            }
            return TimeZones.#formatters.get(zone);
        }

        /** Wall-clock fields of an instant in a zone. */
        static fields(ms, zone) {
            const values = {};
            for (const { type, value } of TimeZones.#formatter(zone).formatToParts(new Date(ms))) {
                if (type !== 'literal') values[type] = Number(value);
            }
            return { year: values.year, month: values.month, day: values.day, hour: values.hour, minute: values.minute, second: values.second };
        }

        static #utcFromFields(f) {
            const date = new Date(0);
            date.setUTCFullYear(f.year, f.month - 1, f.day);
            date.setUTCHours(f.hour, f.minute, f.second, 0);
            return date.getTime();
        }

        static offsetMinutes(ms, zone) {
            const second = Math.floor(ms / 1000) * 1000;
            return Math.round((TimeZones.#utcFromFields(TimeZones.fields(ms, zone)) - second) / 60_000);
        }

        /** "UTC+03:30" */
        static formatOffset(minutes) {
            const sign = minutes < 0 ? '-' : '+';
            const absolute = Math.abs(minutes);
            return `UTC${sign}${String(Math.floor(absolute / 60)).padStart(2, '0')}:${String(absolute % 60).padStart(2, '0')}`;
        }

        /** "2026-10-03 14:15:30" */
        static format(ms, zone) {
            const f = TimeZones.fields(ms, zone);
            const pad = (value) => String(value).padStart(2, '0');
            return `${String(f.year).padStart(4, '0')}-${pad(f.month)}-${pad(f.day)} ${pad(f.hour)}:${pad(f.minute)}:${pad(f.second)}`;
        }

        /**
         * The instant at which a zone's wall clock shows the given fields.
         * The offset is applied twice so daylight-saving changes close to the date are handled.
         */
        static wallToInstant(fields, zone) {
            const wall = TimeZones.#utcFromFields(fields);
            const first = wall - TimeZones.offsetMinutes(wall, zone) * 60_000;
            const second = wall - TimeZones.offsetMinutes(first, zone) * 60_000;
            return second;
        }
    }

    class RelativeTime {
        static format(targetMs, nowMs, locale) {
            const diffSeconds = Math.round((targetMs - nowMs) / 1000);
            const steps = [['year', 31_536_000], ['month', 2_592_000], ['day', 86_400], ['hour', 3600], ['minute', 60], ['second', 1]];
            const [unit, size] = steps.find(([, seconds]) => Math.abs(diffSeconds) >= seconds) ?? steps.at(-1);
            return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.trunc(diffSeconds / size), unit);
        }
    }

    class HistoryStore {
        list() {
            try {
                const parsed = JSON.parse(localStorage.getItem(KEYS.history));
                if (!Array.isArray(parsed)) return [];
                return parsed.map(HistoryStore.#normalize).filter(Boolean);
            } catch {
                return [];
            }
        }

        add(type, content) {
            this.#save([{ type, content: String(content), timestamp: Date.now() }, ...this.list()].slice(0, MAX_HISTORY));
        }

        clear() {
            this.#save([]);
        }

        /** Older entries stored the Persian title instead of a type key. */
        static #normalize(raw) {
            if (!raw || typeof raw.content !== 'string') return null;
            const legacy = { 'تبدیل Unix': 'unix', 'تبدیل تاریخ': 'date' };
            const type = ['unix', 'date'].includes(raw.type) ? raw.type : legacy[raw.type];
            return type ? { type, content: raw.content, timestamp: Number(raw.timestamp) || 0 } : null;
        }

        #save(items) {
            try {
                localStorage.setItem(KEYS.history, JSON.stringify(items));
            } catch (error) {
                console.warn('Could not save history', error);
            }
        }
    }

    class ZoneStore {
        list() {
            try {
                const parsed = JSON.parse(localStorage.getItem(KEYS.zones));
                return Array.isArray(parsed) ? parsed.filter((zone) => typeof zone === 'string' && TimeZones.isValid(zone)) : [];
            } catch {
                return [];
            }
        }

        add(zone) {
            if (DEFAULT_ZONES.includes(zone) || this.list().includes(zone)) return false;
            this.#save([...this.list(), zone]);
            return true;
        }

        remove(zone) {
            this.#save(this.list().filter((item) => item !== zone));
        }

        #save(zones) {
            try {
                localStorage.setItem(KEYS.zones, JSON.stringify(zones));
            } catch {
                // storage blocked: custom zones just will not persist
            }
        }
    }

    /* ---------- Services ---------- */

    class I18n {
        #translations = {};
        #lang = localStorage.getItem('lang') || 'fa';

        get lang() {
            return this.#lang;
        }

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

        has(key) {
            return this.#translations[this.#lang]?.[key] !== undefined;
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
                const label = this.t(element.dataset.i18nLabel);
                element.setAttribute('aria-label', label);
                element.title = label;
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

    const copyText = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            const area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
            document.body.append(area);
            area.select();
            const isCopied = document.execCommand('copy');
            area.remove();
            return isCopied;
        }
    };

    /* ---------- Clock ---------- */

    class AnalogClock {
        #hands;

        constructor(svg, locale) {
            const digits = new Intl.NumberFormat(locale, { useGrouping: false });
            const face = svg.querySelector('[data-ticks]');

            for (let i = 0; i < 60; i++) {
                const isHour = i % 5 === 0;
                const tick = document.createElementNS(SVG_NS, 'line');
                tick.setAttribute('class', isHour ? 'tick tick--hour' : 'tick');
                tick.setAttribute('y1', isHour ? '-84' : '-88');
                tick.setAttribute('y2', '-92');
                tick.setAttribute('transform', `rotate(${i * 6})`);
                face.append(tick);
            }
            for (let hour = 1; hour <= 12; hour++) {
                const angle = (hour * Math.PI) / 6;
                const label = document.createElementNS(SVG_NS, 'text');
                label.setAttribute('class', 'numeral');
                label.setAttribute('x', String(Math.sin(angle) * 68));
                label.setAttribute('y', String(-Math.cos(angle) * 68));
                label.textContent = digits.format(hour);
                face.append(label);
            }
            this.#hands = {
                hour: svg.querySelector('[data-hand="hour"]'),
                minute: svg.querySelector('[data-hand="minute"]'),
                second: svg.querySelector('[data-hand="second"]')
            };
        }

        update(date) {
            const seconds = date.getSeconds();
            const minutes = date.getMinutes() + seconds / 60;
            const hours = (date.getHours() % 12) + minutes / 60;
            this.#hands.second.setAttribute('transform', `rotate(${seconds * 6})`);
            this.#hands.minute.setAttribute('transform', `rotate(${minutes * 6})`);
            this.#hands.hour.setAttribute('transform', `rotate(${hours * 30})`);
        }
    }

    /* ---------- Application ---------- */

    class TimeApp {
        #i18n = new I18n();
        #history = new HistoryStore();
        #zoneStore = new ZoneStore();
        #toast;
        #confirm;
        #clock;
        #dom;
        #zoneViews = new Map();
        #tickTimer = 0;
        #inputTimer = 0;

        async init() {
            this.#cacheDom();
            this.#toast = new Toast(this.#dom.toast);
            this.#confirm = new ConfirmDialog(this.#dom.dialog);
            await this.#i18n.load();

            this.#clock = new AnalogClock(this.#dom.analog, this.#i18n.locale);
            this.#fillConvertZones();
            this.#fillZoneList();
            this.#renderZones();
            this.#setDefaultDateTime();
            this.#renderHistory();
            this.#bindEvents();
            this.#tick();
            window.addEventListener('languageChanged', () => window.location.reload());
        }

        #cacheDom() {
            const byId = (id) => document.getElementById(id);
            this.#dom = {
                analog: byId('analogClock'),
                digitalTime: byId('digitalTime'),
                digitalDate: byId('digitalDate'),
                digitalGregorian: byId('digitalGregorian'),
                tsSeconds: byId('currentTimestamp'),
                tsMillis: byId('currentTimestampMs'),
                copySeconds: byId('copyCurrentTimestamp'),
                copyMillis: byId('copyCurrentTimestampMs'),
                unixInput: byId('unixInput'),
                unixUnit: byId('unixUnit'),
                unixHint: byId('unixHint'),
                unixResults: byId('unixResults'),
                convertToDate: byId('convertToDate'),
                useNow: byId('useCurrentTimestamp'),
                dateInput: byId('dateInput'),
                timeInput: byId('timeInput'),
                zoneSelect: byId('timezoneInput'),
                convertToUnix: byId('convertToUnix'),
                dateResults: byId('dateResults'),
                zoneGrid: byId('zoneGrid'),
                zoneForm: byId('zoneForm'),
                zoneInput: byId('zoneInput'),
                zoneList: byId('zoneList'),
                historyList: byId('historyList'),
                clearHistory: byId('clearHistory'),
                toast: byId('toast'),
                dialog: byId('confirmDialog')
            };
        }

        #bindEvents() {
            const dom = this.#dom;

            dom.copySeconds.addEventListener('click', () => this.#copy(String(Math.floor(Date.now() / 1000))));
            dom.copyMillis.addEventListener('click', () => this.#copy(String(Date.now())));

            dom.convertToDate.addEventListener('click', () => this.#convertUnix(true));
            dom.unixInput.addEventListener('input', () => {
                clearTimeout(this.#inputTimer);
                this.#inputTimer = setTimeout(() => this.#convertUnix(false), 200);
            });
            dom.unixInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') this.#convertUnix(true);
            });
            dom.unixUnit.addEventListener('change', () => this.#convertUnix(false));
            dom.useNow.addEventListener('click', () => {
                dom.unixInput.value = String(Math.floor(Date.now() / 1000));
                dom.unixUnit.value = 'auto';
                this.#convertUnix(true);
            });

            dom.convertToUnix.addEventListener('click', () => this.#convertDate());

            dom.zoneForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.#addZone();
            });
            dom.zoneGrid.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-action]');
                if (!button) return;
                const zone = button.closest('[data-zone]').dataset.zone;
                if (button.dataset.action === 'remove') this.#removeZone(zone);
                else this.#copy(this.#zoneText(zone, Date.now()));
            });

            dom.unixResults.addEventListener('click', (event) => this.#onResultClick(event));
            dom.dateResults.addEventListener('click', (event) => this.#onResultClick(event));
            dom.clearHistory.addEventListener('click', () => this.#clearHistory());

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) clearTimeout(this.#tickTimer);
                else this.#tick();
            });
        }

        async #copy(text) {
            const isCopied = await copyText(text);
            this.#toast.show(this.#i18n.t(isCopied ? 'toast_copied' : 'toast_copy_failed'));
        }

        #onResultClick(event) {
            const button = event.target.closest('button[data-copy]');
            if (button) this.#copy(button.dataset.copy);
        }

        /* ----- clock ----- */

        #tick() {
            clearTimeout(this.#tickTimer);
            const now = Date.now();
            this.#renderClocks(now);
            // wake up right after the next second starts, so the display never lags or skips
            this.#tickTimer = setTimeout(() => this.#tick(), 1000 - (now % 1000) + 5);
        }

        #renderClocks(now) {
            const dom = this.#dom;
            const date = new Date(now);

            dom.digitalTime.textContent = TimeZones.format(now, 'local').slice(11);
            dom.digitalDate.textContent = new Intl.DateTimeFormat(this.#i18n.locale, { dateStyle: 'full' }).format(date);
            dom.digitalGregorian.textContent = TimeZones.format(now, 'local').slice(0, 10);
            dom.tsSeconds.textContent = String(Math.floor(now / 1000));
            dom.tsMillis.textContent = String(now);
            this.#clock.update(date);

            for (const [zone, view] of this.#zoneViews) {
                view.time.textContent = TimeZones.format(now, zone).slice(11);
                view.offset.textContent = TimeZones.formatOffset(TimeZones.offsetMinutes(now, zone));
            }
        }

        /* ----- unix -> date ----- */

        #convertUnix(isExplicit) {
            const { unixInput, unixUnit, unixHint, unixResults } = this.#dom;
            const text = unixInput.value.trim();

            unixHint.textContent = '';
            if (text === '') {
                unixResults.replaceChildren();
                return;
            }

            const parsed = UnixTimestamp.parse(text, unixUnit.value);
            if (!parsed) {
                unixResults.replaceChildren();
                if (isExplicit) this.#toast.show(this.#i18n.t('error_invalid_timestamp'));
                else unixHint.textContent = this.#i18n.t('error_invalid_timestamp');
                return;
            }

            unixHint.textContent = this.#i18n.t('hint_detected_unit', { unit: this.#i18n.t(`unit_${parsed.unit}`) });
            const { ms } = parsed;
            const date = new Date(ms);
            const locale = this.#i18n.locale;
            const jalali = this.#i18n.lang === 'fa' ? 'fa-IR' : 'en-US-u-ca-persian';

            const rows = [
                ['res_local', `${TimeZones.format(ms, 'local')} (${TimeZones.formatOffset(TimeZones.offsetMinutes(ms, 'local'))})`],
                ['res_utc', TimeZones.format(ms, 'UTC')],
                ['res_tehran', TimeZones.format(ms, 'Asia/Tehran')],
                ['res_jalali', new Intl.DateTimeFormat(jalali, { dateStyle: 'full' }).format(date)],
                ['res_iso', date.toISOString()],
                ['res_relative', RelativeTime.format(ms, Date.now(), locale)]
            ];
            unixResults.replaceChildren(...rows.map(([key, value]) => this.#createResult(this.#i18n.t(key), value)));

            if (isExplicit) this.#history.add('unix', `${text} → ${TimeZones.format(ms, 'local')}`);
            if (isExplicit) this.#renderHistory();
        }

        /* ----- date -> unix ----- */

        #convertDate() {
            const { dateInput, timeInput, zoneSelect, dateResults } = this.#dom;

            if (!dateInput.value || !timeInput.value) {
                dateResults.replaceChildren();
                return this.#toast.show(this.#i18n.t('error_date_time_required'));
            }

            const [year, month, day] = dateInput.value.split('-').map(Number);
            const [hour, minute, second = 0] = timeInput.value.split(':').map(Number);
            const ms = TimeZones.wallToInstant({ year, month, day, hour, minute, second }, zoneSelect.value);

            if (!Number.isFinite(ms) || Math.abs(ms) > MAX_ABS_MS) {
                dateResults.replaceChildren();
                return this.#toast.show(this.#i18n.t('error_invalid_date'));
            }

            dateResults.replaceChildren(
                this.#createResult(this.#i18n.t('res_unix_s'), String(Math.floor(ms / 1000))),
                this.#createResult(this.#i18n.t('res_unix_ms'), String(ms)),
                this.#createResult(this.#i18n.t('res_iso'), new Date(ms).toISOString())
            );
            this.#history.add('date', `${dateInput.value} ${timeInput.value} (${zoneSelect.value}) → ${Math.floor(ms / 1000)}`);
            this.#renderHistory();
        }

        #setDefaultDateTime() {
            const now = TimeZones.format(Date.now(), 'local'); // local date and local time, never UTC mixed with local
            this.#dom.dateInput.value = now.slice(0, 10);
            this.#dom.timeInput.value = now.slice(11);
        }

        #createResult(label, value) {
            const row = document.createElement('div');
            row.className = 'result-row';

            const name = document.createElement('span');
            name.className = 'result-label';
            name.textContent = label;

            const text = document.createElement('span');
            text.className = 'result-value';
            text.textContent = value;

            const copy = document.createElement('button');
            copy.type = 'button';
            copy.className = 'btn btn--ghost btn--sm';
            copy.dataset.copy = value;
            copy.textContent = this.#i18n.t('button_copy');

            row.append(name, text, copy);
            return row;
        }

        /* ----- time zones ----- */

        #fillConvertZones() {
            this.#dom.zoneSelect.replaceChildren(...CONVERT_ZONES.map((zone) => {
                const option = document.createElement('option');
                option.value = zone;
                option.textContent = zone === 'local' ? this.#i18n.t('zone_local') : this.#zoneName(zone);
                return option;
            }));
        }

        #fillZoneList() {
            const supported = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
            this.#dom.zoneList.replaceChildren(...supported.map((zone) => {
                const option = document.createElement('option');
                option.value = zone;
                return option;
            }));
        }

        #zoneName(zone) {
            const key = `zone_${zone.replace(/\//g, '_')}`;
            return this.#i18n.has(key) ? this.#i18n.t(key) : zone.split('/').pop().replace(/_/g, ' ');
        }

        #zoneText(zone, ms) {
            return `${TimeZones.format(ms, zone)} ${TimeZones.formatOffset(TimeZones.offsetMinutes(ms, zone))}`;
        }

        #renderZones() {
            const custom = this.#zoneStore.list();
            this.#zoneViews.clear();
            this.#dom.zoneGrid.replaceChildren(...[...DEFAULT_ZONES, ...custom].map((zone) => {
                const isCustom = custom.includes(zone);
                const card = document.createElement('article');
                card.className = 'card zone';
                card.dataset.zone = zone;

                const name = document.createElement('h4');
                name.className = 'zone-name';
                name.textContent = this.#zoneName(zone);

                const time = document.createElement('p');
                time.className = 'zone-time';
                const offset = document.createElement('p');
                offset.className = 'zone-offset muted';

                const actions = document.createElement('div');
                actions.className = 'row zone-actions';
                actions.append(this.#createZoneButton('copy', this.#i18n.t('button_copy'), 'btn btn--secondary btn--sm'));
                if (isCustom) actions.append(this.#createZoneButton('remove', this.#i18n.t('button_remove'), 'btn btn--ghost btn--sm'));

                card.append(name, time, offset, actions);
                this.#zoneViews.set(zone, { time, offset });
                return card;
            }));
        }

        #createZoneButton(action, text, className) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = className;
            button.dataset.action = action;
            button.textContent = text;
            return button;
        }

        #addZone() {
            const { zoneInput } = this.#dom;
            const zone = zoneInput.value.trim();

            if (!TimeZones.isValid(zone) || zone === 'local') return this.#toast.show(this.#i18n.t('error_zone'));
            if (!this.#zoneStore.add(zone)) return this.#toast.show(this.#i18n.t('error_zone_exists'));

            zoneInput.value = '';
            this.#renderZones();
            this.#renderClocks(Date.now());
        }

        #removeZone(zone) {
            this.#zoneStore.remove(zone);
            this.#renderZones();
            this.#renderClocks(Date.now());
        }

        /* ----- history ----- */

        #renderHistory() {
            const items = this.#history.list();
            const dom = this.#dom;
            dom.clearHistory.hidden = items.length === 0;

            if (items.length === 0) {
                const empty = document.createElement('p');
                empty.className = 'empty';
                empty.textContent = this.#i18n.t('history_empty');
                dom.historyList.replaceChildren(empty);
                return;
            }

            const dateFormat = new Intl.DateTimeFormat(this.#i18n.locale, { dateStyle: 'medium', timeStyle: 'short' });
            dom.historyList.replaceChildren(...items.map((item) => {
                const entry = document.createElement('div');
                entry.className = 'history-item';

                const meta = document.createElement('div');
                meta.className = 'history-meta muted';
                meta.textContent = `${this.#i18n.t(`history_${item.type}`)} · ${dateFormat.format(new Date(item.timestamp))}`;

                const content = document.createElement('div');
                content.className = 'history-content';
                content.textContent = item.content;

                entry.append(meta, content);
                return entry;
            }));
        }

        async #clearHistory() {
            const isConfirmed = await this.#confirm.ask({
                title: this.#i18n.t('heading_13'),
                message: this.#i18n.t('confirm_clear_history')
            });
            if (!isConfirmed) return;

            this.#history.clear();
            this.#renderHistory();
            this.#toast.show(this.#i18n.t('toast_history_cleared'));
        }
    }

    new TimeApp().init();
})();
