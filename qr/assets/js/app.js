(() => {
    'use strict';

    const SETTINGS_KEY = 'qr-app-settings';
    const JSQR_URL = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
    const TOAST_DURATION_MS = 1800;
    const RENDER_DELAY_MS = 150;
    const SCAN_INTERVAL_MS = 160;
    const MAX_DECODE_SIZE = 1280;
    const MIN_CONTRAST = 3;

    const DEFAULT_SETTINGS = Object.freeze({
        text: 'https://example.com',
        color: '#111827',
        bg: '#ffffff',
        size: 240,
        level: 'M'
    });
    const ERROR_LEVELS = Object.freeze(['L', 'M', 'Q', 'H']);

    /* ---------- Pure logic (no DOM) ---------- */

    class Color {
        static normalize(value) {
            let hex = String(value ?? '').trim().replace(/^#/, '');
            if (/^[0-9a-f]{3}$/i.test(hex)) hex = [...hex].map((char) => char + char).join('');
            return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
        }

        /** WCAG relative luminance. */
        static luminance(hex) {
            const [r, g, b] = [1, 3, 5].map((start) => {
                const channel = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
                return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }

        /** WCAG contrast ratio, from 1 (identical) to 21 (black on white). */
        static contrast(a, b) {
            const [light, dark] = [Color.luminance(a), Color.luminance(b)].sort((x, y) => y - x);
            return (light + 0.05) / (dark + 0.05);
        }

        /** @returns {'ok'|'low'|'inverted'} */
        static assessQr(darkHex, lightHex) {
            if (Color.contrast(darkHex, lightHex) < MIN_CONTRAST) return 'low';
            // Some scanners cannot read light modules on a dark background
            return Color.luminance(darkHex) > Color.luminance(lightHex) ? 'inverted' : 'ok';
        }
    }

    class LinkGuard {
        /** Returns a URL only for http(s) links, never for javascript:, data:, etc. */
        static parse(text) {
            const value = String(text ?? '').trim();
            if (!/^https?:\/\//i.test(value)) return null;
            try {
                return new URL(value);
            } catch {
                return null;
            }
        }
    }

    class SettingsStore {
        load() {
            try {
                const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
                if (!saved || typeof saved !== 'object') return { ...DEFAULT_SETTINGS };

                return {
                    text: typeof saved.text === 'string' ? saved.text : DEFAULT_SETTINGS.text,
                    color: Color.normalize(saved.color) ?? DEFAULT_SETTINGS.color,
                    bg: Color.normalize(saved.bg) ?? DEFAULT_SETTINGS.bg,
                    size: [200, 240, 320, 512, 1024].includes(Number(saved.size)) ? Number(saved.size) : DEFAULT_SETTINGS.size,
                    level: ERROR_LEVELS.includes(saved.level) ? saved.level : DEFAULT_SETTINGS.level
                };
            } catch {
                return { ...DEFAULT_SETTINGS };
            }
        }

        save(settings) {
            try {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            } catch {
                // storage blocked: settings are a convenience only
            }
        }
    }

    /* ---------- Services ---------- */

    class I18n {
        #translations = {};
        #lang = localStorage.getItem('lang') || 'fa';

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

    class ScriptLoader {
        static #loading = new Map();

        static load(src) {
            if (!ScriptLoader.#loading.has(src)) {
                ScriptLoader.#loading.set(src, new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = src;
                    script.crossOrigin = 'anonymous';
                    script.onload = resolve;
                    script.onerror = () => {
                        ScriptLoader.#loading.delete(src); // allow a retry after a network failure
                        reject(new Error(`Could not load ${src}`));
                    };
                    document.head.append(script);
                }));
            }
            return ScriptLoader.#loading.get(src);
        }
    }

    /**
     * Reads QR codes. Prefers the browser's native BarcodeDetector (fast, works offline)
     * and falls back to jsQR, which is downloaded only when it is really needed.
     */
    class QrDecoder {
        #detector = null;
        #jsQr = null;
        #canvas = document.createElement('canvas');
        #context = this.#canvas.getContext('2d', { willReadFrequently: true });
        #ready = null;

        /** @returns {Promise<string|null>} decoded text, or null when no code was found */
        async decode(source, { tryInverted = false } = {}) {
            await (this.#ready ??= this.#prepare());

            if (this.#detector) {
                try {
                    const codes = await this.#detector.detect(source);
                    if (codes.length > 0) return codes[0].rawValue;
                    if (!tryInverted) return null;
                } catch {
                    this.#detector = null; // native detection failed: switch to jsQR for good
                    await (this.#ready = this.#prepare());
                }
            }
            return this.#decodeWithJsQr(source, tryInverted);
        }

        async #prepare() {
            if (!this.#detector && 'BarcodeDetector' in window) {
                try {
                    const formats = await BarcodeDetector.getSupportedFormats();
                    if (formats.includes('qr_code')) {
                        this.#detector = new BarcodeDetector({ formats: ['qr_code'] });
                        return;
                    }
                } catch {
                    // fall through to jsQR
                }
            }
            if (typeof window.jsQR !== 'function') await ScriptLoader.load(JSQR_URL);
            if (typeof window.jsQR !== 'function') throw new Error('jsQR unavailable');
            this.#jsQr = window.jsQR;
        }

        #decodeWithJsQr(source, tryInverted) {
            if (!this.#jsQr) throw new Error('jsQR unavailable');

            const width = source.videoWidth ?? source.naturalWidth ?? source.width;
            const height = source.videoHeight ?? source.naturalHeight ?? source.height;
            const scale = Math.min(1, MAX_DECODE_SIZE / Math.max(width, height));
            const targetWidth = Math.max(1, Math.round(width * scale));
            const targetHeight = Math.max(1, Math.round(height * scale));

            if (this.#canvas.width !== targetWidth) this.#canvas.width = targetWidth;
            if (this.#canvas.height !== targetHeight) this.#canvas.height = targetHeight;

            this.#context.drawImage(source, 0, 0, targetWidth, targetHeight);
            const { data } = this.#context.getImageData(0, 0, targetWidth, targetHeight);
            const code = this.#jsQr(data, targetWidth, targetHeight, {
                inversionAttempts: tryInverted ? 'attemptBoth' : 'dontInvert'
            });
            return code ? code.data : null;
        }
    }

    /* ---------- Generator ---------- */

    class QrGenerator {
        #dom;
        #i18n;
        #toast;
        #store = new SettingsStore();
        #timer = 0;

        constructor(i18n, toast) {
            this.#i18n = i18n;
            this.#toast = toast;
            const byId = (id) => document.getElementById(id);
            this.#dom = {
                form: byId('qr-generator'),
                text: byId('qr-text'),
                color: byId('qr-color'),
                bg: byId('qr-bg'),
                size: byId('qr-size'),
                level: byId('qr-level'),
                canvas: byId('qr-canvas'),
                status: byId('generator-status'),
                warning: byId('contrast-warning'),
                download: byId('download-btn'),
                copy: byId('copy-btn')
            };
        }

        init() {
            const dom = this.#dom;
            const settings = this.#store.load();
            dom.text.value = settings.text;
            dom.color.value = settings.color;
            dom.bg.value = settings.bg;
            dom.size.value = String(settings.size);
            dom.level.value = settings.level;

            dom.form.addEventListener('submit', (event) => {
                event.preventDefault();
                this.render();
            });
            dom.text.addEventListener('input', () => this.#scheduleRender());
            for (const input of [dom.color, dom.bg, dom.size, dom.level]) {
                input.addEventListener('input', () => this.#scheduleRender());
            }
            dom.download.addEventListener('click', () => this.#download());
            dom.copy.addEventListener('click', () => this.#copy());

            this.render();
        }

        #scheduleRender() {
            clearTimeout(this.#timer);
            this.#timer = setTimeout(() => this.render(), RENDER_DELAY_MS);
        }

        async render() {
            const dom = this.#dom;
            const value = dom.text.value.trim();

            this.#store.save({
                text: dom.text.value,
                color: dom.color.value,
                bg: dom.bg.value,
                size: Number(dom.size.value),
                level: dom.level.value
            });
            this.#updateWarning();

            if (!window.QRCode) return this.#setStatus('error_library');
            if (!value) {
                dom.canvas.getContext('2d').clearRect(0, 0, dom.canvas.width, dom.canvas.height);
                dom.download.disabled = true;
                dom.copy.disabled = true;
                return this.#setStatus('status_empty');
            }

            try {
                const size = Number(dom.size.value);
                dom.canvas.width = dom.canvas.height = size;
                await window.QRCode.toCanvas(dom.canvas, value, {
                    margin: 1,
                    width: size,
                    errorCorrectionLevel: dom.level.value,
                    color: { dark: dom.color.value, light: dom.bg.value }
                });
                dom.download.disabled = false;
                dom.copy.disabled = false;
                this.#setStatus('status_ready');
            } catch (error) {
                console.warn('QR generation failed', error);
                dom.download.disabled = true;
                this.#setStatus('error_too_long');
            }
        }

        #updateWarning() {
            const { color, bg, warning } = this.#dom;
            const verdict = Color.assessQr(color.value, bg.value);
            warning.hidden = verdict === 'ok';
            if (verdict !== 'ok') warning.textContent = this.#i18n.t(`warning_${verdict}`);
        }

        #setStatus(key) {
            this.#dom.status.textContent = this.#i18n.t(key);
        }

        #download() {
            const link = document.createElement('a');
            link.href = this.#dom.canvas.toDataURL('image/png');
            link.download = 'qr-code.png';
            link.click();
        }

        async #copy() {
            const isCopied = await copyText(this.#dom.text.value.trim());
            this.#toast.show(this.#i18n.t(isCopied ? 'toast_copied' : 'toast_copy_failed'));
        }
    }

    /* ---------- Reader ---------- */

    class QrReader {
        #dom;
        #i18n;
        #toast;
        #decoder = new QrDecoder();
        #stream = null;
        #scanTimer = 0;
        #isScanning = false;
        #output = '';

        constructor(i18n, toast) {
            this.#i18n = i18n;
            this.#toast = toast;
            const byId = (id) => document.getElementById(id);
            this.#dom = {
                file: byId('qr-file'),
                start: byId('start-camera'),
                stop: byId('stop-camera'),
                cameraBox: byId('camera-box'),
                video: byId('qr-video'),
                status: byId('reader-status'),
                output: byId('reader-output'),
                open: byId('open-link'),
                copy: byId('copy-result'),
                linkHint: byId('link-hint')
            };
        }

        init() {
            const dom = this.#dom;
            dom.file.addEventListener('change', () => this.#readFile(dom.file.files[0]));
            dom.start.addEventListener('click', () => this.#startCamera());
            dom.stop.addEventListener('click', () => this.stopCamera());
            dom.open.addEventListener('click', () => this.#openLink());
            dom.copy.addEventListener('click', () => this.#copyResult());

            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this.stopCamera();
            });
            window.addEventListener('pagehide', () => this.stopCamera());
        }

        /* ----- still images ----- */

        async #readFile(file) {
            if (!file) return;
            this.#setStatus('status_reading');

            let bitmap = null;
            try {
                bitmap = await createImageBitmap(file);
                const text = await this.#decoder.decode(bitmap, { tryInverted: true });
                if (text === null) {
                    this.#showResult('');
                    return this.#setStatus('status_not_found');
                }
                this.#showResult(text);
            } catch (error) {
                console.warn('read failed', error);
                this.#setStatus(error.message === 'jsQR unavailable' || error.message?.startsWith('Could not load')
                    ? 'error_reader_library'
                    : 'error_image');
            } finally {
                bitmap?.close();
                this.#dom.file.value = '';
            }
        }

        /* ----- camera ----- */

        async #startCamera() {
            if (!navigator.mediaDevices?.getUserMedia) return this.#setStatus('error_camera_unsupported');

            this.#setStatus('status_camera_starting');
            try {
                this.#stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false
                });
            } catch (error) {
                return this.#setStatus(error.name === 'NotFoundError' ? 'error_camera_missing' : 'error_camera_denied');
            }

            const { video, cameraBox, start, stop } = this.#dom;
            video.srcObject = this.#stream;
            await video.play().catch(() => {});
            cameraBox.hidden = false;
            start.disabled = true;
            stop.disabled = false;
            this.#setStatus('status_scanning');
            this.#scheduleScan();
        }

        stopCamera() {
            clearTimeout(this.#scanTimer);
            this.#scanTimer = 0;
            this.#stream?.getTracks().forEach((track) => track.stop());
            this.#stream = null;

            const { video, cameraBox, start, stop } = this.#dom;
            video.srcObject = null;
            cameraBox.hidden = true;
            start.disabled = false;
            stop.disabled = true;
        }

        #scheduleScan() {
            this.#scanTimer = setTimeout(() => this.#scanFrame(), SCAN_INTERVAL_MS);
        }

        async #scanFrame() {
            const { video } = this.#dom;
            if (!this.#stream) return;
            if (this.#isScanning || video.readyState < video.HAVE_ENOUGH_DATA) return this.#scheduleScan();

            this.#isScanning = true;
            try {
                const text = await this.#decoder.decode(video);
                if (text !== null) {
                    this.stopCamera();
                    this.#showResult(text);
                    return;
                }
            } catch (error) {
                console.warn('scan failed', error);
                this.stopCamera();
                return this.#setStatus('error_reader_library');
            } finally {
                this.#isScanning = false;
            }
            if (this.#stream) this.#scheduleScan();
        }

        /* ----- result ----- */

        #setStatus(key) {
            this.#dom.status.textContent = this.#i18n.t(key);
        }

        #showResult(text) {
            const { output, open, copy, linkHint } = this.#dom;
            const url = LinkGuard.parse(text);

            this.#output = text;
            output.textContent = text || this.#i18n.t('result_empty');
            open.disabled = url === null;
            copy.disabled = text === '';
            linkHint.hidden = url === null;
            if (url) linkHint.textContent = this.#i18n.t('link_hint', { host: url.hostname });
            if (text) this.#setStatus('status_found');
        }

        #openLink() {
            const url = LinkGuard.parse(this.#output);
            if (url) window.open(url.href, '_blank', 'noopener,noreferrer');
        }

        async #copyResult() {
            const isCopied = await copyText(this.#output);
            this.#toast.show(this.#i18n.t(isCopied ? 'toast_copied' : 'toast_copy_failed'));
        }
    }

    /* ---------- Application ---------- */

    class QrApp {
        async init() {
            const i18n = new I18n();
            const toast = new Toast(document.getElementById('toast'));
            await i18n.load();

            new QrGenerator(i18n, toast).init();
            new QrReader(i18n, toast).init();
            window.addEventListener('languageChanged', () => window.location.reload());
        }
    }

    new QrApp().init();
})();
