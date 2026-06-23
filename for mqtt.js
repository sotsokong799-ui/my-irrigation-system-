// ================= ១. ការភ្ជាប់ទៅ EMQX Cloud =================
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
    // ឱ្យ Web ចាំស្តាប់រាល់ទិន្នន័យពី ESP32
    client.subscribe("irrigation/temp");
    client.subscribe("irrigation/humidity");
    client.subscribe("irrigation/soil");
    client.subscribe("irrigation/tank");
    client.subscribe("irrigation/flow");
    client.subscribe("irrigation/pump");
    client.subscribe("irrigation/mode");
});

// ================= ២. ទទួលទិន្នន័យមកបង្ហាញលើ Web =================
client.on('message', (topic, payload) => {
    const message = payload.toString().trim();
    console.log(`Received [${topic}]: ${message}`);

    // ប្តូរតម្លៃកំដៅ
    if (topic === "irrigation/temp") {
        const element = document.getElementById('temp'); 
        if(element) element.innerText = message + "°C";
    }
    // ប្តូរសំណើមដី (កូដ HTML របស់អ្នកប្រើ id="num" សម្រាប់ដី)
    if (topic === "irrigation/soil") {
        const element = document.getElementById('num') || document.getElementById('soil'); 
        if(element) element.innerText = message + "%";
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
    // ប្តូរស្ថានភាពស្នប់ទឹក (id="pump" ក្នុង HTML)
    if (topic === "irrigation/pump") {
        const element = document.getElementById('pump'); 
        if(element) {
            element.innerText = message;
            element.style.color = (message === "ON") ? "green" : "red";
        }
    }
});

// ================= ៣. មុខងារបញ្ជាប៊ូតុង (អក្សរធំត្រូវនឹង HTML) =================
function pumpON() {
    if (client && client.connected) {
        client.publish("esp32/pump", "ON");
        console.log("Sent: ON");
        const element = document.getElementById('pump');
        if(element) { element.innerText = "ON"; element.style.color = "green"; }
    }
}

function pumpOFF() {
    if (client && client.connected) {
        client.publish("esp32/pump", "OFF");
        console.log("Sent: OFF");
        const element = document.getElementById('pump');
        if(element) { element.innerText = "OFF"; element.style.color = "red"; }
    }
}

// ប៊ូតុង AUTO លើ HTML (onclick="autoMode()")
function autoMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "AUTO");
        console.log("Sent: AUTO");
    }
}

// ប៊ូតុង MANUAL លើ HTML (onclick="manualMode()")
function manualMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "MANUAL");
        console.log("Sent: MANUAL");
    }
}
