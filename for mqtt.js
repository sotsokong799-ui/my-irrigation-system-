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
// --- កូដបញ្ជាប៊ូតុងកែសម្រួលអក្សរធំ (ត្រូវនឹង HTML ១០០%) ---
function pumpON() {
  if (client && client.connected) {
    client.publish("esp32/pump", "ON");
    console.log("Sent: ON to esp32/pump");
  } else {
    console.log("MQTT Not Connected!");
  }
}

function pumpOFF() {
  if (client && client.connected) {
    client.publish("esp32/pump", "OFF");
    console.log("Sent: OFF to esp32/pump");
  } else {
    console.log("MQTT Not Connected!");
  }
}

function autoMode() {
  if (client && client.connected) {
    client.publish("esp32/mode", "AUTO");
    console.log("Sent: AUTO to esp32/mode");
  }
}

function manualMode() {
  if (client && client.connected) {
    client.publish("esp32/mode", "MANUAL");
    console.log("Sent: MANUAL to esp32/mode");
  }
}
