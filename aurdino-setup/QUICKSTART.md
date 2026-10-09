# Arduino Connection - Quick Start Guide

## The Big Picture

Your Arduino will:
1. Read temperature, humidity, and soil moisture sensors every 2 seconds.
2. Print the readings over USB serial.
3. A Python bridge on your PC reads the serial output and sends it to the Flask backend.
4. The backend stores the data and computes crop health score and alerts.

```
Arduino sensors -> USB serial -> Python bridge on PC -> Flask backend -> MongoDB
```

## Step 1: Start the backend

From the project root:

```bash
docker compose up --build -d
docker compose ps
```

You should see `mongo` and `flask-backend` running.

## Step 2: Install bridge dependencies

```bash
cd aurdino-setup
pip install -r requirements.txt
```

## Step 3: Upload the Arduino sketch

Open [arduino_sensor/arduino_sensor.ino](arduino_sensor/arduino_sensor.ino).

It already uses:

```cpp
Serial.begin(9600);
```

So the bridge must also use `9600` baud.

Upload the sketch to your Arduino and open Serial Monitor at `9600` baud.

Expected output:

```text
[SENSOR] Temp: 28.0°C | Humidity: 65.0% | Soil: 45%
[RAW] Soil Value: 512
----------------------
```

## Step 4: Register user in frontend (NO TERMINAL NEEDED!)

1. Open browser: http://localhost:3000
2. Click "Register"
3. Fill form:
   - Name: "Farmer John"
   - Email: "john@farm.com"  
   - Password: "secure123"
4. Click Register → Dashboard loads!
   - ✅ You now have 5 devices (rice, wheat, maize, vegetables, pulses)
   - ✅ NO API keys to copy!
   - ✅ Dashboard ready!

## Step 5: Authenticate Serial Bridge (First Time Only)

```bash
cd aurdino-setup
python serial_bridge.py --setup
```

You'll be prompted to enter:
- Email (your dashboard login email)
- Password

This stores your credentials securely on your PC. You only need to do this ONCE!

## Step 6: Select Active Device in Dashboard

1. Open http://localhost:3000
2. Log in with your credentials
3. In dashboard, find your device (Rice, Wheat, etc.)
4. Click to select it (it turns GREEN - this marks it as active)

## Step 7: Run Serial Bridge

Now it's simple - just specify port and baudrate:

```bash
# Auto-detects port and uses active device from dashboard
python serial_bridge.py --port COM3
```

Or even simpler - let it auto-detect the port:

```bash
# Fully automatic!
python serial_bridge.py
```

The bridge will:
- ✅ Auto-fetch active device from your dashboard
- ✅ Connect to Arduino on specified port
- ✅ Stream sensor data to the backend
- ✅ Update dashboard in real-time
3. Health score and predictions display ✅
4. Switch device anytime → Same serial bridge, new data! ✨

Done! No config files, no API keys, no complexity! 🚀
python serial_bridge.py --port COM4 --baudrate 9600 --backend http://localhost:5000 --device-id device_001 --api-key YOUR_DEVICE_API_KEY
```

Replace `COM3` with your actual port.

## Step 6: Verify it works

Check the backend endpoints:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
Invoke-RestMethod -Uri "http://localhost:5000/api/sensors/latest/device_001" `
  -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN"}
```

If everything is working, the bridge terminal should show HTTP 201 responses and the backend should return readings.

## Troubleshooting

- If the bridge cannot see the board, check the COM port.
- If the bridge prints parse errors, make sure the Arduino sketch is unchanged and still prints lines starting with `[SENSOR]`.
- If the backend rejects the request, check that the device API key matches the registered device.
- If `localhost` does not work in the bridge, confirm the backend container is up and reachable on port 5000.

## Quick Command Reference

To start the serial bridge with your current setup (COM4 port + master API key):

```powershell
d:/cropthingy/.venv/Scripts/python.exe aurdino-setup/serial_bridge.py --port COM4 --backend http://localhost:5000 --device-id SERIAL_SCHEMA_001 --api-key replace_me_device_api_key
```

Run this in a separate PowerShell terminal whenever you want to stream sensor data.

## Notes

- No ESP32 is required.
- No Wi-Fi is required on the Arduino.
- The PC does the network part.
