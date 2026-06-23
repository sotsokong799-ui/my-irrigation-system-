// ================= ១. មុខងារបង្កើតប្រវត្តិជាអក្សរ (History Log Function) =================
function addLog(actionText, color = '#333') {
    const logContainer = document.getElementById('historyLog');
    if (!logContainer) return;

    // បើសិនជាទើបតែដើរដំបូង លុបពាក្យ "No activity" ចេញ
    if (logContainer.innerHTML.includes("No activity recorded yet.")) {
        logContainer.innerHTML = "";
    }

    // ចាប់យក ថ្ងៃខែឆ្នាំ និង ម៉ោង នាទី វិនាទី ពីម៉ាស៊ីន (ទូរស័ព្ទ ឬ កុំព្យូទ័រ)
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const dateTimeString = `[${day}/${month}/${year} - ${hours}:${minutes}:${seconds}]`;

    // បង្កើតបន្ទាត់ Log ថ្មី
    const logEntry = document.createElement('div');
    logEntry.style.marginBottom = '8px';
    logEntry.style.borderBottom = '1px dashed #eee';
    logEntry.style.paddingBottom = '4px';
    logEntry.innerHTML = `<span style="color: #7f8c8d; font-weight: bold;">${dateTimeString}</span> ➡️ <span style="color: ${color}; font-weight: 500;">${actionText}</span>`;

    // រុញ Log ថ្មីទៅលើគេបង្អស់ (ទិន្នន័យថ្មីនៅពីលើ ទិន្នន័យចាស់នៅពីក្រោម)
    logContainer.insertBefore(logEntry, logContainer.firstChild);
}

// ================= ២. ការភ្ជាប់ទៅ EMQX Cloud (Port 8084 សម្រាប់ HTTPS) =================
const options = {
    username: 'KONG@29',
    password: '29072003KONG', 
    keepalive: 60,
    clientId: 'web_dashboard_' + Math.random().toString(16).substr(2, 8),
    protocolId: 'MQTT',
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000
};

const client = mqtt.connect('wss://z2b71312.ala.dedicated.aws.emqxcloud.com:8084/mqtt', options);

client.on('connect', () => {
    console.log('Connected to EMQX Successfully!');
    client.subscribe("irrigation/voltage");
    client.subscribe("irrigation/soil");
    client.subscribe("irrigation/tank");
    client.subscribe("irrigation/flow");
    client.subscribe("irrigation/pump");
    client.subscribe("irrigation/mode");
    
    // កត់ត្រាពេល Web ភ្ជាប់ទៅកាន់ Server បានជោគជ័យ
    addLog("Dashboard connected to EMQX Broker Server.", "#2980b9");
});

// ================= ៣. ទទួលទិន្នន័យ និងកត់ត្រាប្រវត្តិពេលមានការប្រែប្រួល =================
let lastPumpState = "";
let lastModeState = "";

client.on('message', (topic, payload) => {
    const message = payload.toString().trim();
    console.log(`Received [${topic}]: ${message}`);

    if (topic === "irrigation/voltage") {
        const element = document.getElementById('volt'); 
        if(element) element.innerText = message + " V";
    }
    if (topic === "irrigation/soil") {
        const element = document.getElementById('soil'); 
        if(element) element.innerText = message + "%";
    }
    if (topic === "irrigation/tank") {
        const element = document.getElementById('tank'); 
        if(element) element.innerText = message;
    }
    if (topic === "irrigation/flow") {
        const element = document.getElementById('flow'); 
        if(element) element.innerText = message + " L/min";
    }
    
    // ចាប់សកម្មភាពបិទបើក Motor (ទោះជាចុចពី TFT ឬពី Web ក៏វាដឹងដែរ)
    if (topic === "irrigation/pump") {
        const element = document.getElementById('pump'); 
        if(element) {
            element.innerText = message;
            element.style.color = (message === "ON") ? "green" : "red";
        }
        
        // កត់ត្រាចូល History លុះត្រាតែស្ថានភាពមានការផ្លាស់ប្តូរ (ការពារកុំឱ្យណែន Log ដដែលៗ)
        if (message !== lastPumpState) {
            if (message === "ON") {
                addLog("Motor Status changed to 🟢 ON", "green");
            } else if (message === "OFF") {
                addLog("Motor Status changed to 🔴 OFF", "red");
            }
            lastPumpState = message;
        }
    }

    // ចាប់សកម្មភាពផ្លាស់ប្តូរ Mode
    if (topic === "irrigation/mode") {
        if (message !== lastModeState) {
            if (message === "AUTO") {
                addLog("System Mode set to 🔵 AUTOMATIC", "#2980b9");
            } else if (message === "MANUAL") {
                addLog("System Mode set to 🟠 MANUAL", "#d35400");
            }
            lastModeState = message;
        }
    }
});

// ================= ៤. មុខងារបញ្ជាប៊ូតុងពី Web Dashboard =================
function pumpOn() {
    if (client && client.connected) {
        client.publish("esp32/pump", "ON");
        addLog("User clicked [START] button from Web Dashboard.", "#27ae60");
    }
}

function pumpOff() {
    if (client && client.connected) {
        client.publish("esp32/pump", "OFF");
        addLog("User clicked [STOP] button from Web Dashboard.", "#c0392b");
    }
}

function autoMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "AUTO");
        addLog("User clicked [AUTO] mode from Web Dashboard.", "#2980b9");
    }
}

function manualMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "MANUAL");
        addLog("User clicked [MANUAL] mode from Web Dashboard.", "#d35400");
    }
}
