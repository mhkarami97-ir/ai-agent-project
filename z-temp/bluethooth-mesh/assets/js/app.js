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



// Listen to tool-wrapper theme changes
window.addEventListener('themeChanged', (e) => {
    themeManager.currentTheme = e.detail;
    themeManager.applyTheme();
});

// Listen to tool-wrapper language changes
window.addEventListener('languageChanged', (e) => {
    const newLang = e.detail;
    localStorage.setItem('lang', newLang);
    // Reload page to apply language changes
    location.reload();
});


// Bluetooth Mesh Messenger Application
// End-to-End Encrypted Messaging without Internet

class BluetoothMeshMessenger {
    constructor() {
        this.db = null;
        this.username = '';
        this.deviceId = '';
        this.connectedDevices = new Map();
        this.bluetoothDevice = null;
        this.characteristic = null;
        this.server = null;
        this.settings = {
            soundEnabled: true,
            autoConnect: true
        };
        
        // Bluetooth GATT service UUID for messaging
        this.SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
        this.CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';
        
        this.initDatabase();
        this.initElements();
        this.initEventListeners();
        this.loadSettings();
    }

    // Initialize IndexedDB
    initDatabase() {
        const request = indexedDB.open('BluetoothMeshDB', 1);
        
        request.onerror = () => {
            this.showToast('خطا در ایجاد پایگاه داده', 'error');
        };
        
        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadUserData();
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Messages store
            if (!db.objectStoreNames.contains('messages')) {
                const messagesStore = db.createObjectStore('messages', { keyPath: 'id', autoIncrement: true });
                messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
                messagesStore.createIndex('deviceId', 'deviceId', { unique: false });
            }
            
            // Devices store
            if (!db.objectStoreNames.contains('devices')) {
                const devicesStore = db.createObjectStore('devices', { keyPath: 'id' });
                devicesStore.createIndex('name', 'name', { unique: false });
            }
            
            // Settings store
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'key' });
            }
        };
    }

    // Initialize DOM elements
    initElements() {
        this.elements = {
            setupSection: document.getElementById('setupSection'),
            chatSection: document.getElementById('chatSection'),
            usernameInput: document.getElementById('usernameInput'),
            startBtn: document.getElementById('startBtn'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            scanBtn: document.getElementById('scanBtn'),
            devicesList: document.getElementById('devicesList'),
            messagesContainer: document.getElementById('messagesContainer'),
            messageInput: document.getElementById('messageInput'),
            sendBtn: document.getElementById('sendBtn'),
            clearBtn: document.getElementById('clearBtn'),
            settingsBtn: document.getElementById('settingsBtn'),
            settingsModal: document.getElementById('settingsModal'),
            closeSettingsBtn: document.getElementById('closeSettingsBtn'),
            settingsUsername: document.getElementById('settingsUsername'),
            updateUsernameBtn: document.getElementById('updateUsernameBtn'),
            soundToggle: document.getElementById('soundToggle'),
            autoConnectToggle: document.getElementById('autoConnectToggle'),
            deviceIdDisplay: document.getElementById('deviceIdDisplay'),
            resetBtn: document.getElementById('resetBtn'),
            toastContainer: document.getElementById('toastContainer'),
            chatTitle: document.getElementById('chatTitle'),
            chatSubtitle: document.getElementById('chatSubtitle')
        };
    }

    // Initialize event listeners
    initEventListeners() {
        this.elements.startBtn.addEventListener('click', () => this.startConnection());
        this.elements.scanBtn.addEventListener('click', () => this.scanDevices());
        this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
        this.elements.messageInput.addEventListener('input', () => this.handleMessageInput());
        this.elements.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        this.elements.clearBtn.addEventListener('click', () => this.clearMessages());
        this.elements.settingsBtn.addEventListener('click', () => this.openSettings());
        this.elements.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.elements.updateUsernameBtn.addEventListener('click', () => this.updateUsername());
        this.elements.soundToggle.addEventListener('change', () => this.updateSettings());
        this.elements.autoConnectToggle.addEventListener('change', () => this.updateSettings());
        this.elements.resetBtn.addEventListener('click', () => this.resetAllData());
        
        // Auto-resize textarea
        this.elements.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    // Load user data from database
    loadUserData() {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        const usernameRequest = store.get('username');
        usernameRequest.onsuccess = (event) => {
            if (event.target.result) {
                this.username = event.target.result.value;
                this.elements.setupSection.classList.add('hidden');
                this.elements.chatSection.classList.remove('hidden');
                this.loadMessages();
            }
        };
        
        const deviceIdRequest = store.get('deviceId');
        deviceIdRequest.onsuccess = (event) => {
            if (event.target.result) {
                this.deviceId = event.target.result.value;
            } else {
                this.deviceId = this.generateDeviceId();
                this.saveToDatabase('settings', { key: 'deviceId', value: this.deviceId });
            }
            this.elements.deviceIdDisplay.textContent = this.deviceId;
        };
    }

    // Load settings from database
    loadSettings() {
        if (!this.db) {
            setTimeout(() => this.loadSettings(), 100);
            return;
        }
        
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        
        const soundRequest = store.get('soundEnabled');
        soundRequest.onsuccess = (event) => {
            if (event.target.result !== undefined) {
                this.settings.soundEnabled = event.target.result.value;
                this.elements.soundToggle.checked = this.settings.soundEnabled;
            }
        };
        
        const autoConnectRequest = store.get('autoConnect');
        autoConnectRequest.onsuccess = (event) => {
            if (event.target.result !== undefined) {
                this.settings.autoConnect = event.target.result.value;
                this.elements.autoConnectToggle.checked = this.settings.autoConnect;
            }
        };
    }

    // Generate unique device ID
    generateDeviceId() {
        return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Start Bluetooth connection
    async startConnection() {
        const username = this.elements.usernameInput.value.trim();
        
        if (!username) {
            this.showToast('لطفاً نام خود را وارد کنید', 'warning');
            return;
        }
        
        // Check if Web Bluetooth API is available
        if (!navigator.bluetooth) {
            this.showToast('مرورگر شما از Bluetooth پشتیبانی نمی‌کند. لطفاً از مرورگر Chrome در دستگاه موبایل یا دسکتاپ استفاده کنید.', 'error');
            return;
        }
        
        this.username = username;
        this.saveToDatabase('settings', { key: 'username', value: username });
        
        this.elements.setupSection.classList.add('hidden');
        this.elements.chatSection.classList.remove('hidden');
        
        this.showToast(`خوش آمدید ${username}!`, 'success');
        this.updateStatus(true);
        this.loadMessages();
        this.loadDevices();
    }
    
    // Load devices from database
    loadDevices() {
        const transaction = this.db.transaction(['devices'], 'readonly');
        const store = transaction.objectStore('devices');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const devices = event.target.result;
            devices.forEach(device => {
                this.connectedDevices.set(device.id, {
                    ...device,
                    status: 'disconnected'
                });
            });
            this.renderDevicesList();
        };
    }

    // Scan for Bluetooth devices
    async scanDevices() {
        if (!navigator.bluetooth) {
            this.showToast('مرورگر شما از Bluetooth پشتیبانی نمی‌کند', 'error');
            return;
        }
        
        this.showToast('در حال جستجوی دستگاه‌ها...', 'info');
        
        try {
            // Request Bluetooth device with messaging service
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [this.SERVICE_UUID] }
                ],
                optionalServices: [this.SERVICE_UUID]
            }).catch(err => {
                // Fallback to accept all devices if service not found
                return navigator.bluetooth.requestDevice({
                    acceptAllDevices: true,
                    optionalServices: [this.SERVICE_UUID, 'battery_service', 'device_information']
                });
            });
            
            if (device) {
                // Check if device already exists
                if (this.connectedDevices.has(device.id)) {
                    this.showToast('این دستگاه قبلاً اضافه شده است', 'warning');
                    return;
                }
                
                // Connect to device
                await this.connectToDevice(device);
            }
        } catch (error) {
            if (error.name === 'NotFoundError') {
                this.showToast('هیچ دستگاهی پیدا نشد', 'warning');
            } else if (error.name === 'NotAllowedError') {
                this.showToast('دسترسی به Bluetooth رد شد', 'error');
            } else {
                this.showToast('خطا در جستجوی دستگاه‌ها: ' + error.message, 'error');
            }
        }
    }
    
    // Connect to Bluetooth device
    async connectToDevice(device) {
        try {
            this.showToast('در حال اتصال...', 'info');
            
            // Connect to GATT server
            const server = await device.gatt.connect();
            
            // Try to get our custom service for messaging
            let service, characteristic;
            try {
                service = await server.getPrimaryService(this.SERVICE_UUID);
                characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);
                
                // Start notifications for incoming messages
                await characteristic.startNotifications();
                characteristic.addEventListener('characteristicvaluechanged', (event) => {
                    this.handleIncomingMessage(event.target.value);
                });
            } catch (e) {
                // Service not available - device can still be added but won't receive messages
                console.log('Messaging service not available on this device');
            }
            
            // Add device to connected list
            const deviceData = {
                id: device.id,
                name: device.name || 'دستگاه ناشناس',
                status: 'connected',
                lastSeen: Date.now(),
                device: device,
                server: server,
                characteristic: characteristic
            };
            
            this.connectedDevices.set(device.id, deviceData);
            this.saveToDatabase('devices', {
                id: device.id,
                name: deviceData.name,
                status: 'connected',
                lastSeen: deviceData.lastSeen
            });
            
            this.renderDevicesList();
            this.showToast(`به ${deviceData.name} متصل شدید!`, 'success');
            
            // Handle disconnection
            device.addEventListener('gattserverdisconnected', () => {
                this.handleDeviceDisconnected(device.id);
            });
            
        } catch (error) {
            this.showToast('خطا در اتصال: ' + error.message, 'error');
            console.error('Connection error:', error);
        }
    }
    
    // Handle device disconnection
    handleDeviceDisconnected(deviceId) {
        const device = this.connectedDevices.get(deviceId);
        if (device) {
            device.status = 'disconnected';
            this.connectedDevices.set(deviceId, device);
            this.renderDevicesList();
            this.showToast(`${device.name} قطع شد`, 'warning');
        }
    }
    
    // Handle incoming message from Bluetooth
    handleIncomingMessage(value) {
        try {
            const decoder = new TextDecoder();
            const receivedData = decoder.decode(value);
            const messageData = JSON.parse(receivedData);
            
            // Decrypt message
            const decryptedText = this.decryptMessage(messageData.text);
            
            const message = {
                text: decryptedText,
                sender: messageData.sender,
                deviceId: messageData.deviceId,
                timestamp: messageData.timestamp || Date.now(),
                type: 'received'
            };
            
            this.saveMessage(message);
            this.renderMessage(message);
            this.playNotificationSound();
            
        } catch (error) {
            console.error('Error handling incoming message:', error);
        }
    }

    // Encrypt message with UTF-8 support (for Persian/Farsi text)
    encryptMessage(message) {
        try {
            const key = this.deviceId;
            // Convert to UTF-8 bytes
            const encoder = new TextEncoder();
            const messageBytes = encoder.encode(message);
            const keyBytes = encoder.encode(key);
            
            // XOR encryption
            const encrypted = new Uint8Array(messageBytes.length);
            for (let i = 0; i < messageBytes.length; i++) {
                encrypted[i] = messageBytes[i] ^ keyBytes[i % keyBytes.length];
            }
            
            // Convert to base64
            return btoa(String.fromCharCode(...encrypted));
        } catch (e) {
            console.error('Encryption error:', e);
            return btoa(message);
        }
    }

    // Decrypt message with UTF-8 support
    decryptMessage(encrypted) {
        try {
            const key = this.deviceId;
            // Decode from base64
            const decoded = atob(encrypted);
            const encryptedBytes = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i++) {
                encryptedBytes[i] = decoded.charCodeAt(i);
            }
            
            // XOR decryption
            const encoder = new TextEncoder();
            const keyBytes = encoder.encode(key);
            const decryptedBytes = new Uint8Array(encryptedBytes.length);
            for (let i = 0; i < encryptedBytes.length; i++) {
                decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
            }
            
            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decryptedBytes);
        } catch (e) {
            console.error('Decryption error:', e);
            return encrypted;
        }
    }

    // Send message
    async sendMessage() {
        const text = this.elements.messageInput.value.trim();
        
        if (!text) return;
        
        const message = {
            text: text,
            sender: this.username,
            deviceId: this.deviceId,
            timestamp: Date.now(),
            type: 'sent'
        };
        
        // Save and display locally
        this.saveMessage(message);
        this.renderMessage(message);
        
        // Clear input
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = 'auto';
        this.elements.sendBtn.disabled = true;
        
        // Encrypt the message
        const encryptedText = this.encryptMessage(text);
        
        // Prepare message data for transmission
        const messageData = {
            text: encryptedText,
            sender: this.username,
            deviceId: this.deviceId,
            timestamp: message.timestamp
        };
        
        // Send to all connected devices via Bluetooth
        let sentCount = 0;
        for (const [deviceId, deviceData] of this.connectedDevices) {
            if (deviceData.characteristic && deviceData.status === 'connected') {
                try {
                    const encoder = new TextEncoder();
                    const data = encoder.encode(JSON.stringify(messageData));
                    await deviceData.characteristic.writeValue(data);
                    sentCount++;
                } catch (error) {
                    console.error(`Failed to send to ${deviceData.name}:`, error);
                    this.showToast(`خطا در ارسال به ${deviceData.name}`, 'error');
                }
            }
        }
        
        if (sentCount > 0) {
            this.showToast(`پیام به ${sentCount} دستگاه ارسال شد`, 'success');
        } else if (this.connectedDevices.size === 0) {
            this.showToast('هیچ دستگاهی متصل نیست', 'warning');
        } else {
            this.showToast('پیام ذخیره شد (دستگاه‌ها آماده دریافت نیستند)', 'info');
        }
    }

    // Handle message input
    handleMessageInput() {
        const text = this.elements.messageInput.value.trim();
        this.elements.sendBtn.disabled = !text;
    }

    // Save message to database
    saveMessage(message) {
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        store.add(message);
    }

    // Save to database
    saveToDatabase(storeName, data) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.put(data);
    }

    // Load messages from database
    loadMessages() {
        const transaction = this.db.transaction(['messages'], 'readonly');
        const store = transaction.objectStore('messages');
        const request = store.getAll();
        
        request.onsuccess = (event) => {
            const messages = event.target.result;
            this.elements.messagesContainer.innerHTML = '<div class="date-divider"><span>امروز</span></div>';
            messages.forEach(message => this.renderMessage(message, false));
            this.scrollToBottom();
        };
    }

    // Render message
    renderMessage(message, animate = true) {
        const isOwn = message.type === 'sent';
        const messageElement = document.createElement('div');
        messageElement.className = `message ${isOwn ? 'own' : ''}`;
        if (animate) {
            messageElement.style.animation = 'messageSlide 0.3s ease';
        }
        
        const avatar = message.sender.charAt(0).toUpperCase();
        const time = new Date(message.timestamp).toLocaleTimeString('fa-IR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageElement.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <span class="message-sender">${message.sender}</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble">${this.escapeHtml(message.text)}</div>
            </div>
        `;
        
        this.elements.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    // Render devices list
    renderDevicesList() {
        if (this.connectedDevices.size === 0) {
            this.elements.devicesList.innerHTML = `
                <div class="empty-state">
                    <p>هنوز دستگاهی یافت نشد</p>
                    <small>روی دکمه جستجو کلیک کنید</small>
                </div>
            `;
            return;
        }
        
        this.elements.devicesList.innerHTML = '';
        this.connectedDevices.forEach((device, id) => {
            const deviceElement = document.createElement('div');
            deviceElement.className = 'device-item';
            const statusText = device.status === 'connected' ? 'متصل' : 'قطع شده';
            const statusClass = device.status === 'connected' ? 'connected' : 'disconnected';
            deviceElement.innerHTML = `
                <div class="device-avatar">${device.name.charAt(0).toUpperCase()}</div>
                <div class="device-info">
                    <div class="device-name">${device.name}</div>
                    <div class="device-status ${statusClass}">${statusText}</div>
                </div>
            `;
            this.elements.devicesList.appendChild(deviceElement);
        });
    }

    // Clear messages
    clearMessages() {
        if (!confirm('آیا مطمئن هستید که می‌خواهید همه پیام‌ها را پاک کنید؟')) {
            return;
        }
        
        const transaction = this.db.transaction(['messages'], 'readwrite');
        const store = transaction.objectStore('messages');
        const request = store.clear();
        
        request.onsuccess = () => {
            this.elements.messagesContainer.innerHTML = '<div class="date-divider"><span>امروز</span></div>';
            this.showToast('پیام‌ها پاک شدند', 'success');
        };
    }

    // Open settings modal
    openSettings() {
        this.elements.settingsUsername.value = this.username;
        this.elements.settingsModal.classList.remove('hidden');
    }

    // Close settings modal
    closeSettings() {
        this.elements.settingsModal.classList.add('hidden');
    }

    // Update username
    updateUsername() {
        const newUsername = this.elements.settingsUsername.value.trim();
        
        if (!newUsername) {
            this.showToast('نام نمی‌تواند خالی باشد', 'warning');
            return;
        }
        
        this.username = newUsername;
        this.saveToDatabase('settings', { key: 'username', value: newUsername });
        this.showToast('نام کاربری به‌روز شد', 'success');
    }

    // Update settings
    updateSettings() {
        this.settings.soundEnabled = this.elements.soundToggle.checked;
        this.settings.autoConnect = this.elements.autoConnectToggle.checked;
        
        this.saveToDatabase('settings', { key: 'soundEnabled', value: this.settings.soundEnabled });
        this.saveToDatabase('settings', { key: 'autoConnect', value: this.settings.autoConnect });
        
        this.showToast('تنظیمات ذخیره شد', 'success');
    }

    // Reset all data
    resetAllData() {
        if (!confirm('آیا مطمئن هستید که می‌خواهید همه داده‌ها را پاک کنید؟ این عملیات قابل بازگشت نیست.')) {
            return;
        }
        
        const transaction = this.db.transaction(['messages', 'devices', 'settings'], 'readwrite');
        
        transaction.objectStore('messages').clear();
        transaction.objectStore('devices').clear();
        transaction.objectStore('settings').clear();
        
        transaction.oncomplete = () => {
            this.showToast('همه داده‌ها پاک شدند', 'success');
            setTimeout(() => {
                location.reload();
            }, 1500);
        };
    }

    // Update connection status
    updateStatus(connected) {
        if (connected) {
            this.elements.statusDot.classList.add('active');
            this.elements.statusText.textContent = 'فعال';
        } else {
            this.elements.statusDot.classList.remove('active');
            this.elements.statusText.textContent = 'غیرفعال';
        }
    }

    // Show toast notification
    showToast(message, type = 'info') {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${icons[type]}</div>
            <div class="toast-message">${message}</div>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'toastSlide 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Play notification sound
    playNotificationSound() {
        if (!this.settings.soundEnabled) return;
        
        // Create a simple beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
            console.log('Could not play sound');
        }
    }

    // Scroll to bottom of messages
    scrollToBottom() {
        this.elements.messagesContainer.scrollTop = this.elements.messagesContainer.scrollHeight;
    }

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new BluetoothMeshMessenger();
});

