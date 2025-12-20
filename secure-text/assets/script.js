// Encryption & Storage Manager
class CryptoManager {
    constructor() {
        this.passphrase = null;
    }

    // Hash the passphrase using SHA-256
    async hashPassphrase(passphrase) {
        const encoder = new TextEncoder();
        const data = encoder.encode(passphrase);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Simple XOR-based encryption for client-side storage
    encrypt(text, passphrase) {
        // Convert text to UTF-8 bytes
        const encoder = new TextEncoder();
        const textBytes = encoder.encode(text);
        const passphraseBytes = encoder.encode(passphrase);
        
        // XOR encryption
        const encrypted = new Uint8Array(textBytes.length);
        for (let i = 0; i < textBytes.length; i++) {
            encrypted[i] = textBytes[i] ^ passphraseBytes[i % passphraseBytes.length];
        }
        
        // Convert to base64 using proper Unicode handling
        let binary = '';
        for (let i = 0; i < encrypted.length; i++) {
            binary += String.fromCharCode(encrypted[i]);
        }
        return btoa(binary);
    }

    decrypt(encryptedText, passphrase) {
        try {
            // Decode from base64
            const binary = atob(encryptedText);
            const encrypted = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                encrypted[i] = binary.charCodeAt(i);
            }
            
            // XOR decryption
            const encoder = new TextEncoder();
            const passphraseBytes = encoder.encode(passphrase);
            const decrypted = new Uint8Array(encrypted.length);
            for (let i = 0; i < encrypted.length; i++) {
                decrypted[i] = encrypted[i] ^ passphraseBytes[i % passphraseBytes.length];
            }
            
            // Convert bytes back to UTF-8 string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (e) {
            throw new Error('رمزگشایی ناموفق بود');
        }
    }

    async setPassphrase(passphrase) {
        this.passphrase = passphrase;
        const hash = await this.hashPassphrase(passphrase);
        localStorage.setItem('appPassHash', hash);
    }

    async verifyPassphrase(passphrase) {
        const hash = await this.hashPassphrase(passphrase);
        const storedHash = localStorage.getItem('appPassHash');
        return hash === storedHash;
    }

    setCurrentPassphrase(passphrase) {
        this.passphrase = passphrase;
    }

    isSetup() {
        return localStorage.getItem('appPassHash') !== null;
    }
}

// Notes Manager
class NotesManager {
    constructor(cryptoManager) {
        this.crypto = cryptoManager;
        this.notes = [];
        this.currentNoteId = null;
    }

    loadNotes() {
        const encryptedNotes = localStorage.getItem('encryptedNotes');
        if (!encryptedNotes) {
            this.notes = [];
            return;
        }

        try {
            const decryptedData = this.crypto.decrypt(encryptedNotes, this.crypto.passphrase);
            this.notes = JSON.parse(decryptedData);
        } catch (e) {
            console.error('Failed to load notes:', e);
            this.notes = [];
        }
    }

    saveNotes() {
        const notesJson = JSON.stringify(this.notes);
        const encrypted = this.crypto.encrypt(notesJson, this.crypto.passphrase);
        localStorage.setItem('encryptedNotes', encrypted);
    }

    createNote() {
        const note = {
            id: Date.now().toString(),
            title: 'یادداشت بدون عنوان',
            content: '',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString()
        };
        this.notes.unshift(note);
        this.saveNotes();
        return note;
    }

    getNote(id) {
        return this.notes.find(note => note.id === id);
    }

    updateNote(id, title, content) {
        const note = this.getNote(id);
        if (note) {
            note.title = title || 'یادداشت بدون عنوان';
            note.content = content;
            note.modifiedAt = new Date().toISOString();
            this.saveNotes();
        }
    }

    deleteNote(id) {
        this.notes = this.notes.filter(note => note.id !== id);
        this.saveNotes();
    }

    searchNotes(query) {
        if (!query) return this.notes;
        const lowerQuery = query.toLowerCase();
        return this.notes.filter(note =>
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery)
        );
    }

    getAllNotes() {
        return this.notes;
    }
}

// Auto-lock Manager
class AutoLockManager {
    constructor(lockCallback) {
        this.lockCallback = lockCallback;
        this.timeout = null;
        this.lockTime = parseInt(localStorage.getItem('autoLockTime')) || 5;
        this.lastActivity = Date.now();
        this.timerInterval = null;
    }

    setLockTime(minutes) {
        this.lockTime = minutes;
        localStorage.setItem('autoLockTime', minutes.toString());
        this.resetTimer();
    }

    getLockTime() {
        return this.lockTime;
    }

    resetTimer() {
        this.lastActivity = Date.now();
        
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (this.lockTime > 0) {
            this.timeout = setTimeout(() => {
                this.lockCallback();
            }, this.lockTime * 60 * 1000);
        }
    }

    startTimer() {
        this.resetTimer();
        this.updateTimerDisplay();
        
        // Update timer display every second
        this.timerInterval = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);

        // Track user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach(event => {
            document.addEventListener(event, () => this.resetTimer());
        });
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('lockTimer');
        if (!timerElement || this.lockTime === 0) {
            if (timerElement) timerElement.textContent = 'غیرفعال';
            return;
        }

        const elapsed = Date.now() - this.lastActivity;
        const remaining = (this.lockTime * 60 * 1000) - elapsed;

        if (remaining <= 0) {
            timerElement.textContent = 'در حال قفل...';
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    stopTimer() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }
}

// Main App Controller
class SecureNotesApp {
    constructor() {
        this.crypto = new CryptoManager();
        this.notes = new NotesManager(this.crypto);
        this.autoLock = new AutoLockManager(() => this.lock());
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkSetupStatus();
    }

    setupEventListeners() {
        // Login/Setup
        document.getElementById('setupBtn').addEventListener('click', () => this.handleSetup());
        document.getElementById('loginBtn').addEventListener('click', () => this.handleLogin());
        
        // Password visibility toggles
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => this.togglePasswordVisibility(e.target));
        });

        // Enter key on password fields
        document.getElementById('setupPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('setupBtn').click();
        });
        document.getElementById('confirmPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('setupBtn').click();
        });
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') document.getElementById('loginBtn').click();
        });

        // App actions
        document.getElementById('newNoteBtn').addEventListener('click', () => this.createNewNote());
        document.getElementById('saveNoteBtn').addEventListener('click', () => this.saveCurrentNote());
        document.getElementById('deleteNoteBtn').addEventListener('click', () => this.deleteCurrentNote());
        document.getElementById('lockBtn').addEventListener('click', () => this.lock());
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettings());

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Editor
        document.getElementById('noteTitle').addEventListener('input', () => this.handleEditorChange());
        document.getElementById('noteContent').addEventListener('input', (e) => {
            this.handleEditorChange();
            this.updateCharCount(e.target.value);
        });

        // Settings
        document.getElementById('closeSettingsBtn').addEventListener('click', () => this.closeSettings());
        document.getElementById('autoLockTime').addEventListener('change', (e) => this.updateAutoLockTime(e.target.value));
        document.getElementById('changePasswordBtn').addEventListener('click', () => this.changePassword());
        document.getElementById('resetAppBtn').addEventListener('click', () => this.resetApp());

        // Confirmation modal
        document.getElementById('confirmNo').addEventListener('click', () => this.closeConfirmModal());

        // Close modals on outside click
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.closeSettings();
        });
        document.getElementById('confirmModal').addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') this.closeConfirmModal();
        });
    }

    checkSetupStatus() {
        if (this.crypto.isSetup()) {
            document.getElementById('setupMode').style.display = 'none';
            document.getElementById('loginMode').style.display = 'block';
        } else {
            document.getElementById('setupMode').style.display = 'block';
            document.getElementById('loginMode').style.display = 'none';
        }
    }

    async handleSetup() {
        const password = document.getElementById('setupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!password || password.length < 4) {
            this.showError('رمز عبور باید حداقل ۴ کاراکتر باشد');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('رمز عبور و تایید آن مطابقت ندارند');
            return;
        }

        await this.crypto.setPassphrase(password);
        this.crypto.setCurrentPassphrase(password);
        this.showApp();
    }

    async handleLogin() {
        const password = document.getElementById('loginPassword').value;

        if (!password) {
            this.showError('لطفاً رمز عبور را وارد کنید');
            return;
        }

        const isValid = await this.crypto.verifyPassphrase(password);
        if (!isValid) {
            this.showError('رمز عبور اشتباه است');
            return;
        }

        this.crypto.setCurrentPassphrase(password);
        this.showApp();
    }

    showApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('appScreen').style.display = 'block';
        this.notes.loadNotes();
        this.renderNotesList();
        this.autoLock.setLockTime(this.autoLock.getLockTime());
        this.autoLock.startTimer();
    }

    lock() {
        this.autoLock.stopTimer();
        this.crypto.setCurrentPassphrase(null);
        document.getElementById('appScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('loginPassword').value = '';
        this.hideError();
        this.clearEditor();
    }

    showError(message) {
        const errorMsg = document.getElementById('errorMsg');
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMsg').style.display = 'none';
    }

    togglePasswordVisibility(button) {
        const targetId = button.closest('.toggle-password').dataset.target;
        const input = document.getElementById(targetId);
        
        if (input.type === 'password') {
            input.type = 'text';
            button.querySelector('.eye-icon').textContent = '🙈';
        } else {
            input.type = 'password';
            button.querySelector('.eye-icon').textContent = '👁️';
        }
    }

    createNewNote() {
        const note = this.notes.createNote();
        this.renderNotesList();
        this.openNote(note.id);
    }

    openNote(noteId) {
        this.notes.currentNoteId = noteId;
        const note = this.notes.getNote(noteId);
        
        if (!note) return;

        document.getElementById('emptyState').style.display = 'none';
        document.getElementById('editorContainer').style.display = 'flex';
        
        document.getElementById('noteTitle').value = note.title;
        document.getElementById('noteContent').value = note.content;
        
        this.updateLastModified(note.modifiedAt);
        this.updateCharCount(note.content);
        this.updateActiveNote(noteId);
    }

    saveCurrentNote() {
        if (!this.notes.currentNoteId) return;

        const title = document.getElementById('noteTitle').value.trim();
        const content = document.getElementById('noteContent').value;

        this.notes.updateNote(this.notes.currentNoteId, title, content);
        this.renderNotesList();
        this.updateActiveNote(this.notes.currentNoteId);
        
        const note = this.notes.getNote(this.notes.currentNoteId);
        this.updateLastModified(note.modifiedAt);

        // Show save feedback
        const saveBtn = document.getElementById('saveNoteBtn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ ذخیره شد';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 2000);
    }

    deleteCurrentNote() {
        if (!this.notes.currentNoteId) return;

        this.showConfirmModal(
            'حذف یادداشت',
            'آیا مطمئن هستید که می‌خواهید این یادداشت را حذف کنید؟',
            () => {
                this.notes.deleteNote(this.notes.currentNoteId);
                this.notes.currentNoteId = null;
                this.renderNotesList();
                this.clearEditor();
                this.closeConfirmModal();
            }
        );
    }

    clearEditor() {
        document.getElementById('emptyState').style.display = 'flex';
        document.getElementById('editorContainer').style.display = 'none';
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteContent').value = '';
        this.notes.currentNoteId = null;
    }

    handleEditorChange() {
        // Auto-save functionality could be added here
    }

    updateCharCount(text) {
        const count = text.length;
        document.getElementById('charCount').textContent = `${count.toLocaleString('fa-IR')} کاراکتر`;
    }

    updateLastModified(dateString) {
        const date = new Date(dateString);
        const formatted = date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        document.getElementById('lastModified').textContent = `آخرین تغییر: ${formatted}`;
    }

    renderNotesList() {
        const notesList = document.getElementById('notesList');
        const notes = this.notes.getAllNotes();

        if (notes.length === 0) {
            notesList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">هیچ یادداشتی وجود ندارد</div>';
        } else {
            notesList.innerHTML = notes.map(note => this.createNoteItemHTML(note)).join('');
            
            // Add click event listeners
            notesList.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', () => this.openNote(item.dataset.id));
            });
        }

        this.updateNotesCount(notes.length);
    }

    createNoteItemHTML(note) {
        const date = new Date(note.modifiedAt);
        const formatted = date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        const preview = note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '');

        return `
            <div class="note-item" data-id="${note.id}">
                <div class="note-item-title">${this.escapeHtml(note.title)}</div>
                <div class="note-item-preview">${this.escapeHtml(preview)}</div>
                <div class="note-item-date">${formatted}</div>
            </div>
        `;
    }

    updateActiveNote(noteId) {
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === noteId);
        });
    }

    updateNotesCount(count) {
        document.getElementById('notesCount').textContent = `${count.toLocaleString('fa-IR')} یادداشت`;
    }

    handleSearch(query) {
        const notes = this.notes.searchNotes(query);
        const notesList = document.getElementById('notesList');

        if (notes.length === 0) {
            notesList.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">یادداشتی یافت نشد</div>';
        } else {
            notesList.innerHTML = notes.map(note => this.createNoteItemHTML(note)).join('');
            
            notesList.querySelectorAll('.note-item').forEach(item => {
                item.addEventListener('click', () => this.openNote(item.dataset.id));
            });
        }
    }

    openSettings() {
        document.getElementById('settingsModal').classList.add('show');
        document.getElementById('autoLockTime').value = this.autoLock.getLockTime();
    }

    closeSettings() {
        document.getElementById('settingsModal').classList.remove('show');
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    }

    updateAutoLockTime(minutes) {
        this.autoLock.setLockTime(parseInt(minutes));
    }

    async changePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            alert('لطفاً تمام فیلدها را پر کنید');
            return;
        }

        const isValid = await this.crypto.verifyPassphrase(currentPassword);
        if (!isValid) {
            alert('رمز عبور فعلی اشتباه است');
            return;
        }

        if (newPassword.length < 4) {
            alert('رمز عبور جدید باید حداقل ۴ کاراکتر باشد');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            alert('رمز عبور جدید و تایید آن مطابقت ندارند');
            return;
        }

        // Re-encrypt all notes with new password
        const notesData = JSON.stringify(this.notes.notes);

        await this.crypto.setPassphrase(newPassword);
        this.crypto.setCurrentPassphrase(newPassword);

        // Encrypt notes with new password
        const newEncrypted = this.crypto.encrypt(notesData, newPassword);
        localStorage.setItem('encryptedNotes', newEncrypted);

        alert('رمز عبور با موفقیت تغییر کرد');
        this.closeSettings();
    }

    resetApp() {
        this.showConfirmModal(
            '⚠️ حذف همه داده‌ها',
            'این عملیات تمام یادداشت‌ها و تنظیمات را حذف می‌کند و قابل بازگشت نیست. آیا مطمئن هستید؟',
            () => {
                localStorage.clear();
                location.reload();
            }
        );
    }

    showConfirmModal(title, message, onConfirm) {
        document.getElementById('confirmTitle').textContent = title;
        document.getElementById('confirmMessage').textContent = message;
        document.getElementById('confirmModal').classList.add('show');
        
        const yesBtn = document.getElementById('confirmYes');
        const newYesBtn = yesBtn.cloneNode(true);
        yesBtn.parentNode.replaceChild(newYesBtn, yesBtn);
        
        newYesBtn.addEventListener('click', onConfirm);
    }

    closeConfirmModal() {
        document.getElementById('confirmModal').classList.remove('show');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SecureNotesApp();
});

