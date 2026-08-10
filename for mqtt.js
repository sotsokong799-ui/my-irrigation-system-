// --- 1. LOGIN SYSTEM ---
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMessage');
    
    if (!passwordInput) return;

    const passwordEntered = passwordInput.value;
    const correctPassword = "10112003"; 

    if (passwordEntered === correctPassword) {
        const loginBox = document.getElementById('loginContainer');
        const dashBox = document.getElementById('dashboardContainer');

        if (loginBox) loginBox.style.display = 'none';
        if (dashBox) dashBox.style.display = 'block';
        
        localStorage.setItem('isLoggedIn', 'true');
        
        if (typeof connectToMQTT === 'function') connectToMQTT();
        if (typeof loadSavedData === 'function') loadSavedData();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    const loginBox = document.getElementById('loginContainer');
    const dashBox = document.getElementById('dashboardContainer');

    if (loginBox) loginBox.style.display = 'block';
    if (dashBox) dashBox.style.display = 'none';
}

window.onload = function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        const loginBox = document.getElementById('loginContainer');
        const dashBox = document.getElementById('dashboardContainer');

        if (loginBox) loginBox.style.display = 'none';
        if (dashBox) dashBox.style.display = 'block';
        
        if (typeof connectToMQTT === 'function') connectToMQTT();
        if (typeof loadSavedData === 'function') loadSavedData();
    }
};

// --- 2. Save & Load Dashboard Data ---
function saveDashboardState() {
    const getTxt = (id) => {
        const el = document.getElementById(id);
        return el ? el.innerText : '';
    };

    const tempEl = document.getElementById('motorTemp');

    const state = {
        acCurrent: getTxt('acCurrent'),
        dcCurrent: getTxt('dcCurrent'),
        dcVolt: getTxt('Volt'),
        acVolt: getTxt('volt'),
        tank: getTxt('tank'),
        flow: getTxt('flow'),
        pump: getTxt('pump'),
        pumpColor: document.getElementById('pump') ? document.getElementById('pump').style.color : '',
        motorTemp: getTxt('motorTemp'),
        motorTempColor: tempEl ? tempEl.style.color : ''
    };
    localStorage.setItem('dashboardState', JSON.stringify(state));
}

function loadSavedData() {
    const savedState = JSON.parse(localStorage.getItem('dashboardState'));
    if (savedState) {
        if (document.getElementById('acCurrent')) document.getElementById('acCurrent').innerText = savedState.acCurrent || '1.64 A';
        if (document.getElementById('dcCurrent')) document.getElementById('dcCurrent').innerText = savedState.dcCurrent || '-4.91 A';
        if (document.getElementById('Volt')) document.getElementById('Volt').innerText = savedState.dcVolt || '6.9 V';
        if (document.getElementById('volt')) document.getElementById('volt').innerText = savedState.acVolt || '137.0 V';
        if (document.getElementById('tank')) document.getElementById('tank').innerText = savedState.tank || 'LOW';
        if (document.getElementById('flow')) document.getElementById('flow').innerText = savedState.flow || '0.0 m³';
        
        const pump = document.getElementById('pump');
        if (pump) {
            pump.innerText = savedState.pump || 'OFF';
            pump.style.color = savedState.pumpColor || '#95a5a6';
        }

        const tempEl = document.getElementById('motorTemp');
        if (tempEl) {
            tempEl.innerText = savedState.motorTemp || 'NORMAL';
            tempEl.style.color = savedState.motorTempColor || '#27ae60';
        }
    }

    renderSystemLogsUI();
    renderWaterHistoryUI();
}

// --- 3. MOTOR TEMP SYSTEM ---
function updateMotorTemp(status) {
    const tempEl = document.getElementById('motorTemp');
    if (!tempEl) return;

    if (status.toUpperCase() === 'OVERHEAT' || status.toUpperCase() === 'HOT' || status === true) {
        tempEl.innerText = 'OVERHEAT';
        tempEl.style.color = '#e74c3c';
        addLog("Warning: Motor status is OVERHEAT!", "#e74c3c");
    } else {
        tempEl.innerText = 'NORMAL';
        tempEl.style.color = '#27ae60';
    }
    saveDashboardState();
}

// --- 4. SYSTEM ACTIVITY LOG ---
function addLog(actionText, color = '#27ae60') {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const timeString = `[${day}/${month}/${year} - ${hours}:${minutes}:${seconds}]`;
    const logData = { time: timeString, text: actionText, color: color };

    let systemLogs = JSON.parse(localStorage.getItem('systemLogsHistory')) || [];
    systemLogs.push(logData);
    
    if (systemLogs.length > 50) systemLogs.shift();
    
    localStorage.setItem('systemLogsHistory', JSON.stringify(systemLogs));
    renderSystemLogsUI();
}

function renderSystemLogsUI() {
    const logContainer = document.getElementById('historyLog');
    if (!logContainer) return;

    let systemLogs = JSON.parse(localStorage.getItem('systemLogsHistory')) || [];

    if (systemLogs.length === 0) {
        logContainer.innerHTML = `<div style="color: #888; text-align: center;">No activity recorded yet.</div>`;
        return;
    }

    logContainer.innerHTML = "";
    systemLogs.forEach(log => {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-item';
        logEntry.innerHTML = `<span style="color: #7f8c8d;">${log.time}</span> <span class="log-badge">➡</span> <span style="color: ${log.color};">${log.text}</span>`;
        logContainer.appendChild(logEntry);
    });

    logContainer.scrollTop = logContainer.scrollHeight;
}

// --- 5. WATER USAGE SUMMARY SYSTEM ---
let accumulatedWater = parseFloat(localStorage.getItem('accumulatedWater')) || 0;

function updateWaterUsage(currentFlow) {
    const flowEl = document.getElementById('flow');
    if (flowEl) flowEl.innerText = `${currentFlow.toFixed(1)} m³`;

    accumulatedWater += currentFlow;
    localStorage.setItem('accumulatedWater', accumulatedWater);

    const now = new Date();
    const lastReset = localStorage.getItem('lastWaterResetDate');

    if (!lastReset) {
        localStorage.setItem('lastWaterResetDate', now.toISOString());
    } else {
        const lastResetDate = new Date(lastReset);
        const diffInDays = (now.getTime() - lastResetDate.getTime()) / (1000 * 3600 * 24);

        if (diffInDays >= 2) {
            saveAndShowWaterLog(lastResetDate, now, accumulatedWater);
            localStorage.setItem('lastWaterResetDate', now.toISOString());
            accumulatedWater = 0;
            localStorage.setItem('accumulatedWater', 0);
        }
    }
    saveDashboardState();
}

function formatDateTime(date) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const hrs = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    const secs = date.getSeconds().toString().padStart(2, '0');
    return `${d}/${m}/${y} - ${hrs}:${mins}:${secs}`;
}

function saveAndShowWaterLog(startDate, endDate, totalM3) {
    const startStr = formatDateTime(startDate);
    const endStr = formatDateTime(endDate);
    const logText = `[${startStr} ➔ ${endStr}] : សរុបការប្រើប្រាស់ទឹក = ${totalM3.toFixed(2)} m³`;

    let waterHistory = JSON.parse(localStorage.getItem('waterHistoryLogs')) || [];
    waterHistory.unshift(logText);
    localStorage.setItem('waterHistoryLogs', JSON.stringify(waterHistory));

    renderWaterHistoryUI();
}

function renderWaterHistoryUI() {
    const waterLogContainer = document.getElementById('waterUsageLog');
    if (!waterLogContainer) return;

    let waterHistory = JSON.parse(localStorage.getItem('waterHistoryLogs')) || [];

    if (waterHistory.length === 0) {
        waterLogContainer.innerHTML = `<div style="color: #888; text-align: center;">មិនទាន់មានទិន្នន័យបូកសរុបនៅឡើយទេ។</div>`;
        return;
    }

    waterLogContainer.innerHTML = "";
    waterHistory.forEach(log => {
        const parts = log.split(' : ');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-item';
        logEntry.style.marginBottom = '8px';
        logEntry.innerHTML = `<span style="color: #2c3e50; font-weight: bold;">${parts[0]}</span> : <span class="water-badge">${parts[1].replace('សរុបការប្រើប្រាស់ទឹក = ', '')}</span>`;
        waterLogContainer.appendChild(logEntry);
    });
}

// --- 6. MQTT & BUTTON CONTROLS ---
function connectToMQTT() {
    addLog("Dashboard authorized and connected to HiveMQ Free Server.");
}

function pumpOn() {
    const pump = document.getElementById('pump');
    if (pump) {
        pump.innerText = 'ON';
        pump.style.color = '#2ecc71';
    }
    addLog("User activated START button.", "#2ecc71");
    saveDashboardState();
}

function pumpOff() {
    const pump = document.getElementById('pump');
    if (pump) {
        pump.innerText = 'OFF';
        pump.style.color = '#95a5a6';
    }
    addLog("User activated STOP button.", "#e74c3c");
    saveDashboardState();
}
