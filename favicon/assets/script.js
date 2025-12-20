// Constants
const ICON_SIZES = [
    { size: 16, name: 'favicon-16x16.png', type: 'Favicon', includeInIco: true },
    { size: 32, name: 'favicon-32x32.png', type: 'Favicon', includeInIco: true },
    { size: 48, name: 'favicon-48x48.png', type: 'Favicon', includeInIco: true },
    { size: 64, name: 'favicon-64x64.png', type: 'Favicon', includeInIco: false },
    { size: 128, name: 'icon-128x128.png', type: 'PWA', includeInIco: false },
    { size: 144, name: 'icon-144x144.png', type: 'PWA', includeInIco: false },
    { size: 152, name: 'icon-152x152.png', type: 'PWA', includeInIco: false },
    { size: 167, name: 'icon-167x167.png', type: 'PWA', includeInIco: false },
    { size: 180, name: 'icon-180x180.png', type: 'PWA', includeInIco: false },
    { size: 192, name: 'icon-192x192.png', type: 'PWA', includeInIco: false },
    { size: 256, name: 'icon-256x256.png', type: 'PWA', includeInIco: false },
    { size: 384, name: 'icon-384x384.png', type: 'PWA', includeInIco: false },
    { size: 512, name: 'icon-512x512.png', type: 'PWA', includeInIco: false }
];

const DB_NAME = 'IconGeneratorDB';
const DB_VERSION = 1;
const STORE_NAME = 'history';

// Global State
let uploadedImage = null;
let generatedIcons = [];
let generatedICO = null;
let db = null;

// DOM Elements
const fileInput = document.getElementById('fileInput');
const selectFileBtn = document.getElementById('selectFileBtn');
const uploadArea = document.getElementById('uploadArea');
const uploadPlaceholder = document.getElementById('uploadPlaceholder');
const previewSection = document.getElementById('previewSection');
const previewImage = document.getElementById('previewImage');
const changeImageBtn = document.getElementById('changeImageBtn');
const backgroundColorInput = document.getElementById('backgroundColorInput');
const backgroundColorText = document.getElementById('backgroundColorText');
const transparentBg = document.getElementById('transparentBg');
const paddingInput = document.getElementById('paddingInput');
const paddingValue = document.getElementById('paddingValue');
const generateBtn = document.getElementById('generateBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsGrid = document.getElementById('resultsGrid');
const downloadAllBtn = document.getElementById('downloadAllBtn');
const resetBtn = document.getElementById('resetBtn');
const historyGrid = document.getElementById('historyGrid');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Initialize IndexedDB
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

// Save to history
function saveToHistory(imageData, icons, icoData) {
    if (!db) return;

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const historyItem = {
        timestamp: Date.now(),
        imageData: imageData,
        icons: icons,
        icoData: icoData,
        date: new Date().toLocaleString('fa-IR')
    };

    store.add(historyItem);
    loadHistory();
}

// Load history
function loadHistory() {
    if (!db) return;

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
        const history = request.result.reverse().slice(0, 10); // Last 10 items
        displayHistory(history);
    };
}

// Display history
function displayHistory(history) {
    historyGrid.innerHTML = '';

    if (history.length === 0) {
        historyGrid.innerHTML = '<div class="history-empty">تاریخچه‌ای وجود ندارد</div>';
        return;
    }

    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <img src="${item.imageData}" alt="History">
            <div class="history-date">${item.date}</div>
        `;

        historyItem.addEventListener('click', () => {
            loadFromHistory(item);
        });

        historyGrid.appendChild(historyItem);
    });
}

// Load from history
function loadFromHistory(item) {
    uploadedImage = item.imageData;
    previewImage.src = item.imageData;
    uploadPlaceholder.style.display = 'none';
    previewSection.style.display = 'grid';
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Clear history
function clearHistory() {
    if (!db) return;

    if (!confirm('آیا از پاک کردن تاریخچه مطمئن هستید؟')) return;

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
        loadHistory();
    };
}

// Event Listeners
selectFileBtn.addEventListener('click', () => fileInput.click());
changeImageBtn.addEventListener('click', () => fileInput.click());
clearHistoryBtn.addEventListener('click', clearHistory);

fileInput.addEventListener('change', handleFileSelect);

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        handleFile(files[0]);
    }
});

// Handle file select
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        handleFile(file);
    }
}

// Handle file
function handleFile(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        uploadedImage = e.target.result;
        previewImage.src = uploadedImage;
        uploadPlaceholder.style.display = 'none';
        previewSection.style.display = 'grid';
        resultsSection.style.display = 'none';
    };
    
    reader.readAsDataURL(file);
}

// Color input sync
backgroundColorInput.addEventListener('input', (e) => {
    backgroundColorText.value = e.target.value;
});

backgroundColorText.addEventListener('input', (e) => {
    const value = e.target.value;
    if (/^#[0-9A-F]{6}$/i.test(value)) {
        backgroundColorInput.value = value;
    }
});

backgroundColorText.addEventListener('blur', (e) => {
    const value = e.target.value;
    if (!/^#[0-9A-F]{6}$/i.test(value)) {
        e.target.value = backgroundColorInput.value;
    }
});

// Transparent background toggle
transparentBg.addEventListener('change', (e) => {
    const isTransparent = e.target.checked;
    backgroundColorInput.disabled = isTransparent;
    backgroundColorText.disabled = isTransparent;
    
    if (isTransparent) {
        backgroundColorInput.style.opacity = '0.5';
        backgroundColorText.style.opacity = '0.5';
    } else {
        backgroundColorInput.style.opacity = '1';
        backgroundColorText.style.opacity = '1';
    }
});

// Padding input
paddingInput.addEventListener('input', (e) => {
    paddingValue.textContent = `${e.target.value}%`;
});

// Generate icons
generateBtn.addEventListener('click', generateIcons);

async function generateIcons() {
    if (!uploadedImage) return;

    generateBtn.disabled = true;
    generateBtn.classList.add('loading');
    generateBtn.innerHTML = '<span>در حال تولید...</span>';

    try {
        generatedIcons = [];
        
        const img = new Image();
        img.src = uploadedImage;
        
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const padding = parseInt(paddingInput.value);
        const isTransparent = transparentBg.checked;
        const bgColor = backgroundColorInput.value;

        for (const iconConfig of ICON_SIZES) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = iconConfig.size;
            canvas.height = iconConfig.size;

            // Background
            if (!isTransparent) {
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Calculate dimensions with padding
            const paddingPx = (iconConfig.size * padding) / 100;
            const drawSize = iconConfig.size - (paddingPx * 2);

            // Draw image centered
            ctx.drawImage(img, paddingPx, paddingPx, drawSize, drawSize);

            const dataUrl = canvas.toDataURL('image/png');
            generatedIcons.push({
                ...iconConfig,
                dataUrl: dataUrl
            });
        }

        // Generate ICO file
        generatedICO = await generateICO(generatedIcons);

        // Save to history
        saveToHistory(uploadedImage, generatedIcons, generatedICO);

        // Display results
        displayResults();
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        alert('خطا در تولید آیکون‌ها: ' + error.message);
    } finally {
        generateBtn.disabled = false;
        generateBtn.classList.remove('loading');
        generateBtn.innerHTML = '<span>تولید آیکون‌ها</span>';
    }
}

// Generate ICO file
async function generateICO(icons) {
    // Get icons that should be included in ICO (16, 32, 48)
    const icoIcons = icons.filter(icon => icon.includeInIco);
    
    // ICO file structure
    const numImages = icoIcons.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    const dirSize = headerSize + (numImages * dirEntrySize);
    
    // Convert data URLs to image data
    const imageDataArray = [];
    let totalSize = dirSize;
    
    for (const icon of icoIcons) {
        const base64Data = icon.dataUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            bytes[i] = binaryData.charCodeAt(i);
        }
        imageDataArray.push(bytes);
        totalSize += bytes.length;
    }
    
    // Create ICO file buffer
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);
    
    let offset = 0;
    
    // Write ICO header
    view.setUint16(offset, 0, true); offset += 2;  // Reserved
    view.setUint16(offset, 1, true); offset += 2;  // Type (1 = ICO)
    view.setUint16(offset, numImages, true); offset += 2;  // Number of images
    
    // Write directory entries
    let imageOffset = dirSize;
    for (let i = 0; i < numImages; i++) {
        const icon = icoIcons[i];
        const imageData = imageDataArray[i];
        
        bytes[offset++] = icon.size === 256 ? 0 : icon.size;  // Width (0 = 256)
        bytes[offset++] = icon.size === 256 ? 0 : icon.size;  // Height (0 = 256)
        bytes[offset++] = 0;  // Color palette
        bytes[offset++] = 0;  // Reserved
        view.setUint16(offset, 1, true); offset += 2;  // Color planes
        view.setUint16(offset, 32, true); offset += 2;  // Bits per pixel
        view.setUint32(offset, imageData.length, true); offset += 4;  // Image size
        view.setUint32(offset, imageOffset, true); offset += 4;  // Image offset
        
        imageOffset += imageData.length;
    }
    
    // Write image data
    for (const imageData of imageDataArray) {
        bytes.set(imageData, offset);
        offset += imageData.length;
    }
    
    // Convert to blob and data URL
    const blob = new Blob([buffer], { type: 'image/x-icon' });
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

// Display results
function displayResults() {
    resultsGrid.innerHTML = '';

    // Add ICO file first
    if (generatedICO) {
        const icoItem = document.createElement('div');
        icoItem.className = 'result-item ico-item';
        icoItem.innerHTML = `
            <div class="ico-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
            </div>
            <div class="size-label">favicon.ico</div>
            <div class="size-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">16, 32, 48</div>
            <button class="btn btn-primary" onclick="downloadIcon('${generatedICO}', 'favicon.ico')">دانلود</button>
        `;
        resultsGrid.appendChild(icoItem);
    }

    generatedIcons.forEach(icon => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <img src="${icon.dataUrl}" alt="${icon.name}">
            <div class="size-label">${icon.size}×${icon.size}</div>
            <div class="size-label" style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.5rem;">${icon.type}</div>
            <button class="btn btn-primary" onclick="downloadIcon('${icon.dataUrl}', '${icon.name}')">دانلود</button>
        `;
        resultsGrid.appendChild(resultItem);
    });
}

// Download single icon
function downloadIcon(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    link.click();
}

// Download all icons
downloadAllBtn.addEventListener('click', downloadAllIcons);

async function downloadAllIcons() {
    if (generatedIcons.length === 0) return;

    downloadAllBtn.disabled = true;
    downloadAllBtn.classList.add('loading');
    downloadAllBtn.textContent = 'در حال دانلود...';

    try {
        // Use JSZip from CDN
        if (typeof JSZip === 'undefined') {
            await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
        }

        const zip = new JSZip();
        const faviconFolder = zip.folder('favicons');
        const pwaFolder = zip.folder('pwa-icons');

        // Add ICO file to root
        if (generatedICO) {
            const icoBase64 = generatedICO.split(',')[1];
            zip.file('favicon.ico', icoBase64, { base64: true });
        }

        generatedIcons.forEach(icon => {
            const base64Data = icon.dataUrl.split(',')[1];
            if (icon.type === 'Favicon') {
                faviconFolder.file(icon.name, base64Data, { base64: true });
            } else {
                pwaFolder.file(icon.name, base64Data, { base64: true });
            }
        });

        // Add README
        const readme = `# آیکون‌های تولید شده

تاریخ تولید: ${new Date().toLocaleString('fa-IR')}

## Favicon.ico
فایل favicon.ico شامل 3 سایز (16x16, 32x32, 48x48) است و با تمام مرورگرها سازگار است.

در تگ head صفحه HTML:

\`\`\`html
<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
\`\`\`

## Favicon PNG
آیکون‌های PNG موجود در پوشه favicons:

\`\`\`html
<link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="48x48" href="/favicons/favicon-48x48.png">
\`\`\`

## PWA Icons
آیکون‌های PWA را در فایل manifest.json خود استفاده کنید:

\`\`\`json
{
  "icons": [
    {
      "src": "/pwa-icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/pwa-icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
\`\`\`
`;

        zip.file('README.md', readme);

        const blob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `icons-${Date.now()}.zip`;
        link.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        alert('خطا در دانلود فایل‌ها: ' + error.message);
    } finally {
        downloadAllBtn.disabled = false;
        downloadAllBtn.classList.remove('loading');
        downloadAllBtn.textContent = 'دانلود همه';
    }
}

// Load external script
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Reset
resetBtn.addEventListener('click', () => {
    uploadedImage = null;
    generatedIcons = [];
    generatedICO = null;
    fileInput.value = '';
    previewImage.src = '';
    uploadPlaceholder.style.display = 'flex';
    previewSection.style.display = 'none';
    resultsSection.style.display = 'none';
    resultsGrid.innerHTML = '';
    paddingInput.value = 10;
    paddingValue.textContent = '10%';
    transparentBg.checked = true;
    backgroundColorInput.disabled = true;
    backgroundColorText.disabled = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Initialize
(async function init() {
    try {
        await initDB();
        loadHistory();
    } catch (error) {
        console.error('خطا در راه‌اندازی دیتابیس:', error);
    }
})();

