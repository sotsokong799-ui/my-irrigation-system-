// --- 1. LOGIN SYSTEM ---
function checkPassword() {
    const passwordEntered = document.getElementById('passwordInput').value;
    const correctPassword = "29072003"; 
    const errorMsg = document.getElementById('errorMessage');

    if (passwordEntered === correctPassword) {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        
        // រក្សាស្ថានភាព Login ទុកក្នុង Storage
        localStorage.setItem('isLoggedIn', 'true');
        
        connectToMQTT();
        loadSavedData(); // ទាញយកទិន្នន័យទាំងអស់មកបង្ហាញវិញ
    } else {
        errorMsg.style.display = 'block';
    }
}

// ឆែកមើលថាតើធ្លាប់ Login ហើយឬនៅពេលបើក App មកភ្លាម
window.onload = function() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        connectToMQTT();
        loadSavedData();
    }
};

// --- 2. Save & Load Dashboard Data ---
function saveDashboardState() {
    const state = {
        acCurrent: document.getElementById('acCurrent').innerText,
        dcCurrent: document.getElementById('dcCurrent').innerText,
        dcVolt: document.getElementById('Volt').innerText,
        acVolt: document.getElementById('volt').innerText,
        tank: document.getElementById('tank').innerText,
        flow: document.getElementById('flow').innerText,
        pump: document.getElementById('pump').innerText,
        pumpColor: document.getElementById('pump').style.color,
        mode: document.getElementById('mode').innerText
    };
    localStorage.setItem('dashboardState', JSON.stringify(state));
}

function loadSavedData() {
    // 1. ទាញយកស្ថានភាព Card Dashboard
    const savedState = JSON.parse(localStorage.getItem('dashboardState'));
    if (savedState) {
        document.getElementById('acCurrent').innerText = savedState.acCurrent || '1.64 A';
        document.getElementById('dcCurrent').innerText = savedState.dcCurrent || '-4.91 A';
        document.getElementById('Volt').innerText = savedState.dcVolt || '6.9 V';
        document.getElementById('volt').innerText = savedState.acVolt || '137.0 V';
        document.getElementById('tank').innerText = savedState.tank || 'LOW';
        document.getElementById('flow').innerText = savedState.flow || '0.0 m³';
        
        const pump = document.getElementById('pump');
        pump.innerText = savedState.pump || 'OFF';
        pump.style.color = savedState.pumpColor || '#95a5a6';

        document.getElementById('mode').innerText = savedState.mode || 'MANUAL';
    }

    // 2. ទាញយក System Logs
    renderSystemLogsUI();

    // 3. ទាញយក Water Summary History
    renderWaterHistoryUI();
}

// --- 3. SYSTEM ACTIVITY LOG ---
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

// --- 4. 2-DAY WATER USAGE SUMMARY SYSTEM (មានម៉ោង ថ្ងៃ ខែ ឆ្នាំ) ---
let accumulatedWater = parseFloat(localStorage.getItem('accumulatedWater')) || 0;

function updateWaterUsage(currentFlow) {
    document.getElementById('flow').innerText = `${currentFlow.toFixed(1)} m³`;

    accumulatedWater += currentFlow;
    localStorage.setItem('accumulatedWater', accumulatedWater);

    const now = new Date();
    const lastReset = localStorage.getItem('lastWaterResetDate');

    if (!lastReset) {
        localStorage.setItem('lastWaterResetDate', now.toISOString());
    } else {
        const lastResetDate = new Date(lastReset);
        const diffInTime = now.getTime() - lastResetDate.getTime();
        const diffInDays = diffInTime / (1000 * 3600 * 24);

        if (diffInDays >= 2) {
            saveAndShowWaterLog(lastResetDate, now, accumulatedWater);

            localStorage.setItem('lastWaterResetDate', now.toISOString());
            accumulatedWater = 0;
            localStorage.setItem('accumulatedWater', 0);
        }
    }
    saveDashboardState();
}

// Function បំប្លែង Date ឱ្យមាន ថ្ងៃ/ខែ/ឆ្នាំ និង ម៉ោង:នាទី:វិនាទី
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

// --- 5. MQTT & BUTTON CONTROLS ---
function connectToMQTT() {
    addLog("Dashboard authorized and connected to HiveMQ Free Server.");
}

function pumpOn() {
    const pump = document.getElementById('pump');
    pump.innerText = 'ON';
    pump.style.color = '#2ecc71';
    addLog("User activated START button.", "#2ecc71");
    saveDashboardState();
}

function pumpOff() {
    const pump = document.getElementById('pump');
    pump.innerText = 'OFF';
    pump.style.color = '#95a5a6';
    addLog("User activated STOP button.", "#e74c3c");
    saveDashboardState();
}

function autoMode() {
    document.getElementById('mode').innerText = 'AUTO';
    addLog("System mode changed to AUTO.", "#2980b9");
    saveDashboardState();
}

function manualMode() {
    document.getElementById('mode').innerText = 'MANUAL';
    addLog("System mode changed to MANUAL.", "#e67e22");
    saveDashboardState();
}
