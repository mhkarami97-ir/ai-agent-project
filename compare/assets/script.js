// ==================== DOM Elements ====================
const leftText = document.getElementById('leftText');
const rightText = document.getElementById('rightText');
const compareBtn = document.getElementById('compareBtn');
const clearBtn = document.getElementById('clearBtn');
const swapBtn = document.getElementById('swapBtn');
const diffContainer = document.getElementById('diffContainer');
const leftDiff = document.getElementById('leftDiff');
const rightDiff = document.getElementById('rightDiff');
const statsDiv = document.getElementById('stats');
const leftLineCount = document.getElementById('leftLineCount');
const rightLineCount = document.getElementById('rightLineCount');

// ==================== Local Storage Keys ====================
const STORAGE_KEYS = {
    LEFT_TEXT: 'textCompare_leftText',
    RIGHT_TEXT: 'textCompare_rightText'
};

// ==================== Initialize ====================
function init() {
    loadFromStorage();
    updateLineCounts();
    attachEventListeners();
}

// ==================== Event Listeners ====================
function attachEventListeners() {
    compareBtn.addEventListener('click', performComparison);
    clearBtn.addEventListener('click', clearAll);
    swapBtn.addEventListener('click', swapTexts);
    
    leftText.addEventListener('input', () => {
        updateLineCount(leftText, leftLineCount);
        saveToStorage();
    });
    
    rightText.addEventListener('input', () => {
        updateLineCount(rightText, rightLineCount);
        saveToStorage();
    });

    // Real-time comparison on input (debounced)
    let debounceTimer;
    const autoCompare = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (leftText.value.trim() || rightText.value.trim()) {
                performComparison();
            }
        }, 500);
    };

    leftText.addEventListener('input', autoCompare);
    rightText.addEventListener('input', autoCompare);
}

// ==================== Line Count ====================
function updateLineCounts() {
    updateLineCount(leftText, leftLineCount);
    updateLineCount(rightText, rightLineCount);
}

function updateLineCount(textarea, countElement) {
    const lines = textarea.value.split('\n').length;
    countElement.textContent = `${lines.toLocaleString('fa-IR')} خط`;
}

// ==================== Local Storage ====================
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.LEFT_TEXT, leftText.value);
        localStorage.setItem(STORAGE_KEYS.RIGHT_TEXT, rightText.value);
    } catch (e) {
        console.error('خطا در ذخیره‌سازی:', e);
    }
}

function loadFromStorage() {
    try {
        const savedLeft = localStorage.getItem(STORAGE_KEYS.LEFT_TEXT);
        const savedRight = localStorage.getItem(STORAGE_KEYS.RIGHT_TEXT);
        
        if (savedLeft !== null) leftText.value = savedLeft;
        if (savedRight !== null) rightText.value = savedRight;
    } catch (e) {
        console.error('خطا در بارگذاری:', e);
    }
}

// ==================== Clear & Swap ====================
function clearAll() {
    leftText.value = '';
    rightText.value = '';
    diffContainer.style.display = 'none';
    updateLineCounts();
    saveToStorage();
}

function swapTexts() {
    const temp = leftText.value;
    leftText.value = rightText.value;
    rightText.value = temp;
    updateLineCounts();
    saveToStorage();
    
    if (diffContainer.style.display !== 'none') {
        performComparison();
    }
}

// ==================== Diff Algorithm ====================
function performComparison() {
    const left = leftText.value.split('\n');
    const right = rightText.value.split('\n');
    
    const diff = computeDiff(left, right);
    renderDiff(diff, left, right);
    displayStats(diff);
    
    diffContainer.style.display = 'block';
    setTimeout(() => {
        diffContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

function computeDiff(left, right) {
    const leftLen = left.length;
    const rightLen = right.length;
    
    // Dynamic Programming LCS (Longest Common Subsequence)
    const dp = Array(leftLen + 1).fill(null).map(() => Array(rightLen + 1).fill(0));
    
    for (let i = 1; i <= leftLen; i++) {
        for (let j = 1; j <= rightLen; j++) {
            if (left[i - 1] === right[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    // Backtrack to find the diff
    const diff = [];
    let i = leftLen;
    let j = rightLen;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && left[i - 1] === right[j - 1]) {
            diff.unshift({
                type: 'unchanged',
                leftLine: i - 1,
                rightLine: j - 1,
                content: left[i - 1]
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({
                type: 'added',
                leftLine: null,
                rightLine: j - 1,
                content: right[j - 1]
            });
            j--;
        } else if (i > 0) {
            diff.unshift({
                type: 'removed',
                leftLine: i - 1,
                rightLine: null,
                content: left[i - 1]
            });
            i--;
        }
    }
    
    return diff;
}

// ==================== Render Diff ====================
function renderDiff(diff, left, right) {
    const leftLines = [];
    const rightLines = [];
    
    diff.forEach(item => {
        switch (item.type) {
            case 'unchanged':
                leftLines.push(createDiffLine(item.content, 'unchanged'));
                rightLines.push(createDiffLine(item.content, 'unchanged'));
                break;
            case 'removed':
                leftLines.push(createDiffLine(item.content, 'removed'));
                rightLines.push(createDiffLine('', 'empty'));
                break;
            case 'added':
                leftLines.push(createDiffLine('', 'empty'));
                rightLines.push(createDiffLine(item.content, 'added'));
                break;
            case 'modified':
                leftLines.push(createDiffLine(item.oldContent, 'modified'));
                rightLines.push(createDiffLine(item.newContent, 'modified'));
                break;
        }
    });
    
    leftDiff.innerHTML = leftLines.join('');
    rightDiff.innerHTML = rightLines.join('');
}

function createDiffLine(content, type) {
    const escapedContent = escapeHtml(content);
    const displayContent = escapedContent || '&nbsp;';
    
    if (type === 'empty') {
        return `<div class="diff-line" style="opacity: 0.3; min-height: 1.8em;">&nbsp;</div>`;
    }
    
    return `<div class="diff-line ${type}">${displayContent}</div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== Display Stats ====================
function displayStats(diff) {
    const stats = {
        added: 0,
        removed: 0,
        modified: 0,
        unchanged: 0
    };
    
    diff.forEach(item => {
        stats[item.type]++;
    });
    
    const totalChanges = stats.added + stats.removed + stats.modified;
    
    statsDiv.innerHTML = `
        <div class="stat-item">
            <span class="stat-value added">${stats.added.toLocaleString('fa-IR')}</span>
            <span class="stat-label">خط افزوده شده</span>
        </div>
        <div class="stat-item">
            <span class="stat-value removed">${stats.removed.toLocaleString('fa-IR')}</span>
            <span class="stat-label">خط حذف شده</span>
        </div>
        <div class="stat-item">
            <span class="stat-value">${stats.unchanged.toLocaleString('fa-IR')}</span>
            <span class="stat-label">خط بدون تغییر</span>
        </div>
        <div class="stat-item">
            <span class="stat-value" style="color: var(--primary-color);">${totalChanges.toLocaleString('fa-IR')}</span>
            <span class="stat-label">مجموع تغییرات</span>
        </div>
    `;
}

// ==================== Initialize App ====================
document.addEventListener('DOMContentLoaded', init);

