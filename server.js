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

// បង្កើត Schema ឲ្យគ្របដណ្តប់គ្រប់តម្លៃដែល ESP32 ផ្ញើមក
const SensorLogSchema = new mongoose.Schema({
  acCurrent: Number,
  acVoltage: Number,
  dcCurrent: Number,
  dcVoltage: Number,
  acPower: Number,
  dcPower: Number,
  waterFlow: Number,
  pumpStatus: String,
  tankLevel: String,
  motorLoad: String,
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
  password: '29072003Sot'
};

const mqttClient = mqtt.connect(`mqtts://${HIVEMQ_HOST}`, options);

mqttClient.on('connect', () => {
  console.log('✅ Connected to HiveMQ Cloud Broker!');
  
  // ✅ កែសម្រួល Topic ឲ្យត្រូវជាមួយ ESP32 (មាន 's' នៅ sensors)
  mqttClient.subscribe('irrigation/sensors/data', (err) => {
    if (!err) {
      console.log('📡 Subscribed to topic: irrigation/sensors/data');
    } else {
      console.error('❌ Subscription Error:', err);
    }
  });

  // Subscribe លើ Topic Status របស់ Pump ផងដែរ (ប្រសិនបើចង់ Save ពេល Pump ផ្លាស់ប្តូរ Status)
  mqttClient.subscribe('irrigation/pump/status', (err) => {
    if (!err) console.log('📡 Subscribed to topic: irrigation/pump/status');
  });
});

// -------------------------------------------------------------
// ៣. ទទួលសារពី HiveMQ រួច Save ចូល Database
// -------------------------------------------------------------
mqttClient.on('message', async (topic, message) => {
  try {
    const rawMsg = message.toString();
    console.log(`📩 Received Data from [${topic}]:`, rawMsg);

    if (topic === 'irrigation/sensors/data') {
      const data = JSON.parse(rawMsg);

      // បង្កើត Object រក្សាទុកក្នុង DB (ទ្រទ្រង់ទាំង Snake_case និង CamelCase)
      const newLog = new SensorLog({
        acCurrent:  data.acCurrent  !== undefined ? data.acCurrent  : data.ac_current,
        acVoltage:  data.acVoltage  !== undefined ? data.acVoltage  : data.ac_voltage,
        dcCurrent:  data.dcCurrent  !== undefined ? data.dcCurrent  : data.dc_current,
        dcVoltage:  data.dcVoltage  !== undefined ? data.dcVoltage  : data.dc_voltage,
        waterFlow:  data.waterFlow  !== undefined ? data.waterFlow  : data.water_flow,
        pumpStatus: data.pumpStatus || data.pump_status || "UNKNOWN",
        tankLevel:  data.tankLevel  || data.tank_level,
        motorLoad:  data.motorLoad  || data.motor_load
      });

      await newLog.save();
      console.log('💾 Sensor Log successfully saved to MongoDB Database!');
    }
  } catch (error) {
    console.error('❌ Error parsing or saving MQTT message:', error.message);
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
