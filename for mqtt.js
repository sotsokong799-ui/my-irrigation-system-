// ================= ១. ការភ្ជាប់ទៅ EMQX Cloud (Port 8084 សម្រាប់ HTTPS) =================
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
    client.subscribe("irrigation/voltage");
    client.subscribe("irrigation/soil");
    client.subscribe("irrigation/tank");
    client.subscribe("irrigation/flow");
    client.subscribe("irrigation/pump");
    client.subscribe("irrigation/mode");
});

// ================= ២. ទទួលទិន្នន័យមកបង្ហាញលើ Web (Real-time) =================
client.on('message', (topic, payload) => {
    const message = payload.toString().trim();
    console.log(`Received [${topic}]: ${message}`);

    if (topic === "irrigation/temp") {
        const element = document.getElementById('temp'); 
        if(element) element.innerText = message + "°C";
    }
    if (topic === "irrigation/soil") {
        const element = document.getElementById('soil'); 
        if(element) element.innerText = message + "%";
    }
    if (topic === "irrigation/humidity") {
        const element = document.getElementById('hum'); // ត្រូវនឹង id="hum" ក្នុង HTML
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
    if (topic === "irrigation/pump") {
        const element = document.getElementById('pump'); 
        if(element) {
            element.innerText = message;
            element.style.color = (message === "ON") ? "green" : "red";
        }
    }
});

// ================= ៣. មុខងារបញ្ជាប៊ូតុង (ត្រូវនឹង onclick របស់ HTML) =================
function pumpOn() {
    if (client && client.connected) {
        client.publish("esp32/pump", "ON");
        console.log("Sent: ON to esp32/pump");
        const element = document.getElementById('pump');
        if(element) { element.innerText = "ON"; element.style.color = "green"; }
    }
}

function pumpOff() {
    if (client && client.connected) {
        client.publish("esp32/pump", "OFF");
        console.log("Sent: OFF to esp32/pump");
        const element = document.getElementById('pump');
        if(element) { element.innerText = "OFF"; element.style.color = "red"; }
    }
}

function autoMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "AUTO");
        console.log("Sent: AUTO");
    }
}

function manualMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "MANUAL");
        console.log("Sent: MANUAL");
    }
}
