function pumpON()
{
client.publish(
"irrigation/control",
"ON"
);
}

function pumpOFF()
{
client.publish(
"irrigation/control",
"OFF"
);
}

function autoMode()
{
client.publish(
"irrigation/control",
"AUTO"
);
}

function manualMode()
{
client.publish(
"irrigation/control",
"MANUAL"
);
}