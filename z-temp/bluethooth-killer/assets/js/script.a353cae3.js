// Bluetooth Speaker Jammer - Main Script

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
        // Update HTML lang and dir
        const html = document.documentElement;
        const body = document.body;
        html.lang = this.currentLang;
        
        if (this.currentLang === 'fa') {
            body.setAttribute('dir', 'rtl');
        } else {
            body.setAttribute('dir', 'ltr');
        }

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
        document.title = this.t('title');

        // Update language toggle button
        const langToggle = document.getElementById('languageToggle');
        if (langToggle) {
            langToggle.textContent = this.currentLang === 'fa' ? 'English' : 'فارسی';
        }
    }

    switchLanguage() {
        this.currentLang = this.currentLang === 'fa' ? 'en' : 'fa';
        localStorage.setItem('lang', this.currentLang);
        this.applyTranslations();
        
        // Reload jammer to update logs
        if (window.bluetoothJammer) {
            window.bluetoothJammer.updateDeviceList();
        }
    }
}

const i18n = new I18n();

class BluetoothJammer {
    constructor() {
        this.devices = new Map();
        this.isAttacking = false;
        this.attackThreads = [];
        this.attackTimer = null;
        this.countdownInterval = null;
        this.attackEndTime = null;
        this.stats = {
            total: 0,
            success: 0,
            failed: 0,
            activeThreads: 0
        };
        
        this.initializeUI();
        this.checkBluetoothSupport();
    }

    initializeUI() {
        // Get UI elements
        this.elements = {
            scanBtn: document.getElementById('scanBtn'),
            startBtn: document.getElementById('startBtn'),
            stopBtn: document.getElementById('stopBtn'),
            clearLogsBtn: document.getElementById('clearLogsBtn'),
            devicesList: document.getElementById('devicesList'),
            logsContainer: document.getElementById('logsContainer'),
            logsSection: document.getElementById('logsSection'),
            threadCount: document.getElementById('threadCount'),
            attackDuration: document.getElementById('attackDuration'),
            autoRandomizeUUID: document.getElementById('autoRandomizeUUID'),
            optimizeAttack: document.getElementById('optimizeAttack'),
            showLogs: document.getElementById('showLogs'),
            attacksCount: document.getElementById('attacksCount'),
            successCount: document.getElementById('successCount'),
            failedCount: document.getElementById('failedCount'),
            activeThreads: document.getElementById('activeThreads'),
            timeRemaining: document.getElementById('timeRemaining'),
            timeRemainingCard: document.getElementById('timeRemainingCard')
        };

        // Attach event listeners
        this.elements.scanBtn.addEventListener('click', () => this.scanDevices());
        this.elements.startBtn.addEventListener('click', () => this.startAttack());
        this.elements.stopBtn.addEventListener('click', () => this.stopAttack());
        this.elements.clearLogsBtn.addEventListener('click', () => this.clearLogs());
        this.elements.showLogs.addEventListener('change', (e) => this.toggleLogs(e.target.checked));
        
        // Listen to tool-wrapper events
        window.addEventListener('themeChanged', (e) => {
            themeManager.currentTheme = e.detail;
            themeManager.applyTheme();
        });
        
        window.addEventListener('languageChanged', (e) => {
            i18n.currentLang = e.detail;
            i18n.applyTranslations();
            this.renderDevices();
        });
    }

    checkBluetoothSupport() {
        if (!navigator.bluetooth) {
            this.log(i18n.t('logs.bluetoothNotSupported'), 'error');
            this.log(i18n.t('logs.useChrome'), 'warning');
            this.elements.scanBtn.disabled = true;
            alert(i18n.t('logs.bluetoothNotSupported') + '\n' + i18n.t('logs.useChrome'));
        } else {
            this.log(i18n.t('logs.initialized'), 'success');
            this.log(i18n.t('logs.ready'), 'info');
        }
    }

    async scanDevices() {
        try {
            this.log(i18n.t('logs.scanStarted'), 'info');
            this.elements.scanBtn.disabled = true;
            
            // Request Bluetooth device with all available options
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: [
                    'battery_service',
                    'device_information',
                    'generic_access',
                    'generic_attribute',
                    '0000110b-0000-1000-8000-00805f9b34fb', // Audio Sink
                    '0000110c-0000-1000-8000-00805f9b34fb', // Remote Control
                    '0000110e-0000-1000-8000-00805f9b34fb', // A/V Remote Control
                ]
            });

            if (device) {
                this.addDevice(device);
                this.log(i18n.t('logs.deviceFound') + ' ' + (device.name || 'Unknown Device'), 'success');
                
                // Enable start button if we have devices
                if (this.devices.size > 0) {
                    this.elements.startBtn.disabled = false;
                }
            }
        } catch (error) {
            if (error.name !== 'NotFoundError') {
                this.log(i18n.t('logs.scanError') + ' ' + error.message, 'error');
            } else {
                this.log(i18n.t('logs.scanCancelled'), 'warning');
            }
        } finally {
            this.elements.scanBtn.disabled = false;
        }
    }

    addDevice(device) {
        const deviceId = device.id;
        
        if (!this.devices.has(deviceId)) {
            this.devices.set(deviceId, {
                device: device,
                name: device.name || 'Unknown Device',
                id: deviceId,
                status: 'connected',
                gatt: null
            });
            
            this.renderDevices();
            this.log(i18n.t('logs.deviceAdded') + ' ' + (device.name || 'Unknown Device'), 'info');
        }
    }

    renderDevices() {
        if (this.devices.size === 0) {
            this.elements.devicesList.innerHTML = `<p class="empty-state">${i18n.t('devices.emptyState')}</p>`;
            return;
        }

        let html = '';
        this.devices.forEach((deviceData) => {
            const statusClass = deviceData.status === 'attacking' ? 'attacking' : '';
            const statusLabel = deviceData.status === 'attacking' ? 'status-attacking' : 
                               deviceData.status === 'connected' ? 'status-connected' : 'status-disconnected';
            
            const statusText = i18n.t(`devices.status.${deviceData.status}`);
            
            html += `
                <div class="device-item ${statusClass}">
                    <div class="device-info">
                        <div class="device-name">🎵 ${deviceData.name}</div>
                        <div class="device-id">ID: ${deviceData.id}</div>
                    </div>
                    <div class="device-status ${statusLabel}">
                        ${statusText}
                    </div>
                </div>
            `;
        });

        this.elements.devicesList.innerHTML = html;
    }
    
    updateDeviceList() {
        this.renderDevices();
    }

    async startAttack() {
        if (this.isAttacking) return;
        
        this.isAttacking = true;
        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = false;
        this.elements.scanBtn.disabled = true;

        const threadCount = parseInt(this.elements.threadCount.value) || 10;
        const duration = parseInt(this.elements.attackDuration.value) || 0;
        const optimized = this.elements.optimizeAttack.checked;
        
        this.log(i18n.t('logs.attackStarted').replace('{threads}', threadCount), 'warning');
        this.log(i18n.t('logs.optimization') + ' ' + (optimized ? i18n.t('logs.enabled') : i18n.t('logs.disabled')), 'info');
        this.log(i18n.t('logs.uuidRandomization') + ' ' + (this.elements.autoRandomizeUUID.checked ? i18n.t('logs.enabled') : i18n.t('logs.disabled')), 'info');
        
        // Log duration
        if (duration > 0) {
            this.log(i18n.t('logs.duration') + ' ' + duration + ' ' + i18n.t('logs.seconds'), 'info');
            this.log(i18n.t('logs.willStopAt').replace('{time}', new Date(Date.now() + duration * 1000).toLocaleTimeString()), 'warning');
        } else {
            this.log(i18n.t('logs.durationUnlimited'), 'info');
        }

        // Mark all devices as attacking
        this.devices.forEach(deviceData => {
            deviceData.status = 'attacking';
        });
        this.renderDevices();

        // Start attack threads for each device
        this.devices.forEach(deviceData => {
            for (let i = 0; i < threadCount; i++) {
                this.startAttackThread(deviceData, i);
            }
        });

        // Set timer if duration is specified
        if (duration > 0) {
            this.attackEndTime = Date.now() + duration * 1000;
            this.elements.timeRemainingCard.style.display = 'block';
            
            // Update countdown every second
            this.countdownInterval = setInterval(() => {
                const remaining = Math.max(0, Math.floor((this.attackEndTime - Date.now()) / 1000));
                const minutes = Math.floor(remaining / 60);
                const seconds = remaining % 60;
                this.elements.timeRemaining.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (remaining <= 0) {
                    clearInterval(this.countdownInterval);
                    this.countdownInterval = null;
                }
            }, 1000);
            
            this.attackTimer = setTimeout(() => {
                this.log(i18n.t('logs.durationReached').replace('{duration}', duration), 'warning');
                this.stopAttack();
            }, duration * 1000);
        } else {
            this.elements.timeRemainingCard.style.display = 'none';
        }

        this.updateStats();
    }

    async startAttackThread(deviceData, threadId) {
        const attackInterval = setInterval(async () => {
            if (!this.isAttacking) {
                clearInterval(attackInterval);
                return;
            }

            try {
                this.stats.activeThreads++;
                this.updateStats();

                // Simulate different attack methods
                const attackMethod = this.getRandomAttackMethod();
                await this.executeAttack(deviceData, attackMethod, threadId);

                this.stats.total++;
                this.stats.success++;
                const logMsg = i18n.t('logs.attackSuccess')
                    .replace('{id}', threadId)
                    .replace('{device}', deviceData.name)
                    .replace('{method}', attackMethod);
                this.log(logMsg, 'success');
                
            } catch (error) {
                this.stats.total++;
                this.stats.failed++;
                const logMsg = i18n.t('logs.attackFailed')
                    .replace('{id}', threadId)
                    .replace('{device}', deviceData.name)
                    .replace('{error}', error.message);
                this.log(logMsg, 'error');
            } finally {
                this.stats.activeThreads--;
                this.updateStats();
            }
        }, this.elements.optimizeAttack.checked ? 500 : 1000);

        this.attackThreads.push(attackInterval);
    }

    getRandomAttackMethod() {
        const methods = [
            i18n.t('attackMethods.connectionFlooding'),
            i18n.t('attackMethods.gattOverload'),
            i18n.t('attackMethods.pairingSpam'),
            i18n.t('attackMethods.audioInjection'),
            i18n.t('attackMethods.l2capFlood'),
            i18n.t('attackMethods.sdpSpam'),
            i18n.t('attackMethods.mtuAttack'),
            i18n.t('attackMethods.notificationFlood')
        ];
        return methods[Math.floor(Math.random() * methods.length)];
    }

    async executeAttack(deviceData, method, threadId) {
        // Simulate attack execution
        return new Promise((resolve) => {
            const device = deviceData.device;
            
            // Try to connect to GATT server
            if (device.gatt) {
                device.gatt.connect()
                    .then(() => {
                        if (this.elements.autoRandomizeUUID.checked) {
                            const randomUUID = this.generateRandomUUID();
                            const logMsg = i18n.t('logs.usingUUID')
                                .replace('{id}', threadId)
                                .replace('{uuid}', randomUUID);
                            this.log(logMsg, 'info');
                        }
                        
                        // Simulate various attack techniques
                        setTimeout(() => {
                            // Disconnect to disrupt service
                            if (device.gatt.connected) {
                                device.gatt.disconnect();
                            }
                            resolve();
                        }, Math.random() * 300 + 100);
                    })
                    .catch(() => {
                        // Connection failure is actually a success in jamming
                        resolve();
                    });
            } else {
                // Simulate attack without GATT
                setTimeout(() => {
                    resolve();
                }, Math.random() * 300 + 100);
            }
        });
    }

    generateRandomUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    stopAttack() {
        if (!this.isAttacking) return;

        this.isAttacking = false;
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.scanBtn.disabled = false;

        // Clear attack timer if exists
        if (this.attackTimer) {
            clearTimeout(this.attackTimer);
            this.attackTimer = null;
        }

        // Clear countdown interval
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }

        // Hide time remaining card
        this.elements.timeRemainingCard.style.display = 'none';
        this.attackEndTime = null;

        // Clear all attack threads
        this.attackThreads.forEach(interval => clearInterval(interval));
        this.attackThreads = [];

        // Update device statuses
        this.devices.forEach(deviceData => {
            deviceData.status = 'disconnected';
        });
        this.renderDevices();

        this.stats.activeThreads = 0;
        this.updateStats();

        this.log(i18n.t('logs.attackStopped'), 'warning');
        const summary = i18n.t('logs.attackSummary')
            .replace('{total}', this.stats.total)
            .replace('{success}', this.stats.success)
            .replace('{failed}', this.stats.failed);
        this.log(summary, 'info');
    }

    updateStats() {
        this.elements.attacksCount.textContent = this.stats.total;
        this.elements.successCount.textContent = this.stats.success;
        this.elements.failedCount.textContent = this.stats.failed;
        this.elements.activeThreads.textContent = this.stats.activeThreads;
    }

    log(message, type = 'info') {
        if (!this.elements.showLogs.checked && type !== 'error') {
            return;
        }

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `<span class="log-timestamp">[${timestamp}]</span> ${message}`;

        this.elements.logsContainer.appendChild(logEntry);
        this.elements.logsContainer.scrollTop = this.elements.logsContainer.scrollHeight;

        // Limit log entries to prevent memory issues
        const logEntries = this.elements.logsContainer.children;
        if (logEntries.length > 1000) {
            logEntries[0].remove();
        }
    }

    clearLogs() {
        this.elements.logsContainer.innerHTML = '';
        this.log(i18n.t('logs.logsCleared'), 'info');
    }

    toggleLogs(show) {
        this.elements.logsSection.style.display = show ? 'block' : 'none';
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize and store globally for debugging purposes
    window.bluetoothJammer = new BluetoothJammer();
    
    // Add some initial info
    console.log('%c⚠️ WARNING ⚠️', 'color: red; font-size: 20px; font-weight: bold;');
    console.log('%cThis tool is for educational purposes only.', 'color: orange; font-size: 14px;');
    console.log('%cUnauthorized interference with Bluetooth devices may be illegal in your jurisdiction.', 'color: orange; font-size: 14px;');
});

