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

## Step 4: Register a user and device

Run this in PowerShell to get a JWT token and device API key:

```powershell
$token = (Invoke-RestMethod -Uri "http://localhost:5000/api/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"name":"Farmer John","email":"farmer@example.com","password":"secure123"}').data.token

$device = Invoke-RestMethod -Uri "http://localhost:5000/api/devices/register" `
  -Method Post `
  -Headers @{"Authorization"="Bearer $token"} `
  -ContentType "application/json" `
  -Body '{"device_id":"device_001","name":"Main Field Sensor","crop_type":"wheat","location":"North Field"}'

$device.data.api_key
```

Copy the returned API key.

## Step 5: Run the serial bridge

Find your Arduino COM port in Device Manager, then run:

```bash
python serial_bridge.py --port COM3 --baudrate 9600 --backend http://localhost:5000 --device-id device_001 --api-key YOUR_DEVICE_API_KEY
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

## Notes

- No ESP32 is required.
- No Wi-Fi is required on the Arduino.
- The PC does the network part.
