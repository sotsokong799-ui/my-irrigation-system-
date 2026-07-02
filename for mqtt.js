// ================= ៣. ទទួលទិន្នន័យពី MQTT មកបង្ហាញលើ Web =================
    client.on('message', (topic, payload) => {
        const message = payload.toString().trim();
        console.log(`Received [${topic}]: ${message}`);

        if (topic === "irrigation/voltage_ac") {
            const element = document.getElementById('volt'); 
            if(element) element.innerText = message + " V";
        }
        if (topic === "irrigation/voltage_dc") {
            const element = document.getElementById('dc-voltage-value'); 
            if(element) element.innerText = message;
        }
        if (topic === "irrigation/current_ac") {
            const element = document.getElementById('ac-current'); 
            if(element) element.innerText = message + " A";
        }
        if (topic === "irrigation/current_dc") {
            const element = document.getElementById('dc-current'); 
            if(element) element.innerText = message + " A";
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
            const element = document.getElementById('mode'); 
            if (element) {
                element.innerText = message;
                element.style.color = (message === "AUTO") ? "#2980b9" : "#d35400";
            }

            if (message !== lastModeState) {
                lastModeState = message; 
                if (message === "AUTO") {
                    addLog("System Mode set to 🔵 AUTOMATIC", "#2980b9");
                } else if (message === "MANUAL") {
                    addLog("System Mode set to 🟠 MANUAL", "#d35400");
                }
            }
        }
    }); // 🟢 បិទត្រឹមត្រូវ (លែងមានសញ្ញាលើសរញ៉េរញ៉េទៀតហើយ)

// ================= ៤. មុខងារបញ្ជាប៊ូតុងពី Web Dashboard =================
function pumpOn() {
    if (client && client.connected) {
        client.publish("irrigation/pump", "ON"); 
        addLog("User clicked [START] button from Web Dashboard.", "#27ae60");
    }
}

// មុខងារ STOP ម៉ូទ័រ
function pumpOff() {
    if (client && client.connected) {
        client.publish("irrigation/pump", "OFF"); 
        addLog("User clicked [STOP] button from Web Dashboard.", "#c0392b");
    }
}

// មុខងារប្តូរទៅ AUTO Mode
void function autoMode() {
    if (client && client.connected) {
        client.publish("irrigation/mode", "AUTO"); 
        addLog("User switched system to 🔵 AUTOMATIC Mode via Phone.", "#2980b9");
    } else {
        console.log("MQTT Client disconnected. Cannot change mode.");
    }
}

// មុខងារប្តូរទៅ MANUAL Mode
void function manualMode() {
    if (client && client.connected) {
        client.publish("irrigation/mode", "MANUAL"); 
        addLog("User switched system to 🟠 MANUAL Mode via Phone.", "#d35400");
    } else {
        console.log("MQTT Client disconnected. Cannot change mode.");
    }
}
