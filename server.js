const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// ១. ភ្ជាប់ទៅកាន់ MongoDB Atlas
// -------------------------------------------------------------
const MONGODB_URI = "mongodb+srv://sotsokong799_db_user:KYY6BzyV888qDCgE@cluster0.hkyiehs.mongodb.net/irrigation_db?appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// កំណត់ Schema និង Model សម្រាប់ Sensor Data
const sensorSchema = new mongoose.Schema({
  ac_current: { type: Number, default: 0 },
  ac_voltage: { type: Number, default: 0 },
  dc_current: { type: Number, default: 0 },
  dc_voltage: { type: Number, default: 0 },
  ac_power: { type: Number, default: 0 },
  dc_power: { type: Number, default: 0 },
  water_flow: { type: Number, default: 0 },
  pump_status: { type: String, default: "OFF" },
  tank_level: { type: String, default: "UNKNOWN" },
  motor_load: { type: String, default: "NORMAL" },
  timestamp: { type: Number, default: Date.now }
});

const SensorLog = mongoose.model('SensorLog', sensorSchema);

// -------------------------------------------------------------
// ២. ភ្ជាប់ទៅកាន់ HiveMQ Cloud Broker
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
  
  mqttClient.subscribe('irrigation/sensors/data', (err) => {
    if (!err) console.log('📡 Subscribed to topic: irrigation/sensors/data');
    else console.error('❌ Subscription Error:', err);
  });
});

// -------------------------------------------------------------
// ៣. ទទួលសារពី MQTT រួច Save ចូល MongoDB
// -------------------------------------------------------------
mqttClient.on('message', async (topic, message) => {
  try {
    const rawMsg = message.toString();
    console.log(`📩 Received Data from [${topic}]:`, rawMsg);

    if (topic === 'irrigation/sensors/data') {
      const data = JSON.parse(rawMsg);

      const record = new SensorLog({
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
      });

      await record.save();
      console.log('💾 Sensor Log successfully saved to MongoDB!');
    }
  } catch (error) {
    console.error('❌ Error parsing or saving MQTT message:', error.message);
  }
});

// -------------------------------------------------------------
// ៤. API សម្រាប់ Web Dashboard ទាញយក History ពី MongoDB
// -------------------------------------------------------------
app.get('/api/history', async (req, res) => {
  try {
    const logs = `await SensorLog.find().sort({ timestamp: -1 }).limit(50);` // trimmed for display
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Node.js Server running on port ${PORT}`));
