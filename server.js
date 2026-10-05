const express = require('express');
const mqtt = require('mqtt');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// ១. ភ្ជាប់ទៅកាន់ MongoDB Database
// -------------------------------------------------------------
const MONGO_URI = "mongodb+srv://sotsokong799_db_user:KYy6BzyV80BqDCgE@cluster0.hkyiehs.mongodb.net/iot_db?retryWrites=true&w=majority";

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Database'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// បង្កើត Schema សម្រាប់រក្សាទុក History Log
const SensorLogSchema = new mongoose.Schema({
  acCurrent: Number,
  waterFlow: Number,
  pumpStatus: String,
  timestamp: { type: Date, default: Date.now }
});
const SensorLog = mongoose.model('SensorLog', SensorLogSchema);

// -------------------------------------------------------------
// ២. ភ្ជាប់ទៅកាន់ HiveMQ Cloud
// -------------------------------------------------------------
const HIVEMQ_HOST = "4a8939aca73049848878fb5e2c8c332c.s1.eu.hivemq.cloud"; 
const options = {
  port: 8883,
  protocol: 'mqtts',
  username: 'MyMQTT',
  password: '29072003Sot' // ⚠️ ដាក់ Password HiveMQ របស់អ្នកនៅទីនេះ
};

const mqttClient = mqtt.connect(`mqtts://${HIVEMQ_HOST}`, options);

mqttClient.on('connect', () => {
  console.log('✅ Connected to HiveMQ Cloud Broker!');
  // Subscribe ទៅ Topic ដែល ESP32 ផ្ញើមក
  mqttClient.subscribe('irrigation/sensor/data', (err) => {
    if (!err) console.log('📡 Subscribed to topic: irrigation/sensor/data');
  });
});

// -------------------------------------------------------------
// ៣. ទទួលសារពី HiveMQ រួច Save ចូល Database
// -------------------------------------------------------------
mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log('📩 Received Data:', data);

    const newLog = new SensorLog({
      acCurrent: data.acCurrent,
      waterFlow: data.waterFlow,
      pumpStatus: data.pumpStatus
    });
    await newLog.save();
    console.log('💾 Log saved to MongoDB Database!');
  } catch (error) {
    console.error('Error parsing MQTT message:', error);
  }
});

// -------------------------------------------------------------
// ៤. API សម្រាប់ Web Dashboard ទាញយក History Data មកបង្ហាញ
// -------------------------------------------------------------
app.get('/api/history', async (req, res) => {
  try {
    const logs = await SensorLog.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Node.js Server running on port ${PORT}`));
