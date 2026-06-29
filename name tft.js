client.on('connect',()=>{

console.log("MQTT Connected");

client.subscribe("irrigation/Volt DC");
client.subscribe("irrigation/Volt AC");
client.subscribe("irrigation/tank");
client.subscribe("irrigation/flow");

});
