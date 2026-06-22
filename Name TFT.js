client.on('connect',()=>{

console.log("MQTT Connected");

client.subscribe("irrigation/soil");
client.subscribe("irrigation/temp");
client.subscribe("irrigation/humidity");
client.subscribe("irrigation/tank");
client.subscribe("irrigation/flow");
client.subscribe("irrigation/temp");
client.subscribe("irrigation/humidity");

});