function pumpON()
{
  client.publish(
    "esp32/pump",  // ◀️ កែពី "irrigation/control" មកជា "esp32/pump"
    "ON"
  );
}

function pumpOFF()
{
  client.publish(
    "esp32/pump",  // ◀️ កែពី "irrigation/control" មកជា "esp32/pump"
    "OFF"
  );
}

function autoMode()
{
  client.publish(
    "esp32/mode",  // ◀️ កែពី "irrigation/control" មកជា "esp32/mode"
    "AUTO"
  );
}

function manualMode() // ◀️ បន្ថែមមុខងារនេះ ប្រសិនបើប៊ូតុង MANUAL លើ Web មិនទាន់ដើរ
{
  client.publish(
    "esp32/mode",
    "MANUAL"
  );
}
