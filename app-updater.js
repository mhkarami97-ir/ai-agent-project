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
            const waiting = this.#registration?.waiting;

            if (waiting) {
                // The new worker activates, controllerchange fires, and the page reloads
                waiting.postMessage({ type: 'SKIP_WAITING' });
            } else {
                this.#reload();
            }
        }

        #showNotification() {
            const notification = document.getElementById('updateNotification');
            notification?.classList.remove('hidden');
            notification?.classList.add('show');
        }

        #hideNotification() {
            const notification = document.getElementById('updateNotification');
            notification?.classList.remove('show');
            notification?.classList.add('hidden');
        }

        #bindUi() {
            const bind = () => {
                document.getElementById('updateButton')?.addEventListener('click', () => this.#applyUpdate());
                document.getElementById('dismissUpdate')?.addEventListener('click', () => this.#hideNotification());
            };

            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', bind);
            } else {
                bind();
            }
        }
    }

    new AppUpdater().init();
})();
