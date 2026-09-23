// ==========================================
// CONFIGURATION & MQTT GLOBALS
// ==========================================
const MQTT_HOST = "4a8939aca73049848878fb5e2c8c332c.s1.eu.hivemq.cloud";
const MQTT_PORT = 8884;
const MQTT_USER = "MyMQTT";
const MQTT_PASS = "29072003Sot";
const MQTT_CLIENT_ID = "IrrigationDash_" + Math.random().toString(16).substr(2, 8);

const TOPIC_PUMP_CONTROL = "irrigation/pump/control";
const TOPIC_PUMP_STATUS  = "irrigation/pump/status";
const TOPIC_SENSOR_DATA  = "irrigation/sensors/data";

let client = null;

// ==========================================
// LOGIN & AUTHENTICATION
// ==========================================
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMessage');
    
    if (passwordInput && passwordInput.value === "10112003") {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        localStorage.setItem('isLoggedIn', 'true');
        
        connectToMQTT();
        loadSavedData();
    } else {
        if (errorMsg) errorMsg.style.display = 'block';
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    if (client && client.isConnected()) client.disconnect();
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'none';
}

window.onload = function() {
    localStorage.removeItem('isLoggedIn');
    document.getElementById('loginContainer').style.display = 'block';
    document.getElementById('dashboardContainer').style.display = 'none';
};

// ==========================================
// MQTT CONNECTION
// ==========================================
function connectToMQTT() {
    client = new Paho.MQTT.Client(MQTT_HOST, Number(MQTT_PORT), MQTT_CLIENT_ID);
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    const options = {
        timeout: 10,
        useSSL: true,         
        userName: MQTT_USER,
        password: MQTT_PASS,
        cleanSession: true,
        onSuccess: onConnect,
        onFailure: onConnectFailure
    };

    client.connect(options);
}

function onConnect() {
    addLog("Dashboard authorized and connected to HiveMQ Free Server.", "#27ae60");
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

    if (topic === TOPIC_PUMP_STATUS) {
        const pumpEl = document.getElementById('pump');
        if (pumpEl) {
            pumpEl.innerText = payload;
            pumpEl.style.color = (payload.toUpperCase() === 'ON') ? '#2ecc71' : '#95a5a6';
        }
        addLog(`Pump status updated to: ${payload}`, payload.toUpperCase() === 'ON' ? '#2ecc71' : '#e74c3c');
        saveDashboardState();
    }

    if (topic === TOPIC_SENSOR_DATA) {
        try {
            const data = JSON.parse(payload);

            const acCur = data.ac_current !== undefined ? data.ac_current : data.acCurrent;
            if (acCur !== undefined && document.getElementById('acCurrent')) 
                document.getElementById('acCurrent').innerText = `${parseFloat(acCur).toFixed(2)} A`;

            const dcCur = data.dc_current !== undefined ? data.dc_current : data.dcCurrent;
            if (dcCur !== undefined && document.getElementById('dcCurrent')) 
                document.getElementById('dcCurrent').innerText = `${parseFloat(dcCur).toFixed(2)} A`;

            const dcV = data.dc_voltage !== undefined ? data.dc_voltage : data.dcVolt;
            if (dcV !== undefined && document.getElementById('Volt')) 
                document.getElementById('Volt').innerText = `${parseFloat(dcV).toFixed(1)} V`;

            const acV = data.ac_voltage !== undefined ? data.ac_voltage : data.acVolt;
            if (acV !== undefined && document.getElementById('volt')) 
                document.getElementById('volt').innerText = `${parseFloat(acV).toFixed(1)} V`;

            // Calculate & Display AC/DC Power
            let acP = data.ac_power !== undefined ? data.ac_power : data.acPower;
            if (acP === undefined && acV !== undefined && acCur !== undefined) acP = parseFloat(acV) * parseFloat(acCur);
            if (acP !== undefined && document.getElementById('acPower')) 
                document.getElementById('acPower').innerText = `${parseFloat(acP).toFixed(2)} W`;

            let dcP = data.dc_power !== undefined ? data.dc_power : data.dcPower;
            if (dcP === undefined && dcV !== undefined && dcCur !== undefined) dcP = parseFloat(dcV) * parseFloat(dcCur);
            if (dcP !== undefined && document.getElementById('dcPower')) 
                document.getElementById('dcPower').innerText = `${parseFloat(dcP).toFixed(2)} W`;

            const tankLvl = data.tank_level !== undefined ? data.tank_level : data.tank;
            if (tankLvl !== undefined && document.getElementById('tank')) 
                document.getElementById('tank').innerText = tankLvl;
            
            const flowVal = data.water_flow !== undefined ? data.water_flow : (data.waterFlow !== undefined ? data.waterFlow : data.flow);
            if (flowVal !== undefined) updateWaterUsage(parseFloat(flowVal));

            const mLoad = data.motor_load !== undefined ? data.motor_load : data.motorLoad;
            if (mLoad !== undefined) updateMotorLoad(mLoad);

            // Record Electrical History Log
            if (acCur !== undefined && dcCur !== undefined && acV !== undefined && dcV !== undefined) {
                addElectricalLogDaily(acCur, dcCur, acV, dcV, acP || 0, dcP || 0);
            }

            saveDashboardState();
        } catch (e) {
            console.error("Invalid JSON:", payload);
        }
    }
}

// ==========================================
// CONTROLS & LOGGING FUNCTIONS
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

function updateMotorLoad(status) {
    const loadEl = document.getElementById('motorLoad');
    if (!loadEl) return;

    if (status.toString().toUpperCase() === 'OVERLOAD' || status === true) {
        loadEl.innerText = 'OVERLOAD';
        loadEl.style.color = '#e74c3c';
        addLog("Warning: Motor status is OVERLOAD!", "#e74c3c");
    } else {
        loadEl.innerText = 'NORMAL';
        loadEl.style.color = '#27ae60';
    }
    saveDashboardState();
}

// ELECTRICAL HISTORY LOG (AC/DC Voltage, Current & Power)
function addElectricalLogDaily(acCur, dcCur, acVolt, dcVolt, acPower, dcPower) {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const todayStr = `${day}/${month}/${year}`;
    const timeStr = `[${todayStr} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;

    const logData = {
        time: timeStr,
        acCur: parseFloat(acCur).toFixed(2),
        dcCur: parseFloat(dcCur).toFixed(2),
        acVolt: parseFloat(acVolt).toFixed(1),
        dcVolt: parseFloat(dcVolt).toFixed(1),
        acPower: parseFloat(acPower).toFixed(2),
        dcPower: parseFloat(dcPower).toFixed(2)
    };

    let elecLogs = JSON.parse(localStorage.getItem('electricalHistoryLogs')) || [];

    if (localStorage.getItem('lastElecSavedDate') !== todayStr) {
        elecLogs.unshift(logData);
        if (elecLogs.length > 30) elecLogs.pop();
        localStorage.setItem('lastElecSavedDate', todayStr);
    } else {
        if (elecLogs.length > 0) {
            elecLogs[0] = logData;
        } else {
            elecLogs.unshift(logData);
        }
    }

    localStorage.setItem('electricalHistoryLogs', JSON.stringify(elecLogs));
    renderElectricalLogsUI();
}

function renderElectricalLogsUI() {
    const container = document.getElementById('electricalHistoryLog');
    if (!container) return;
    let elecLogs = JSON.parse(localStorage.getItem('electricalHistoryLogs')) || [];

    if (elecLogs.length === 0) {
        container.innerHTML = `<div class="empty-log">No daily electrical log recorded yet.</div>`;
        return;
    }

    container.innerHTML = "";
    elecLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item';
        item.style.padding = "6px 0";
        item.style.borderBottom = "1px solid #eee";
        
        item.innerHTML = `
            <span style="color: #7f8c8d; font-weight: bold;">${log.time}</span> ➔ 
            <span style="color: #2196F3;">AC: <b>${log.acVolt}V / ${log.acCur}A / ${log.acPower}W</b></span> | 
            <span style="color: #27ae60;">DC: <b>${log.dcVolt}V / ${log.dcCur}A / ${log.dcPower}W</b></span>
        `;
        container.appendChild(item);
    });
}

function addLog(actionText, color = '#27ae60') {
    const now = new Date();
    const timeString = `[${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} - ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    const logData = { time: timeString, text: actionText, color: color };

    let systemLogs = JSON.parse(localStorage.getItem('systemLogsHistory')) || [];
    systemLogs.push(logData);
    if (systemLogs.length > 50) systemLogs.shift();
    
    localStorage.setItem('systemLogsHistory', JSON.stringify(systemLogs));
    renderSystemLogsUI();
}

function renderSystemLogsUI() {
    const container = document.getElementById('historyLog');
    if (!container) return;
    let systemLogs = JSON.parse(localStorage.getItem('systemLogsHistory')) || [];

    if (systemLogs.length === 0) {
        container.innerHTML = `<div class="empty-log">No activity recorded yet.</div>`;
        return;
    }

    container.innerHTML = "";
    systemLogs.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item';
        item.innerHTML = `<span style="color: #7f8c8d;">${log.time}</span> ➡ <span style="color: ${log.color};">${log.text}</span>`;
        container.appendChild(item);
    });
    container.scrollTop = container.scrollHeight;
}

function updateWaterUsage(currentFlow) {
    const flowEl = document.getElementById('flow');
    if (flowEl) flowEl.innerText = `${currentFlow.toFixed(1)} m³`;

    const now = new Date();
    const lastReset = localStorage.getItem('lastWaterResetDate');

    if (!lastReset) {
        localStorage.setItem('lastWaterResetDate', now.toISOString());
    } else {
        const diffInDays = (now.getTime() - new Date(lastReset).getTime()) / (1000 * 3600 * 24);
        if (diffInDays >= 2) {
            saveAndShowWaterLog(new Date(lastReset), now, currentFlow);
            localStorage.setItem('lastWaterResetDate', now.toISOString());
        }
    }
    saveDashboardState();
}

function saveAndShowWaterLog(startDate, endDate, totalM3) {
    const formatDt = (d) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} - ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    const logText = `[${formatDt(startDate)} ➔ ${formatDt(endDate)}] : សរុបការប្រើប្រាស់ទឹក = ${totalM3.toFixed(2)} m³`;

    let waterHistory = JSON.parse(localStorage.getItem('waterHistoryLogs')) || [];
    waterHistory.unshift(logText);
    localStorage.setItem('waterHistoryLogs', JSON.stringify(waterHistory));
    renderWaterHistoryUI();
}

function renderWaterHistoryUI() {
    const container = document.getElementById('waterUsageLog');
    if (!container) return;
    let waterHistory = JSON.parse(localStorage.getItem('waterHistoryLogs')) || [];

    if (waterHistory.length === 0) {
        container.innerHTML = `<div class="empty-log">មិនទាន់មានទិន្នន័យបូកសរុបនៅឡើយទេ។</div>`;
        return;
    }

    container.innerHTML = "";
    waterHistory.forEach(log => {
        const item = document.createElement('div');
        item.className = 'log-item';
        item.innerText = log;
        container.appendChild(item);
    });
}

// ==========================================
// SAVE & LOAD STATE
// ==========================================
function saveDashboardState() {
    const getTxt = (id) => document.getElementById(id) ? document.getElementById(id).innerText : '';
    const state = {
        acCurrent: getTxt('acCurrent'),
        dcCurrent: getTxt('dcCurrent'),
        dcVolt: getTxt('Volt'),
        acVolt: getTxt('volt'),
        acPower: getTxt('acPower'),
        dcPower: getTxt('dcPower'),
        tank: getTxt('tank'),
        flow: getTxt('flow'),
        pump: getTxt('pump'),
        motorLoad: getTxt('motorLoad')
    };
    localStorage.setItem('dashboardState', JSON.stringify(state));
}

function loadSavedData() {
    const saved = JSON.parse(localStorage.getItem('dashboardState'));
    if (saved) {
        if (document.getElementById('acCurrent')) document.getElementById('acCurrent').innerText = saved.acCurrent || '0.00 A';
        if (document.getElementById('dcCurrent')) document.getElementById('dcCurrent').innerText = saved.dcCurrent || '0.00 A';
        if (document.getElementById('Volt')) document.getElementById('Volt').innerText = saved.dcVolt || '0.0 V';
        if (document.getElementById('volt')) document.getElementById('volt').innerText = saved.acVolt || '0.0 V';
        if (document.getElementById('acPower')) document.getElementById('acPower').innerText = saved.acPower || '0.00 W';
        if (document.getElementById('dcPower')) document.getElementById('dcPower').innerText = saved.dcPower || '0.00 W';
        if (document.getElementById('tank')) document.getElementById('tank').innerText = saved.tank || 'LOW';
        if (document.getElementById('flow')) document.getElementById('flow').innerText = saved.flow || '0.0 m³';
        if (document.getElementById('pump')) document.getElementById('pump').innerText = saved.pump || 'OFF';
        if (document.getElementById('motorLoad')) document.getElementById('motorLoad').innerText = saved.motorLoad || 'NORMAL';
    }

    renderElectricalLogsUI();
    renderSystemLogsUI();
    renderWaterHistoryUI();
}
