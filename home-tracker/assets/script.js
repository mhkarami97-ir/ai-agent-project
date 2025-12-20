// Database management using IndexedDB
class Database {
    constructor() {
        this.dbName = 'HomeTrackerDB';
        this.dbVersion = 1;
        this.storeName = 'items';
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const objectStore = db.createObjectStore(this.storeName, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    objectStore.createIndex('name', 'name', { unique: false });
                    objectStore.createIndex('category', 'category', { unique: false });
                    objectStore.createIndex('expiryDate', 'expiryDate', { unique: false });
                }
            };
        });
    }

    async addItem(item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.add(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllItems() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readonly');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateItem(id, item) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            item.id = id;
            const request = objectStore.put(item);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteItem(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Initialize database
const db = new Database();
let items = [];
let currentFilter = 'all';
let currentSort = 'expiry-asc';

// Category names in Persian
const categoryNames = {
    'dairy': 'لبنیات',
    'meat': 'گوشت و پروتئین',
    'vegetables': 'سبزیجات',
    'fruits': 'میوه‌جات',
    'grains': 'غلات و حبوبات',
    'canned': 'کنسرو',
    'beverages': 'نوشیدنی',
    'snacks': 'تنقلات',
    'cleaning': 'لوازم نظافت',
    'personal': 'لوازم بهداشتی',
    'other': 'سایر'
};

// Location names in Persian
const locationNames = {
    'fridge': 'یخچال',
    'freezer': 'فریزر',
    'pantry': 'انباری',
    'cabinet': 'کابینت',
    'other': 'سایر'
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.init();
        await loadItems();
        setupEventListeners();
        updateStats();
        checkExpiryAlerts();
        setMinDate();
    } catch (error) {
        console.error('خطا در بارگذاری برنامه:', error);
        showNotification('خطا در بارگذاری برنامه', 'danger');
    }
});

// Set minimum date for date inputs to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expiryDate').setAttribute('min', today);
    document.getElementById('editExpiryDate').setAttribute('min', today);
}

// Load items from database
async function loadItems() {
    try {
        items = await db.getAllItems();
        renderItems();
        updateStats();
    } catch (error) {
        console.error('خطا در بارگذاری اقلام:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('itemForm').addEventListener('submit', handleAddItem);
    document.getElementById('editForm').addEventListener('submit', handleEditItem);

    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderItems();
        });
    });

    // Sort
    document.getElementById('sortBy').addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderItems();
    });
}

// Handle add item
async function handleAddItem(e) {
    e.preventDefault();

    const item = {
        name: document.getElementById('itemName').value.trim(),
        category: document.getElementById('category').value,
        quantity: document.getElementById('quantity').value.trim(),
        expiryDate: document.getElementById('expiryDate').value,
        location: document.getElementById('location').value,
        notes: document.getElementById('notes').value.trim(),
        dateAdded: new Date().toISOString()
    };

    try {
        await db.addItem(item);
        await loadItems();
        document.getElementById('itemForm').reset();
        showNotification('قلم با موفقیت اضافه شد', 'success');
        updateStats();
        checkExpiryAlerts();
    } catch (error) {
        console.error('خطا در افزودن قلم:', error);
        showNotification('خطا در افزودن قلم', 'danger');
    }
}

// Handle edit item
async function handleEditItem(e) {
    e.preventDefault();

    const id = parseInt(document.getElementById('editItemId').value);
    const item = {
        name: document.getElementById('editItemName').value.trim(),
        category: document.getElementById('editCategory').value,
        quantity: document.getElementById('editQuantity').value.trim(),
        expiryDate: document.getElementById('editExpiryDate').value,
        location: document.getElementById('editLocation').value,
        notes: document.getElementById('editNotes').value.trim(),
        dateAdded: items.find(i => i.id === id).dateAdded
    };

    try {
        await db.updateItem(id, item);
        await loadItems();
        closeEditModal();
        showNotification('قلم با موفقیت ویرایش شد', 'success');
        updateStats();
        checkExpiryAlerts();
    } catch (error) {
        console.error('خطا در ویرایش قلم:', error);
        showNotification('خطا در ویرایش قلم', 'danger');
    }
}

// Open edit modal
function openEditModal(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editCategory').value = item.category;
    document.getElementById('editQuantity').value = item.quantity;
    document.getElementById('editExpiryDate').value = item.expiryDate;
    document.getElementById('editLocation').value = item.location;
    document.getElementById('editNotes').value = item.notes || '';

    document.getElementById('editModal').classList.remove('hidden');
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
    document.getElementById('editForm').reset();
}

// Delete item
async function deleteItem(id) {
    if (!confirm('آیا از حذف این قلم اطمینان دارید؟')) return;

    try {
        await db.deleteItem(id);
        await loadItems();
        showNotification('قلم با موفقیت حذف شد', 'success');
        updateStats();
        checkExpiryAlerts();
    } catch (error) {
        console.error('خطا در حذف قلم:', error);
        showNotification('خطا در حذف قلم', 'danger');
    }
}

// Clear all items
async function clearAllItems() {
    if (!confirm('آیا از حذف تمام اقلام اطمینان دارید؟ این عمل قابل بازگشت نیست!')) return;

    try {
        await db.clearAll();
        await loadItems();
        showNotification('تمام اقلام با موفقیت حذف شدند', 'success');
        updateStats();
        closeAlert();
    } catch (error) {
        console.error('خطا در حذف اقلام:', error);
        showNotification('خطا در حذف اقلام', 'danger');
    }
}

// Reset form
function resetForm() {
    document.getElementById('itemForm').reset();
}

// Calculate days until expiry
function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// Get item status
function getItemStatus(expiryDate) {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    
    if (daysUntilExpiry < 0) {
        return { status: 'expired', label: 'منقضی شده', class: 'expired' };
    } else if (daysUntilExpiry <= 7) {
        return { status: 'expiring', label: `${daysUntilExpiry} روز مانده`, class: 'expiring' };
    } else {
        return { status: 'fresh', label: `${daysUntilExpiry} روز مانده`, class: 'fresh' };
    }
}

// Format date to Persian
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('fa-IR', options);
}

// Render items
function renderItems() {
    const itemsList = document.getElementById('itemsList');
    let filteredItems = [...items];

    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    }

    // Apply status filter
    if (currentFilter !== 'all') {
        filteredItems = filteredItems.filter(item => {
            const status = getItemStatus(item.expiryDate).status;
            return status === currentFilter;
        });
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
        switch (currentSort) {
            case 'expiry-asc':
                return new Date(a.expiryDate) - new Date(b.expiryDate);
            case 'expiry-desc':
                return new Date(b.expiryDate) - new Date(a.expiryDate);
            case 'name-asc':
                return a.name.localeCompare(b.name, 'fa');
            case 'name-desc':
                return b.name.localeCompare(a.name, 'fa');
            case 'date-desc':
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            default:
                return 0;
        }
    });

    if (filteredItems.length === 0) {
        itemsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>موردی یافت نشد</h3>
                <p>هیچ قلمی با این فیلتر وجود ندارد</p>
            </div>
        `;
        return;
    }

    itemsList.innerHTML = filteredItems.map(item => {
        const status = getItemStatus(item.expiryDate);
        return `
            <div class="item-card ${status.class}">
                <div class="item-header">
                    <div class="item-title">
                        <div class="item-name">${item.name}</div>
                        <span class="item-category">${categoryNames[item.category]}</span>
                    </div>
                    <div class="item-status ${status.class}">${status.label}</div>
                </div>
                <div class="item-details">
                    <div class="item-detail">
                        <span class="item-detail-icon">📦</span>
                        <span class="item-detail-label">مقدار:</span>
                        <span class="item-detail-value">${item.quantity}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-icon">📅</span>
                        <span class="item-detail-label">انقضا:</span>
                        <span class="item-detail-value">${formatDate(item.expiryDate)}</span>
                    </div>
                    <div class="item-detail">
                        <span class="item-detail-icon">📍</span>
                        <span class="item-detail-label">محل:</span>
                        <span class="item-detail-value">${locationNames[item.location]}</span>
                    </div>
                </div>
                ${item.notes ? `<div class="item-notes">📝 ${item.notes}</div>` : ''}
                <div class="item-actions">
                    <button class="item-btn item-btn-edit" onclick="openEditModal(${item.id})">
                        <span>✏️</span> ویرایش
                    </button>
                    <button class="item-btn item-btn-delete" onclick="deleteItem(${item.id})">
                        <span>🗑️</span> حذف
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Update statistics
function updateStats() {
    const totalItems = items.length;
    let expiredCount = 0;
    let expiringCount = 0;
    let freshCount = 0;

    items.forEach(item => {
        const status = getItemStatus(item.expiryDate).status;
        if (status === 'expired') expiredCount++;
        else if (status === 'expiring') expiringCount++;
        else freshCount++;
    });

    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('expiredItems').textContent = expiredCount;
    document.getElementById('expiringItems').textContent = expiringCount;
    document.getElementById('freshItems').textContent = freshCount;

    // Show/hide clear all button
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (totalItems > 0) {
        clearAllBtn.style.display = 'flex';
    } else {
        clearAllBtn.style.display = 'none';
    }
}

// Check expiry alerts
function checkExpiryAlerts() {
    const expiredItems = items.filter(item => 
        getItemStatus(item.expiryDate).status === 'expired'
    );
    const expiringItems = items.filter(item => 
        getItemStatus(item.expiryDate).status === 'expiring'
    );

    if (expiredItems.length > 0) {
        showAlert(`${expiredItems.length} قلم منقضی شده دارید که نیاز به حذف دارند!`);
    } else if (expiringItems.length > 0) {
        showAlert(`${expiringItems.length} قلم در حال انقضا دارید. لطفاً زودتر استفاده کنید!`);
    } else {
        closeAlert();
    }
}

// Show alert banner
function showAlert(message) {
    const alertBanner = document.getElementById('alertBanner');
    const alertText = alertBanner.querySelector('.alert-text');
    alertText.textContent = message;
    alertBanner.classList.remove('hidden');
}

// Close alert banner
function closeAlert() {
    document.getElementById('alertBanner').classList.add('hidden');
}

// Show notification (temporary)
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert-banner ${type}`;
    notification.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${type === 'success' ? '✅' : '❌'}</span>
            <span class="alert-text">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Handle search
function handleSearch() {
    renderItems();
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        closeEditModal();
    }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // ESC to close modal
    if (e.key === 'Escape') {
        closeEditModal();
    }
    
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
});

// Periodic check for expiry (every 5 minutes)
setInterval(() => {
    updateStats();
    checkExpiryAlerts();
    renderItems();
}, 5 * 60 * 1000);

