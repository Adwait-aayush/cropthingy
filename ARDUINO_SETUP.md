# Arduino Sensor to Backend Integration Guide

## Complete Flow Architecture

```
Arduino (DHT11 + Soil Sensor)
    ↓
USB serial
    ↓
Python serial bridge on your PC
    ↓
HTTP POST to Flask backend
    ↓
MongoDB
    ↓
Health score + alerts + analytics
```

## 1. Hardware Required

- Arduino board with USB connection
- DHT11 temperature and humidity sensor
- Soil moisture sensor
- Jumper wires
- USB cable

## 2. Wiring

Use the pins in [aurdino-setup/arduino_sensor/arduino_sensor.ino](aurdino-setup/arduino_sensor/arduino_sensor.ino):

```text
DHT11 data pin  -> D2
DHT11 VCC       -> 5V or 3.3V depending on your module
DHT11 GND       -> GND
Soil sensor AO  -> A0
Soil sensor VCC -> 5V or 3.3V depending on your module
Soil sensor GND -> GND
```

## 3. Arduino Sketch

The sketch does not use Wi-Fi or HTTP. It only reads the sensors and prints data over serial.

Open [aurdino-setup/arduino_sensor/arduino_sensor.ino](aurdino-setup/arduino_sensor/arduino_sensor.ino) and upload it as-is.

Expected serial output:

```text
[SENSOR] Temp: 28.0°C | Humidity: 65.0% | Soil: 45%
[RAW] Soil Value: 512
----------------------
```

## 4. Start the Backend

From the project root:

```bash
docker compose up --build -d
```

Then confirm it is running:

```bash
docker compose ps
curl http://localhost:5000/api/health
```

## 5. Install Bridge Dependencies

```bash
cd aurdino-setup
pip install -r requirements.txt
```

## 6. Register a User and Device

The device must exist in the backend before the bridge can post readings.

Example PowerShell flow:

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

Copy the returned API key for the next step.

## 7. Run the Serial Bridge

The bridge reads the Arduino serial output and sends it to the backend.

```bash
python serial_bridge.py --port COM3 --baudrate 9600 --backend http://localhost:5000 --device-id device_001 --api-key YOUR_DEVICE_API_KEY
```

Replace `COM3` with your Arduino port.

## 8. Verify It Works

### Latest reading

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/sensors/latest/device_001" `
  -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN"}
```

### Reading history

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/sensors/history/device_001?limit=10" `
  -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN"}
```

### Alerts

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/sensors/alerts/device_001" `
  -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN"}
```

### Prediction

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/predictions/device_001" `
  -Headers @{"Authorization"="Bearer YOUR_JWT_TOKEN"}
```

## 9. Troubleshooting

- If the bridge cannot find the Arduino, check the COM port in Device Manager.
- If the bridge prints no sensor data, open the Serial Monitor and confirm the sketch is outputting `[SENSOR]` lines.
- If the backend rejects the request, confirm the API key matches the one returned during device registration.
- If the backend is not reachable, verify `docker compose up --build -d` succeeded and `http://localhost:5000/api/health` works.

### High Latency or Connection Drops
- Increase `SEND_INTERVAL` in Arduino code
- Move Arduino closer to WiFi router
- Reduce HTTP timeout on Arduino

## 7. Production Checklist

- [ ] Register user and device via API
- [ ] Update Arduino credentials (WiFi, Backend URL, API Key)
- [ ] Flash Arduino firmware
- [ ] Power on Arduino and verify serial monitor shows connection
- [ ] Wait 5-10 minutes and verify data appears in backend
- [ ] Check predictions and alerts on dashboard
- [ ] Set up automated backups
- [ ] Monitor device connectivity

## 8. Monitor Device Health

```powershell
# List all your devices
$token = "YOUR_JWT_TOKEN"
Invoke-RestMethod -Uri "http://localhost:5000/api/devices" `
  -Headers @{"Authorization"="Bearer $token"}

# Get device details
Invoke-RestMethod -Uri "http://localhost:5000/api/devices/device_001" `
  -Headers @{"Authorization"="Bearer $token"}

# Rotate API key (for security)
Invoke-RestMethod -Uri "http://localhost:5000/api/devices/device_001/rotate-key" `
  -Method Post `
  -Headers @{"Authorization"="Bearer $token"}
```

