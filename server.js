const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const admin = require('firebase-admin');

// ទាញយក Firebase Service Account Key របស់អ្នក (អាច Download ពី Firebase Console -> Project Settings -> Service Accounts)
const serviceAccount = require('./firebase-service-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-irrigation-system-default-rtdb.firebaseio.com" // ជំនួសដោយ Database URL របស់អ្នក
});

const db = admin.database();

const app = express();
app.use(cors());
app.use(express.json());

// ភ្ជាប់ទៅកាន់ HiveMQ Cloud Broker
const HIVEMQ_HOST = "4a8939aca73049848878fb5e2c8c332c.s1.eu.hivemq.cloud"; 
const options = {
  port: 8883,
  protocol: 'mqtts',
  username: 'MyMQTT',
  password: '29072003Sot'
};

const mqttClient = mqtt.connect(`mqtts://${HIVEMQ_HOST}`, options);

mqttClient.on('connect', () => {
  console.log('✅ Connected to HiveMQ Cloud Broker!');
  
  mqttClient.subscribe('irrigation/sensors/data', (err) => {
    if (!err) console.log('📡 Subscribed to topic: irrigation/sensors/data');
    else console.error('❌ Subscription Error:', err);
  });
});

// ទទួលសារពី MQTT រួច Save ចូល Firebase Realtime Database
mqttClient.on('message', async (topic, message) => {
  try {
    const rawMsg = message.toString();
    console.log(`📩 Received Data from [${topic}]:`, rawMsg);

    if (topic === 'irrigation/sensors/data') {
      const data = JSON.parse(rawMsg);

      const record = {
        ac_current:  data.ac_current  ?? data.acCurrent  ?? 0,
        ac_voltage:  data.ac_voltage  ?? data.acVoltage  ?? 0,
        dc_current:  data.dc_current  ?? data.dcCurrent  ?? 0,
        dc_voltage:  data.dc_voltage  ?? data.dcVoltage  ?? 0,
        ac_power:    data.ac_power    ?? data.acPower    ?? (data.ac_voltage * data.ac_current) ?? 0,
        dc_power:    data.dc_power    ?? data.dcPower    ?? (data.dc_voltage * data.dc_current) ?? 0,
        water_flow:  data.water_flow  ?? data.waterFlow  ?? 0,
        pump_status: data.pump_status ?? data.pumpStatus ?? "OFF",
        tank_level:  data.tank_level  ?? data.tankLevel  ?? "UNKNOWN",
        motor_load:  data.motor_load  ?? data.motorLoad  ?? "NORMAL",
        timestamp:   Date.now()
      };

      // បញ្ចូលទិន្នន័យចូល Firebase Realtime Database
      await db.ref('sensor_logs').push(record);
      console.log('💾 Sensor Log successfully saved to Firebase Database!');
    }
  } catch (error) {
    console.error('❌ Error parsing or saving MQTT message:', error.message);
  }
});

// API សម្រាប់ទាញយក History ទិន្នន័យ
app.get('/api/history', async (req, res) => {
  try {
    const snapshot = await db.ref('sensor_logs').limitToLast(50).once('value');
    const data = snapshot.val();
    res.json(data ? Object.values(data).reverse() : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Node.js Server running on port ${PORT}`));
