// State management
let currentMode = 'simple';
let currentExpression = {
    simple: '0',
    eng: '0',
    prog: '0'
};
let currentBase = 16;
let angleMode = 'deg';
let waitingForOperand = {
    simple: false,
    eng: false,
    prog: false
};

// Initialize calculator
document.addEventListener('DOMContentLoaded', function() {
    initializeModeButtons();
    initializeBaseSelector();
    initializeAngleSelector();
    loadHistory();
    updateProgrammingDisplay();
});

// Mode switching
function initializeModeButtons() {
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            switchMode(mode);
        });
    });
}

function switchMode(mode) {
    currentMode = mode;
    
    // Update active mode button
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // Update active calculator mode
    document.querySelectorAll('.calculator-mode').forEach(calcMode => {
        calcMode.classList.remove('active');
    });
    document.getElementById(`${mode}-mode`).classList.add('active');
}

// Number input
function appendNumber(mode, num) {
    if (mode === 'prog') {
        // Check if number is valid for current base
        if (!isValidForBase(num, currentBase)) return;
    }
    
    if (waitingForOperand[mode]) {
        currentExpression[mode] = num;
        waitingForOperand[mode] = false;
    } else {
        if (currentExpression[mode] === '0') {
            currentExpression[mode] = num;
        } else {
            currentExpression[mode] += num;
        }
    }
    
    updateDisplay(mode);
    if (mode === 'prog') updateProgrammingDisplay();
}

// Operator input
function appendOperator(mode, operator) {
    const lastChar = currentExpression[mode].slice(-1);
    
    // Prevent multiple operators
    if (['+', '-', '*', '/', '('].includes(lastChar) && operator !== '(') {
        currentExpression[mode] = currentExpression[mode].slice(0, -1) + operator;
    } else {
        currentExpression[mode] += operator;
    }
    
    updateDisplay(mode);
}

// Update display
function updateDisplay(mode) {
    const resultElement = document.getElementById(`${mode}-result`);
    if (resultElement) {
        resultElement.value = currentExpression[mode];
    }
}

// Clear display
function clearDisplay(mode) {
    currentExpression[mode] = '0';
    waitingForOperand[mode] = false;
    updateDisplay(mode);
    if (mode === 'prog') updateProgrammingDisplay();
}

// Delete last character
function deleteLast(mode) {
    if (currentExpression[mode].length > 1) {
        currentExpression[mode] = currentExpression[mode].slice(0, -1);
    } else {
        currentExpression[mode] = '0';
    }
    updateDisplay(mode);
    if (mode === 'prog') updateProgrammingDisplay();
}

// Percentage
function percentage(mode) {
    try {
        const value = eval(currentExpression[mode]);
        currentExpression[mode] = (value / 100).toString();
        updateDisplay(mode);
    } catch (error) {
        showError(mode);
    }
}

// Calculate
function calculate(mode) {
    try {
        let expression = currentExpression[mode];
        let result;
        
        if (mode === 'prog') {
            // Convert from current base to decimal, calculate, convert back
            const decimalValue = parseInt(expression, currentBase);
            result = decimalValue;
            currentExpression[mode] = result.toString(currentBase).toUpperCase();
            updateProgrammingDisplay();
        } else {
            // Replace × and ÷ with * and /
            expression = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
            
            // Handle mathematical functions
            expression = expression.replace(/sin\(/g, 'Math.sin(');
            expression = expression.replace(/cos\(/g, 'Math.cos(');
            expression = expression.replace(/tan\(/g, 'Math.tan(');
            expression = expression.replace(/sqrt\(/g, 'Math.sqrt(');
            expression = expression.replace(/ln\(/g, 'Math.log(');
            expression = expression.replace(/log\(/g, 'Math.log10(');
            expression = expression.replace(/exp\(/g, 'Math.exp(');
            expression = expression.replace(/abs\(/g, 'Math.abs(');
            
            result = eval(expression);
            
            // Round to avoid floating point errors
            result = Math.round(result * 1e10) / 1e10;
            currentExpression[mode] = result.toString();
        }
        
        // Save to history
        saveToHistory(currentExpression[mode], result);
        
        updateDisplay(mode);
        waitingForOperand[mode] = true;
    } catch (error) {
        showError(mode);
    }
}

// Show error
function showError(mode) {
    currentExpression[mode] = 'خطا';
    updateDisplay(mode);
    setTimeout(() => {
        currentExpression[mode] = '0';
        updateDisplay(mode);
    }, 1500);
}

// Engineering functions
function engineeringFunc(mode, func) {
    try {
        let value = parseFloat(currentExpression[mode]);
        let result;
        
        switch (func) {
            case 'sin':
                result = angleMode === 'deg' ? Math.sin(value * Math.PI / 180) : Math.sin(value);
                break;
            case 'cos':
                result = angleMode === 'deg' ? Math.cos(value * Math.PI / 180) : Math.cos(value);
                break;
            case 'tan':
                result = angleMode === 'deg' ? Math.tan(value * Math.PI / 180) : Math.tan(value);
                break;
            case 'asin':
                result = Math.asin(value);
                result = angleMode === 'deg' ? result * 180 / Math.PI : result;
                break;
            case 'acos':
                result = Math.acos(value);
                result = angleMode === 'deg' ? result * 180 / Math.PI : result;
                break;
            case 'atan':
                result = Math.atan(value);
                result = angleMode === 'deg' ? result * 180 / Math.PI : result;
                break;
            case 'sqrt':
                result = Math.sqrt(value);
                break;
            case 'square':
                result = value * value;
                break;
            case 'cube':
                result = value * value * value;
                break;
            case 'pow':
                currentExpression[mode] += '^';
                updateDisplay(mode);
                return;
            case 'exp':
                result = Math.exp(value);
                break;
            case 'ln':
                result = Math.log(value);
                break;
            case 'log':
                result = Math.log10(value);
                break;
            case 'pi':
                currentExpression[mode] = Math.PI.toString();
                updateDisplay(mode);
                return;
            case 'e':
                currentExpression[mode] = Math.E.toString();
                updateDisplay(mode);
                return;
            case 'factorial':
                result = factorial(Math.floor(value));
                break;
            case 'abs':
                result = Math.abs(value);
                break;
            case 'inv':
                result = 1 / value;
                break;
            default:
                return;
        }
        
        result = Math.round(result * 1e10) / 1e10;
        currentExpression[mode] = result.toString();
        updateDisplay(mode);
        waitingForOperand[mode] = true;
    } catch (error) {
        showError(mode);
    }
}

// Factorial function
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Angle mode selector
function initializeAngleSelector() {
    const angleRadios = document.querySelectorAll('input[name="angle"]');
    angleRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            angleMode = this.value;
        });
    });
}

// Programming mode functions
function initializeBaseSelector() {
    const baseRadios = document.querySelectorAll('input[name="base"]');
    baseRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const newBase = parseInt(this.value);
            convertBase(currentBase, newBase);
            currentBase = newBase;
            updateButtonStates();
            updateProgrammingDisplay();
        });
    });
}

function isValidForBase(char, base) {
    if (base === 2) return ['0', '1'].includes(char);
    if (base === 8) return '01234567'.includes(char);
    if (base === 10) return '0123456789'.includes(char);
    if (base === 16) return '0123456789ABCDEF'.includes(char);
    return false;
}

function convertBase(fromBase, toBase) {
    try {
        const decimalValue = parseInt(currentExpression.prog, fromBase);
        if (isNaN(decimalValue)) {
            currentExpression.prog = '0';
        } else {
            currentExpression.prog = decimalValue.toString(toBase).toUpperCase();
        }
        updateDisplay('prog');
    } catch (error) {
        currentExpression.prog = '0';
        updateDisplay('prog');
    }
}

function updateButtonStates() {
    const hexButtons = document.querySelectorAll('.hex-only');
    const octButtons = document.querySelectorAll('.oct-disabled');
    const binButtons = document.querySelectorAll('.bin-disabled');
    
    // Enable/disable hex buttons (A-F)
    hexButtons.forEach(btn => {
        if (currentBase === 16) {
            btn.classList.remove('hex-only');
        } else {
            btn.classList.add('hex-only');
        }
    });
    
    // Enable/disable octal buttons (8-9)
    octButtons.forEach(btn => {
        if (currentBase === 2) {
            btn.classList.add('oct-disabled');
        } else {
            btn.classList.remove('oct-disabled');
        }
    });
    
    // Enable/disable binary buttons (2-9, A-F)
    binButtons.forEach(btn => {
        if (currentBase === 2) {
            btn.classList.add('bin-disabled');
        } else {
            btn.classList.remove('bin-disabled');
        }
    });
}

function updateProgrammingDisplay() {
    try {
        const decValue = parseInt(currentExpression.prog, currentBase);
        if (isNaN(decValue)) {
            document.getElementById('hex-result').textContent = '0';
            document.getElementById('dec-result').textContent = '0';
            document.getElementById('oct-result').textContent = '0';
            document.getElementById('bin-result').textContent = '0';
            return;
        }
        
        document.getElementById('hex-result').textContent = decValue.toString(16).toUpperCase();
        document.getElementById('dec-result').textContent = decValue.toString(10);
        document.getElementById('oct-result').textContent = decValue.toString(8);
        document.getElementById('bin-result').textContent = decValue.toString(2);
    } catch (error) {
        document.getElementById('hex-result').textContent = '0';
        document.getElementById('dec-result').textContent = '0';
        document.getElementById('oct-result').textContent = '0';
        document.getElementById('bin-result').textContent = '0';
    }
}

function bitwiseOp(mode, operation) {
    try {
        const value = parseInt(currentExpression[mode], currentBase);
        let result;
        
        switch (operation) {
            case 'AND':
                currentExpression[mode] += '&';
                updateDisplay(mode);
                return;
            case 'OR':
                currentExpression[mode] += '|';
                updateDisplay(mode);
                return;
            case 'XOR':
                currentExpression[mode] += '^';
                updateDisplay(mode);
                return;
            case 'NOT':
                result = ~value;
                break;
            case 'LSH':
                currentExpression[mode] += '<<';
                updateDisplay(mode);
                return;
            case 'RSH':
                currentExpression[mode] += '>>';
                updateDisplay(mode);
                return;
        }
        
        currentExpression[mode] = result.toString(currentBase).toUpperCase();
        updateDisplay(mode);
        updateProgrammingDisplay();
    } catch (error) {
        showError(mode);
    }
}

// Graph functions
function drawGraph() {
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    const functionInput = document.getElementById('graph-function').value;
    const xMin = parseFloat(document.getElementById('x-min').value);
    const xMax = parseFloat(document.getElementById('x-max').value);
    const yMin = parseFloat(document.getElementById('y-min').value);
    const yMax = parseFloat(document.getElementById('y-max').value);
    
    if (!functionInput) {
        alert('لطفا تابع را وارد کنید');
        return;
    }
    
    // Set canvas size
    canvas.width = 500;
    canvas.height = 500;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid and axes
    drawGridAndAxes(ctx, canvas.width, canvas.height, xMin, xMax, yMin, yMax);
    
    // Draw function
    try {
        drawFunction(ctx, canvas.width, canvas.height, functionInput, xMin, xMax, yMin, yMax);
    } catch (error) {
        alert('خطا در رسم تابع: ' + error.message);
    }
}

function drawGridAndAxes(ctx, width, height, xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    
    // Draw grid
    const xStep = (xMax - xMin) / 10;
    const yStep = (yMax - yMin) / 10;
    
    for (let i = 0; i <= 10; i++) {
        const x = (i / 10) * width;
        const y = (i / 10) * height;
        
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    
    const xAxisY = height * (yMax / (yMax - yMin));
    const yAxisX = width * (-xMin / (xMax - xMin));
    
    // X-axis
    if (xAxisY >= 0 && xAxisY <= height) {
        ctx.beginPath();
        ctx.moveTo(0, xAxisY);
        ctx.lineTo(width, xAxisY);
        ctx.stroke();
    }
    
    // Y-axis
    if (yAxisX >= 0 && yAxisX <= width) {
        ctx.beginPath();
        ctx.moveTo(yAxisX, 0);
        ctx.lineTo(yAxisX, height);
        ctx.stroke();
    }
}

function drawFunction(ctx, width, height, functionStr, xMin, xMax, yMin, yMax) {
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    let firstPoint = true;
    const steps = 1000;
    
    for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        let y;
        
        try {
            y = evaluateFunction(functionStr, x);
            
            if (isNaN(y) || !isFinite(y)) continue;
            
            // Convert to canvas coordinates
            const canvasX = ((x - xMin) / (xMax - xMin)) * width;
            const canvasY = height - ((y - yMin) / (yMax - yMin)) * height;
            
            if (canvasY < 0 || canvasY > height) {
                firstPoint = true;
                continue;
            }
            
            if (firstPoint) {
                ctx.moveTo(canvasX, canvasY);
                firstPoint = false;
            } else {
                ctx.lineTo(canvasX, canvasY);
            }
        } catch (error) {
            firstPoint = true;
        }
    }
    
    ctx.stroke();
}

function evaluateFunction(functionStr, x) {
    // Replace function names with Math equivalents
    let expression = functionStr
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/ln/g, 'Math.log')
        .replace(/log/g, 'Math.log10')
        .replace(/exp/g, 'Math.exp')
        .replace(/abs/g, 'Math.abs')
        .replace(/\^/g, '**');
    
    // Replace x with the actual value
    expression = expression.replace(/x/g, `(${x})`);
    
    return eval(expression);
}

function clearGraph() {
    const canvas = document.getElementById('graph-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function setGraphFunction(func) {
    document.getElementById('graph-function').value = func;
}

// History functions
function saveToHistory(expression, result) {
    const history = getHistory();
    const timestamp = new Date().toLocaleString('fa-IR');
    
    history.unshift({
        expression: expression,
        result: result,
        timestamp: timestamp
    });
    
    // Keep only last 50 calculations
    if (history.length > 50) {
        history.pop();
    }
    
    localStorage.setItem('calculatorHistory', JSON.stringify(history));
}

function getHistory() {
    const history = localStorage.getItem('calculatorHistory');
    return history ? JSON.parse(history) : [];
}

function loadHistory() {
    // History is loaded when modal is opened
}

function showHistory() {
    const modal = document.getElementById('history-modal');
    const historyList = document.getElementById('history-list');
    const history = getHistory();
    
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-history">تاریخچه‌ای وجود ندارد</div>';
    } else {
        history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="expression">${item.expression}</div>
                <div class="result-value">= ${item.result}</div>
                <div class="timestamp">${item.timestamp}</div>
            `;
            historyItem.onclick = () => {
                currentExpression[currentMode] = item.result.toString();
                updateDisplay(currentMode);
                closeHistory();
            };
            historyList.appendChild(historyItem);
        });
    }
    
    modal.classList.add('active');
}

function closeHistory() {
    const modal = document.getElementById('history-modal');
    modal.classList.remove('active');
}

function clearHistory() {
    if (confirm('آیا مطمئن هستید که می‌خواهید تاریخچه را پاک کنید؟')) {
        localStorage.removeItem('calculatorHistory');
        showHistory();
    }
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('history-modal');
    if (event.target === modal) {
        closeHistory();
    }
});

// Keyboard support
document.addEventListener('keydown', function(event) {
    if (currentMode === 'graph') return;
    
    const key = event.key;
    
    if (/[0-9]/.test(key)) {
        appendNumber(currentMode, key);
    } else if (key === '.') {
        appendNumber(currentMode, '.');
    } else if (['+', '-', '*', '/'].includes(key)) {
        appendOperator(currentMode, key);
    } else if (key === 'Enter') {
        event.preventDefault();
        calculate(currentMode);
    } else if (key === 'Escape') {
        clearDisplay(currentMode);
    } else if (key === 'Backspace') {
        event.preventDefault();
        deleteLast(currentMode);
    }
});

