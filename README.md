# Crop Analyzer

A beginner-friendly IoT + ML project that collects crop sensor readings, moves them through MQTT and Redis, then shows them on a live dashboard and exposes a prediction API.

This repo currently runs in **demo mode** with a fake sensor publisher so you can test the full pipeline without hardware. Later, you can replace the fake sensor with a real ESP32 and real sensors.

## What This Project Does

The system is a simple data pipeline:

1. A sensor sends readings like temperature, humidity, and soil moisture.
2. MQTT carries those readings to the backend.
3. The ingestion service receives the message and pushes it into Redis.
4. The preprocessing service reads from Redis and creates useful features.
5. The inference service returns a crop health score and advice.
6. The dashboard shows the live data in charts.

In short:

ESP32 or fake sensor -> MQTT broker -> ingestion -> Redis -> preprocessing -> Redis -> inference/dashboard

## Project Structure

### Top-level files

- [docker-compose.yml](docker-compose.yml): starts all services together.
- [.env](.env): local environment values used by the containers.
- [.env.example](.env.example): template file for environment variables.

### ESP32 firmware

- [esp32/main.ino](esp32/main.ino): Arduino firmware for the ESP32.

This firmware:
- connects the ESP32 to Wi-Fi,
- connects to the MQTT broker,
- reads DHT22 temperature and humidity,
- reads soil moisture from an analog pin,
- publishes JSON messages to the MQTT topic `crop/sensors`.

### Services

#### 1. Ingestion
Folder: [services/ingestion](services/ingestion)

Files:
- [services/ingestion/main.py](services/ingestion/main.py)
- [services/ingestion/s3_uploader.py](services/ingestion/s3_uploader.py)
- [services/ingestion/requirements.txt](services/ingestion/requirements.txt)
- [services/ingestion/Dockerfile](services/ingestion/Dockerfile)

What it does:
- subscribes to MQTT topic `crop/sensors`,
- receives sensor payloads,
- adds a server timestamp,
- pushes the raw reading into Redis queue `preprocess_queue`,
- optionally tries to save raw data to S3-style storage.

#### 2. Preprocessing
Folder: [services/preprocessing](services/preprocessing)

Files:
- [services/preprocessing/preprocess.py](services/preprocessing/preprocess.py)
- [services/preprocessing/requirements.txt](services/preprocessing/requirements.txt)
- [services/preprocessing/Dockerfile](services/preprocessing/Dockerfile)

What it does:
- reads items from Redis queue `preprocess_queue`,
- normalizes sensor values,
- computes a crop health score,
- adds alert flags,
- writes processed data into Redis list `dashboard_feed`,
- also pushes data into `inference_queue`.

#### 3. Training
Folder: [services/training](services/training)

Files:
- [services/training/train.py](services/training/train.py)
- [services/training/requirements.txt](services/training/requirements.txt)
- [services/training/Dockerfile](services/training/Dockerfile)

What it does:
- loads processed sensor records,
- fits a lightweight model,
- saves the model for later inference.

This service is meant to be run manually when you have enough data.

#### 4. Inference
Folder: [services/inference](services/inference)

Files:
- [services/inference/main.py](services/inference/main.py)
- [services/inference/requirements.txt](services/inference/requirements.txt)
- [services/inference/Dockerfile](services/inference/Dockerfile)

What it does:
- exposes a FastAPI endpoint at `/predict`,
- returns a health score and advice,
- uses the saved model if available,
- falls back to a heuristic score if no model is loaded.

#### 5. Dashboard
Folder: [services/dashboard](services/dashboard)

Files:
- [services/dashboard/app.py](services/dashboard/app.py)
- [services/dashboard/requirements.txt](services/dashboard/requirements.txt)
- [services/dashboard/Dockerfile](services/dashboard/Dockerfile)

What it does:
- reads live data from Redis list `dashboard_feed`,
- shows graphs for temperature, humidity, soil moisture, and health score,
- calls the inference API when you request a prediction.

#### 6. Fake sensor
Folder: [services/fake_sensor](services/fake_sensor)

Files:
- [services/fake_sensor/publisher.py](services/fake_sensor/publisher.py)
- [services/fake_sensor/requirements.txt](services/fake_sensor/requirements.txt)
- [services/fake_sensor/Dockerfile](services/fake_sensor/Dockerfile)

What it does:
- publishes fake sensor readings to MQTT,
- is only for demo/testing,
- can be replaced later by the real ESP32.

#### 7. Mosquitto config
Folder: [mosquitto](mosquitto)

File:
- [mosquitto/mosquitto.conf](mosquitto/mosquitto.conf)

What it does:
- runs the MQTT broker,
- accepts sensor messages on port `1883`.

## How The Data Flows

Here is the full path of one reading:

1. The fake sensor or ESP32 creates a JSON reading.
2. The reading is published to MQTT topic `crop/sensors`.
3. Ingestion receives the MQTT message.
4. Ingestion adds a server timestamp and pushes the payload into Redis queue `preprocess_queue`.
5. Preprocessing reads the payload from Redis.
6. Preprocessing computes normalized values, health score, and alerts.
7. The processed reading is stored in Redis list `dashboard_feed`.
8. The dashboard reads `dashboard_feed` and draws live charts.
9. The inference API can use the same data to return advice.

## What You Need Installed

To run the Docker stack:

- Docker Desktop
- Docker Compose

To use the real ESP32:

- Arduino IDE or PlatformIO
- ESP32 board support installed
- DHT22 sensor
- soil moisture sensor
- USB cable for flashing the ESP32

## How To Run The Project

### 1. Start the containers

From the project root:

```bash
docker compose up --build -d
```

This starts:
- mosquitto
- redis
- ingestion
- preprocessing
- inference
- dashboard
- fake-sensor

### 2. Check that the containers are running

```bash
docker compose ps
```

You should see all services in `Up` state.

### 3. Open the dashboard

Open:

```text
http://localhost:8050
```

### 4. Check the APIs

Ingestion health:

```bash
curl http://localhost:8000/health
```

Inference health:

```bash
curl http://localhost:8001/health
```

## How To Test It Manually

### Test 1: MQTT publishing

Look at the fake sensor logs:

```bash
docker compose logs -f fake-sensor
```

Expected:
- you should see new fake readings being published every few seconds.

### Test 2: MQTT ingestion

Look at ingestion logs:

```bash
docker compose logs -f ingestion
```

Expected:
- messages showing the payload was received,
- data being queued into Redis.

### Test 3: Redis queue flow

Check queue sizes:

```bash
docker compose exec redis redis-cli LLEN preprocess_queue
docker compose exec redis redis-cli LLEN inference_queue
docker compose exec redis redis-cli LLEN dashboard_feed
```

How to read this:
- `preprocess_queue` is where raw messages wait.
- `inference_queue` holds processed data for prediction logic.
- `dashboard_feed` is the live list used by the dashboard.

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
