# Crop Analyzer

A beginner-friendly crop monitoring project that reads soil moisture, humidity, and temperature from a basic Arduino over USB serial, sends the data through a Python bridge, stores it in MongoDB, and exposes a crop health API.

This repository has two parts:

1. The backend Flask app in [backend/](backend) that receives sensor readings and computes health scores.
2. The Arduino setup in [aurdino-setup/](aurdino-setup) that prints sensor values over serial, then a Python bridge posts them to the backend.

## What This Project Does

The system is a simple data pipeline:

1. Arduino reads temperature, humidity, and soil moisture.
2. Arduino prints the readings over USB serial.
3. A Python serial bridge on your computer reads the serial output.
4. The bridge sends the readings to the Flask backend.
5. The backend stores the readings in MongoDB and computes a crop health score.
6. You query the API or dashboard for the latest status and alerts.

In short:

Arduino sensors -> USB serial -> Python bridge -> Flask API -> MongoDB -> predictions/analytics

## Project Structure

### Top-level files

- [docker-compose.yml](docker-compose.yml): starts all services together.
- [.env](.env): local environment values used by the containers.
- [.env.example](.env.example): template file for environment variables.

### Arduino firmware

- [aurdino-setup/arduino_sensor/arduino_sensor.ino](aurdino-setup/arduino_sensor/arduino_sensor.ino): Arduino sketch for DHT11 + soil moisture.

This sketch:
- reads DHT11 temperature and humidity,
- reads soil moisture from an analog pin,
- prints the readings over USB serial every 2 seconds,
- does not require Wi-Fi on the Arduino itself.

### Serial bridge

- [aurdino-setup/serial_bridge.py](aurdino-setup/serial_bridge.py): Python script that reads the Arduino serial output and posts it to the backend API.

### Services

#### Backend API
Folder: [backend/](backend)

What it does:
- exposes auth endpoints for user login/register,
- exposes device registration and device management endpoints,
- exposes sensor ingestion endpoints,
- stores readings in MongoDB,
- computes health scores and alerts.

## How The Data Flows

Here is the full path of one reading:

1. The Arduino reads DHT11 humidity and temperature plus soil moisture.
2. The Arduino prints a sensor line over USB serial.
3. The Python bridge reads the serial line from your computer.
4. The bridge sends a JSON POST to `/api/sensors/ingest` (no auth needed!).
5. The backend checks: which device is **active** in this user's dashboard session?
6. The backend tags the reading with the active device and saves to MongoDB.
7. The backend calculates health score and alerts.
8. You see live data on the dashboard for the selected device.

## What You Need Installed

To run the backend and bridge:

- Docker Desktop
- Docker Compose
- Python 3.10+ on your PC
- Arduino IDE

To use the Arduino:

- Arduino board connected by USB
- DHT11 sensor
- soil moisture sensor
- jumper wires

## How To Run The Project

### 1. Start the backend

From the project root:

```bash
docker compose up --build -d
```

This starts:
- `mongo`
- `flask-backend`

### 2. Verify the backend

```bash
docker compose ps
curl http://localhost:5000/api/health
```

If you are on PowerShell, use:

```powershell
Invoke-RestMethod http://localhost:5000/api/health
```

### 3. Prepare the Arduino bridge

```bash
cd aurdino-setup
pip install -r requirements.txt
```

### 4. Upload the Arduino sketch

Open [aurdino-setup/arduino_sensor/arduino_sensor.ino](aurdino-setup/arduino_sensor/arduino_sensor.ino) and make sure:

- `Serial.begin(9600)` matches the bridge baud rate
- the sketch prints `[SENSOR] ...` lines over USB serial

### 5. Run the serial bridge on your PC

```bash
python serial_bridge.py --port COM3 --baudrate 9600 --backend http://localhost:5000 --device-id device_001 --api-key YOUR_DEVICE_API_KEY
```

Replace `COM3` with your Arduino port.

### 6. Confirm data is arriving

Use these endpoints after the bridge is running:

```bash
curl http://localhost:5000/api/health
curl http://localhost:5000/api/sensors/latest/device_001
curl http://localhost:5000/api/sensors/history/device_001?limit=10
```

On PowerShell:

```powershell
Invoke-RestMethod http://localhost:5000/api/sensors/latest/device_001 -Headers @{Authorization="Bearer YOUR_JWT_TOKEN"}
```

## How To Test It Manually

### Test 1: Serial output from Arduino

Open the Arduino Serial Monitor at 9600 baud.

Expected output:

```text
[SENSOR] Temp: 28.00°C | Humidity: 65.00% | Soil: 45%
[RAW] Soil Value: 512
----------------------
```

### Test 2: Bridge posts to backend

Run the bridge and watch for:

```text
[BACKEND] POST to http://localhost:5000/api/sensors/ingest → HTTP 201
[SUCCESS] Data sent to backend!
```

### Test 3: API data flow

Check that latest reading and history endpoints return data.

### Test 4: Inference API

Send a sample request:

```bash
curl -X POST http://localhost:8001/predict -H "Content-Type: application/json" -d "{\"crop_type\":\"wheat\",\"temperature\":28,\"humidity\":60,\"soil_moisture\":45}"
```

Expected:
- a JSON response with `health_score`, `advice`, and `model_used`.

### Test 5: Dashboard

Open the dashboard in your browser:

```text
http://localhost:8050
```

Expected:
- live charts for temperature, humidity, soil moisture, and health score.

## How To Use A Real ESP32 Later

When you are ready to replace the fake sensor:

1. Open [esp32/main.ino](esp32/main.ino).
2. Replace `YOUR_WIFI_SSID` and `YOUR_WIFI_PASSWORD`.
3. Set `MQTT_BROKER` to your computer's LAN IP address.
4. Flash the sketch to the ESP32.
5. Wire the DHT22 and soil sensor to the pins used in the code.
6. Stop or ignore the fake sensor container.
7. Keep mosquitto, redis, ingestion, preprocessing, inference, and dashboard running.

Important:
- The ESP32 must be able to reach your PC on port `1883`.
- The broker address should be your PC's LAN IP, not `localhost`.
- Your PC and ESP32 must be on the same network.

## How S3 Fits In Later

Right now the project is set up so you can focus on the data pipeline first.

Later, S3 can be added for storing:
- raw sensor data,
- processed sensor data,
- trained model files.

Two common options:

1. MinIO for local testing
- acts like S3 on your machine,
- good for development.

2. AWS S3 for production
- used when you deploy for real.

## Beginner Summary

If you want the shortest possible explanation:

- ESP32 or fake sensor creates readings.
- MQTT delivers them.
- Ingestion catches them.
- Redis stores them temporarily.
- Preprocessing cleans and enriches them.
- Inference makes a prediction.
- Dashboard shows everything visually.

## Quick Troubleshooting

- If Docker does not start, check Docker Desktop.
- If the dashboard is empty, check the fake sensor and ingestion logs.
- If Redis queues stay at zero, preprocessing may not be running.
- If inference shows heuristic mode, that is okay until a trained model is available.
- If the ESP32 cannot connect, verify Wi-Fi, IP address, and MQTT port `1883`.

## Notes

This repo currently includes a fake sensor for demo purposes, so new users can see the full flow before wiring real hardware.
