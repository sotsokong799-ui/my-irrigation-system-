// ==========================================
// 1. CONFIGURATION & MQTT GLOBALS (HIVEMQ CLOUD)
// ==========================================
const MQTT_HOST = "4a8939aca73049848878fb5e2c8c332c.s1.eu.hivemq.cloud";
const MQTT_PORT = 8884; // WebSocket Port សម្រាប់ HiveMQ Cloud SSL/TLS
const MQTT_USER = "MyMQTT";
const MQTT_PASS = "29072003Sot";
const MQTT_CLIENT_ID = "IrrigationDash_" + Math.random().toString(16).substr(2, 8);

// MQTT Topics matching ESP32-S3 Firmware
const TOPIC_PUMP_CONTROL = "irrigation/pump/control";
const TOPIC_PUMP_STATUS  = "irrigation/pump/status";
const TOPIC_SENSOR_DATA  = "irrigation/sensors/data";

let client = null;

// ==========================================
// 2. LOGIN SYSTEM
// ==========================================
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
        
        connectToMQTT();
        loadSavedData();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    if (client && client.isConnected()) {
        client.disconnect();
    }
    const loginBox = document.getElementById('loginContainer');
    const dashBox = document.getElementById('dashboardContainer');

    if (loginBox) loginBox.style.display = 'block';
    if (dashBox) dashBox.style.display = 'none';
}

// មុខងារទារ Password ជានិច្ចរាល់ពេលបើក ឬ Refresh Web
window.onload = function() {
    localStorage.removeItem('isLoggedIn');
    
    const loginBox = document.getElementById('loginContainer');
    const dashBox = document.getElementById('dashboardContainer');

    if (loginBox) loginBox.style.display = 'block';
    if (dashBox) dashBox.style.display = 'none';
};

// ==========================================
// 3. MQTT CONNECTION & HANDLING
// ==========================================
function connectToMQTT() {
    client = new Paho.MQTT.Client(MQTT_HOST, Number(MQTT_PORT), MQTT_CLIENT_ID);

    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    const options = {
        timeout: 10,
        useSSL: true,         // HiveMQ Cloud ទាមទារ SSL/TLS ជានិច្ច
        userName: MQTT_USER,
        password: MQTT_PASS,
        cleanSession: true,
        onSuccess: onConnect,
        onFailure: onConnectFailure
    };

    client.connect(options);
}

function onConnect() {
    addLog("Connected to HiveMQ Cloud Broker via WebSockets.", "#27ae60");
    // Subscribe ទៅកាន់ Topics ដើម្បីទទួលទិន្នន័យពី ESP32-S3
    client.subscribe(TOPIC_PUMP_STATUS);
    client.subscribe(TOPIC_SENSOR_DATA);
}

function onConnectFailure(responseObject) {
    addLog("MQTT Connection Failed: " + responseObject.errorMessage, "#e74c3c");
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        addLog("MQTT Lost Connection: " + responseObject.errorMessage, "#e74c3c");
    }
}

function onMessageArrived(message) {
    const topic = message.destinationName;
    const payload = message.payloadString;

    // 1. ទទួលស្ថានភាព Pump ពី ESP32 (ទោះជាចុចលើ Web ឬ Screen HMI)
    if (topic === TOPIC_PUMP_STATUS) {
        const pumpEl = document.getElementById('pump');
        if (pumpEl) {
            pumpEl.innerText = payload;
            pumpEl.style.color = (payload.toUpperCase() === 'ON') ? '#2ecc71' : '#95a5a6';
        }
        addLog(`Pump status updated to: ${payload}`, payload.toUpperCase() === 'ON' ? '#2ecc71' : '#e74c3c');
        saveDashboardState();
    }

    // 2. ទទួលទិន្នន័យ Sensors (JSON) ពី ESP32-S3
    if (topic === TOPIC_SENSOR_DATA) {
        try {
            const data = JSON.parse(payload);
            if (data.acCurrent !== undefined && document.getElementById('acCurrent')) 
                document.getElementById('acCurrent').innerText = `${parseFloat(data.acCurrent).toFixed(2)} A`;
            if (data.dcCurrent !== undefined && document.getElementById('dcCurrent')) 
                document.getElementById('dcCurrent').innerText = `${parseFloat(data.dcCurrent).toFixed(2)} A`;
            if (data.dcVolt !== undefined && document.getElementById('Volt')) 
                document.getElementById('Volt').innerText = `${parseFloat(data.dcVolt).toFixed(1)} V`;
            if (data.acVolt !== undefined && document.getElementById('volt')) 
                document.getElementById('volt').innerText = `${parseFloat(data.acVolt).toFixed(1)} V`;
            if (data.tank !== undefined && document.getElementById('tank')) 
                document.getElementById('tank').innerText = data.tank;
            
            if (data.flow !== undefined) {
                updateWaterUsage(parseFloat(data.flow));
            }
            if (data.motorLoad !== undefined) {
                updateMotorLoad(data.motorLoad);
            }
            saveDashboardState();
        } catch (e) {
            console.error("Invalid Sensor JSON received:", payload);
        }
    }
}

// ==========================================
// 4. BUTTON CONTROLS (START / STOP)
// ==========================================
function pumpOn() {
    const pump = document.getElementById('pump');
    if (pump) {
        pump.innerText = 'ON';
        pump.style.color = '#2ecc71';
    }
    addLog("User activated START button.", "#2ecc71");

    if (client && client.isConnected()) {
        const message = new Paho.MQTT.Message("ON");
        message.destinationName = TOPIC_PUMP_CONTROL;
        client.send(message);
    }
    saveDashboardState();
}

function pumpOff() {
    const pump = document.getElementById('pump');
    if (pump) {
        pump.innerText = 'OFF';
        pump.style.color = '#95a5a6';
    }
    addLog("User activated STOP button.", "#e74c3c");

    if (client && client.isConnected()) {
        const message = new Paho.MQTT.Message("OFF");
        message.destinationName = TOPIC_PUMP_CONTROL;
        client.send(message);
    }
    saveDashboardState();
}

// ==========================================
// 5. MOTOR LOAD SYSTEM
// ==========================================
function updateMotorLoad(status) {
    const loadEl = document.getElementById('motorLoad');
    if (!loadEl) return;

    if (status.toString().toUpperCase() === 'OVERLOAD' || status.toString().toUpperCase() === 'HIGH' || status === true) {
        loadEl.innerText = 'OVERLOAD';
        loadEl.style.color = '#e74c3c';
        addLog("Warning: Motor status is OVERLOAD!", "#e74c3c");
    } else {
        loadEl.innerText = 'NORMAL';
        loadEl.style.color = '#27ae60';
    }
    saveDashboardState();
}

// ==========================================
// 6. SAVE & LOAD LOCALSTORAGE DATA
// ==========================================
function saveDashboardState() {
    const getTxt = (id) => {
        const el = document.getElementById(id);
        return el ? el.innerText : '';
    };

    const loadEl = document.getElementById('motorLoad');

    const state = {
        acCurrent: getTxt('acCurrent'),
        dcCurrent: getTxt('dcCurrent'),
        dcVolt: getTxt('Volt'),
        acVolt: getTxt('volt'),
        tank: getTxt('tank'),
        flow: getTxt('flow'),
        pump: getTxt('pump'),
        pumpColor: document.getElementById('pump') ? document.getElementById('pump').style.color : '',
        motorLoad: getTxt('motorLoad'),
        motorLoadColor: loadEl ? loadEl.style.color : ''
    };
    localStorage.setItem('dashboardState', JSON.stringify(state));
}

function loadSavedData() {
    const savedState = JSON.parse(localStorage.getItem('dashboardState'));
    if (savedState) {
        if (document.getElementById('acCurrent')) document.getElementById('acCurrent').innerText = savedState.acCurrent || '0.00 A';
        if (document.getElementById('dcCurrent')) document.getElementById('dcCurrent').innerText = savedState.dcCurrent || '0.00 A';
        if (document.getElementById('Volt')) document.getElementById('Volt').innerText = savedState.dcVolt || '0.0 V';
        if (document.getElementById('volt')) document.getElementById('volt').innerText = savedState.acVolt || '0.0 V';
        if (document.getElementById('tank')) document.getElementById('tank').innerText = savedState.tank || 'LOW';
        if (document.getElementById('flow')) document.getElementById('flow').innerText = savedState.flow || '0.0 m³';
        
        const pump = document.getElementById('pump');
        if (pump) {
            pump.innerText = savedState.pump || 'OFF';
            pump.style.color = savedState.pumpColor || '#95a5a6';
        }

        const loadEl = document.getElementById('motorLoad');
        if (loadEl) {
            loadEl.innerText = savedState.motorLoad || 'NORMAL';
            loadEl.style.color = savedState.motorLoadColor || '#27ae60';
        }
    }

    renderSystemLogsUI();
    renderWaterHistoryUI();
}

// ==========================================
// 7. SYSTEM ACTIVITY LOG
// ==========================================
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

// ==========================================
// 8. WATER USAGE SUMMARY SYSTEM (2 DAYS)
// ==========================================
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
