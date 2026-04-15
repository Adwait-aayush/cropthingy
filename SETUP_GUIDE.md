# Complete Setup & Testing Guide

## System Status ✅

| Component | Status | Location |
|-----------|--------|----------|
| Arduino | ✅ Connected on COM4 | Sends sensor data |
| Serial Bridge | ✅ Ready | Python script |
| Backend | ✅ Running | http://localhost:5000 |
| Frontend | ✅ Running | http://localhost:3000 |
| MongoDB Atlas | ✅ Connected | Cloud storage |

---

## Step-by-Step Testing

### Phase 1: User Registration (Frontend)
1. Open http://localhost:3000
2. Click "Register" tab
3. Fill form:
   - Name: "John Farmer"
   - Email: "john@farm.com"
   - Password: "Test@123456"
   - Confirm: "Test@123456"
4. Click Register button
5. Should see "Registration successful!" message
6. Switch to Login tab
7. Login with same credentials
8. JWT token automatically saved to localStorage

### Phase 2: Device Registration (Frontend)
1. After login, click "+" button to register device
2. Fill form:
   - Device ID: `sensor_north_01`
   - Device Name: "North Field Sensor"
   - Crop Type: "Wheat"
   - Location: "North Field"
3. Click Register
4. Modal should show:
   - ✅ Device registered
   - API Key: `<copy this value>`

### Phase 3: Configure Arduino
Update your Arduino sketch to have:
```
DEVICE_ID = "sensor_north_01"
API_KEY = "<from step Phase 2>"
```

### Phase 4: Run Serial Bridge
```bash
cd d:\cropthingy

# Keep Arduino connected to COM4

python aurdino-setup/serial_bridge.py \
  --port COM4 \
  --baudrate 9600 \
  --backend http://localhost:5000 \
  --device-id sensor_north_01 \
  --api-key "<API-KEY-from-Phase2>"
```

5. Watch output like:
```
[SUCCESS] Connected to COM4 at 9600 baud
[SERIAL] 🌡 Temp: 32.8 °C | 💧 Humidity: 39.2 %
[DATA] {'temperature': 32.8, 'humidity': 39.2, 'soil_moisture': 45.0}
[BACKEND] ✓ Ingested | Health Score: 52.5
```

### Phase 5: View Dashboard
1. Go to http://localhost:3000/dashboard
2. You should see:
   - "North Field Sensor" device listed
   - Temperature/Humidity/Soil readings (live from Arduino)
   - Health Score graph
   - Alerts (if any)

---

## Adding Multiple Devices

1. Click "+" button again
2. Register second device:
   - Device ID: `sensor_south_02`
   - Name: "South Field Sensor"
   - Type: "Corn"
   - Location: "South Field"
3. Get API Key from response
4. Update Arduino with new device_id & api_key
5. Run serial bridge with new device_id
6. Dashboard now shows BOTH devices
7. Can switch between them via device selector

---

## Troubleshooting

### "401 Unauthorized" on device list
- **Issue:** JWT token not stored or expired
- **Fix:** Re-login on frontend

### "Device not found" from serial bridge
- **Issue:** device_id doesn't match registered device
- **Fix:** Check device_id in dashboard device settings

### "Invalid API key"
- **Issue:** API key is wrong or doesn't belong to device
- **Fix:** Copy API key again from device registration

### "POST 400" on device registration
- **Issue:** Missing required fields
- **Fix:** Ensure device_id, name, crop_type, location all filled

---

## Database Verification

Check MongoDB Atlas to verify data:

```bash
# Terminal: Access MongoDB in Docker
docker compose exec mongo mongosh smart_farming

# Inside MongoDB shell:
db.users.find()  # Should see your user
db.devices.find()  # Should see your devices with owner_id match
db.sensor_readings.find().limit(5)  # Should see sensor data
```

---

## Complete Data Flow

```
Arduino (Sensors) 
    ↓ USB Serial
Serial Bridge (Python)
    ↓ HTTP POST
Backend (/api/sensors/ingest)
    ↓ Validate device & api_key
MongoDB Atlas
    ↓ Store reading
Frontend Dashboard
    ↓ Fetch via JWT
Shows User's Devices & Data
```

---

## Key Commands

```bash
# Start backend
cd d:\cropthingy
docker compose up --build -d

# Start frontend
cd frontend
npm run dev

# Run serial bridge
python aurdino-setup/serial_bridge.py --port COM4 --device-id sensor_north_01 --api-key YOUR_KEY

# Check MongoDB
docker compose exec mongo mongosh smart_farming
```
