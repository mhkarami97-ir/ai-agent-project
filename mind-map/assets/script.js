// Mind Map Application
class MindMap {
    constructor() {
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.connectionMode = false;
        this.firstNodeForConnection = null;
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nodesContainer = document.getElementById('nodesContainer');
        this.nodeIdCounter = 0;
        
        this.initCanvas();
        this.initEventListeners();
        this.loadFromLocalStorage();
        this.render();
    }

    initCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }

    initEventListeners() {
        // Toolbar buttons
        document.getElementById('addNodeBtn').addEventListener('click', () => this.addNode());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveToLocalStorage());
        document.getElementById('loadBtn').addEventListener('click', () => this.loadFromLocalStorage());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportToJSON());
        document.getElementById('importBtn').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        document.getElementById('importFile').addEventListener('change', (e) => this.importFromJSON(e));
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAll());
        document.getElementById('toggleModeBtn').addEventListener('click', () => this.toggleConnectionMode());

        // Modal
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('nodeForm').addEventListener('submit', (e) => this.saveNodeEdit(e));
        
        // Close modal on outside click
        document.getElementById('nodeModal').addEventListener('click', (e) => {
            if (e.target.id === 'nodeModal') {
                this.closeModal();
            }
        });
    }

    addNode(data = null) {
        const node = {
            id: data?.id || ++this.nodeIdCounter,
            title: data?.title || 'نود جدید',
            description: data?.description || '',
            color: data?.color || '#4A90E2',
            x: data?.x || Math.random() * (this.canvas.width - 200) + 50,
            y: data?.y || Math.random() * (this.canvas.height - 150) + 50
        };

        this.nodes.push(node);
        this.createNodeElement(node);
        this.render();
        
        if (!data) {
            this.showToast('نود جدید اضافه شد', 'success');
        }
    }

    createNodeElement(node) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.id = `node-${node.id}`;
        nodeEl.style.right = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.borderRightColor = node.color;

        nodeEl.innerHTML = `
            <div class="node-header">
                <div class="node-title">${this.escapeHtml(node.title)}</div>
                <div class="node-actions">
                    <button class="node-btn edit-btn" title="ویرایش">✏️</button>
                    <button class="node-btn delete-btn" title="حذف">✖️</button>
                </div>
            </div>
            ${node.description ? `<div class="node-description">${this.escapeHtml(node.description)}</div>` : ''}
        `;

        // Event listeners for node
        nodeEl.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.editNode(node);
        });

        nodeEl.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteNode(node.id);
        });

        nodeEl.addEventListener('mousedown', (e) => this.onNodeMouseDown(e, node));
        nodeEl.addEventListener('click', (e) => this.onNodeClick(e, node));

        this.nodesContainer.appendChild(nodeEl);
    }

    onNodeMouseDown(e, node) {
        if (e.target.closest('.node-btn')) return;
        
        this.draggedNode = node;
        const nodeEl = document.getElementById(`node-${node.id}`);
        const rect = nodeEl.getBoundingClientRect();
        const containerRect = this.nodesContainer.getBoundingClientRect();
        
        this.dragOffset = {
            x: e.clientX - rect.left + containerRect.left,
            y: e.clientY - rect.top + containerRect.top
        };

        nodeEl.classList.add('dragging');

        const onMouseMove = (e) => {
            if (!this.draggedNode) return;
            
            const containerRect = this.nodesContainer.getBoundingClientRect();
            let x = containerRect.right - e.clientX - this.dragOffset.x;
            let y = e.clientY - containerRect.top - this.dragOffset.y;

            // Keep node within bounds
            x = Math.max(0, Math.min(x, this.canvas.width - 150));
            y = Math.max(0, Math.min(y, this.canvas.height - 100));

            this.draggedNode.x = x;
            this.draggedNode.y = y;

            nodeEl.style.right = `${x}px`;
            nodeEl.style.top = `${y}px`;

            this.render();
        };

        const onMouseUp = () => {
            if (this.draggedNode) {
                nodeEl.classList.remove('dragging');
                this.draggedNode = null;
            }
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    onNodeClick(e, node) {
        if (e.target.closest('.node-btn')) return;
        
        if (this.connectionMode) {
            if (!this.firstNodeForConnection) {
                this.firstNodeForConnection = node;
                this.selectNode(node.id);
                this.showToast('نود اول انتخاب شد. نود دوم را انتخاب کنید', 'info');
            } else if (this.firstNodeForConnection.id !== node.id) {
                this.createConnection(this.firstNodeForConnection.id, node.id);
                this.deselectAllNodes();
                this.firstNodeForConnection = null;
            }
        }
    }

    selectNode(nodeId) {
        this.deselectAllNodes();
        const nodeEl = document.getElementById(`node-${nodeId}`);
        if (nodeEl) {
            nodeEl.classList.add('selected');
        }
    }

    deselectAllNodes() {
        document.querySelectorAll('.node.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }

    editNode(node) {
        this.selectedNode = node;
        document.getElementById('nodeTitle').value = node.title;
        document.getElementById('nodeDescription').value = node.description;
        document.getElementById('nodeColor').value = node.color;
        this.openModal();
    }

    saveNodeEdit(e) {
        e.preventDefault();
        
        if (!this.selectedNode) return;

        this.selectedNode.title = document.getElementById('nodeTitle').value;
        this.selectedNode.description = document.getElementById('nodeDescription').value;
        this.selectedNode.color = document.getElementById('nodeColor').value;

        const nodeEl = document.getElementById(`node-${this.selectedNode.id}`);
        nodeEl.style.borderRightColor = this.selectedNode.color;
        nodeEl.querySelector('.node-title').textContent = this.selectedNode.title;
        
        const descEl = nodeEl.querySelector('.node-description');
        if (this.selectedNode.description) {
            if (descEl) {
                descEl.textContent = this.selectedNode.description;
            } else {
                const newDesc = document.createElement('div');
                newDesc.className = 'node-description';
                newDesc.textContent = this.selectedNode.description;
                nodeEl.appendChild(newDesc);
            }
        } else if (descEl) {
            descEl.remove();
        }

        this.closeModal();
        this.render();
        this.showToast('تغییرات ذخیره شد', 'success');
    }

    deleteNode(nodeId) {
        if (!confirm('آیا از حذف این نود مطمئن هستید؟')) return;

        this.nodes = this.nodes.filter(n => n.id !== nodeId);
        this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
        
        const nodeEl = document.getElementById(`node-${nodeId}`);
        if (nodeEl) nodeEl.remove();

        this.render();
        this.showToast('نود حذف شد', 'info');
    }

    createConnection(fromId, toId) {
        // Check if connection already exists
        const exists = this.connections.some(c => 
            (c.from === fromId && c.to === toId) || (c.from === toId && c.to === fromId)
        );

        if (!exists) {
            this.connections.push({ from: fromId, to: toId });
            this.render();
            this.showToast('اتصال ایجاد شد', 'success');
        } else {
            this.showToast('این اتصال قبلاً وجود دارد', 'error');
        }
    }

    toggleConnectionMode() {
        this.connectionMode = !this.connectionMode;
        this.firstNodeForConnection = null;
        this.deselectAllNodes();
        
        const btn = document.getElementById('toggleModeBtn');
        if (this.connectionMode) {
            btn.classList.add('active');
            btn.innerHTML = '<span>✅</span> اتصال فعال';
            this.showToast('حالت اتصال فعال شد', 'info');
        } else {
            btn.classList.remove('active');
            btn.innerHTML = '<span>🔗</span> اتصال';
            this.showToast('حالت اتصال غیرفعال شد', 'info');
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.connections.forEach(conn => {
            const fromNode = this.nodes.find(n => n.id === conn.from);
            const toNode = this.nodes.find(n => n.id === conn.to);

            if (fromNode && toNode) {
                const fromEl = document.getElementById(`node-${fromNode.id}`);
                const toEl = document.getElementById(`node-${toNode.id}`);

                if (fromEl && toEl) {
                    const fromRect = fromEl.getBoundingClientRect();
                    const toRect = toEl.getBoundingClientRect();
                    const containerRect = this.canvas.getBoundingClientRect();

                    const fromX = fromRect.left + fromRect.width / 2 - containerRect.left;
                    const fromY = fromRect.top + fromRect.height / 2 - containerRect.top;
                    const toX = toRect.left + toRect.width / 2 - containerRect.left;
                    const toY = toRect.top + toRect.height / 2 - containerRect.top;

                    this.drawConnection(fromX, fromY, toX, toY);
                }
            }
        });
    }

    drawConnection(x1, y1, x2, y2) {
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        // Draw curved line
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        this.ctx.quadraticCurveTo(cx, cy, x2, y2);
        
        this.ctx.stroke();

        // Draw arrow at the end
        const angle = Math.atan2(y2 - cy, x2 - cx);
        const arrowSize = 10;
        
        this.ctx.fillStyle = '#667eea';
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle - Math.PI / 6),
            y2 - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            x2 - arrowSize * Math.cos(angle + Math.PI / 6),
            y2 - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    saveToLocalStorage() {
        const data = {
            nodes: this.nodes,
            connections: this.connections,
            nodeIdCounter: this.nodeIdCounter
        };
        localStorage.setItem('mindMapData', JSON.stringify(data));
        this.showToast('نقشه ذهنی ذخیره شد', 'success');
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('mindMapData');
        if (data) {
            this.loadData(JSON.parse(data));
            this.showToast('نقشه ذهنی بارگذاری شد', 'success');
        } else {
            this.showToast('هیچ داده‌ای برای بارگذاری وجود ندارد', 'info');
        }
    }

    exportToJSON() {
        const data = {
            nodes: this.nodes,
            connections: this.connections
        };
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mindmap-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('فایل JSON دانلود شد', 'success');
    }

    importFromJSON(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data.nodes && Array.isArray(data.nodes)) {
                    this.clearAll(true);
                    this.loadData(data);
                    this.showToast('فایل JSON با موفقیت وارد شد', 'success');
                } else {
                    throw new Error('فرمت فایل نامعتبر است');
                }
            } catch (error) {
                this.showToast('خطا در خواندن فایل JSON', 'error');
                console.error(error);
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    loadData(data) {
        this.clearAll(true);
        this.nodeIdCounter = data.nodeIdCounter || 0;
        
        if (data.nodes) {
            data.nodes.forEach(nodeData => {
                this.addNode(nodeData);
                if (nodeData.id > this.nodeIdCounter) {
                    this.nodeIdCounter = nodeData.id;
                }
            });
        }

        if (data.connections) {
            this.connections = data.connections;
        }

        this.render();
    }

    clearAll(silent = false) {
        if (!silent && !confirm('آیا از پاک کردن همه نودها و اتصالات مطمئن هستید؟')) return;

        this.nodes = [];
        this.connections = [];
        this.nodeIdCounter = 0;
        this.nodesContainer.innerHTML = '';
        this.render();
        
        if (!silent) {
            this.showToast('همه چیز پاک شد', 'info');
        }
    }

    openModal() {
        document.getElementById('nodeModal').classList.add('active');
    }

    closeModal() {
        document.getElementById('nodeModal').classList.remove('active');
        this.selectedNode = null;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});

