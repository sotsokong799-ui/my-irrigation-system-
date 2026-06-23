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
    // ឱ្យ Web ចាំស្តាប់រាល់ទិន្នន័យពី ESP32 តាម Topic នីមួយៗ
    client.subscribe("irrigation/voltage"); // ចាំស្តាប់តម្លៃវ៉ុល
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

    // ◀️ កែតម្រូវត្រង់នេះ៖ ទទួលតម្លៃវ៉ុល រួចបង្ហាញទៅកាន់ id="volt" ក្នុង HTML
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
    if (topic === "irrigation/pump") {
        const element = document.getElementById('pump'); 
        if(element) {
            element.innerText = message;
            element.style.color = (message === "ON") ? "green" : "red";
        }
    }
    if (topic === "irrigation/mode") { // ◀️ បន្ថែមការបង្ហាញ Mode លើ Web ពេលដូរតាមអេក្រង់ TFT
        const element = document.getElementById('btn-auto');
        const elementManual = document.getElementById('btn-manual');
        // កូដនេះគ្រាន់តែជួយចំណាំពណ៌ប៊ូតុងលើ Web ឱ្យត្រូវតាម Mode
        if(message === "AUTO") {
            console.log("Current Mode: AUTO");
        } else {
            console.log("Current Mode: MANUAL");
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

// មុខងារប៊ូតុង STOP
function pumpOff() {
    if (client && client.connected) {
        client.publish("esp32/pump", "OFF");
        console.log("Sent: OFF to esp32/pump");
        const element = document.getElementById('pump');
        if(element) { element.innerText = "OFF"; element.style.color = "red"; }
    }
}

// មុខងារប៊ូតុង AUTO
function autoMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "AUTO");
        console.log("Sent: AUTO");
    }
}

// មុខងារប៊ូតុង MANUAL
function manualMode() {
    if (client && client.connected) {
        client.publish("esp32/mode", "MANUAL");
        console.log("Sent: MANUAL");
    }
}
