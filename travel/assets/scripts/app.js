(() => {
    'use strict';

    const STORAGE_KEY = 'travelPlannerItinerary';
    const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
    const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
    const REQUEST_TIMEOUT_MS = 10_000;
    const EARTH_RADIUS_KM = 6371;
    const TOAST_DURATION_MS = 1800;

    /** Built-in coordinates: instant and available offline for the most common cities. */
    const BUILTIN_CITIES = Object.freeze({
        tehran: [35.6892, 51.389], تهران: [35.6892, 51.389],
        mashhad: [36.297, 59.6111], مشهد: [36.297, 59.6111],
        isfahan: [32.6525, 51.68], اصفهان: [32.6525, 51.68],
        shiraz: [29.5918, 52.5836], شیراز: [29.5918, 52.5836],
        tabriz: [38.0962, 46.2738], تبریز: [38.0962, 46.2738],
        karaj: [35.84, 50.9391], کرج: [35.84, 50.9391],
        ahvaz: [31.3183, 48.6706], اهواز: [31.3183, 48.6706],
        qom: [34.6416, 50.8746], قم: [34.6416, 50.8746],
        rasht: [37.2669, 49.5881], رشت: [37.2669, 49.5881],
        kerman: [30.2832, 57.0788], کرمان: [30.2832, 57.0788]
    });

    const DIGITS = Object.freeze({
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    });

    /* ---------- Pure logic (no DOM) ---------- */

    class NumberText {
        /** Understands Persian/Arabic digits and digit grouping; returns NaN for anything else. */
        static parse(text) {
            const normalized = String(text)
                .replace(/[۰-۹٠-٩]/g, (digit) => DIGITS[digit])
                .replace(/٫/g, '.')
                .replace(/[,٬،\s]/g, '');
            return /^\d+(\.\d+)?$/.test(normalized) ? Number(normalized) : Number.NaN;
        }
    }

    class Place {
        static key(name) {
            return String(name)
                .replace(/ي/g, 'ی')
                .replace(/ك/g, 'ک')
                .replace(/[\u200c\s]+/g, '')
                .toLowerCase();
        }

        static builtin(name) {
            const coordinates = BUILTIN_CITIES[Place.key(name)];
            return coordinates ? { latitude: coordinates[0], longitude: coordinates[1] } : null;
        }
    }

    class Geometry {
        /** Great-circle (straight line) distance in km. */
        static haversineKm(a, b) {
            const rad = (degrees) => (degrees * Math.PI) / 180;
            const dLat = rad(b.latitude - a.latitude);
            const dLon = rad(b.longitude - a.longitude);
            const h = Math.sin(dLat / 2) ** 2 +
                Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
            return 2 * EARTH_RADIUS_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
        }

        static splitHours(hours) {
            const totalMinutes = Math.round(hours * 60);
            return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
        }
    }

    class RouteApi {
        static geocodingUrl(name, lang) {
            const params = new URLSearchParams({ name: name.trim(), count: '1', language: lang, format: 'json' });
            return `${GEOCODING_URL}?${params}`;
        }

        static routeUrl(from, to) {
            return `${OSRM_URL}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=false`;
        }

        static parseGeocoding(json) {
            const result = json?.results?.[0];
            if (!Number.isFinite(result?.latitude) || !Number.isFinite(result?.longitude)) return null;
            return { latitude: result.latitude, longitude: result.longitude };
        }

        /** @returns {{distanceKm: number, durationHours: number}} */
        static parseRoute(json) {
            const route = json?.routes?.[0];
            if (json?.code !== 'Ok' || !route) throw new Error('No route found');
            return { distanceKm: route.distance / 1000, durationHours: route.duration / 3600 };
        }
    }

    class ItineraryStore {
        list() {
            try {
                const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
                if (!Array.isArray(parsed)) return [];
                // Older entries have no id: give them one so single items can be deleted
                const base = Date.now();
                return parsed.map((raw, index) => ItineraryStore.#normalize(raw, base - index)).filter(Boolean);
            } catch {
                return [];
            }
        }

        add(item) {
            const items = this.list();
            const id = Math.max(Date.now(), (items[0]?.id ?? 0) + 1);
            this.#save([{ ...item, id }, ...items]);
        }

        remove(id) {
            this.#save(this.list().filter((item) => item.id !== id));
        }

        clear() {
            this.#save([]);
        }

        static totals(items) {
            return {
                count: items.length,
                nights: items.reduce((sum, item) => sum + item.nights, 0),
                budget: items.reduce((sum, item) => sum + item.budget, 0)
            };
        }

        static #normalize(raw, fallbackId) {
            const title = String(raw?.title ?? '').trim();
            const nights = Number(raw?.nights);
            const budget = Number(raw?.budget);
            if (!title || !Number.isFinite(nights) || !Number.isFinite(budget)) return null;

            return {
                id: Number.isFinite(Number(raw.id)) && raw.id ? Number(raw.id) : fallbackId,
                title,
                nights,
                budget,
                notes: String(raw.notes ?? '').trim()
            };
        }

        #save(items) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

    const fetchJson = async (url, parentSignal) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        parentSignal?.addEventListener('abort', () => controller.abort(), { once: true });

        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } finally {
            clearTimeout(timer);
        }
    };

    class NotFoundError extends Error {
        constructor(place) {
            super(`Place not found: ${place}`);
            this.place = place;
        }
    }

    class RouteService {
        #lang;

        constructor(lang) {
            this.#lang = lang;
        }

        async resolve(name, signal) {
            const builtin = Place.builtin(name);
            if (builtin) return builtin;

            let coordinates = null;
            try {
                coordinates = RouteApi.parseGeocoding(await fetchJson(RouteApi.geocodingUrl(name, this.#lang), signal));
            } catch (error) {
                if (signal?.aborted) throw error;
                console.warn('geocoding failed', error);
            }
            if (!coordinates) throw new NotFoundError(name);
            return coordinates;
        }

        /** Driving route when available, otherwise the straight-line distance. */
        async measure(from, to, signal) {
            try {
                const route = RouteApi.parseRoute(await fetchJson(RouteApi.routeUrl(from, to), signal));
                return { ...route, source: 'route' };
            } catch (error) {
                if (signal?.aborted) throw error;
                console.warn('routing failed', error);
                return { distanceKm: Geometry.haversineKm(from, to), durationHours: null, source: 'straight' };
            }
        }
    }

    /* ---------- Application ---------- */

    class TravelApp {
        #i18n = new I18n();
        #store = new ItineraryStore();
        #toast;
        #confirm;
        #dom;
        #request = null;

        async init() {
            this.#cacheDom();
            this.#toast = new Toast(this.#dom.toast);
            this.#confirm = new ConfirmDialog(this.#dom.dialog);
            await this.#i18n.load();

            this.#bindEvents();
            this.#renderItineraries();
            window.addEventListener('languageChanged', () => window.location.reload());
        }

        #cacheDom() {
            const byId = (id) => document.getElementById(id);
            this.#dom = {
                distanceForm: byId('distance-form'),
                origin: byId('origin'),
                destination: byId('destination'),
                speed: byId('speed'),
                swap: byId('swapBtn'),
                calculate: byId('calculateBtn'),
                result: byId('distance-result'),
                itineraryForm: byId('itinerary-form'),
                list: byId('itinerary-list'),
                empty: byId('emptyPlans'),
                summary: byId('plans-summary'),
                clear: byId('clear-itinerary'),
                toast: byId('toast'),
                dialog: byId('confirmDialog')
            };
        }

        #bindEvents() {
            const dom = this.#dom;

            dom.distanceForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.#calculate();
            });
            dom.swap.addEventListener('click', () => {
                [dom.origin.value, dom.destination.value] = [dom.destination.value, dom.origin.value];
            });
            dom.itineraryForm.addEventListener('submit', (event) => {
                event.preventDefault();
                this.#savePlan();
            });
            dom.clear.addEventListener('click', () => this.#clearPlans());
            dom.list.addEventListener('click', (event) => {
                const button = event.target.closest('button[data-action="delete"]');
                if (button) this.#deletePlan(Number(button.closest('[data-id]').dataset.id));
            });
        }

        /* ----- distance ----- */

        async #calculate() {
            const { origin, destination, speed } = this.#dom;
            const from = origin.value.trim();
            const to = destination.value.trim();
            const speedKmh = NumberText.parse(speed.value);

            if (!from || !to || !(speedKmh > 0)) return this.#showMessage('error_fields', 'warning');
            if (Place.key(from) === Place.key(to)) return this.#showMessage('error_same_place', 'warning');

            this.#request?.abort();
            this.#request = new AbortController();
            const { signal } = this.#request;
            const service = new RouteService(this.#i18n.lang);

            this.#showMessage('status_loading', 'info');
            this.#dom.calculate.disabled = true;

            try {
                const [start, end] = await Promise.all([service.resolve(from, signal), service.resolve(to, signal)]);
                const measured = await service.measure(start, end, signal);
                this.#renderResult({ from, to, speedKmh, ...measured });
            } catch (error) {
                if (signal.aborted) return;
                if (error instanceof NotFoundError) {
                    this.#showMessage('error_place_not_found', 'danger', { place: error.place });
                } else {
                    console.warn('calculation failed', error);
                    this.#showMessage('error_generic', 'danger');
                }
            } finally {
                if (this.#request.signal === signal) this.#dom.calculate.disabled = false;
            }
        }

        #showMessage(key, variant, params) {
            const message = document.createElement('p');
            message.className = `alert alert--${variant}`;
            message.textContent = this.#i18n.t(key, params);
            this.#dom.result.replaceChildren(message);
        }

        #renderResult({ from, to, speedKmh, distanceKm, durationHours, source }) {
            const number = new Intl.NumberFormat(this.#i18n.locale, { maximumFractionDigits: 0 });
            const result = this.#dom.result;

            const title = document.createElement('h4');
            title.className = 'result-route';
            title.textContent = this.#i18n.t('result_route', { from, to });

            const distance = document.createElement('p');
            distance.className = 'result-distance';
            distance.textContent = this.#i18n.t('result_distance', { km: number.format(Math.round(distanceKm)) });

            const badge = document.createElement('span');
            badge.className = source === 'route' ? 'badge badge--success' : 'badge badge--warning';
            badge.textContent = this.#i18n.t(source === 'route' ? 'source_route' : 'source_straight');

            const times = document.createElement('ul');
            times.className = 'result-times';
            times.append(this.#createTime('time_at_speed', distanceKm / speedKmh, { speed: number.format(speedKmh) }));
            if (durationHours !== null) times.append(this.#createTime('time_estimated', durationHours));

            result.replaceChildren(title, distance, badge, times);

            if (source === 'straight') {
                const note = document.createElement('p');
                note.className = 'hint';
                note.textContent = this.#i18n.t('note_straight');
                result.append(note);
            }
        }

        #createTime(labelKey, hours, params = {}) {
            const { hours: h, minutes: m } = Geometry.splitHours(hours);
            const number = new Intl.NumberFormat(this.#i18n.locale);
            const item = document.createElement('li');

            const label = document.createElement('span');
            label.className = 'muted';
            label.textContent = this.#i18n.t(labelKey, params);

            const value = document.createElement('strong');
            value.textContent = this.#i18n.t('duration', { h: number.format(h), m: number.format(m) });

            item.append(label, value);
            return item;
        }

        /* ----- itinerary ----- */

        #savePlan() {
            const form = this.#dom.itineraryForm;
            const data = new FormData(form);
            const nights = NumberText.parse(data.get('nights'));
            const budget = NumberText.parse(data.get('budget'));
            const title = String(data.get('title')).trim();

            if (!title || !(nights >= 1) || !(budget >= 1)) return this.#toast.show(this.#i18n.t('error_plan_fields'));

            this.#store.add({ title, nights: Math.floor(nights), budget, notes: String(data.get('notes')).trim() });
            form.reset();
            this.#renderItineraries();
            this.#toast.show(this.#i18n.t('toast_saved'));
        }

        #deletePlan(id) {
            this.#store.remove(id);
            this.#renderItineraries();
            this.#toast.show(this.#i18n.t('toast_deleted'));
        }

        async #clearPlans() {
            if (this.#store.list().length === 0) return;

            const isConfirmed = await this.#confirm.ask({
                title: this.#i18n.t('button_2'),
                message: this.#i18n.t('confirm_clear')
            });
            if (!isConfirmed) return;

            this.#store.clear();
            this.#renderItineraries();
            this.#toast.show(this.#i18n.t('toast_cleared'));
        }

        #renderItineraries() {
            const items = this.#store.list();
            const number = new Intl.NumberFormat(this.#i18n.locale);
            const totals = ItineraryStore.totals(items);

            this.#dom.empty.hidden = items.length > 0;
            this.#dom.clear.hidden = items.length === 0;
            this.#dom.summary.hidden = items.length === 0;
            this.#dom.summary.textContent = this.#i18n.t('plans_summary', {
                count: number.format(totals.count),
                nights: number.format(totals.nights),
                budget: number.format(totals.budget)
            });
            this.#dom.list.replaceChildren(...items.map((item) => this.#createPlan(item, number)));
        }

        #createPlan(item, number) {
            const article = document.createElement('li');
            article.className = 'plan';
            article.dataset.id = String(item.id);

            const title = document.createElement('strong');
            title.className = 'plan-title';
            title.textContent = item.title;

            const meta = document.createElement('div');
            meta.className = 'row plan-meta';
            const nights = document.createElement('span');
            nights.className = 'badge';
            nights.textContent = this.#i18n.t('plan_nights', { n: number.format(item.nights) });
            const budget = document.createElement('span');
            budget.className = 'badge badge--success';
            budget.textContent = this.#i18n.t('plan_budget', { amount: number.format(item.budget) });
            const toman = document.createElement('span');
            toman.className = 'muted';
            toman.textContent = this.#i18n.t('plan_toman', { amount: number.format(Math.round(item.budget / 10)) });
            meta.append(nights, budget, toman);

            const notes = document.createElement('p');
            notes.className = 'plan-notes';
            notes.textContent = item.notes || this.#i18n.t('plan_no_notes');

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'btn btn--danger btn--sm plan-delete';
            remove.dataset.action = 'delete';
            remove.textContent = this.#i18n.t('button_delete');

            article.append(title, meta, notes, remove);
            return article;
        }
    }

    new TravelApp().init();
})();
