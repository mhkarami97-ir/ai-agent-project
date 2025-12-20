// Global State
let currentLogData = {
    rawContent: '',
    lines: [],
    fileName: '',
    fileSize: 0,
    stats: {
        total: 0,
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
    }
};

// IndexedDB Setup
const DB_NAME = 'LogAnalyzerDB';
const DB_VERSION = 1;
const STORE_NAME = 'analyses';
let db;

// Initialize Database
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const clearFileBtn = document.getElementById('clearFile');
const controlsSection = document.getElementById('controlsSection');
const statsSection = document.getElementById('statsSection');
const logSection = document.getElementById('logSection');
const savedSection = document.getElementById('savedSection');
const searchInput = document.getElementById('searchInput');
const regexInput = document.getElementById('regexInput');
const applyRegexBtn = document.getElementById('applyRegex');
const levelFilter = document.getElementById('levelFilter');
const groupBy = document.getElementById('groupBy');
const logDisplay = document.getElementById('logDisplay');
const totalLines = document.getElementById('totalLines');
const errorCount = document.getElementById('errorCount');
const warnCount = document.getElementById('warnCount');
const infoCount = document.getElementById('infoCount');
const exportBtn = document.getElementById('exportBtn');
const saveAnalysisBtn = document.getElementById('saveAnalysisBtn');
const loadAnalysisBtn = document.getElementById('loadAnalysisBtn');
const copyBtn = document.getElementById('copyBtn');
const toggleWrapBtn = document.getElementById('toggleWrapBtn');
const savedList = document.getElementById('savedList');

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await initDB();
    loadSavedAnalyses();
});

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
clearFileBtn.addEventListener('click', clearFile);
searchInput.addEventListener('input', debounce(applyFilters, 300));
regexInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') applyRegex();
});
applyRegexBtn.addEventListener('click', applyRegex);
levelFilter.addEventListener('change', applyFilters);
groupBy.addEventListener('change', applyFilters);
exportBtn.addEventListener('click', exportToJSON);
saveAnalysisBtn.addEventListener('click', saveAnalysis);
loadAnalysisBtn.addEventListener('click', () => {
    savedSection.style.display = savedSection.style.display === 'none' ? 'block' : 'none';
});
copyBtn.addEventListener('click', copyToClipboard);
toggleWrapBtn.addEventListener('click', toggleWrap);

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

// File Processing
function processFile(file) {
    const validExtensions = ['.txt', '.log', '.json'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        alert('فرمت فایل نامعتبر است. لطفاً فایل TXT، LOG یا JSON انتخاب کنید.');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const content = e.target.result;
        currentLogData.rawContent = content;
        currentLogData.fileName = file.name;
        currentLogData.fileSize = file.size;
        
        parseLogContent(content, fileExtension);
        updateUI();
        displayFileInfo(file);
    };
    
    reader.onerror = () => {
        alert('خطا در خواندن فایل. لطفاً دوباره تلاش کنید.');
    };
    
    reader.readAsText(file);
}

// Parse Log Content
function parseLogContent(content, fileExtension) {
    if (fileExtension === '.json') {
        try {
            const jsonData = JSON.parse(content);
            if (Array.isArray(jsonData)) {
                currentLogData.lines = jsonData.map(item => 
                    typeof item === 'string' ? item : JSON.stringify(item)
                );
            } else {
                currentLogData.lines = [JSON.stringify(jsonData, null, 2)];
            }
        } catch (e) {
            currentLogData.lines = content.split('\n');
        }
    } else {
        currentLogData.lines = content.split('\n').filter(line => line.trim() !== '');
    }
    
    calculateStats();
}

// Calculate Statistics
function calculateStats() {
    const stats = {
        total: currentLogData.lines.length,
        error: 0,
        warn: 0,
        info: 0,
        debug: 0
    };
    
    currentLogData.lines.forEach(line => {
        const upperLine = line.toUpperCase();
        if (upperLine.includes('ERROR')) stats.error++;
        else if (upperLine.includes('WARN')) stats.warn++;
        else if (upperLine.includes('INFO')) stats.info++;
        else if (upperLine.includes('DEBUG')) stats.debug++;
    });
    
    currentLogData.stats = stats;
}

// Update UI
function updateUI() {
    // Show sections
    controlsSection.style.display = 'block';
    statsSection.style.display = 'block';
    logSection.style.display = 'block';
    
    // Update stats
    totalLines.textContent = currentLogData.stats.total.toLocaleString('fa-IR');
    errorCount.textContent = currentLogData.stats.error.toLocaleString('fa-IR');
    warnCount.textContent = currentLogData.stats.warn.toLocaleString('fa-IR');
    infoCount.textContent = currentLogData.stats.info.toLocaleString('fa-IR');
    
    // Display logs
    applyFilters();
}

// Display File Info
function displayFileInfo(file) {
    uploadArea.style.display = 'none';
    fileInfo.style.display = 'flex';
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
}

// Clear File
function clearFile() {
    currentLogData = {
        rawContent: '',
        lines: [],
        fileName: '',
        fileSize: 0,
        stats: { total: 0, error: 0, warn: 0, info: 0, debug: 0 }
    };
    
    uploadArea.style.display = 'block';
    fileInfo.style.display = 'none';
    controlsSection.style.display = 'none';
    statsSection.style.display = 'none';
    logSection.style.display = 'none';
    savedSection.style.display = 'none';
    
    fileInput.value = '';
    searchInput.value = '';
    regexInput.value = '';
    levelFilter.value = 'all';
    groupBy.value = 'none';
}

// Apply Filters
function applyFilters() {
    let filteredLines = [...currentLogData.lines];
    
    // Apply search filter
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm) {
        filteredLines = filteredLines.filter(line => 
            line.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply level filter
    const level = levelFilter.value;
    if (level !== 'all') {
        filteredLines = filteredLines.filter(line => 
            line.toUpperCase().includes(level.toUpperCase())
        );
    }
    
    // Apply grouping
    const grouping = groupBy.value;
    if (grouping === 'none') {
        displayLogs(filteredLines);
    } else {
        displayGroupedLogs(filteredLines, grouping);
    }
}

// Apply Regex
function applyRegex() {
    const regexPattern = regexInput.value.trim();
    if (!regexPattern) {
        applyFilters();
        return;
    }
    
    try {
        const regex = new RegExp(regexPattern, 'gi');
        let filteredLines = currentLogData.lines.filter(line => regex.test(line));
        
        const grouping = groupBy.value;
        if (grouping === 'none') {
            displayLogs(filteredLines, regex);
        } else {
            displayGroupedLogs(filteredLines, grouping, regex);
        }
    } catch (e) {
        alert('الگوی Regex نامعتبر است: ' + e.message);
    }
}

// Display Logs
function displayLogs(lines, highlightRegex = null) {
    logDisplay.innerHTML = '';
    logDisplay.className = 'log-display no-wrap';
    
    if (lines.length === 0) {
        logDisplay.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">نتیجه‌ای یافت نشد</div>';
        return;
    }
    
    lines.forEach((line) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'log-line';
        
        let displayText = escapeHtml(line);
        
        // Highlight regex matches
        if (highlightRegex) {
            displayText = displayText.replace(highlightRegex, match => 
                `<span class="highlight" style="background: rgba(255, 215, 0, 0.3); font-weight: bold;">${match}</span>`
            );
            lineDiv.classList.add('highlight');
        }
        
        // Color code by level
        const upperLine = line.toUpperCase();
        if (upperLine.includes('ERROR')) {
            displayText = `<span class="level-error">${displayText}</span>`;
        } else if (upperLine.includes('WARN')) {
            displayText = `<span class="level-warn">${displayText}</span>`;
        } else if (upperLine.includes('INFO')) {
            displayText = `<span class="level-info">${displayText}</span>`;
        } else if (upperLine.includes('DEBUG')) {
            displayText = `<span class="level-debug">${displayText}</span>`;
        }
        
        lineDiv.innerHTML = displayText;
        logDisplay.appendChild(lineDiv);
    });
}

// Display Grouped Logs
function displayGroupedLogs(lines, grouping, highlightRegex = null) {
    logDisplay.innerHTML = '';
    logDisplay.className = 'log-display no-wrap';
    
    if (lines.length === 0) {
        logDisplay.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">نتیجه‌ای یافت نشد</div>';
        return;
    }
    
    const groups = {};
    
    lines.forEach(line => {
        let groupKey;
        const upperLine = line.toUpperCase();
        
        switch (grouping) {
            case 'level':
                if (upperLine.includes('ERROR')) groupKey = 'ERROR';
                else if (upperLine.includes('WARN')) groupKey = 'WARN';
                else if (upperLine.includes('INFO')) groupKey = 'INFO';
                else if (upperLine.includes('DEBUG')) groupKey = 'DEBUG';
                else groupKey = 'OTHER';
                break;
            case 'date':
                const dateMatch = line.match(/\d{4}-\d{2}-\d{2}/);
                groupKey = dateMatch ? dateMatch[0] : 'بدون تاریخ';
                break;
            case 'source':
                const sourceMatch = line.match(/\[([^\]]+)]/);
                groupKey = sourceMatch ? sourceMatch[1] : 'نامشخص';
                break;
            default:
                groupKey = 'OTHER';
        }
        
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(line);
    });
    
    Object.keys(groups).sort().forEach(groupKey => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'log-group';
        
        const headerDiv = document.createElement('div');
        headerDiv.className = 'log-group-header';
        if (groupKey === 'ERROR') headerDiv.classList.add('error');
        else if (groupKey === 'WARN') headerDiv.classList.add('warn');
        else if (groupKey === 'INFO') headerDiv.classList.add('info');
        else if (groupKey === 'DEBUG') headerDiv.classList.add('debug');
        
        headerDiv.innerHTML = `
            <span>${groupKey} (${groups[groupKey].length.toLocaleString('fa-IR')} خط)</span>
            <span>▼</span>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'log-group-content';
        
        groups[groupKey].forEach(line => {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'log-line';
            
            let displayText = escapeHtml(line);
            
            if (highlightRegex) {
                displayText = displayText.replace(highlightRegex, match => 
                    `<span style="background: rgba(255, 215, 0, 0.3); font-weight: bold;">${match}</span>`
                );
            }
            
            lineDiv.innerHTML = displayText;
            contentDiv.appendChild(lineDiv);
        });
        
        headerDiv.addEventListener('click', () => {
            contentDiv.classList.toggle('collapsed');
            const arrow = headerDiv.querySelector('span:last-child');
            arrow.textContent = contentDiv.classList.contains('collapsed') ? '◀' : '▼';
        });
        
        groupDiv.appendChild(headerDiv);
        groupDiv.appendChild(contentDiv);
        logDisplay.appendChild(groupDiv);
    });
}

// Export to JSON
function exportToJSON() {
    const exportData = {
        fileName: currentLogData.fileName,
        exportDate: new Date().toISOString(),
        stats: currentLogData.stats,
        logs: currentLogData.lines
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `log-analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Save Analysis to IndexedDB
async function saveAnalysis() {
    if (!currentLogData.lines.length) {
        alert('هیچ داده‌ای برای ذخیره وجود ندارد.');
        return;
    }
    
    const analysis = {
        fileName: currentLogData.fileName,
        savedDate: new Date().toISOString(),
        stats: currentLogData.stats,
        rawContent: currentLogData.rawContent,
        lines: currentLogData.lines
    };
    
    try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.add(analysis);
        
        alert('تحلیل با موفقیت ذخیره شد.');
        loadSavedAnalyses();
    } catch (error) {
        alert('خطا در ذخیره‌سازی: ' + error.message);
    }
}

// Load Saved Analyses
async function loadSavedAnalyses() {
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => {
            const analyses = request.result;
            displaySavedAnalyses(analyses);
        };
    } catch (error) {
        console.error('خطا در بارگذاری تحلیل‌ها:', error);
    }
}

// Display Saved Analyses
function displaySavedAnalyses(analyses) {
    savedList.innerHTML = '';
    
    if (analyses.length === 0) {
        savedList.innerHTML = '<div style="text-align: center; color: #888; padding: 20px;">تحلیل ذخیره شده‌ای وجود ندارد</div>';
        return;
    }
    
    analyses.reverse().forEach(analysis => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'saved-item';
        
        const date = new Date(analysis.savedDate);
        const formattedDate = date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR');
        
        itemDiv.innerHTML = `
            <div class="saved-item-info">
                <div class="saved-item-name">${analysis.fileName}</div>
                <div class="saved-item-date">${formattedDate}</div>
            </div>
            <div class="saved-item-actions">
                <button class="btn-primary" onclick="loadAnalysisById(${analysis.id})">بارگذاری</button>
                <button class="btn-secondary" onclick="deleteAnalysisById(${analysis.id})">حذف</button>
            </div>
        `;
        
        savedList.appendChild(itemDiv);
    });
}

// Load Analysis by ID
window.loadAnalysisById = async function(id) {
    try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);
        
        request.onsuccess = () => {
            const analysis = request.result;
            if (analysis) {
                currentLogData.rawContent = analysis.rawContent;
                currentLogData.lines = analysis.lines;
                currentLogData.fileName = analysis.fileName;
                currentLogData.fileSize = new Blob([analysis.rawContent]).size;
                currentLogData.stats = analysis.stats;
                
                updateUI();
                
                // Update file info display
                uploadArea.style.display = 'none';
                fileInfo.style.display = 'flex';
                fileName.textContent = analysis.fileName;
                fileSize.textContent = formatFileSize(currentLogData.fileSize);
                
                savedSection.style.display = 'none';
                
                alert('تحلیل با موفقیت بارگذاری شد.');
            }
        };
    } catch (error) {
        alert('خطا در بارگذاری: ' + error.message);
    }
};

// Delete Analysis by ID
window.deleteAnalysisById = async function(id) {
    if (!confirm('آیا از حذف این تحلیل اطمینان دارید؟')) {
        return;
    }
    
    try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.delete(id);
        
        alert('تحلیل با موفقیت حذف شد.');
        loadSavedAnalyses();
    } catch (error) {
        alert('خطا در حذف: ' + error.message);
    }
};

// Copy to Clipboard
function copyToClipboard() {
    const text = logDisplay.innerText;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✓';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        alert('خطا در کپی کردن.');
    });
}

// Toggle Wrap
function toggleWrap() {
    if (logDisplay.classList.contains('no-wrap')) {
        logDisplay.classList.remove('no-wrap');
        logDisplay.classList.add('wrap');
    } else {
        logDisplay.classList.remove('wrap');
        logDisplay.classList.add('no-wrap');
    }
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

