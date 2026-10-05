const express = require('express');
const mqtt = require('mqtt');
const cors = require('cors');
const fetch = require('node-fetch'); // បន្ថែម node-fetch ត្រង់នេះ
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// ១. ភ្ជាប់ទៅកាន់ Supabase (ទាញយក Key ពី Render Environment)
// -------------------------------------------------------------
const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_KEY = (process.env.SUPABASE_KEY || '').trim();

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

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
// ៣. ទទួលសារពី HiveMQ រួច Insert ចូល Supabase (sensor_logs)
// -------------------------------------------------------------
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
        motor_load:  data.motor_load  ?? data.motorLoad  ?? "NORMAL"
      };

      const { error } = await supabase.from('sensor_logs').insert([record]);

      if (error) {
        console.error('❌ Supabase Insert Error:', error.message || JSON.stringify(error));
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Node.js Server running on port ${PORT}`));
