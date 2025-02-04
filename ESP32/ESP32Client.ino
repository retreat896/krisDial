#include "BLEDevice.h"

#define bleServerName "ESPDial"

static BLEUUID bmeServiceUUID("6d4e688b-b1b8-492a-8a82-d77669a5fd66");
static BLEUUID bmeCharacteristicUUID("7b8c02df-4145-48dc-a71e-ed1fd1e7c977");
// "cfbcb909-3b42-4827-bde7-82c44e2a8aa3"

static boolean doConnect = false;
static boolean connected = false;

static BLEAddress *pServerAddress;

static BLERemoteCharacteristic* levelCharachteristic;

const uint8_t notificationOn[] = {0x1, 0x0};
const uint8_t notificationOff[] = {0x0, 0x0};

char* level = "0";

bool connectToServer(BLEAddress pAddress) {
    BLEClient* pClient = BLEDevice::createClient();

  // Connect to the remove BLE Server.
    pClient->connect(pAddress);
    Serial.println(" - Connected to server");

  // Obtain a reference to the service we are after in the remote BLE server.
    BLERemoteService* pRemoteService = pClient->getService(bmeServiceUUID);
    if (pRemoteService == nullptr) {
        Serial.print("Failed to find our service UUID: ");
        Serial.println(bmeServiceUUID.toString().c_str());
        pClient->disconnect();
        return (false);
    }

    levelCharachteristic = pRemoteService->getCharacteristic(bmeCharacteristicUUID);

    if (levelCharachteristic == nullptr) {
        Serial.print("Failed to find our characteristic UUID: ");
        return (false);
    }

    Serial.println(" - Found our characteristic");

