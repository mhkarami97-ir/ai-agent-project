// Configuration
const GIST_ID_KEY = 'chat_gist_id';
const GITHUB_TOKEN_KEY = 'github_token';
const USERNAME_KEY = 'chat_username';
const POLL_INTERVAL = 2000; // 2 seconds

// State
let currentUsername = '';
let githubToken = '';
let gistId = '';
let messages = [];
let pollInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    setupEventListeners();
    checkSetup();
});

function loadSavedData() {
    currentUsername = localStorage.getItem(USERNAME_KEY) || '';
    githubToken = localStorage.getItem(GITHUB_TOKEN_KEY) || '';
    gistId = localStorage.getItem(GIST_ID_KEY) || '';

    if (currentUsername) {
        showChatInterface();
    }
}

function setupEventListeners() {
    document.getElementById('setUsernameBtn').addEventListener('click', setUsername);
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') setUsername();
    });

    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('sendBtn').addEventListener('click', sendMessage);
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    document.getElementById('saveTokenBtn').addEventListener('click', saveToken);
    document.getElementById('githubTokenInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveToken();
    });
}

function checkSetup() {
    if (!githubToken) {
        document.getElementById('setupSection').style.display = 'block';
        return;
    }

    if (gistId) {
        startPolling();
    } else {
        createGist();
    }
}

function saveToken() {
    const token = document.getElementById('githubTokenInput').value.trim();
    if (!token) {
        alert('لطفاً Token را وارد کنید');
        return;
    }

    githubToken = token;
    localStorage.setItem(GITHUB_TOKEN_KEY, token);
    document.getElementById('setupSection').style.display = 'none';
    
    if (!gistId) {
        createGist();
    } else {
        startPolling();
    }
}

async function createGist() {
    if (!githubToken) return;

    try {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                description: 'Chat Messages Storage',
                public: false,
                files: {
                    'messages.json': {
                        content: JSON.stringify([], null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert('Token نامعتبر است. لطفاً Token جدیدی ایجاد کنید.');
                localStorage.removeItem(GITHUB_TOKEN_KEY);
                githubToken = '';
                document.getElementById('setupSection').style.display = 'block';
                return;
            }
            throw new Error('خطا در ایجاد Gist');
        }

        const data = await response.json();
        gistId = data.id;
        localStorage.setItem(GIST_ID_KEY, gistId);
        startPolling();
    } catch (error) {
        console.error('Error creating gist:', error);
        alert('خطا در اتصال به GitHub. لطفاً دوباره تلاش کنید.');
    }
}

async function loadMessages() {
    if (!gistId || !githubToken) return;

    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                // Gist not found, create a new one
                gistId = '';
                localStorage.removeItem(GIST_ID_KEY);
                createGist();
                return;
            }
            throw new Error('خطا در بارگذاری پیام‌ها');
        }

        const data = await response.json();
        const content = data.files['messages.json'].content;
        const loadedMessages = JSON.parse(content);

        // Only update if messages changed
        if (JSON.stringify(messages) !== JSON.stringify(loadedMessages)) {
            messages = loadedMessages;
            displayMessages();
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

async function saveMessage(message) {
    if (!gistId || !githubToken) return;

    messages.push(message);

    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${githubToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                files: {
                    'messages.json': {
                        content: JSON.stringify(messages, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            throw new Error('خطا در ذخیره پیام');
        }

        displayMessages();
    } catch (error) {
        console.error('Error saving message:', error);
        messages.pop(); // Remove message if save failed
        alert('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.');
    }
}

function setUsername() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
        alert('لطفاً نام کاربری خود را وارد کنید');
        return;
    }

    currentUsername = username;
    localStorage.setItem(USERNAME_KEY, username);
    showChatInterface();
}

function logout() {
    currentUsername = '';
    localStorage.removeItem(USERNAME_KEY);
    document.getElementById('userInfo').style.display = 'flex';
    document.getElementById('currentUser').style.display = 'none';
    document.getElementById('chatInputContainer').style.display = 'none';
    document.getElementById('messages').innerHTML = `
        <div class="welcome-message">
            <p>👋 به سیستم چت خوش آمدید!</p>
            <p>لطفاً ابتدا نام کاربری خود را وارد کنید.</p>
        </div>
    `;
    document.getElementById('usernameInput').value = '';
}

function showChatInterface() {
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('currentUser').style.display = 'flex';
    document.getElementById('usernameDisplay').textContent = currentUsername;
    document.getElementById('chatInputContainer').style.display = 'block';
    
    // Clear welcome message
    const messagesDiv = document.getElementById('messages');
    if (messagesDiv.querySelector('.welcome-message')) {
        messagesDiv.innerHTML = '';
    }

    if (gistId && githubToken) {
        loadMessages();
        startPolling();
    }
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const text = input.value.trim();

    if (!text) return;
    if (!currentUsername) {
        alert('لطفاً ابتدا نام کاربری خود را وارد کنید');
        return;
    }
    if (!githubToken) {
        alert('لطفاً ابتدا GitHub Token را تنظیم کنید');
        return;
    }

    const message = {
        id: Date.now(),
        username: currentUsername,
        text: text,
        timestamp: new Date().toISOString()
    };

    input.value = '';
    saveMessage(message);
}

function displayMessages() {
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = '';

    if (messages.length === 0) {
        messagesDiv.innerHTML = '<div class="welcome-message"><p>هنوز پیامی ارسال نشده است. اولین پیام را شما بفرستید! 🎉</p></div>';
        return;
    }

    messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.username === currentUsername ? 'own' : 'other'}`;

        const time = new Date(msg.timestamp);
        const timeString = time.toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-username">${escapeHtml(msg.username)}</span>
                <span class="message-time">${timeString}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.text)}</div>
        `;

        messagesDiv.appendChild(messageDiv);
    });

    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function startPolling() {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
    loadMessages(); // Load immediately
    pollInterval = setInterval(loadMessages, POLL_INTERVAL);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (pollInterval) {
        clearInterval(pollInterval);
    }
});

