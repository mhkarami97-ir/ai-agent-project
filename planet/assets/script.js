// ===== Data Storage Manager =====
class StorageManager {
    static KEYS = {
        PLANTS: 'plants',
        REMINDERS: 'reminders',
        COMPLETED_TASKS: 'completedTasks'
    };

    static save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('خطا در ذخیره‌سازی:', e);
            return false;
        }
    }

    static load(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('خطا در بارگذاری:', e);
            return defaultValue;
        }
    }

    static remove(key) {
        localStorage.removeItem(key);
    }

    static clear() {
        localStorage.clear();
    }
}

// ===== Plant Manager =====
class PlantManager {
    constructor() {
        this.plants = StorageManager.load(StorageManager.KEYS.PLANTS, []);
        this.currentEditId = null;
    }

    addPlant(plant) {
        plant.id = Date.now().toString();
        plant.createdAt = new Date().toISOString();
        this.plants.push(plant);
        this.save();
        return plant;
    }

    updatePlant(id, updatedData) {
        const index = this.plants.findIndex(p => p.id === id);
        if (index !== -1) {
            this.plants[index] = { ...this.plants[index], ...updatedData, updatedAt: new Date().toISOString() };
            this.save();
            return true;
        }
        return false;
    }

    deletePlant(id) {
        this.plants = this.plants.filter(p => p.id !== id);
        this.save();
    }

    getPlant(id) {
        return this.plants.find(p => p.id === id);
    }

    getAllPlants() {
        return this.plants;
    }

    filterPlants(searchTerm, filterTag) {
        return this.plants.filter(plant => {
            const matchesSearch = !searchTerm || 
                plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (plant.scientificName && plant.scientificName.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesFilter = filterTag === 'all' || 
                plant.location.toLowerCase() === filterTag.toLowerCase() ||
                plant.waterNeeds === filterTag ||
                plant.lightNeeds === filterTag ||
                (plant.tags && plant.tags.some(tag => tag.toLowerCase() === filterTag.toLowerCase()));

            return matchesSearch && matchesFilter;
        });
    }

    save() {
        StorageManager.save(StorageManager.KEYS.PLANTS, this.plants);
    }

    exportData() {
        return JSON.stringify(this.plants, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (Array.isArray(data)) {
                this.plants = data;
                this.save();
                return true;
            }
            return false;
        } catch (e) {
            console.error('خطا در import:', e);
            return false;
        }
    }

    getAllTags() {
        const allTags = new Set(['all']);
        
        // Location tags
        this.plants.forEach(plant => {
            if (plant.location) allTags.add(plant.location);
            if (plant.waterNeeds) allTags.add(plant.waterNeeds);
            if (plant.lightNeeds) allTags.add(plant.lightNeeds);
            if (plant.tags) {
                plant.tags.forEach(tag => allTags.add(tag));
            }
        });

        return Array.from(allTags);
    }
}

// ===== Reminder Manager =====
class ReminderManager {
    constructor(plantManager) {
        this.plantManager = plantManager;
        this.completedTasks = StorageManager.load(StorageManager.KEYS.COMPLETED_TASKS, []);
    }

    getReminders() {
        const reminders = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        this.plantManager.getAllPlants().forEach(plant => {
            // Water reminder
            if (plant.lastWatered) {
                const lastWatered = new Date(plant.lastWatered);
                const nextWater = new Date(lastWatered);
                nextWater.setDate(nextWater.getDate() + parseInt(plant.waterInterval));
                
                reminders.push({
                    id: `${plant.id}-water`,
                    plantId: plant.id,
                    plantName: plant.name,
                    type: 'water',
                    typeLabel: 'آبیاری',
                    icon: '💧',
                    dueDate: nextWater,
                    isCompleted: this.isTaskCompleted(`${plant.id}-water`, nextWater)
                });
            } else {
                // First time watering
                reminders.push({
                    id: `${plant.id}-water`,
                    plantId: plant.id,
                    plantName: plant.name,
                    type: 'water',
                    typeLabel: 'آبیاری',
                    icon: '💧',
                    dueDate: today,
                    isCompleted: this.isTaskCompleted(`${plant.id}-water`, today)
                });
            }

            // Fertilize reminder
            if (plant.fertilizeInterval) {
                if (plant.lastFertilized) {
                    const lastFertilized = new Date(plant.lastFertilized);
                    const nextFertilize = new Date(lastFertilized);
                    nextFertilize.setDate(nextFertilize.getDate() + parseInt(plant.fertilizeInterval));
                    
                    reminders.push({
                        id: `${plant.id}-fertilize`,
                        plantId: plant.id,
                        plantName: plant.name,
                        type: 'fertilize',
                        typeLabel: 'کوددهی',
                        icon: '🌱',
                        dueDate: nextFertilize,
                        isCompleted: this.isTaskCompleted(`${plant.id}-fertilize`, nextFertilize)
                    });
                } else {
                    reminders.push({
                        id: `${plant.id}-fertilize`,
                        plantId: plant.id,
                        plantName: plant.name,
                        type: 'fertilize',
                        typeLabel: 'کوددهی',
                        icon: '🌱',
                        dueDate: today,
                        isCompleted: this.isTaskCompleted(`${plant.id}-fertilize`, today)
                    });
                }
            }
        });

        return reminders.sort((a, b) => a.dueDate - b.dueDate);
    }

    getTodayReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        return this.getReminders().filter(reminder => {
            const dueDate = new Date(reminder.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= today;
        });
    }

    getUpcomingReminders() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.getReminders().filter(reminder => {
            const dueDate = new Date(reminder.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate > today;
        });
    }

    completeTask(reminderId, plantId, type) {
        const plant = this.plantManager.getPlant(plantId);
        if (!plant) return;

        const today = new Date().toISOString();
        
        if (type === 'water') {
            plant.lastWatered = today;
        } else if (type === 'fertilize') {
            plant.lastFertilized = today;
        }

        this.plantManager.updatePlant(plantId, plant);
        
        // Record completion
        this.completedTasks.push({
            reminderId,
            plantId,
            type,
            completedAt: today
        });
        this.saveCompletedTasks();
    }

    isTaskCompleted(reminderId, dueDate) {
        const dueDateStr = new Date(dueDate).toDateString();
        return this.completedTasks.some(task => 
            task.reminderId === reminderId && 
            new Date(task.completedAt).toDateString() === dueDateStr
        );
    }

    clearCompletedTasks() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        this.completedTasks = this.completedTasks.filter(task => 
            new Date(task.completedAt) > oneMonthAgo
        );
        this.saveCompletedTasks();
    }

    saveCompletedTasks() {
        StorageManager.save(StorageManager.KEYS.COMPLETED_TASKS, this.completedTasks);
    }

    getCompletedTasksThisMonth() {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        return this.completedTasks.filter(task => 
            new Date(task.completedAt) >= firstDayOfMonth
        ).length;
    }
}

// ===== Statistics Manager =====
class StatisticsManager {
    constructor(plantManager, reminderManager) {
        this.plantManager = plantManager;
        this.reminderManager = reminderManager;
    }

    getTotalPlants() {
        return this.plantManager.getAllPlants().length;
    }

    getTodayTasks() {
        return this.reminderManager.getTodayReminders().length;
    }

    getCompletedTasksThisMonth() {
        return this.reminderManager.getCompletedTasksThisMonth();
    }

    getTotalLocations() {
        const locations = new Set();
        this.plantManager.getAllPlants().forEach(plant => {
            if (plant.location) locations.add(plant.location);
        });
        return locations.size;
    }

    getLocationDistribution() {
        const distribution = {};
        this.plantManager.getAllPlants().forEach(plant => {
            const location = plant.location || 'نامشخص';
            distribution[location] = (distribution[location] || 0) + 1;
        });
        return distribution;
    }

    getWaterNeedsDistribution() {
        const distribution = {
            'low': 0,
            'medium': 0,
            'high': 0
        };
        this.plantManager.getAllPlants().forEach(plant => {
            if (plant.waterNeeds) {
                distribution[plant.waterNeeds]++;
            }
        });
        return {
            'کم': distribution.low,
            'متوسط': distribution.medium,
            'زیاد': distribution.high
        };
    }

    getLightNeedsDistribution() {
        const distribution = {
            'low': 0,
            'medium': 0,
            'high': 0
        };
        this.plantManager.getAllPlants().forEach(plant => {
            if (plant.lightNeeds) {
                distribution[plant.lightNeeds]++;
            }
        });
        return {
            'کم': distribution.low,
            'متوسط': distribution.medium,
            'زیاد': distribution.high
        };
    }
}

// ===== UI Manager =====
class UIManager {
    constructor(plantManager, reminderManager, statisticsManager) {
        this.plantManager = plantManager;
        this.reminderManager = reminderManager;
        this.statisticsManager = statisticsManager;
        this.initializeEventListeners();
        this.currentView = 'plants';
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });

        // Add plant button
        document.getElementById('addPlantBtn').addEventListener('click', () => {
            this.openPlantModal();
        });

        // Modal close buttons
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closePlantModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closePlantModal();
        });

        document.getElementById('closeDetailsModal').addEventListener('click', () => {
            this.closeDetailsModal();
        });

        // Form submit
        document.getElementById('plantForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePlant();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.filterAndRenderPlants();
        });

        // Image preview
        document.getElementById('plantImage').addEventListener('change', (e) => {
            this.handleImagePreview(e);
        });

        // Export/Import
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFileInput').click();
        });

        document.getElementById('importFileInput').addEventListener('change', (e) => {
            this.importData(e);
        });

        // Clear completed tasks
        document.getElementById('clearCompletedBtn').addEventListener('click', () => {
            this.reminderManager.clearCompletedTasks();
            this.renderReminders();
            this.showToast('وظایف انجام شده پاک شدند', 'success');
        });

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('show');
            }
        });
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        document.getElementById(`${viewName}View`).classList.add('active');

        this.currentView = viewName;

        // Render content based on view
        if (viewName === 'plants') {
            this.renderPlants();
        } else if (viewName === 'reminders') {
            this.renderReminders();
        } else if (viewName === 'guide') {
            // Guide is static, no need to render
        } else if (viewName === 'statistics') {
            this.renderStatistics();
        }
    }

    renderPlants() {
        this.renderFilterTags();
        this.filterAndRenderPlants();
    }

    renderFilterTags() {
        const tags = this.plantManager.getAllTags();
        const container = document.getElementById('filterTags');
        
        container.innerHTML = tags.map(tag => {
            const label = this.getTagLabel(tag);
            const active = tag === 'all' ? 'active' : '';
            return `<button class="tag-filter ${active}" data-filter="${tag}">${label}</button>`;
        }).join('');

        // Add click listeners
        container.querySelectorAll('.tag-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.tag-filter').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.filterAndRenderPlants();
            });
        });
    }

    filterAndRenderPlants() {
        const searchTerm = document.getElementById('searchInput').value;
        const activeFilter = document.querySelector('.tag-filter.active');
        const filterTag = activeFilter ? activeFilter.dataset.filter : 'all';
        
        const plants = this.plantManager.filterPlants(searchTerm, filterTag);
        
        const grid = document.getElementById('plantsGrid');
        const emptyState = document.getElementById('emptyState');

        if (plants.length === 0) {
            grid.innerHTML = '';
            emptyState.classList.add('show');
        } else {
            emptyState.classList.remove('show');
            grid.innerHTML = plants.map(plant => this.createPlantCard(plant)).join('');

            // Add event listeners
            grid.querySelectorAll('.plant-card').forEach(card => {
                const plantId = card.dataset.plantId;
                
                card.querySelector('.plant-info').addEventListener('click', () => {
                    this.openPlantDetails(plantId);
                });

                card.querySelector('.edit-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.openPlantModal(plantId);
                });

                card.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deletePlant(plantId);
                });

                const waterBtn = card.querySelector('.water-btn');
                if (waterBtn) {
                    waterBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.completeTask(plantId, 'water');
                    });
                }

                const fertilizeBtn = card.querySelector('.fertilize-btn');
                if (fertilizeBtn) {
                    fertilizeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.completeTask(plantId, 'fertilize');
                    });
                }
            });
        }
    }

    createPlantCard(plant) {
        const waterDue = this.getNextWateringDate(plant);
        const fertilizeDue = plant.fertilizeInterval ? this.getNextFertilizeDate(plant) : null;
        
        const imageHtml = plant.image 
            ? `<img src="${plant.image}" alt="${plant.name}">`
            : '<div class="plant-image">🌿</div>';

        const tagsHtml = plant.tags && plant.tags.length > 0
            ? plant.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '';

        const waterDueClass = waterDue.overdue ? 'due' : '';
        const fertilizeDueClass = fertilizeDue && fertilizeDue.overdue ? 'due' : '';

        const remindersHtml = `
            <div class="plant-reminders">
                <button class="reminder-btn water-btn ${waterDueClass}">
                    <span class="reminder-icon">💧</span>
                    <span class="reminder-text">${waterDue.text}</span>
                </button>
                ${fertilizeDue ? `
                    <button class="reminder-btn fertilize-btn ${fertilizeDueClass}">
                        <span class="reminder-icon">🌱</span>
                        <span class="reminder-text">${fertilizeDue.text}</span>
                    </button>
                ` : ''}
            </div>
        `;

        return `
            <div class="plant-card" data-plant-id="${plant.id}">
                ${plant.image ? `<div class="plant-image"><img src="${plant.image}" alt="${plant.name}"></div>` : `<div class="plant-image">🌿</div>`}
                <div class="plant-info">
                    <div class="plant-header">
                        <div>
                            <div class="plant-name">${plant.name}</div>
                            ${plant.scientificName ? `<div class="plant-scientific">${plant.scientificName}</div>` : ''}
                        </div>
                        <div class="plant-actions">
                            <button class="icon-btn edit-btn" title="ویرایش">✏️</button>
                            <button class="icon-btn delete-btn" title="حذف">🗑️</button>
                        </div>
                    </div>
                    
                    <div class="plant-meta">
                        <div class="meta-item">
                            <span class="meta-icon">💧</span>
                            <span>${this.getWaterNeedsLabel(plant.waterNeeds)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-icon">☀️</span>
                            <span>${this.getLightNeedsLabel(plant.lightNeeds)}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-icon">📍</span>
                            <span>${plant.location}</span>
                        </div>
                    </div>

                    ${tagsHtml ? `<div class="plant-tags">${tagsHtml}</div>` : ''}
                    
                    ${remindersHtml}
                </div>
            </div>
        `;
    }

    getNextWateringDate(plant) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!plant.lastWatered) {
            return { text: 'امروز', overdue: true };
        }

        const lastWatered = new Date(plant.lastWatered);
        const nextWater = new Date(lastWatered);
        nextWater.setDate(nextWater.getDate() + parseInt(plant.waterInterval));
        nextWater.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((nextWater - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `${Math.abs(diffDays)} روز قبل`, overdue: true };
        } else if (diffDays === 0) {
            return { text: 'امروز', overdue: true };
        } else if (diffDays === 1) {
            return { text: 'فردا', overdue: false };
        } else {
            return { text: `${diffDays} روز دیگر`, overdue: false };
        }
    }

    getNextFertilizeDate(plant) {
        if (!plant.fertilizeInterval) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (!plant.lastFertilized) {
            return { text: 'امروز', overdue: true };
        }

        const lastFertilized = new Date(plant.lastFertilized);
        const nextFertilize = new Date(lastFertilized);
        nextFertilize.setDate(nextFertilize.getDate() + parseInt(plant.fertilizeInterval));
        nextFertilize.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil((nextFertilize - today) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { text: `${Math.abs(diffDays)} روز قبل`, overdue: true };
        } else if (diffDays === 0) {
            return { text: 'امروز', overdue: true };
        } else if (diffDays === 1) {
            return { text: 'فردا', overdue: false };
        } else {
            return { text: `${diffDays} روز دیگر`, overdue: false };
        }
    }

    renderReminders() {
        const todayReminders = this.reminderManager.getTodayReminders();
        const upcomingReminders = this.reminderManager.getUpcomingReminders();

        // Today's reminders
        const todayContainer = document.getElementById('todayReminders');
        if (todayReminders.length === 0) {
            todayContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">یادآوری برای امروز وجود ندارد! 🎉</p>';
        } else {
            todayContainer.innerHTML = todayReminders.map(reminder => 
                this.createReminderCard(reminder)
            ).join('');
        }

        // Upcoming reminders
        const upcomingContainer = document.getElementById('upcomingReminders');
        if (upcomingReminders.length === 0) {
            upcomingContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">یادآوری آینده وجود ندارد</p>';
        } else {
            upcomingContainer.innerHTML = upcomingReminders.map(reminder => 
                this.createReminderCard(reminder)
            ).join('');
        }

        // Add event listeners
        document.querySelectorAll('.reminder-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const card = e.target.closest('.reminder-card');
                const reminderId = card.dataset.reminderId;
                const plantId = card.dataset.plantId;
                const type = card.dataset.type;

                if (e.target.checked) {
                    card.classList.add('completed');
                    this.reminderManager.completeTask(reminderId, plantId, type);
                    this.showToast('وظیفه انجام شد! ✅', 'success');
                    setTimeout(() => this.renderReminders(), 500);
                }
            });
        });
    }

    createReminderCard(reminder) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(reminder.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const isOverdue = dueDate < today;
        const dateText = this.formatReminderDate(reminder.dueDate);

        return `
            <div class="reminder-card ${isOverdue ? 'overdue' : ''} ${reminder.isCompleted ? 'completed' : ''}" 
                 data-reminder-id="${reminder.id}"
                 data-plant-id="${reminder.plantId}"
                 data-type="${reminder.type}">
                <input type="checkbox" class="reminder-checkbox" ${reminder.isCompleted ? 'checked' : ''}>
                <div class="reminder-content">
                    <div class="reminder-title">${reminder.icon} ${reminder.typeLabel} - ${reminder.plantName}</div>
                    <div class="reminder-subtitle">هر ${this.getIntervalText(reminder)} یکبار</div>
                </div>
                <div class="reminder-date">${dateText}</div>
            </div>
        `;
    }

    getIntervalText(reminder) {
        const plant = this.plantManager.getPlant(reminder.plantId);
        if (!plant) return '';
        
        if (reminder.type === 'water') {
            return `${plant.waterInterval} روز`;
        } else if (reminder.type === 'fertilize') {
            return `${plant.fertilizeInterval} روز`;
        }
        return '';
    }

    formatReminderDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const diffTime = targetDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'امروز';
        if (diffDays === 1) return 'فردا';
        if (diffDays === -1) return 'دیروز';
        if (diffDays < 0) return `${Math.abs(diffDays)} روز قبل`;
        if (diffDays < 7) return `${diffDays} روز دیگر`;
        
        return new Date(date).toLocaleDateString('fa-IR');
    }

    renderStatistics() {
        // Update stat cards
        document.getElementById('totalPlants').textContent = this.statisticsManager.getTotalPlants();
        document.getElementById('todayTasks').textContent = this.statisticsManager.getTodayTasks();
        document.getElementById('completedTasks').textContent = this.statisticsManager.getCompletedTasksThisMonth();
        document.getElementById('totalLocations').textContent = this.statisticsManager.getTotalLocations();

        // Render charts
        this.renderChart('locationChart', this.statisticsManager.getLocationDistribution());
        this.renderChart('waterChart', this.statisticsManager.getWaterNeedsDistribution());
        this.renderChart('lightChart', this.statisticsManager.getLightNeedsDistribution());
    }

    renderChart(containerId, data) {
        const container = document.getElementById(containerId);
        const total = Object.values(data).reduce((sum, val) => sum + val, 0);

        if (total === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">داده‌ای برای نمایش وجود ندارد</p>';
            return;
        }

        container.innerHTML = Object.entries(data).map(([label, value]) => {
            const percentage = total > 0 ? (value / total * 100).toFixed(1) : 0;
            return `
                <div class="chart-bar">
                    <div class="chart-label">${label}</div>
                    <div class="chart-bar-container">
                        <div class="chart-bar-fill" style="width: ${percentage}%">
                            ${percentage > 10 ? value : ''}
                        </div>
                    </div>
                    <div class="chart-value">${value}</div>
                </div>
            `;
        }).join('');
    }

    openPlantModal(plantId = null) {
        const modal = document.getElementById('plantModal');
        const form = document.getElementById('plantForm');
        const title = document.getElementById('modalTitle');

        form.reset();
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('imagePreview').classList.remove('show');

        if (plantId) {
            // Edit mode
            const plant = this.plantManager.getPlant(plantId);
            if (!plant) return;

            title.textContent = 'ویرایش گیاه';
            this.plantManager.currentEditId = plantId;

            document.getElementById('plantName').value = plant.name;
            document.getElementById('scientificName').value = plant.scientificName || '';
            document.getElementById('waterNeeds').value = plant.waterNeeds;
            document.getElementById('lightNeeds').value = plant.lightNeeds;
            document.getElementById('waterInterval').value = plant.waterInterval;
            document.getElementById('fertilizeInterval').value = plant.fertilizeInterval || '';
            document.getElementById('location').value = plant.location;
            document.getElementById('tags').value = plant.tags ? plant.tags.join(', ') : '';
            document.getElementById('notes').value = plant.notes || '';

            if (plant.image) {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${plant.image}" alt="Preview">`;
                preview.classList.add('show');
            }
        } else {
            // Add mode
            title.textContent = 'افزودن گیاه جدید';
            this.plantManager.currentEditId = null;
        }

        // Populate location suggestions
        this.populateLocationSuggestions();

        modal.classList.add('show');
    }

    closePlantModal() {
        document.getElementById('plantModal').classList.remove('show');
        this.plantManager.currentEditId = null;
    }

    populateLocationSuggestions() {
        const datalist = document.getElementById('locationSuggestions');
        const locations = new Set();
        
        this.plantManager.getAllPlants().forEach(plant => {
            if (plant.location) locations.add(plant.location);
        });

        datalist.innerHTML = Array.from(locations).map(loc => 
            `<option value="${loc}">`
        ).join('');
    }

    handleImagePreview(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
            preview.classList.add('show');
        };
        reader.readAsDataURL(file);
    }

    savePlant() {
        const plantData = {
            name: document.getElementById('plantName').value.trim(),
            scientificName: document.getElementById('scientificName').value.trim(),
            waterNeeds: document.getElementById('waterNeeds').value,
            lightNeeds: document.getElementById('lightNeeds').value,
            waterInterval: document.getElementById('waterInterval').value,
            fertilizeInterval: document.getElementById('fertilizeInterval').value,
            location: document.getElementById('location').value.trim(),
            tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
            notes: document.getElementById('notes').value.trim()
        };

        // Handle image
        const preview = document.getElementById('imagePreview');
        if (preview.querySelector('img')) {
            plantData.image = preview.querySelector('img').src;
        }

        if (this.plantManager.currentEditId) {
            // Update existing plant
            const plant = this.plantManager.getPlant(this.plantManager.currentEditId);
            plantData.lastWatered = plant.lastWatered;
            plantData.lastFertilized = plant.lastFertilized;
            
            this.plantManager.updatePlant(this.plantManager.currentEditId, plantData);
            this.showToast('گیاه با موفقیت بروزرسانی شد', 'success');
        } else {
            // Add new plant
            this.plantManager.addPlant(plantData);
            this.showToast('گیاه جدید اضافه شد', 'success');
        }

        this.closePlantModal();
        this.renderPlants();
    }

    deletePlant(plantId) {
        if (confirm('آیا از حذف این گیاه اطمینان دارید؟')) {
            this.plantManager.deletePlant(plantId);
            this.showToast('گیاه حذف شد', 'success');
            this.renderPlants();
        }
    }

    completeTask(plantId, type) {
        const reminderId = `${plantId}-${type}`;
        this.reminderManager.completeTask(reminderId, plantId, type);
        
        const taskLabel = type === 'water' ? 'آبیاری' : 'کوددهی';
        this.showToast(`${taskLabel} انجام شد! ✅`, 'success');
        
        this.renderPlants();
    }

    openPlantDetails(plantId) {
        const plant = this.plantManager.getPlant(plantId);
        if (!plant) return;

        const modal = document.getElementById('plantDetailsModal');
        const content = document.getElementById('plantDetailsContent');
        
        document.getElementById('detailsPlantName').textContent = plant.name;

        const imageHtml = plant.image 
            ? `<img src="${plant.image}" alt="${plant.name}" class="details-image">`
            : '';

        const tagsHtml = plant.tags && plant.tags.length > 0
            ? plant.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span style="color: var(--text-light)">بدون برچسب</span>';

        content.innerHTML = `
            ${imageHtml}
            
            <div class="details-section">
                <h3>اطلاعات اصلی</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">نام گیاه</div>
                        <div class="detail-value">${plant.name}</div>
                    </div>
                    ${plant.scientificName ? `
                        <div class="detail-item">
                            <div class="detail-label">نام علمی</div>
                            <div class="detail-value">${plant.scientificName}</div>
                        </div>
                    ` : ''}
                    <div class="detail-item">
                        <div class="detail-label">مکان</div>
                        <div class="detail-value">📍 ${plant.location}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">تاریخ افزودن</div>
                        <div class="detail-value">${new Date(plant.createdAt).toLocaleDateString('fa-IR')}</div>
                    </div>
                </div>
            </div>

            <div class="details-section">
                <h3>نیازهای گیاه</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">نیاز آبی</div>
                        <div class="detail-value">💧 ${this.getWaterNeedsLabel(plant.waterNeeds)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">نیاز نوری</div>
                        <div class="detail-value">☀️ ${this.getLightNeedsLabel(plant.lightNeeds)}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">بازه آبیاری</div>
                        <div class="detail-value">هر ${plant.waterInterval} روز یکبار</div>
                    </div>
                    ${plant.fertilizeInterval ? `
                        <div class="detail-item">
                            <div class="detail-label">بازه کوددهی</div>
                            <div class="detail-value">هر ${plant.fertilizeInterval} روز یکبار</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div class="details-section">
                <h3>آخرین مراقبت‌ها</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-label">آخرین آبیاری</div>
                        <div class="detail-value">${plant.lastWatered ? new Date(plant.lastWatered).toLocaleDateString('fa-IR') : 'هنوز آبیاری نشده'}</div>
                    </div>
                    ${plant.lastFertilized ? `
                        <div class="detail-item">
                            <div class="detail-label">آخرین کوددهی</div>
                            <div class="detail-value">${new Date(plant.lastFertilized).toLocaleDateString('fa-IR')}</div>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${plant.tags && plant.tags.length > 0 ? `
                <div class="details-section">
                    <h3>برچسب‌ها</h3>
                    <div class="plant-tags">${tagsHtml}</div>
                </div>
            ` : ''}

            ${plant.notes ? `
                <div class="details-section">
                    <h3>یادداشت‌ها</h3>
                    <p style="color: var(--text-secondary); line-height: 1.8;">${plant.notes}</p>
                </div>
            ` : ''}

            <div class="details-actions">
                <button class="btn btn-outline" onclick="ui.closeDetailsModal()">بستن</button>
                <button class="btn btn-primary" onclick="ui.openPlantModal('${plant.id}'); ui.closeDetailsModal();">ویرایش</button>
            </div>
        `;

        modal.classList.add('show');
    }

    closeDetailsModal() {
        document.getElementById('plantDetailsModal').classList.remove('show');
    }

    exportData() {
        const data = this.plantManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `plant-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('اطلاعات با موفقیت صادر شد', 'success');
    }

    importData(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const success = this.plantManager.importData(event.target.result);
            if (success) {
                this.showToast('اطلاعات با موفقیت وارد شد', 'success');
                this.renderPlants();
            } else {
                this.showToast('خطا در وارد کردن اطلاعات', 'error');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    getWaterNeedsLabel(value) {
        const labels = {
            'low': 'کم (هر 7-14 روز)',
            'medium': 'متوسط (هر 3-5 روز)',
            'high': 'زیاد (هر 1-2 روز)'
        };
        return labels[value] || value;
    }

    getLightNeedsLabel(value) {
        const labels = {
            'low': 'کم (نیمه‌سایه)',
            'medium': 'متوسط (نور غیرمستقیم)',
            'high': 'زیاد (نور مستقیم)'
        };
        return labels[value] || value;
    }

    getTagLabel(tag) {
        if (tag === 'all') return 'همه';
        if (tag === 'low') return 'نیاز کم';
        if (tag === 'medium') return 'نیاز متوسط';
        if (tag === 'high') return 'نیاز زیاد';
        return tag;
    }
}

// ===== Initialize App =====
let plantManager, reminderManager, statisticsManager, ui;

document.addEventListener('DOMContentLoaded', () => {
    plantManager = new PlantManager();
    reminderManager = new ReminderManager(plantManager);
    statisticsManager = new StatisticsManager(plantManager, reminderManager);
    ui = new UIManager(plantManager, reminderManager, statisticsManager);

    // Initial render
    ui.renderPlants();

    // Check for due reminders and show notification
    const todayReminders = reminderManager.getTodayReminders().filter(r => !r.isCompleted);
    if (todayReminders.length > 0) {
        setTimeout(() => {
            ui.showToast(`شما ${todayReminders.length} یادآوری برای امروز دارید! 🔔`, 'warning');
        }, 1000);
    }
});

