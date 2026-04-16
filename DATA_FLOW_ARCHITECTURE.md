# CropSense - Complete Data Flow Architecture

## 1. SENSOR DATA FLOW (Arduino → Backend → Atlas DB)

### Step 1A: Arduino Serial Output
```
Arduino sends every 2 seconds:
[SENSOR] Temp: 28.50°C | Humidity: 65.30% | Soil: 45%
```

**Location:** [aurdino-setup/serial_bridge.py](aurdino-setup/serial_bridge.py)

### Step 1B: Serial Bridge Parsing (PC-side)
```python
# Line 53-67: parse_sensor_line()
Raw String "[SENSOR] Temp: 28.50°C | Humidity: 65.30% | Soil: 45%"
    ↓
Parse using Regex
    ↓
{
  "temperature": 28.50,
  "humidity": 65.30,
  "soil_moisture": 45.0
}
```

### Step 1C: Send to Backend (NO API KEY NEEDED!)
```python
# Line 71-98: send_to_backend()
POST http://localhost:5000/api/sensors/ingest

Headers:
  Content-Type: application/json
  (NO X-API-KEY needed!)

Payload:
{
  "device_id": "user_456_RICE",
  "temperature": 28.50,
  "humidity": 65.30,
  "soil_moisture": 45.0,
  "raw_soil_score": 520,
  "timestamp": "2024-01-15T10:21:20.123456Z"
}
```

**Key difference from old system:** No API key validation! Backend checks active device session instead.

---

## 2. BACKEND PROCESSING (Flask)

### Step 2A: Sensor Controller
**File:** `backend/app/controllers/sensor_controller.py` (Line 32-37)

```
POST /api/sensors/ingest
  ↓
validate_sensor_payload()  [Checks required fields]
  ↓
ingest_sensor_reading(payload)
```

### Step 2B: Sensor Service - Data Enrichment
**File:** `backend/app/services/sensor_service.py` (Line 6-42)

```python
ingest_sensor_reading(payload):
  1. Look up device from DEVICES collection
  2. Create reading document:
     {
       "device_id": "SERIAL_SCHEMA_001",
       "timestamp": "2026-04-15T10:21:20.123456Z",
       "temperature": 28.50,
       "humidity": 65.30,
       "soil_moisture": 45.0,
       "crop_type": "unknown",           [From device doc]
       "location": "unknown",             [From device doc]
       "metadata": {}
     }
  
  3. Call normalize_and_enrich(reading)
  
  4. Insert into SENSOR_READINGS collection
  
  5. Upload to S3 (raw-sensor bucket)
  
  6. Return response with health_score + alerts
```

---

## 3. DATA ENRICHMENT (Preprocessing)

### Step 3A: Normalize & Enrich Function
**File:** `backend/app/services/preprocessing_service.py` (Line 6-42)

**Input:** Raw sensor reading
```json
{
  "temperature": 28.50,
  "humidity": 65.30,
  "soil_moisture": 45.0
}
```

**Processing:**
```python
# Calculate deltas from ideal values
temp_score = 100 - abs(28.0 - 28.50) * 5.0 = 99.75
humidity_score = 100 - abs(60.0 - 65.30) * 1.2 = 93.64
soil_score = 100 - abs(55.0 - 45.0) * 1.7 = 83.0

health_score = (99.75 + 93.64 + 83.0) / 3 = 92.13

# Check for alerts
alerts = []
if temp > 35: alerts.append("temperature_high")
if temp < 10: alerts.append("temperature_low")
if humidity < 30: alerts.append("humidity_low")
if soil < 25: alerts.append("soil_moisture_low")
if soil > 70: alerts.append("soil_moisture_high")
```

**Output in SENSOR_READINGS:**
```json
{
  "_id": ObjectId("..."),
  "device_id": "SERIAL_SCHEMA_001",
  "timestamp": "2026-04-15T10:21:20.123456Z",
  "temperature": 28.50,
  "humidity": 65.30,
  "soil_moisture": 45.0,
  "crop_type": "unknown",
  "location": "unknown",
  "health_score": 92.13,
  "alerts": [],
  "features": {
    "temp_delta": 0.5,
    "humidity_delta": 5.3,
    "soil_delta": -10.0
  }
}
```

---

## 4. PREDICTION FLOW (Health Score + Irrigation Needed)

### Step 4A: When Frontend Requests Prediction
**Frontend Call:** `/api/predictions/recompute/{device_id}` (POST)
**Location:** `backend/app/controllers/prediction_controller.py`

### Step 4B: Two Parallel Predictions
**File:** `backend/app/services/prediction_service.py`

#### Prediction 1: Rule-Based Health Score (Lines 9-32)
```python
model_predict(temp, humidity, soil, crop_type):
  score = 50.0  # Base score
  
  # Temperature adjustment (ideal 20-30°C)
  if 20 <= temp <= 30:
    score += 20
  elif 15 <= temp <= 35:
    score += 10
  
  # Humidity adjustment (ideal 40-70%)
  if 40 <= humidity <= 70:
    score += 20
  elif 30 <= humidity <= 80:
    score += 10
  
  # Soil moisture adjustment (ideal 40-60%)
  if 40 <= soil <= 60:
    score += 30
  elif 30 <= soil <= 70:
    score += 15
  
  return min(100.0, score), "mock-health-calculator"
  
Result: (92.13, "mock-health-calculator")
```

#### Prediction 2: Trained Keras Model - Irrigation Needed (Lines 37-75)
```python
model_predict_irrigation(temp, humidity, soil, crop_type):
  # Load trained Keras model + scaler
  model = load_model("trained_models/irrigation_model.keras")
  scaler = load("trained_models/scaler.pkl")
  
  # Map crop to numeric: {"rice":0, "wheat":1, "maize":2, "vegetables":3, "pulses":4}
  crop_numeric = 1  # wheat
  
  # Normalize soil (0-1023 → 0-1)
  soil_normalized = 1 - (45.0 / 1023.0) = 0.956
  
  # Create input array
  input = [[28.50, 65.30, 0.956, 1]]
  
  # Scale using fitted scaler
  input_scaled = scaler.transform(input)
  
  # Get prediction
  pred = model.predict(input_scaled)  # Output: 0.0-1.0
  
  irrigation_needed = int(pred[0][0] > 0.5)
  # If pred > 0.5 → 1 (Irrigation NEEDED)
  # If pred ≤ 0.5 → 0 (Irrigation SUFFICIENT)
  
  return irrigation_needed, "trained-logistic-model"
  
Result: (1, "trained-logistic-model")  # If prediction says irrigation needed
```

### Step 4C: Store Prediction in Database
**Collection:** `predictions`

```json
{
  "_id": ObjectId("..."),
  "device_id": "SERIAL_SCHEMA_001",
  "source_reading_id": ObjectId("..."),
  "health_score": 92.13,
  "recommendation": "Crop conditions are good. Keep current irrigation and monitor daily.",
  "model_used": "mock-health-calculator",
  "irrigation_needed": 1,
  "irrigation_model": "trained-logistic-model",
  "created_at": "2026-04-15T10:21:25.789012Z",
  "is_partial": false
}
```

### Step 4D: Return to Frontend
```json
{
  "success": true,
  "data": {
    "id": "...",
    "device_id": "SERIAL_SCHEMA_001",
    "health_score": 92.13,
    "recommendation": "Crop conditions are good...",
    "model_used": "mock-health-calculator",
    "irrigation_needed": 1,
    "irrigation_model": "trained-logistic-model",
    "created_at": "2026-04-15T10:21:25.789012Z"
  }
}
```

---

## 5. ATLAS DB COLLECTIONS SCHEMA

### `sensor_readings` Collection
```javascript
{
  _id: ObjectId,
  device_id: "SERIAL_SCHEMA_001",
  timestamp: "2026-04-15T...",
  temperature: 28.50,      // Float
  humidity: 65.30,         // Float
  soil_moisture: 45.0,     // Float (0-100%)
  crop_type: "unknown",
  location: "unknown",
  metadata: {},
  health_score: 92.13,
  alerts: [],
  features: {
    temp_delta: 0.5,
    humidity_delta: 5.3,
    soil_delta: -10.0
  }
}
```

### `predictions` Collection
```javascript
{
  _id: ObjectId,
  device_id: "SERIAL_SCHEMA_001",
  source_reading_id: ObjectId,
  health_score: 92.13,
  recommendation: "...",
  model_used: "mock-health-calculator",
  irrigation_needed: 1,           // 0 or 1
  irrigation_model: "trained-logistic-model",
  created_at: "2026-04-15T...",
  is_partial: false
}
```

---

## 6. COMPLETE DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│ ARDUINO (COM4)                                                  │
│ DHT11 (Temp/Humidity) + Soil Moisture Sensor                    │
│ ↓ Every 2 seconds                                              │
│ [SENSOR] Temp: 28.50°C | Humidity: 65.30% | Soil: 45%        │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│ SERIAL BRIDGE (PC-side, Python)                                 │
│ - Parse serial output                                            │
│ - Create JSON payload                                            │
│ - Send with X-API-KEY header                                    │
└──────────────────┬──────────────────────────────────────────────┘
                   │
        POST /api/sensors/ingest
                   │
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│ FLASK BACKEND (port 5000)                                       │
│                                                                   │
│ 1. sensor_controller.ingest()                                   │
│ 2. sensor_service.ingest_sensor_reading()                       │
│    ├─ Validate payload                                          │
│    ├─ Lookup device from DB                                     │
│    └─ Create reading doc                                        │
│ 3. preprocessing_service.normalize_and_enrich()                 │
│    ├─ Calculate health_score                                    │
│    ├─ Generate alerts                                           │
│    └─ Compute feature deltas                                    │
│ 4. Insert into SENSOR_READINGS                                  │
│ 5. Upload to S3                                                 │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │  ATLAS MONGODB           │
        │  Database: smart_farming │
        │  Collections:            │
        │  - sensor_readings ✓     │
        │  - predictions           │
        │  - devices               │
        │  - users                 │
        └──────────────────────────┘
                   │
        (When frontend calls /predictions/recompute)
                   │
                   ↓
        ┌──────────────────────────────────────┐
        │ PREDICTION ENGINE (Two Models)       │
        │                                      │
        │ Model 1: Rule-Based Health Score    │
        │ - Input: temp, humidity, soil       │
        │ - Output: 0-100 score (92.13)       │
        │ - Location: prediction_service.py   │
        │                                      │
        │ Model 2: Trained Keras Model        │
        │ - Input: temp, humidity, soil, crop │
        │ - Scaled: via scaler.pkl            │
        │ - Model: irrigation_model.keras     │
        │ - Output: 0 or 1 (1 = irrigation)   │
        │ - Location: trained_models/app.py   │
        └──────────────────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ PREDICTION DOCUMENT      │
        │ {                        │
        │   health_score: 92.13,   │
        │   irrigation_needed: 1,  │
        │   recommendation: "..." │
        │ }                        │
        │ ↓                        │
        │ Saved to predictions DB  │
        └──────────────────────────┘
                   │
                   ↓
        ┌──────────────────────────┐
        │ FRONTEND (Next.js)       │
        │ Dashboard Display        │
        │ - Health: 92.13%         │
        │ - Irrigation: NEEDED     │
        │ - Recommendation: "..."  │
        └──────────────────────────┘
```

---

## 7. KEY FILES & LINES

| Component | File | Lines | Function |
|-----------|------|-------|----------|
| Serial data parsing | `serial_bridge.py` | 53-67 | `parse_sensor_line()` |
| Backend to API | `serial_bridge.py` | 71-98 | `send_to_backend()` |
| Request validation | `sensor_controller.py` | 32-37 | `ingest()` |
| Data enrichment | `sensor_service.py` | 6-42 | `ingest_sensor_reading()` |
| Health score calc | `preprocessing_service.py` | 6-42 | `normalize_and_enrich()` |
| Rule-based prediction | `prediction_service.py` | 9-32 | `model_predict()` |
| Keras prediction | `prediction_service.py` | 37-75 | `model_predict_irrigation()` |
| Compute prediction | `prediction_service.py` | 82-128 | `compute_prediction_for_device()` |

---

## 8. WHAT NEEDS CHANGES?

Please specify what you'd like to modify in:

1. **Sensor ingestion?** (temperature ranges, alert thresholds, enrichment logic)
2. **Health score calculation?** (weights, formulas, ideal values)
3. **Trained model integration?** (preprocessing, input normalization, output interpretation)
4. **Database schema?** (new fields, different structure)
5. **Prediction recommendations?** (advisory text based on scores)

Let me know what changes you need!
