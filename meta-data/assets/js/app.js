const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('preview-image');
const metaList = document.getElementById('meta-list');
const clearButton = document.getElementById('clear-meta');
const downloadLink = document.getElementById('download-link');
const statusMessage = document.getElementById('status-message');
const actions = document.getElementById('actions');
const yearEl = document.getElementById('year');

const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
let loadedFile = null;
let cleanedBlob = null;
let cleanedUrl = null;

yearEl.textContent = new Date().getFullYear();

const LOCAL_STORAGE_KEY = 'metaclean:last-file-info';

const formatValue = (value) => {
    if (value === null || value === undefined) {
        return '—';
    }
    if (Array.isArray(value)) {
        return value.slice(0, 5).join(', ') + (value.length > 5 ? ' …' : '');
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch (error) {
            console.warn('Failed to stringify metadata value', error);
            return '[object Object]';
        }
    }
    return String(value);
};

const updateStatus = (message) => {
    statusMessage.textContent = message;
    statusMessage.hidden = !message;
};

const saveLastInfo = (data) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

const loadLastInfo = () => {
    try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (error) {
        console.warn('Failed to parse cached info', error);
        return null;
    }
};

const displayMessage = (message) => {
    metaList.innerHTML = `<p class="meta-placeholder">${message}</p>`;
    updateStatus('');
};

const revokeCleanedUrl = () => {
    if (cleanedUrl) {
        URL.revokeObjectURL(cleanedUrl);
        cleanedUrl = null;
    }
};

const resetDownloadState = () => {
    revokeCleanedUrl();
    cleanedBlob = null;
    downloadLink.hidden = true;
    downloadLink.removeAttribute('href');
};

const handleFile = async (file) => {
    console.log('handleFile called with:', file);
    
    loadedFile = null;
    resetDownloadState();
    clearButton.disabled = true;
    updateStatus('');

    if (!file) {
        console.log('No file provided');
        displayMessage('فایلی انتخاب نشده است.');
        preview.hidden = true;
        return;
    }

    console.log('File type:', file.type);
    if (!SUPPORTED_TYPES.includes(file.type)) {
        console.log('Unsupported file type:', file.type);
        displayMessage('فرمت پشتیبانی نشده است. لطفاً یک تصویر JPEG، PNG یا WEBP انتخاب کنید.');
        preview.hidden = true;
        return;
    }

    console.log('File accepted, processing...');
    loadedFile = file;
    const reader = new FileReader();

    reader.onload = () => {
        console.log('FileReader onload triggered');
        preview.hidden = false;
        previewImage.src = reader.result;
        extractMetadata(file);
    };

    reader.onerror = () => {
        console.error('FileReader error');
        displayMessage('خطا در خواندن فایل.');
    };

    reader.readAsDataURL(file);
};

const extractMetadata = async (file) => {
    displayMessage('در حال استخراج متادیتا...');
    
    // Check if exifr is available, wait a bit if not
    if (typeof exifr === 'undefined') {
        console.log('exifr not immediately available, waiting...');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (typeof exifr === 'undefined') {
            displayMessage('کتابخانه پردازش متادیتا بارگذاری نشده است. لطفاً صفحه را مجدداً بارگذاری کنید.');
            console.error('exifr library not loaded after waiting');
            // Still show actions even if no metadata
            actions.hidden = false;
            clearButton.disabled = false;
            return;
        }
    }

    try {
        console.log('Parsing metadata for file:', file.name, file.type);
        const metadata = await exifr.parse(file, true);
        console.log('Extracted metadata:', metadata);
        
        const entries = Object.entries(metadata || {});
        renderMetadata(entries);
        saveLastInfo({ name: file.name, size: file.size, type: file.type, extractedAt: Date.now() });
    } catch (error) {
        console.error('Metadata parse failed', error);
        displayMessage('امکان استخراج متادیتا وجود ندارد یا فایل پشتیبانی نمی‌شود.');
        // Still show actions even if no metadata
        actions.hidden = false;
        clearButton.disabled = false;
    }
};

const renderMetadata = (entries) => {
    metaList.innerHTML = '';

    if (!entries.length) {
        actions.hidden = false;
        clearButton.disabled = false;
        displayMessage('متادیتایی یافت نشد یا تصویر فاقد متادیتا است.');
        return;
    }

    entries.slice(0, 30).forEach(([key, value]) => {
        const card = document.createElement('div');
        card.className = 'meta-item';
        const safeKey = typeof key === 'string' ? key : String(key);
        card.innerHTML = `<strong>${safeKey}</strong><span>${formatValue(value)}</span>`;
        metaList.appendChild(card);
    });

    if (entries.length > 30) {
        const more = document.createElement('p');
        more.className = 'meta-placeholder';
        more.textContent = `+${entries.length - 30} مورد دیگر`;
        metaList.appendChild(more);
    }

    actions.hidden = false;
    clearButton.disabled = false;
    updateStatus('برای حذف متادیتا روی دکمه بالا کلیک کنید.');
};

const stripMetadata = () => {
    if (!loadedFile) {
        displayMessage('ابتدا تصویر را بارگذاری کنید.');
        return;
    }
    updateStatus('در حال ساخت نسخه بدون متادیتا...');
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) {
                displayMessage('ساخت نسخه جدید با مشکل مواجه شد.');
                return;
            }
            cleanedBlob = blob;
            revokeCleanedUrl();
            cleanedUrl = URL.createObjectURL(cleanedBlob);
            downloadLink.href = cleanedUrl;
            const extension = loadedFile.name.split('.').pop();
            const nameWithoutExt = loadedFile.name.replace(/\.[^/.]+$/, '');
            downloadLink.download = `${nameWithoutExt}-clean.${extension}`;
            downloadLink.hidden = false;
            updateStatus('نسخه بدون متادیتا آماده دانلود است.');
        }, loadedFile.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.97);
    };
    img.onerror = () => displayMessage('مشکلی در پردازش تصویر رخ داد.');
    img.src = URL.createObjectURL(loadedFile);
};

fileInput.addEventListener('change', (event) => {
    console.log('File input change event triggered');
    console.log('Selected files:', event.target.files);
    handleFile(event.target.files[0]);
});

dropzone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropzone.classList.add('is-dragging');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragging'));

dropzone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropzone.classList.remove('is-dragging');
    const file = event.dataTransfer.files[0];
    handleFile(file);
});

dropzone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
    }
});

downloadLink.addEventListener('click', () => {
    if (cleanedBlob) {
        updateStatus('دانلود آغاز شد.');
    }
});

clearButton.addEventListener('click', stripMetadata);

const lastInfo = loadLastInfo();
if (lastInfo) {
    updateStatus(`آخرین فایل پردازش شده: ${lastInfo.name}`);
}

window.addEventListener('beforeunload', revokeCleanedUrl);

// Initialize and check dependencies
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, checking dependencies...');
    console.log('exifr available:', typeof exifr !== 'undefined');
    if (typeof exifr !== 'undefined') {
        console.log('exifr version:', exifr.version || 'unknown');
    }
});

console.log('app.js loaded successfully');

