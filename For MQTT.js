// កំណត់ទិន្នន័យសម្រាប់ភ្ជាប់ទៅ EMQX Cloud
const options = {
    username: 'KONG@29',
    password: '29072003KONG', // ត្រូវដូរដាក់លេខកូដសម្ងាត់ពិតរបស់អ្នក
    clientId: 'web_dashboard_' + Math.random().toString(16).substr(2, 8)
};

const client = mqtt.connect('wss://z2b71312.ala.dedicated.aws.emqxcloud.com:8084/mqtt', options);

client.on('connect', () => {
    console.log('Web Dashboard Connected to EMQX Successfully!');
    // ភ្ជាប់ទៅកាន់ Topic ដើម្បីស្តាប់តម្លៃពី ESP32 (បើមាន)
    client.subscribe('esp32/sensor_data'); 
});

// មុខងារបញ្ជាប៊ូតុង START (ត្រូវលុបពាក្យ void ចោល)
function pumpOn() {
    client.publish('esp32/pump', 'ON');
    document.getElementById('pump').innerText = "ON";
    console.log("Sent: Pump ON");
}

// មុខងារបញ្ជាប៊ូតុង STOP (ត្រូវលុបពាក្យ void ចោល)
function pumpOff() {
    client.publish('esp32/pump', 'OFF');
    document.getElementById('pump').innerText = "OFF";
    console.log("Sent: Pump OFF");
}

// មុខងារបញ្ជាប៊ូតុង AUTO
function autoMode() {
    client.publish('esp32/mode', 'AUTO');
    console.log("Sent: AUTO Mode");
}

// មុខងារបញ្ជាប៊ូតុង MANUAL
function manualMode() {
    client.publish('esp32/mode', 'MANUAL');
    console.log("Sent: MANUAL Mode");
}