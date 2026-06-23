function pumpOn() {
  client.publish("esp32/pump", "ON");
}

function pumpOff() {
  client.publish("esp32/pump", "OFF");
}

function autoMode() {
  client.publish("esp32/mode", "AUTO");
}

function manualMode() {
  client.publish("esp32/mode", "MANUAL");
}
