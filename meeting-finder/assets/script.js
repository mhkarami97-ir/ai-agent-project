// Data Management
class MeetingFinder {
    constructor() {
        this.participants = this.loadFromStorage('participants') || [];
        this.currentParticipantId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderParticipants();
    }

    setupEventListeners() {
        // Add person
        document.getElementById('addPersonBtn').addEventListener('click', () => this.addPerson());
        document.getElementById('personName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPerson();
        });

        // Add time slot
        document.getElementById('addTimeSlotBtn').addEventListener('click', () => this.addTimeSlot());

        // Back to list
        document.getElementById('backToListBtn').addEventListener('click', () => this.showParticipantsList());

        // Find overlap
        document.getElementById('findOverlapBtn').addEventListener('click', () => this.findOverlappingTimes());

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());
    }

    // Storage methods
    saveToStorage(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    }

    // Person management
    addPerson() {
        const nameInput = document.getElementById('personName');
        const name = nameInput.value.trim();

        if (!name) {
            alert('لطفاً نام شرکت‌کننده را وارد کنید');
            return;
        }

        const person = {
            id: Date.now(),
            name: name,
            timeSlots: []
        };

        this.participants.push(person);
        this.saveToStorage('participants', this.participants);
        this.renderParticipants();
        nameInput.value = '';
    }

    deletePerson(id) {
        if (confirm('آیا از حذف این شرکت‌کننده مطمئن هستید؟')) {
            this.participants = this.participants.filter(p => p.id !== id);
            this.saveToStorage('participants', this.participants);
            this.renderParticipants();
        }
    }

    editPersonTimeSlots(id) {
        this.currentParticipantId = id;
        const person = this.participants.find(p => p.id === id);
        
        if (person) {
            document.getElementById('currentPersonName').textContent = person.name;
            this.showTimeSlotsSection();
            this.renderTimeSlots();
        }
    }

    // Time slot management
    addTimeSlot() {
        const startDate = document.getElementById('startDate').value;
        const startTime = document.getElementById('startTime').value;
        const endDate = document.getElementById('endDate').value;
        const endTime = document.getElementById('endTime').value;

        if (!startDate || !startTime || !endDate || !endTime) {
            alert('لطفاً تمام فیلدها را پر کنید');
            return;
        }

        const startDateTime = new Date(`${startDate}T${startTime}`);
        const endDateTime = new Date(`${endDate}T${endTime}`);

        if (endDateTime <= startDateTime) {
            alert('زمان پایان باید بعد از زمان شروع باشد');
            return;
        }

        const person = this.participants.find(p => p.id === this.currentParticipantId);
        if (person) {
            const timeSlot = {
                id: Date.now(),
                start: startDateTime.getTime(),
                end: endDateTime.getTime()
            };

            person.timeSlots.push(timeSlot);
            this.saveToStorage('participants', this.participants);
            this.renderTimeSlots();
            this.renderParticipants();

            // Clear inputs
            document.getElementById('startDate').value = '';
            document.getElementById('startTime').value = '';
            document.getElementById('endDate').value = '';
            document.getElementById('endTime').value = '';
        }
    }

    deleteTimeSlot(slotId) {
        if (confirm('آیا از حذف این بازه زمانی مطمئن هستید؟')) {
            const person = this.participants.find(p => p.id === this.currentParticipantId);
            if (person) {
                person.timeSlots = person.timeSlots.filter(slot => slot.id !== slotId);
                this.saveToStorage('participants', this.participants);
                this.renderTimeSlots();
                this.renderParticipants();
            }
        }
    }

    // Finding overlapping times
    findOverlappingTimes() {
        if (this.participants.length < 2) {
            alert('حداقل دو شرکت‌کننده برای یافتن زمان مشترک نیاز است');
            return;
        }

        const participantsWithSlots = this.participants.filter(p => p.timeSlots.length > 0);
        
        if (participantsWithSlots.length < 2) {
            alert('حداقل دو شرکت‌کننده باید بازه زمانی داشته باشند');
            return;
        }

        const overlaps = this.calculateOverlaps(participantsWithSlots);
        this.renderResults(overlaps);
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }

    calculateOverlaps(participants) {
        // Collect all time slots from all participants
        const allSlots = [];
        participants.forEach(person => {
            person.timeSlots.forEach(slot => {
                allSlots.push({
                    start: slot.start,
                    end: slot.end,
                    personId: person.id
                });
            });
        });

        // Sort slots by start time
        allSlots.sort((a, b) => a.start - b.start);

        // Find overlapping intervals
        const overlaps = [];
        const numParticipants = participants.length;

        // Create events for sweep line algorithm
        const events = [];
        allSlots.forEach(slot => {
            events.push({ time: slot.start, type: 'start', personId: slot.personId });
            events.push({ time: slot.end, type: 'end', personId: slot.personId });
        });

        // Sort events by time
        events.sort((a, b) => {
            if (a.time !== b.time) return a.time - b.time;
            return a.type === 'start' ? -1 : 1; // Start events before end events
        });

        // Track active participants
        const activeParticipants = new Set();
        let overlapStart = null;

        events.forEach((event, index) => {
            if (event.type === 'start') {
                // Check if we should start tracking an overlap
                if (activeParticipants.size === numParticipants - 1) {
                    overlapStart = event.time;
                }
                activeParticipants.add(event.personId);
            } else {
                activeParticipants.delete(event.personId);
                
                // Check if we should end the overlap
                if (activeParticipants.size === numParticipants - 1 && overlapStart !== null) {
                    overlaps.push({
                        start: overlapStart,
                        end: event.time
                    });
                    overlapStart = null;
                }
            }

            // If all participants are active
            if (activeParticipants.size === numParticipants) {
                if (overlapStart === null) {
                    overlapStart = event.time;
                }
            } else if (activeParticipants.size < numParticipants && overlapStart !== null) {
                overlaps.push({
                    start: overlapStart,
                    end: event.time
                });
                overlapStart = null;
            }
        });

        // Merge adjacent or overlapping intervals
        const merged = [];
        overlaps.forEach(overlap => {
            if (merged.length === 0) {
                merged.push(overlap);
            } else {
                const last = merged[merged.length - 1];
                if (overlap.start <= last.end) {
                    last.end = Math.max(last.end, overlap.end);
                } else {
                    merged.push(overlap);
                }
            }
        });

        return merged.filter(overlap => overlap.end > overlap.start);
    }

    // UI Rendering
    renderParticipants() {
        const list = document.getElementById('participantsList');
        
        if (this.participants.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">هنوز شرکت‌کننده‌ای اضافه نشده است</div>
                </div>
            `;
            return;
        }

        list.innerHTML = this.participants.map(person => `
            <div class="participant-card">
                <div class="participant-info">
                    <div class="participant-name">${this.escapeHtml(person.name)}</div>
                    <div class="participant-slots">${person.timeSlots.length} بازه زمانی</div>
                </div>
                <div class="participant-actions">
                    <button class="btn btn-secondary btn-small" onclick="app.editPersonTimeSlots(${person.id})">
                        ویرایش
                    </button>
                    <button class="btn btn-danger btn-small" onclick="app.deletePerson(${person.id})">
                        حذف
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderTimeSlots() {
        const person = this.participants.find(p => p.id === this.currentParticipantId);
        const list = document.getElementById('timeSlotsList');

        if (!person || person.timeSlots.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📅</div>
                    <div class="empty-state-text">هنوز بازه زمانی اضافه نشده است</div>
                </div>
            `;
            return;
        }

        list.innerHTML = person.timeSlots.map(slot => {
            const start = new Date(slot.start);
            const end = new Date(slot.end);
            const duration = this.formatDuration(slot.end - slot.start);

            return `
                <div class="time-slot-card">
                    <div class="time-slot-info">
                        <div class="time-slot-text">
                            از ${this.formatDateTime(start)} تا ${this.formatDateTime(end)}
                        </div>
                        <div class="time-slot-duration">مدت: ${duration}</div>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="app.deleteTimeSlot(${slot.id})">
                        حذف
                    </button>
                </div>
            `;
        }).join('');
    }

    renderResults(overlaps) {
        const section = document.getElementById('resultsSection');
        const list = document.getElementById('resultsList');

        section.style.display = 'block';

        if (overlaps.length === 0) {
            list.innerHTML = `
                <div class="no-results">
                    متأسفانه زمان مشترکی بین همه شرکت‌کنندگان پیدا نشد 😔
                </div>
            `;
            return;
        }

        list.innerHTML = overlaps.map(overlap => {
            const start = new Date(overlap.start);
            const end = new Date(overlap.end);
            const duration = this.formatDuration(overlap.end - overlap.start);

            return `
                <div class="result-card">
                    <div class="result-time">
                        از ${this.formatDateTime(start)} تا ${this.formatDateTime(end)}
                    </div>
                    <div class="result-duration">مدت: ${duration}</div>
                </div>
            `;
        }).join('');
    }

    // UI Navigation
    showTimeSlotsSection() {
        document.querySelector('.add-person-section').style.display = 'none';
        document.querySelector('.participants-section').style.display = 'none';
        document.querySelector('.find-overlap-section').style.display = 'none';
        document.getElementById('timeSlotsSection').style.display = 'block';
    }

    showParticipantsList() {
        document.querySelector('.add-person-section').style.display = 'flex';
        document.querySelector('.participants-section').style.display = 'block';
        document.querySelector('.find-overlap-section').style.display = 'block';
        document.getElementById('timeSlotsSection').style.display = 'none';
        this.renderParticipants();
    }

    // Utility methods
    formatDateTime(date) {
        const persianDate = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
        return persianDate;
    }

    formatDuration(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            const remainingHours = hours % 24;
            return `${days} روز${remainingHours > 0 ? ` و ${remainingHours} ساعت` : ''}`;
        } else if (hours > 0) {
            const remainingMinutes = minutes % 60;
            return `${hours} ساعت${remainingMinutes > 0 ? ` و ${remainingMinutes} دقیقه` : ''}`;
        } else {
            return `${minutes} دقیقه`;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    clearAll() {
        if (confirm('آیا از پاک کردن تمام داده‌ها مطمئن هستید؟ این عمل قابل بازگشت نیست.')) {
            this.participants = [];
            this.saveToStorage('participants', this.participants);
            this.renderParticipants();
            document.getElementById('resultsSection').style.display = 'none';
            this.showParticipantsList();
        }
    }
}

// Initialize app
const app = new MeetingFinder();

