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


// PeerJS for P2P connections
// Using default PeerJS cloud server (no custom config needed)
const PEERJS_CONFIG = null; // Will use default server

// App State
let peer = null;
let currentLang = localStorage.getItem('language') || 'fa';
let currentTheme = localStorage.getItem('theme') || 'light';
let translations = {};
let selectedFiles = [];
let activeTransfers = new Map();

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    initTheme();
    initLanguage();
    initPeer();
    initEventListeners();
});

// Load translations
async function loadTranslations() {
    try {
        const response = await fetch('assets/translations.json');
        translations = await response.json();
        updateUILanguage();
    } catch (error) {
        console.error('Error loading translations:', error);
    }
}

// Initialize theme
function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// Initialize language
function initLanguage() {
    const html = document.querySelector('html');
    html.setAttribute('lang', currentLang);
    html.setAttribute('dir', currentLang === 'fa' ? 'rtl' : 'ltr');
    document.getElementById('lang-text').textContent = currentLang === 'fa' ? 'EN' : 'FA';
}

// Update UI text based on current language
function updateUILanguage() {
    const lang = translations[currentLang];
    if (!lang) return;

    Object.keys(lang).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = lang[key];
            } else {
                element.textContent = lang[key];
            }
        }
    });
}

// Initialize PeerJS connection
function initPeer() {
    try {
        console.log('Initializing PeerJS...');
        
        // Create peer without config to use default cloud server
        peer = new Peer();

        peer.on('open', (id) => {
            console.log('✓ Connected! Your ID:', id);
            document.getElementById('peer-id').value = id;
            updateConnectionStatus('connected');
            showToast('اتصال برقرار شد!', 'success');
        });

        peer.on('error', (error) => {
            console.error('✗ Peer error:', error);
            updateConnectionStatus('error');
            
            let errorMsg = 'خطا در اتصال';
            if (error.type === 'peer-unavailable') {
                errorMsg = 'کاربر مقصد در دسترس نیست';
            } else if (error.type === 'network') {
                errorMsg = 'خطای شبکه - اینترنت خود را بررسی کنید';
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            showToast(errorMsg, 'error');
        });

        peer.on('connection', (conn) => {
            console.log('Incoming connection from:', conn.peer);
            setupConnection(conn);
        });

        peer.on('disconnected', () => {
            console.log('Disconnected from server');
            updateConnectionStatus('disconnected');
            showToast('ارتباط قطع شد - در حال تلاش مجدد...', 'warning');
            
            // Try to reconnect after 2 seconds
            setTimeout(() => {
                if (peer && !peer.destroyed) {
                    console.log('Attempting to reconnect...');
                    peer.reconnect();
                }
            }, 2000);
        });

        peer.on('close', () => {
            console.log('Connection closed');
            updateConnectionStatus('disconnected');
        });

    } catch (error) {
        console.error('✗ Fatal error initializing peer:', error);
        updateConnectionStatus('error');
        showToast('خطای جدی در راه‌اندازی. صفحه را رفرش کنید.', 'error');
    }
}

// Setup data connection
function setupConnection(conn) {
    conn.on('open', () => {
        console.log('Connection opened with', conn.peer);
    });

    conn.on('data', (data) => {
        handleIncomingData(conn, data);
    });

    conn.on('close', () => {
        console.log('Connection closed with', conn.peer);
    });

    conn.on('error', (error) => {
        console.error('Connection error:', error);
        showToast(translate('connection-error'), 'error');
    });
}

// Handle incoming data
function handleIncomingData(conn, data) {
    if (data.type === 'file-meta') {
        showIncomingFileRequest(conn, data);
    } else if (data.type === 'file-chunk') {
        handleFileChunk(data);
    } else if (data.type === 'file-complete') {
        handleFileComplete(data);
    } else if (data.type === 'file-rejected') {
        handleFileRejected(data);
    }
}

// Show incoming file request
function showIncomingFileRequest(conn, data) {
    const transferId = data.transferId;
    const transfer = {
        id: transferId,
        type: 'receiving',
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType,
        peer: conn.peer,
        connection: conn,
        chunks: [],
        receivedSize: 0,
        status: 'pending'
    };

    activeTransfers.set(transferId, transfer);
    addTransferToUI(transfer, true);
}

// Accept file transfer
function acceptFileTransfer(transferId) {
    const transfer = activeTransfers.get(transferId);
    if (!transfer) return;

    transfer.status = 'receiving';
    transfer.connection.send({ type: 'file-accept', transferId });
    updateTransferUI(transfer);
}

// Reject file transfer
function rejectFileTransfer(transferId) {
    const transfer = activeTransfers.get(transferId);
    if (!transfer) return;

    transfer.status = 'rejected';
    transfer.connection.send({ type: 'file-reject', transferId });
    activeTransfers.delete(transferId);
    removeTransferFromUI(transferId);
    showToast(translate('file-rejected'), 'info');
}

// Handle file chunk
function handleFileChunk(data) {
    const transfer = activeTransfers.get(data.transferId);
    if (!transfer) return;

    transfer.chunks.push(data.chunk);
    transfer.receivedSize += data.chunk.byteLength;

    const progress = (transfer.receivedSize / transfer.fileSize) * 100;
    updateTransferProgress(transfer.id, progress);
}

// Handle file complete
function handleFileComplete(data) {
    const transfer = activeTransfers.get(data.transferId);
    if (!transfer) return;

    const blob = new Blob(transfer.chunks, { type: transfer.fileType });
    const url = URL.createObjectURL(blob);

    // Auto download
    const a = document.createElement('a');
    a.href = url;
    a.download = transfer.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    transfer.status = 'completed';
    updateTransferUI(transfer);
    showToast(translate('file-received-success'), 'success');
}

// Handle file rejected
function handleFileRejected(data) {
    const transfer = activeTransfers.get(data.transferId);
    if (!transfer) return;

    transfer.status = 'rejected';
    updateTransferUI(transfer);
    showToast(translate('file-rejected'), 'error');
}

// Send file
async function sendFile() {
    const recipientId = document.getElementById('recipient-id').value.trim();
    
    if (!recipientId) {
        showToast(translate('error-no-recipient'), 'error');
        return;
    }

    if (selectedFiles.length === 0) {
        showToast(translate('error-no-file'), 'error');
        return;
    }

    if (recipientId === peer.id) {
        showToast(translate('error-self-send'), 'error');
        return;
    }

    for (const file of selectedFiles) {
        await sendSingleFile(recipientId, file);
    }

    // Clear selection
    selectedFiles = [];
    updateSelectedFilesUI();
    document.getElementById('recipient-id').value = '';
}

// Send single file
async function sendSingleFile(recipientId, file) {
    try {
        const conn = peer.connect(recipientId);
        
        await new Promise((resolve, reject) => {
            conn.on('open', () => resolve());
            conn.on('error', (error) => reject(error));
            setTimeout(() => reject(new Error('Connection timeout')), 10000);
        });

        setupConnection(conn);

        const transferId = generateId();
        const transfer = {
            id: transferId,
            type: 'sending',
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            peer: recipientId,
            connection: conn,
            status: 'pending',
            sentSize: 0
        };

        activeTransfers.set(transferId, transfer);
        addTransferToUI(transfer);

        // Send file metadata
        conn.send({
            type: 'file-meta',
            transferId: transferId,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        // Wait for acceptance
        await new Promise((resolve, reject) => {
            const handler = (data) => {
                if (data.type === 'file-accept' && data.transferId === transferId) {
                    conn.off('data', handler);
                    resolve();
                } else if (data.type === 'file-reject' && data.transferId === transferId) {
                    conn.off('data', handler);
                    reject(new Error('File rejected'));
                }
            };
            conn.on('data', handler);
            setTimeout(() => reject(new Error('Acceptance timeout')), 30000);
        });

        transfer.status = 'sending';
        updateTransferUI(transfer);

        // Send file in chunks
        const CHUNK_SIZE = 16384; // 16KB chunks
        const reader = new FileReader();
        let offset = 0;

        while (offset < file.size) {
            const chunk = file.slice(offset, offset + CHUNK_SIZE);
            const arrayBuffer = await new Promise((resolve, reject) => {
                reader.onload = (e) => resolve(e.target.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(chunk);
            });

            conn.send({
                type: 'file-chunk',
                transferId: transferId,
                chunk: arrayBuffer
            });

            offset += CHUNK_SIZE;
            transfer.sentSize = Math.min(offset, file.size);
            
            const progress = (transfer.sentSize / transfer.fileSize) * 100;
            updateTransferProgress(transferId, progress);

            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        // Send completion signal
        conn.send({
            type: 'file-complete',
            transferId: transferId
        });

        transfer.status = 'completed';
        updateTransferUI(transfer);
        showToast(translate('file-sent-success'), 'success');

    } catch (error) {
        console.error('Error sending file:', error);
        showToast(translate('transfer-error'), 'error');
        
        const transfer = Array.from(activeTransfers.values())
            .find(t => t.fileName === file.name && t.status === 'pending');
        if (transfer) {
            transfer.status = 'failed';
            updateTransferUI(transfer);
        }
    }
}

// Update connection status
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    const statusDot = document.querySelector('.status-dot');
    
    statusDot.className = 'status-dot';
    
    if (status === 'connected') {
        statusElement.textContent = translate('connection-status-connected');
        statusDot.classList.add('connected');
    } else if (status === 'error') {
        statusElement.textContent = translate('connection-status-disconnected');
        statusDot.classList.add('error');
    } else {
        statusElement.textContent = translate('connection-status-connecting');
    }
}

// Add transfer to UI
function addTransferToUI(transfer, showActions = false) {
    const transfersList = document.getElementById('transfers-list');
    const emptyState = transfersList.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }

    const transferElement = document.createElement('div');
    transferElement.className = 'transfer-item';
    transferElement.id = `transfer-${transfer.id}`;

    const iconType = transfer.type === 'sending' ? 'sending' : 'receiving';
    const statusText = translate(transfer.status);

    transferElement.innerHTML = `
        <div class="transfer-icon ${iconType}">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${transfer.type === 'sending' 
                    ? '<line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>'
                    : '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'
                }
            </svg>
        </div>
        <div class="transfer-details">
            <div class="transfer-header">
                <span class="transfer-name">${transfer.fileName}</span>
                <span class="transfer-status">${statusText}</span>
            </div>
            <div class="transfer-info">
                <span>${formatFileSize(transfer.fileSize)}</span>
                <span>${transfer.type === 'sending' ? translate('sending') : translate('receiving')}</span>
            </div>
            ${transfer.status === 'sending' || transfer.status === 'receiving' ? `
                <div class="transfer-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0"></div>
                    </div>
                </div>
            ` : ''}
        </div>
        ${showActions ? `
            <div class="transfer-actions">
                <button class="btn-accept" onclick="acceptFileTransfer('${transfer.id}')">${translate('accept')}</button>
                <button class="btn-reject" onclick="rejectFileTransfer('${transfer.id}')">${translate('reject')}</button>
            </div>
        ` : ''}
    `;

    transfersList.insertBefore(transferElement, transfersList.firstChild);
}

// Update transfer UI
function updateTransferUI(transfer) {
    const transferElement = document.getElementById(`transfer-${transfer.id}`);
    if (!transferElement) return;

    const statusElement = transferElement.querySelector('.transfer-status');
    if (statusElement) {
        statusElement.textContent = translate(transfer.status);
        
        if (transfer.status === 'completed') {
            statusElement.classList.add('success');
        } else if (transfer.status === 'failed' || transfer.status === 'rejected') {
            statusElement.classList.add('error');
        }
    }

    // Remove actions if present
    const actions = transferElement.querySelector('.transfer-actions');
    if (actions) {
        actions.remove();
    }
}

// Update transfer progress
function updateTransferProgress(transferId, progress) {
    const transferElement = document.getElementById(`transfer-${transferId}`);
    if (!transferElement) return;

    const progressFill = transferElement.querySelector('.progress-fill');
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
        
        if (progress >= 100) {
            progressFill.classList.add('complete');
        }
    }
}

// Remove transfer from UI
function removeTransferFromUI(transferId) {
    const transferElement = document.getElementById(`transfer-${transferId}`);
    if (transferElement) {
        transferElement.remove();
    }

    // Show empty state if no transfers
    const transfersList = document.getElementById('transfers-list');
    if (transfersList.children.length === 0) {
        transfersList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <p id="no-transfers-text">${translate('no-transfers-text')}</p>
            </div>
        `;
    }
}

// Initialize event listeners
function initEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Language toggle
    document.getElementById('lang-toggle').addEventListener('click', toggleLanguage);

    // Copy peer ID
    document.getElementById('copy-id-btn').addEventListener('click', copyPeerId);

    // File input
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    const uploadLabel = document.querySelector('.file-upload-label');
    uploadLabel.addEventListener('dragover', handleDragOver);
    uploadLabel.addEventListener('dragleave', handleDragLeave);
    uploadLabel.addEventListener('drop', handleDrop);

    // Send button
    document.getElementById('send-btn').addEventListener('click', sendFile);

    // Update send button state on recipient input
    document.getElementById('recipient-id').addEventListener('input', updateSendButtonState);
}

// Toggle theme
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
}

// Toggle language
function toggleLanguage() {
    currentLang = currentLang === 'fa' ? 'en' : 'fa';
    localStorage.setItem('language', currentLang);
    initLanguage();
    updateUILanguage();
}

// Copy peer ID
async function copyPeerId() {
    const peerId = document.getElementById('peer-id').value;
    try {
        await navigator.clipboard.writeText(peerId);
        showToast(translate('copied'), 'success');
    } catch (error) {
        showToast(translate('error-copy'), 'error');
    }
}

// Handle file select
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    addFiles(files);
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

// Handle drag leave
function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(event.dataTransfer.files);
    addFiles(files);
}

// Add files
function addFiles(files) {
    selectedFiles.push(...files);
    updateSelectedFilesUI();
    updateSendButtonState();
}

// Update selected files UI
function updateSelectedFilesUI() {
    const container = document.getElementById('selected-files');
    container.innerHTML = '';

    selectedFiles.forEach((file, index) => {
        const fileElement = document.createElement('div');
        fileElement.className = 'file-item';
        fileElement.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                </div>
                <div class="file-details">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        `;
        container.appendChild(fileElement);
    });
}

// Remove file
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateSelectedFilesUI();
    updateSendButtonState();
}

// Update send button state
function updateSendButtonState() {
    const sendBtn = document.getElementById('send-btn');
    const recipientId = document.getElementById('recipient-id').value.trim();
    sendBtn.disabled = !recipientId || selectedFiles.length === 0;
}

// Show toast notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-message">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 4000);
}

// Helper: Translate
function translate(key) {
    return translations[currentLang]?.[key] || key;
}

// Helper: Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Helper: Generate ID
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

// Make functions globally accessible
window.acceptFileTransfer = acceptFileTransfer;
window.rejectFileTransfer = rejectFileTransfer;
window.removeFile = removeFile;

