# Smart Farming IoT - Complete Workflow

## User Registration & Device Management Flow

### 1. User Registration (Frontend → Backend)
**User visits http://localhost:3000 and signs up:**
- Name: "John Farmer"
- Email: "john@farm.com"
- Password: "secure123"
- **Backend stores:** user_id, email, password hash
- **Frontend saves:** JWT token in localStorage

### 2. Device Registration (Frontend → Backend)
**Logged-in user registers their first sensor:**
- Device Name: "North Field Sensor"
- Device ID: `sensor_north_01` (auto-generated or user-provided)
- Crop Type: "Wheat"
- Location: "North Field"
- **Backend stores:** 
  - Device doc linked to `owner_id` (user's ID)
  - Auto-generates `api_key` for this device
  - Returns: api_key for Arduino configuration

### 3. Arduino Configuration
**Setup Arduino with sensor data:**
```
DEVICE_ID = "sensor_north_01"
API_KEY = "<key-from-step-2>"
COM_PORT = "COM4"
BAUD_RATE = 9600
```

### 4. Serial Bridge Execution
**User runs serial bridge in terminal:**
```bash
python serial_bridge.py \
  --port COM4 \
  --baudrate 9600 \
  --backend http://localhost:5000 \
  --device-id sensor_north_01 \
  --api-key "<api-key-from-step-2>"
```

**Data Flow:**
- Arduino → USB Serial (COM4)
- Serial Bridge reads & parses
- Sends to `/api/sensors/ingest` with device-id & api-key
- Backend validates device exists & api-key matches
- Data stored in MongoDB Atlas

### 5. Dashboard Display (Frontend)
**User logs in and sees their devices:**
- Dashboard fetches `/api/devices/` → Gets all devices owned by user
- For each device, fetches `/api/sensors/latest/{device_id}`
- Shows temperature, humidity, soil moisture
- Shows health score & alerts
- Can add more devices at any time

## Backend Structure

### Authentication
- POST `/api/auth/register` → Register user (no auth needed)
- POST `/api/auth/login` → Get JWT token

### Device Management (Requires JWT)
- POST `/api/devices/register` → Register new device (linked to user)
- GET `/api/devices/` → Get all user's devices

### Sensor Data
- POST `/api/sensors/ingest` → Arduino sends data (requires device API key)
- GET `/api/sensors/latest/{device_id}` → Get latest reading (requires JWT)
- GET `/api/sensors/history/{device_id}` → Get 10 latest readings (requires JWT)

## Data Model

### Users Collection
```
{
  _id: ObjectId,
  name: "John Farmer",
  email: "john@farm.com",
  password_hash: "...",
  created_at: "2026-04-15T..."
}
```

### Devices Collection
```
{
  _id: ObjectId,
  device_id: "sensor_north_01",
  name: "North Field Sensor",
  crop_type: "Wheat",
  location: "North Field",
  owner_id: <user_id>,
  api_key: "...",
  created_at: "2026-04-15T..."
}
```

### Sensor Readings Collection
```
{
  _id: ObjectId,
  device_id: "sensor_north_01",
  timestamp: "2026-04-15T...",
  temperature: 32.8,
  humidity: 39.2,
  soil_moisture: 45,
  crop_type: "Wheat",
  location: "North Field",
  health_score: 52.5,
  alerts: ["soil_moisture_low"],
  ...
}
```

## Key Points

✅ Devices are owned by users (owner_id field)
✅ Arduino sends data with device_id + api_key
✅ Dashboard shows only user's devices
✅ Each device can have multiple sensors/readings
✅ Data persists in MongoDB Atlas cloud
