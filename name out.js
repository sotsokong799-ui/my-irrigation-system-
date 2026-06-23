client.on('message',

(topic,message)=>{

let value=message.toString();

if(topic=="irrigation/soil")
{
document.getElementById("soil")
.innerHTML=value+"%";

addPoint(value);
}

if(topic=="irrigation/temp")
{
document.getElementById("temp")
.innerHTML=value+"°C";
}

if(topic=="irrigation/humidity")
{
document.getElementById("hum")
.innerHTML=value+"%";
}

if(topic=="irrigation/tank")
{
document.getElementById("tank")
.innerHTML=value;
}

if(topic=="irrigation/flow")
{
document.getElementById("flow")
.innerHTML=value+" L/min";
}

});
