(function () {
    'use strict';

    if (!('serviceWorker' in navigator)) return;

    class AppUpdater {
        static #UPDATE_INTERVAL_MS = 60000;

        #registration = null;
        #hadController = Boolean(navigator.serviceWorker.controller);
        #isReloading = false;

        init() {
            window.addEventListener('load', () => this.#register());
            navigator.serviceWorker.addEventListener('controllerchange', () => this.#onControllerChange());
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') this.#registration?.update();
            });
            this.#bindUi();
        }

        async #register() {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
                this.#registration = registration;
                console.log('SW registered:', registration);

                // A worker may already be waiting from a previous visit
                if (registration.waiting && navigator.serviceWorker.controller) {
                    this.#showNotification();
                }

                registration.addEventListener('updatefound', () => this.#trackInstalling(registration.installing));
                setInterval(() => registration.update(), AppUpdater.#UPDATE_INTERVAL_MS);
            } catch (error) {
                console.log('SW registration failed:', error);
            }
        }

        #trackInstalling(worker) {
            worker.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.#showNotification();
                }
            });
        }

        #onControllerChange() {
            // The first install also fires controllerchange (clients.claim); do not reload then
            if (!this.#hadController) return;
            this.#reload();
        }

        #reload() {
            if (this.#isReloading) return;
            this.#isReloading = true;
            window.location.reload();
        }

        #applyUpdate() {
            const btn = document.getElementById('updateButton');
            if (btn) {
                btn.disabled = true;
                btn.classList.add('loading');
                btn.innerHTML = '<span>در حال اعمال...</span>';
            }

            const waiting = this.#registration?.waiting;
            if (waiting) {
                // The new worker activates, controllerchange fires, and the page reloads
                waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                this.#reload();
            }
        }

        #ensureNotificationElement() {
            let notification = document.getElementById('updateNotification');
            if (!notification) {
                notification = document.createElement('div');
                notification.id = 'updateNotification';
                notification.className = 'update-notification hidden';
                notification.setAttribute('role', 'alert');
                notification.setAttribute('aria-live', 'polite');
                notification.innerHTML = `
                    <div class="update-content">
                        <div class="update-icon-wrap" aria-hidden="true">
                            <svg class="update-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                                <path d="M3 3v5h5"/>
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
                                <path d="M16 21h5v-5"/>
                            </svg>
                            <span class="update-pulse-dot"></span>
                        </div>
                        <div class="update-text">
                            <div class="update-title-row">
                                <strong class="update-title">نسخه جدید در دسترس است</strong>
                                <span class="update-badge">PWA</span>
                            </div>
                            <p class="update-desc">برای دریافت آخرین تغییرات و بهبودها، برنامه را به‌روزرسانی کنید.</p>
                        </div>
                        <div class="update-actions">
                            <button id="updateButton" class="update-button" type="button">
                                <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 2v6h-6"/>
                                    <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
                                    <path d="M3 22v-6h6"/>
                                    <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
                                </svg>
                                <span>به‌روزرسانی</span>
                            </button>
                            <button id="dismissUpdate" class="dismiss-button" type="button" title="بستن" aria-label="بستن اعلان">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>`;
                document.body.appendChild(notification);
                this.#bindUi();
            }
            return notification;
        }

        #showNotification() {
            const notification = this.#ensureNotificationElement();
            notification.classList.remove('hidden');
            requestAnimationFrame(() => {
                notification.classList.add('show');
            });
        }

        #hideNotification() {
            const notification = document.getElementById('updateNotification');
            if (!notification) return;
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 350);
        }

        #bindUi() {
            document.getElementById('updateButton')?.addEventListener('click', () => this.#applyUpdate());
            document.getElementById('dismissUpdate')?.addEventListener('click', () => this.#hideNotification());
        }
    }

    if (!window.__appUpdaterInitialized) {
        window.__appUpdaterInitialized = true;
        new AppUpdater().init();
    }
})();
