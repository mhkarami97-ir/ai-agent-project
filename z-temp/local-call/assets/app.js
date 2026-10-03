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


// State Management
let currentLang = localStorage.getItem('language') || 'fa';
let currentTheme = localStorage.getItem('theme') || 'light';
let peer = null;
let localStream = null;
let remoteStream = null;
let currentCall = null;
let dataConnection = null;
let isVideoEnabled = true;
let isAudioEnabled = true;

// DOM Elements
let elements = {};

// Initialize DOM Elements
function initElements() {
    elements = {
        myPeerId: document.getElementById('myPeerId'),
        remotePeerId: document.getElementById('remotePeerId'),
        connectBtn: document.getElementById('connectBtn'),
        disconnectBtn: document.getElementById('disconnectBtn'),
        copyIdBtn: document.getElementById('copyIdBtn'),
        langToggle: document.getElementById('langToggle'),
        themeToggle: document.getElementById('themeToggle'),
        themeIcon: document.getElementById('themeIcon'),
        connectionSection: document.getElementById('connectionSection'),
        communicationSection: document.getElementById('communicationSection'),
        connectionStatus: document.getElementById('connectionStatus'),
        localVideo: document.getElementById('localVideo'),
        remoteVideo: document.getElementById('remoteVideo'),
        toggleVideoBtn: document.getElementById('toggleVideoBtn'),
        toggleAudioBtn: document.getElementById('toggleAudioBtn'),
        chatMessages: document.getElementById('chatMessages'),
        messageInput: document.getElementById('messageInput'),
        sendBtn: document.getElementById('sendBtn')
    };
}

// Initialize App
function init() {
    initElements();
    applyTheme();
    applyLanguage();
    initPeer();
    attachEventListeners();
}

// Theme Management
function applyTheme() {
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const sunIcon = '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    const moonIcon = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
    
    elements.themeIcon.innerHTML = currentTheme === 'dark' ? sunIcon : moonIcon;
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    applyTheme();
}

// Language Management
function applyLanguage() {
    const html = document.documentElement;
    html.setAttribute('lang', currentLang);
    html.setAttribute('dir', currentLang === 'fa' ? 'rtl' : 'ltr');
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            element.textContent = translations[currentLang][key];
        }
    });
    
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[currentLang][key]) {
            element.placeholder = translations[currentLang][key];
        }
    });
}

function toggleLanguage() {
    currentLang = currentLang === 'fa' ? 'en' : 'fa';
    localStorage.setItem('language', currentLang);
    applyLanguage();
}

// PeerJS Initialization
function initPeer() {
    try {
        peer = new Peer({
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        });

        peer.on('open', (id) => {
            elements.myPeerId.textContent = id;
            elements.myPeerId.classList.remove('loading');
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            showStatus(translations[currentLang].peer_error + ': ' + err.type, 'error');
        });

        peer.on('call', (call) => {
            showStatus(translations[currentLang].incoming_call, 'info');
            answerCall(call);
        });

        peer.on('connection', (conn) => {
            setupDataConnection(conn);
        });

    } catch (error) {
        console.error('Error initializing peer:', error);
        showStatus(translations[currentLang].peer_error, 'error');
    }
}

// Media Stream Management
async function getLocalStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });
        elements.localVideo.srcObject = localStream;
        return localStream;
    } catch (error) {
        console.error('Error accessing media devices:', error);
        showStatus(translations[currentLang].error_media, 'error');
        throw error;
    }
}

function toggleVideo() {
    if (localStream) {
        isVideoEnabled = !isVideoEnabled;
        localStream.getVideoTracks().forEach(track => {
            track.enabled = isVideoEnabled;
        });
        elements.toggleVideoBtn.classList.toggle('active', isVideoEnabled);
        elements.toggleVideoBtn.classList.toggle('inactive', !isVideoEnabled);
    }
}

function toggleAudio() {
    if (localStream) {
        isAudioEnabled = !isAudioEnabled;
        localStream.getAudioTracks().forEach(track => {
            track.enabled = isAudioEnabled;
        });
        elements.toggleAudioBtn.classList.toggle('active', isAudioEnabled);
        elements.toggleAudioBtn.classList.toggle('inactive', !isAudioEnabled);
    }
}

// Connection Management
async function connect() {
    const remotePeerId = elements.remotePeerId.value.trim();
    
    if (!remotePeerId) {
        showStatus(translations[currentLang].enter_peer_id, 'error');
        return;
    }

    try {
        showStatus(translations[currentLang].connecting, 'info');
        
        const stream = await getLocalStream();
        
        currentCall = peer.call(remotePeerId, stream);
        
        currentCall.on('stream', (remoteStreamReceived) => {
            elements.remoteVideo.srcObject = remoteStreamReceived;
            remoteStream = remoteStreamReceived;
        });

        currentCall.on('close', () => {
            handleDisconnect();
        });

        dataConnection = peer.connect(remotePeerId);
        setupDataConnection(dataConnection);
        
        showCommunicationSection();
        showStatus(translations[currentLang].connected, 'success');

    } catch (error) {
        console.error('Connection error:', error);
        showStatus(translations[currentLang].error_connection, 'error');
    }
}

async function answerCall(call) {
    try {
        const stream = await getLocalStream();
        
        currentCall = call;
        call.answer(stream);
        
        call.on('stream', (remoteStreamReceived) => {
            elements.remoteVideo.srcObject = remoteStreamReceived;
            remoteStream = remoteStreamReceived;
        });

        call.on('close', () => {
            handleDisconnect();
        });
        
        showCommunicationSection();
        showStatus(translations[currentLang].connected, 'success');

    } catch (error) {
        console.error('Error answering call:', error);
        showStatus(translations[currentLang].error_media, 'error');
    }
}

function disconnect() {
    if (currentCall) {
        currentCall.close();
    }
    if (dataConnection) {
        dataConnection.close();
    }
    handleDisconnect();
}

function handleDisconnect() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    
    elements.localVideo.srcObject = null;
    elements.remoteVideo.srcObject = null;
    
    currentCall = null;
    dataConnection = null;
    remoteStream = null;
    isVideoEnabled = true;
    isAudioEnabled = true;
    
    elements.toggleVideoBtn.classList.add('active');
    elements.toggleVideoBtn.classList.remove('inactive');
    elements.toggleAudioBtn.classList.add('active');
    elements.toggleAudioBtn.classList.remove('inactive');
    
    elements.chatMessages.innerHTML = '';
    elements.messageInput.value = '';
    
    hideCommunicationSection();
    showStatus(translations[currentLang].disconnected, 'info');
}

// Data Connection for Chat
function setupDataConnection(conn) {
    dataConnection = conn;
    
    conn.on('open', () => {
        console.log('Data connection established');
    });
    
    conn.on('data', (data) => {
        addMessage(data.message, 'received', data.timestamp);
    });
    
    conn.on('close', () => {
        console.log('Data connection closed');
    });
}

function sendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message || !dataConnection) {
        return;
    }
    
    const timestamp = new Date().toLocaleTimeString(currentLang === 'fa' ? 'fa-IR' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const data = {
        message: message,
        timestamp: timestamp
    };
    
    try {
        dataConnection.send(data);
        addMessage(message, 'sent', timestamp);
        elements.messageInput.value = '';
    } catch (error) {
        console.error('Error sending message:', error);
    }
}

function addMessage(message, type, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ' + type;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = message;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = timestamp;
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    elements.chatMessages.appendChild(messageDiv);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// UI Management
function showCommunicationSection() {
    elements.communicationSection.style.display = 'block';
    elements.connectionSection.style.display = 'none';
}

function hideCommunicationSection() {
    elements.communicationSection.style.display = 'none';
    elements.connectionSection.style.display = 'block';
}

function showStatus(message, type) {
    elements.connectionStatus.textContent = message;
    elements.connectionStatus.className = 'status-message ' + type;
    
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            elements.connectionStatus.className = 'status-message';
        }, 5000);
    }
}

function copyPeerId() {
    const peerId = elements.myPeerId.textContent;
    navigator.clipboard.writeText(peerId).then(() => {
        const originalText = elements.copyIdBtn.textContent;
        elements.copyIdBtn.textContent = translations[currentLang].copied;
        setTimeout(() => {
            elements.copyIdBtn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Error copying:', err);
    });
}

// Event Listeners
function attachEventListeners() {
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.langToggle.addEventListener('click', toggleLanguage);
    elements.connectBtn.addEventListener('click', connect);
    elements.disconnectBtn.addEventListener('click', disconnect);
    elements.copyIdBtn.addEventListener('click', copyPeerId);
    elements.toggleVideoBtn.addEventListener('click', toggleVideo);
    elements.toggleAudioBtn.addEventListener('click', toggleAudio);
    elements.sendBtn.addEventListener('click', sendMessage);
    
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    elements.remotePeerId.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            connect();
        }
    });
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (currentCall) {
        currentCall.close();
    }
    if (peer) {
        peer.destroy();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

