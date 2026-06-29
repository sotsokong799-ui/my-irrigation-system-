// អថេរសម្រាប់ប្រើជាសកល (Global Variables)
let client;
let lastPumpState = "";
let lastModeState = "";

// ================= ០. មុខងារត្រួតពិនិត្យការ Login =================
function checkPassword() {
    const passwordEntered = document.getElementById('passwordInput').value;
    const correctPassword = "​ "; // Password សម្រាប់ចូលប្រព័ន្ធ
    const errorMsg = document.getElementById('errorMessage');

    if (passwordEntered === correctPassword) {
        // បើត្រូវ៖ លាក់ផ្ទាំង Login រួចបង្ហាញផ្ទាំង Dashboard ភ្លាម
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('dashboardContainer').style.display = 'block';
        
        // ចាប់ផ្តើមដំណើរការភ្ជាប់ទៅកាន់ MQTT Broker
        connectToMQTT(); 
    } else {
        // បើខុស៖ បង្ហាញអក្សរប្រកាសអាសន្នពណ៌ក្រហម
        if (errorMsg) errorMsg.style.display = 'block';
    }
}

// ================= ១. មុខងារបង្កើតប្រវត្តិជាអក្សរ (History Log Function) =================
function addLog(actionText, color = '#333') {
    const logContainer = document.getElementById('historyLog');
    if (!logContainer) return;

    if (logContainer.innerHTML.includes("No activity recorded yet.")) {
        logContainer.innerHTML = "";
    }

    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    const dateTimeString = `[${day}/${month}/${year} - ${hours}:${minutes}:${seconds}]`;

    const logEntry = document.createElement('div');
    logEntry.style.marginBottom = '8px';
    logEntry.style.borderBottom = '1px dashed #eee';
    logEntry.style.paddingBottom = '4px';
    logEntry.innerHTML = `<span style="color: #7f8c8d; font-weight: bold;">${dateTimeString}</span> ➡️ <span style="color: ${color}; font-weight: 500;">${actionText}</span>`;

    logContainer.insertBefore(logEntry, logContainer.firstChild);
}

// ================= ២. ការភ្ជាប់ទៅ EMQX Cloud =================
const options = {
  username: 'YOUR_MQTT_USERNAME', // 
  password: 'YOUR_MQTT_PASSWORD', // 
  keepalive: 60,
  clientId: 'web_dashboard_' + Math.random().toString(16).substr(2, 8),
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000
};

function connectToMQTT() {
    client = mqtt.connect('wss://gb0066f0.ala.us-east-1.emqxsl.com:8084/mqtt', options);

    client.on('connect', () => {
        console.log('Connected to EMQX Successfully!');
        client.subscribe("irrigation/voltage_ac");
        client.subscribe("irrigation/voltage_dc");
        client.subscribe("irrigation/tank");
        client.subscribe("irrigation/flow");
        client.subscribe("irrigation/pump");
        client.subscribe("irrigation/mode");
        
        addLog("Dashboard authorized and connected to EMQX Broker Server.", "#2980b9");
    });

    // ================= ៣. ទទួលទិន្នន័យពី MQTT មកបង្ហាញលើ Web =================
    client.on('message', (topic, payload) => {
        const message = payload.toString().trim();
        console.log(`Received [${topic}]: ${message}`);

        if (topic === "irrigation/voltage_ac") {
            const element = document.getElementById('volt'); 
            if(element) element.innerText = message + " V";
        }
        if (topic === "irrigation/voltage_dc") {
            const element = document.getElementById('volt'); 
            if(element) element.innerText = message + " V";
        }
        if (topic === "irrigation/tank") {
            const element = document.getElementById('tank'); 
            if(element) element.innerText = message;
        }
        if (topic === "irrigation/flow") {
            const element = document.getElementById('flow'); 
            if(element) element.innerText = message + " L/min";
        }
        
        if (topic === "irrigation/pump") {
            const element = document.getElementById('pump'); 
            if(element) {
                element.innerText = message;
                element.style.color = (message === "ON") ? "green" : "red";
            }
            
            if (message !== lastPumpState) {
                if (message === "ON") {
                    addLog("Motor Status changed to 🟢 ON", "green");
                } else if (message === "OFF") {
                    addLog("Motor Status changed to 🔴 OFF", "red");
                }
                lastPumpState = message;
            }
        }

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
}

// ================= ៤. មុខងារបញ្ជាប៊ូតុងពី Web Dashboard =================
function pumpOn() {
    if (client && client.connected) {
        client.publish("esp32/pump", "ON");
        addLog("User clicked [START] button from Web Dashboard.", "#27ae60");
    }
}

// មុខងារ STOP
function pumpOff() {
    if (client && client.connected) {
        client.publish("esp32/pump", "OFF");
        addLog("User clicked [STOP] button from Web Dashboard.", "#c0392b");
    }
}

// មុខងារ AUTO
function autoMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "AUTO");
        addLog("User clicked [AUTO] mode from Web Dashboard.", "#2980b9");
    }
}

// មុខងារ MANUAL
function manualMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "MANUAL");
        addLog("User clicked [MANUAL] mode from Web Dashboard.", "#d35400");
    }
}
