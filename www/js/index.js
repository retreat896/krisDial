document.addEventListener('deviceready', onDeviceReady, false);

let targetDeviceName = "ESPKnob";
let targetDeviceId = null;
let connected = false;

function onDeviceReady() {
    logToScreen('Running cordova-' + cordova.platformId + '@' + cordova.version);

    if (typeof ble === "undefined") {
        console.error("BLE plugin is not loaded. Check your plugin installation.");
        return;
    }

    ble.isEnabled(
        () => logToScreen('BLE is enabled'),
        () => logToScreen('BLE is NOT enabled')
    );
}

let scanTimeout = null;

function scanAndConnect() {
    if (scanTimeout !== null) {
        clearTimeout(scanTimeout);
    }

    logToScreen("Starting BLE scan...");

    ble.scan([], 10, function (device) {
        logToScreen("Device found: " + JSON.stringify(device, null, 2));
        if (device.name === targetDeviceName) {
            targetDeviceId = device.id;
            logToScreen("Found target device: " + targetDeviceId);

            logToScreen("Connecting to " + targetDeviceId);

            ble.stopScan();
            ble.connect(targetDeviceId, function(peripheral) {
                logToScreen("Connected to device: " + JSON.stringify(peripheral, null, 2));
                connected = true;
                window.connectedDevice = device;
                console.log(device);

                // Auto-reconnect if disconnected
                ble.startStateNotifications(targetDeviceId, function(state) {
                    if (state === "disconnected") {
                        logToScreen("Device disconnected. Reconnecting...");
                        window.connectedDevice = null;
                        connected = false;
                        setTimeout(scanAndConnect, 5000);
                    }
                });

            }, function(error) {
                logToScreen("Connection failed: " + JSON.stringify(error));
                connected = false;
                setTimeout(scanAndConnect, 5000);
            });
            scanTimeout = null;
        }
    }, function (error) {
        logToScreen("Scan failed: " + JSON.stringify(error));
    });

    scanTimeout = setTimeout(function () {
        logToScreen("Scan timeout reached.");
    }, 10000);  // Timeout after 10 seconds
}

function sendDataToESP32(data) {
    let dataBuffer = new TextEncoder().encode(data); // Convert text to bytes
    
    ble.write(connectedDevice.id, connectedDevice.services[0].characteristics[0].id, connectedDevice.characteristics[0].id,
        dataBuffer.buffer,
        () => logToScreen("Data sent successfully: " + data),
        (error) => logToScreen("Failed to send data: " + JSON.stringify(error))
    );
}

$("#scan").click(scanAndConnect);
$("#level").on("input", function() {
    let level = $(this).val();
    console.log("Level: " + level);
    sendDataToESP32(level);
});

const MAX_CONSOLE_LINES = 10;

function logToScreen(message) {
    let consoleDiv = $("#consoleOutput");
    if (consoleDiv.children().length > MAX_CONSOLE_LINES) {
        consoleDiv.children().first().remove();
    }
    consoleDiv.append(`<p>${message}</p>`);
    consoleDiv.scrollTop(consoleDiv.prop("scrollHeight")); // Auto-scroll
}
