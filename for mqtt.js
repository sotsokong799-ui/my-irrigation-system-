// ================= ១. កំណត់ទិន្នន័យសម្រាប់ភ្ជាប់ទៅ EMQX Cloud =================
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

// ភ្ជាប់ទៅកាន់ EMQX តាមរយៈ Port 8084 (Secure WebSocket សម្រាប់ HTTPS / GitHub Pages)
const client = mqtt.connect('wss://z2b71312.ala.dedicated.aws.emqxcloud.com:8084/mqtt', options);

// ================= ២. ពេលភ្ជាប់ជោគជ័យ (Subscribe ចាំស្តាប់រាល់ Topic ពី ESP32) =================
client.on('connect', () => {
    console.log('Web Dashboard Connected to EMQX Successfully!');
    
    // ឱ្យ Web ចាំស្តាប់រាល់ទិន្នន័យដែល ESP32 ផ្ញើមក
    client.subscribe("irrigation/temp");
    client.subscribe("irrigation/humidity");
    client.subscribe("irrigation/soil");
    client.subscribe("irrigation/tank");
    client.subscribe("irrigation/flow");
    client.subscribe("irrigation/pump");
    client.subscribe("irrigation/mode");
});

// ================= ៣. ទទួលទិន្នន័យពី ESP32 រួចយកមកបង្ហាញលើផ្ទៃ Web (Real-time) =================
client.on('message', (topic, payload) => {
    const message = payload.toString().trim();
    console.log(`Received [${topic}]: ${message}`);

    // ប្តូរតម្លៃកំដៅ
    if (topic === "irrigation/temp") {
        const element = document.getElementById('temp'); // ត្រូវនឹង id="temp" ក្នុង HTML
        if(element) element.innerText = message + "°C";
    }
    // ប្តូរសំណើមដី
    if (topic === "irrigation/soil") {
        const element = document.getElementById('soil'); // បើ HTML ប្រើ id="soil" ឬ id="num" សូមដូរឱ្យត្រូវ
        if(element) element.innerText = message + "%";
        // ករណី HTML របស់អ្នកប្រើ id="num" ដូចក្នុងរូបភាព បើកកូដបន្ទាត់ខាងក្រោម៖
        // document.getElementById('num').innerText = message + "%";
    }
    // ប្តូរសំណើមខ្យល់
    if (topic === "irrigation/humidity") {
        const element = document.getElementById('humidity'); 
        if(element) element.innerText = message + "%";
    }
    // ប្តូរស្ថានភាពធុងទឹក
    if (topic === "irrigation/tank") {
        const element = document.getElementById('tank'); 
        if(element) element.innerText = message;
    }
    // ប្តូរល្បឿនទឹកហូរ
    if (topic === "irrigation/flow") {
        const element = document.getElementById('flow'); 
        if(element) element.innerText = message + " L/min";
    }
    // ប្តូរស្ថានភាពស្នប់ទឹក Pump Status (ON / OFF)
    if (topic === "irrigation/pump") {
        const element = document.getElementById('pump'); 
        if(element) {
            element.innerText = message;
            // បន្ថែមពណ៌អក្សរឱ្យស្អាត (បើ ON ពណ៌បៃតង បើ OFF ពណ៌ក្រហម)
            element.style.color = (message === "ON") ? "green" : "red";
        }
    }
});

// ================= ៤. មុខងារបញ្ជាប៊ូតុងពី Web ទៅកាន់ ESP32 (ត្រូវនឹង HTML ១០០%) =================

// ប៊ូតុង START លើ HTML (onclick="pumpON()")
function pumpON() {
    if (client && client.connected) {
        client.publish("esp32/pump", "ON");
        console.log("Sent: ON to esp32/pump");
        // ប្តូរលើ Web ភ្លាមៗដោយមិនបាច់ចាំ ESP32 តបមកវិញក៏បាន
        const element = document.getElementById('pump');
        if(element) { element.innerText = "ON"; element.style.color = "green"; }
    } else {
        console.log("MQTT Not Connected!");
    }
}

// ប៊ូតុង STOP លើ HTML (onclick="pumpOFF()")
function pumpOFF() {
    if (client && client.connected) {
        client.publish("esp32/pump", "OFF");
        console.log("Sent: OFF to esp32/pump");
        const element = document.getElementById('pump');
        if(element) { element.innerText = "OFF"; element.style.color = "red"; }
    } else {
        console.log("MQTT Not Connected!");
    }
}

// ប៊ូតុង AUTO លើ HTML (onclick="autoMode()")
function autoMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "AUTO");
        console.log("Sent: AUTO to esp32/mode");
    }
}

// ប៊ូតុង MANUAL លើ HTML (onclick="manualMode()")
function manualMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "MANUAL");
        console.log("Sent: MANUAL to esp32/mode");
    }
}
