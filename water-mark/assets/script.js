// Global Variables
let canvas, ctx;
let originalImage = null;
let logoImage = null;
let currentSettings = {
    type: 'text',
    text: 'نمونه واترمارک',
    fontSize: 48,
    textColor: '#ffffff',
    opacity: 70,
    position: 'center',
    rotation: 0,
    logoSize: 100
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    setupEventListeners();
    loadSettingsFromLocalStorage();
});

// Setup Event Listeners
function setupEventListeners() {
    // Upload Box
    const uploadBox = document.getElementById('uploadBox');
    const imageInput = document.getElementById('imageInput');
    
    uploadBox.addEventListener('click', () => imageInput.click());
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('dragleave', handleDragLeave);
    uploadBox.addEventListener('drop', handleDrop);
    imageInput.addEventListener('change', handleImageSelect);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', handleTabSwitch);
    });
    
    // Text Watermark Controls
    document.getElementById('watermarkText').addEventListener('input', handleTextChange);
    document.getElementById('fontSize').addEventListener('input', handleFontSizeChange);
    document.getElementById('textColor').addEventListener('input', handleTextColorChange);
    
    // Logo Controls
    document.getElementById('logoBtn').addEventListener('click', () => {
        document.getElementById('logoInput').click();
    });
    document.getElementById('logoInput').addEventListener('change', handleLogoSelect);
    document.getElementById('logoSize').addEventListener('input', handleLogoSizeChange);
    
    // Common Controls
    document.getElementById('opacity').addEventListener('input', handleOpacityChange);
    document.getElementById('rotation').addEventListener('input', handleRotationChange);
    
    // Position Buttons
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.addEventListener('click', handlePositionChange);
    });
    
    // Action Buttons
    document.getElementById('downloadBtn').addEventListener('click', handleDownload);
    document.getElementById('resetBtn').addEventListener('click', handleReset);
}

// Drag and Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        loadImage(files[0]);
    }
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
}

// Load Image
function loadImage(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            originalImage = img;
            setupCanvas();
            showControls();
            renderWatermark();
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Setup Canvas
function setupCanvas() {
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;
}

// Show Controls
function showControls() {
    document.getElementById('controlsSection').style.display = 'block';
    document.getElementById('previewSection').style.display = 'block';
}

// Tab Switch Handler
function handleTabSwitch(e) {
    const tabName = e.currentTarget.dataset.tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    // Update settings type
    currentSettings.type = tabName;
    renderWatermark();
}

// Text Controls Handlers
function handleTextChange(e) {
    currentSettings.text = e.target.value;
    renderWatermark();
    saveSettingsToLocalStorage();
}

function handleFontSizeChange(e) {
    currentSettings.fontSize = parseInt(e.target.value);
    document.getElementById('fontSizeValue').textContent = e.target.value;
    renderWatermark();
    saveSettingsToLocalStorage();
}

function handleTextColorChange(e) {
    currentSettings.textColor = e.target.value;
    renderWatermark();
    saveSettingsToLocalStorage();
}

// Logo Controls Handlers
function handleLogoSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                logoImage = img;
                document.getElementById('logoFileName').textContent = file.name;
                renderWatermark();
            };
            img.src = event.target.result;
        };
        
        reader.readAsDataURL(file);
    }
}

function handleLogoSizeChange(e) {
    currentSettings.logoSize = parseInt(e.target.value);
    document.getElementById('logoSizeValue').textContent = e.target.value;
    renderWatermark();
    saveSettingsToLocalStorage();
}

// Common Controls Handlers
function handleOpacityChange(e) {
    currentSettings.opacity = parseInt(e.target.value);
    document.getElementById('opacityValue').textContent = e.target.value;
    renderWatermark();
    saveSettingsToLocalStorage();
}

function handleRotationChange(e) {
    currentSettings.rotation = parseInt(e.target.value);
    document.getElementById('rotationValue').textContent = e.target.value;
    renderWatermark();
    saveSettingsToLocalStorage();
}

function handlePositionChange(e) {
    // Update active button
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    currentSettings.position = e.currentTarget.dataset.position;
    renderWatermark();
    saveSettingsToLocalStorage();
}

// Render Watermark
function renderWatermark() {
    if (!originalImage) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw original image
    ctx.drawImage(originalImage, 0, 0);
    
    // Calculate position
    const position = calculatePosition();
    
    // Save context state
    ctx.save();
    
    // Set opacity
    ctx.globalAlpha = currentSettings.opacity / 100;
    
    // Move to position and rotate
    ctx.translate(position.x, position.y);
    ctx.rotate((currentSettings.rotation * Math.PI) / 180);
    
    // Draw watermark based on type
    if (currentSettings.type === 'text') {
        drawTextWatermark();
    } else if (currentSettings.type === 'image' && logoImage) {
        drawImageWatermark();
    }
    
    // Restore context state
    ctx.restore();
}

// Calculate Position
function calculatePosition() {
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    let x, y;
    
    switch (currentSettings.position) {
        case 'top-left':
            x = canvasWidth - 50;
            y = 50;
            break;
        case 'top-center':
            x = canvasWidth / 2;
            y = 50;
            break;
        case 'top-right':
            x = 50;
            y = 50;
            break;
        case 'center-left':
            x = canvasWidth - 50;
            y = canvasHeight / 2;
            break;
        case 'center':
            x = canvasWidth / 2;
            y = canvasHeight / 2;
            break;
        case 'center-right':
            x = 50;
            y = canvasHeight / 2;
            break;
        case 'bottom-left':
            x = canvasWidth - 50;
            y = canvasHeight - 50;
            break;
        case 'bottom-center':
            x = canvasWidth / 2;
            y = canvasHeight - 50;
            break;
        case 'bottom-right':
            x = 50;
            y = canvasHeight - 50;
            break;
        default:
            x = canvasWidth / 2;
            y = canvasHeight / 2;
    }
    
    return { x, y };
}

// Draw Text Watermark
function drawTextWatermark() {
    ctx.font = `bold ${currentSettings.fontSize}px Vazirmatn, Arial, sans-serif`;
    ctx.fillStyle = currentSettings.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(currentSettings.text, 0, 0);
}

// Draw Image Watermark
function drawImageWatermark() {
    const size = currentSettings.logoSize;
    const aspectRatio = logoImage.width / logoImage.height;
    const width = size;
    const height = size / aspectRatio;
    
    ctx.drawImage(logoImage, -width / 2, -height / 2, width, height);
}

// Download Image
function handleDownload() {
    if (!originalImage) return;
    
    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.download = `watermarked-image-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

// Reset Application
function handleReset() {
    originalImage = null;
    logoImage = null;
    
    // Reset form
    document.getElementById('imageInput').value = '';
    document.getElementById('logoInput').value = '';
    document.getElementById('logoFileName').textContent = 'فایلی انتخاب نشده';
    
    // Hide controls and preview
    document.getElementById('controlsSection').style.display = 'none';
    document.getElementById('previewSection').style.display = 'none';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Local Storage Functions
function saveSettingsToLocalStorage() {
    try {
        localStorage.setItem('watermarkSettings', JSON.stringify(currentSettings));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

function loadSettingsFromLocalStorage() {
    try {
        const savedSettings = localStorage.getItem('watermarkSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            
            // Update current settings
            currentSettings = { ...currentSettings, ...settings };
            
            // Update UI
            document.getElementById('watermarkText').value = currentSettings.text;
            document.getElementById('fontSize').value = currentSettings.fontSize;
            document.getElementById('fontSizeValue').textContent = currentSettings.fontSize;
            document.getElementById('textColor').value = currentSettings.textColor;
            document.getElementById('opacity').value = currentSettings.opacity;
            document.getElementById('opacityValue').textContent = currentSettings.opacity;
            document.getElementById('rotation').value = currentSettings.rotation;
            document.getElementById('rotationValue').textContent = currentSettings.rotation;
            document.getElementById('logoSize').value = currentSettings.logoSize;
            document.getElementById('logoSizeValue').textContent = currentSettings.logoSize;
            
            // Update active position button
            document.querySelectorAll('.position-btn').forEach(btn => {
                if (btn.dataset.position === currentSettings.position) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

