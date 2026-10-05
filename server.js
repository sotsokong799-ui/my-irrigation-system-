const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// ១. ភ្ជាប់ទៅកាន់ Supabase Database
// -------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://eososxmzucdheycreenpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable__YIpgqFdy6bpuVemfI3ntw_xfj_sthQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
    if (!err) {
      console.log('📡 Subscribed to topic: irrigation/sensors/data');
    } else {
      console.error('❌ Subscription Error:', err);
    }
  });

  mqttClient.subscribe('irrigation/pump/status', (err) => {
    if (!err) console.log('📡 Subscribed to topic: irrigation/pump/status');
  });
});

// -------------------------------------------------------------
// ៣. ទទួលសារពី HiveMQ រួច Insert ចូល Supabase Table (sensor_logs)
// -------------------------------------------------------------
mqttClient.on('message', async (topic, message) => {
  try {
    const rawMsg = message.toString();
    console.log(`📩 Received Data from [${topic}]:`, rawMsg);

    if (topic === 'irrigation/sensors/data') {
      const data = JSON.parse(rawMsg);

      // រៀបចំទិន្នន័យ Insert ចូល Supabase sensor_logs table
      const { data: insertedData, error } = await supabase
        .from('sensor_logs')
        .insert([
          {
            ac_current:  data.acCurrent  !== undefined ? data.acCurrent  : data.ac_current,
            ac_voltage:  data.acVoltage  !== undefined ? data.acVoltage  : data.ac_voltage,
            dc_current:  data.dcCurrent  !== undefined ? data.dcCurrent  : data.dc_current,
            dc_voltage:  data.dcVoltage  !== undefined ? data.dcVoltage  : data.dc_voltage,
            ac_power:    data.acPower    !== undefined ? data.acPower    : data.ac_power,
            dc_power:    data.dcPower    !== undefined ? data.dcPower    : data.dc_power,
            water_flow:  data.waterFlow  !== undefined ? data.waterFlow  : data.water_flow,
            pump_status: data.pumpStatus || data.pump_status || "UNKNOWN",
            tank_level:  data.tankLevel  || data.tank_level,
            motor_load:  data.motorLoad  || data.motor_load
          }
        ]);

      if (error) {
        console.error('❌ Supabase Insert Error:', error.message);
      } else {
        console.log('💾 Sensor Log successfully saved to Supabase Database!');
      }
    }
  } catch (error) {
    console.error('❌ Error parsing or saving MQTT message:', error.message);
  }
});

// -------------------------------------------------------------
// ៤. API សម្រាប់ Web Dashboard ទាញយក History ពី Supabase
// -------------------------------------------------------------
app.get('/api/history', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sensor_logs')
      .select('*')
      .order('id', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Node.js Server running on port ${PORT}`));
