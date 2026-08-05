<!DOCTYPE html>
<html lang="km">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IoT Irrigation System - Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <!-- MQTT Library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.min.js" type="text/javascript"></script>
</head>
<body>

    <!-- ================= LOGIN SECTION ================= -->
    <div id="loginContainer">
        <h2>🌱 System Login</h2>
        <p>Please enter password to access dashboard.</p>
        
        <input type="password" id="passwordInput" placeholder="Enter Password">
        <button onclick="checkPassword()">LOGIN</button>
        <p id="errorMessage">❌ Incorrect Password! Try again.</p>
    </div>

    <!-- ================= DASHBOARD SECTION ================= -->
    <div id="dashboardContainer" style="display: none;">
        
        <header class="header">
            <div class="header-title">
                <span class="icon">🌱</span>
                <h1>IoT Irrigation Dashboard</h1>
            </div>
        </header>

        <main class="container">
            <!-- 8 Cards Grid -->
            <div class="card-grid">
                <div class="card">
                    <h3>AC Current</h3>
                    <p class="value ac-curr" id="acCurrent">1.64 A</p>
                </div>

                <div class="card">
                    <h3>DC Current</h3>
                    <p class="value dc-curr" id="dcCurrent">-4.91 A</p>
                </div>

                <div class="card">
                    <h3>DC Voltage</h3>
                    <p class="value dc-volt" id="Volt">6.9 V</p>
                </div>

                <div class="card">
                    <h3>AC Voltage</h3>
                    <p class="value ac-volt" id="volt">137.0 V</p>
                </div>

                <div class="card">
                    <h3>Tank Level</h3>
                    <p class="value tank-level" id="tank">LOW</p>
                </div>

                <div class="card">
                    <h3>Water Flow</h3>
                    <p class="value water-flow" id="flow">0.0 m³</p>
                </div>

                <div class="card">
                    <h3>Pump Status</h3>
                    <p class="value pump-status" id="pump">OFF</p>
                </div>

                <div class="card card-active">
                    <h3>System Mode</h3>
                    <p class="value system-mode" id="mode">MANUAL</p>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="button-group">
                <button class="btn btn-start" onclick="pumpOn()">START</button>
                <button class="btn btn-stop" onclick="pumpOff()">STOP</button>
                <button class="btn btn-auto" id="btn-auto" onclick="autoMode()">AUTO</button>
                <button class="btn btn-manual" id="btn-manual" onclick="manualMode()">MANUAL</button>
            </div>

            <!-- System Activity Log -->
            <section class="history-section">
                <div class="history-header">
                    <span class="icon">📜</span>
                    <h2>System Activity History</h2>
                </div>
                <div class="history-box" id="historyLog">
                    <div style="color: #888; text-align: center;">No activity recorded yet.</div>
                </div>
            </section>

            <!-- 2-Day Water Usage Summary Log -->
            <section class="history-section" style="margin-top: 25px;">
                <div class="history-header">
                    <span class="icon">💧</span>
                    <h2>2-Day Water Usage Summary (បូកសរុបការប្រើប្រាស់ទឹក ២ថ្ងៃ/ម្តង)</h2>
                </div>
                <div class="history-box" id="waterUsageLog">
                    <div style="color: #888; text-align: center;">មិនទាន់មានទិន្នន័យបូកសរុបនៅឡើយទេ។</div>
                </div>
            </section>
        </main>

    </div>

    <script src="For MQTT.js"></script> 
</body>
</html>
