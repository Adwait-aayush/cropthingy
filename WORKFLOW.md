# Smart Farming Workflow - Session-Based (Simplified!)

## User Journey

### 1. Registration (1 minute)
**User visits http://localhost:3000 and signs up:**

```
Name:     "John Farmer"
Email:    "john@farm.com"
Password: "Test@123456"
          ↓
Backend:  Creates user_id = "user_123"
          Auto-creates 5 devices:
            • user_123_RICE
            • user_123_WHEAT  
            • user_123_MAIZE
            • user_123_VEGETABLES
            • user_123_PULSES
          ↓
Frontend: Saves JWT token in localStorage
          Redirects to dashboard
          ✅ Shows all 5 devices (no claiming needed!)
```

### 2. Select Active Device (30 seconds)
**User chooses which field they're monitoring:**

```
Dashboard: Shows "Manage Devices" section
           5 devices listed:
           ☐ Rice Field
           ☐ Wheat Field
           ☐ Maize Field
           ☐ Vegetables
           ☐ Pulses

User:      Clicks "Rice Field"
           ↓
Frontend:  Sends POST /api/sessions/set-active-device
           Body: {"device_id": "user_123_RICE"}
           ↓
Backend:   Stores active_device_id in user_sessions collection
           ↓
UI:        Rice device turns GREEN (active!)
           ✅ Ready to receive data
```

### 3. Run Serial Bridge (30 seconds)
**One terminal command - no config files!**

```bash
python serial_bridge.py \
  --port COM3 \
  --backend http://localhost:5000 \
  --device-id user_123_RICE
```

**What happens:**
```
Serial Bridge:
  Connects to COM3 (Arduino)
  Reads: "Temp: 28.5 C, Humidity: 65%"
  Sends POST /api/sensors/ingest:
  {
    "device_id": "user_123_RICE",
    "temperature": 28.5,
    "humidity": 65,
    "soil_moisture": 45,
    "raw_soil_score": 2800
  }
  ↓
Backend receives:
  1. Query: Get owner_id from device_id
     owner_id = "user_123"
  
  2. Check active device:
     SELECT active_device_id FROM user_sessions 
     WHERE user_id = "user_123"
     → Result: "user_123_WHEAT" (user selected wheat!)
  
  3. Compare:
     Submitted: user_123_RICE
     Active:    user_123_WHEAT
     → DIFFERENT! Use active device!
  
  4. Store with active device:
     {
       "device_id": "user_123_WHEAT",  ← NOT RICE!
       "temperature": 28.5,
       "humidity": 65,
       ...
     }
  ↓
MongoDB: Stores reading tagged to WHEAT
  ↓
Frontend: Fetches data for selected device (WHEAT)
          ✅ Shows data from WHEAT field
```

### 4. Switch Device (NO RESTART!)
**Most elegant part - same serial instance, different data:**

```
User clicks "Maize Field" in dashboard
  ↓
Frontend:  POST /api/sessions/set-active-device
           {"device_id": "user_123_MAIZE"}
  ↓
Backend:   Updates user_sessions
           active_device_id = "user_123_MAIZE"
  ↓
UI:        Maize device turns GREEN
  ↓
Serial Bridge (still running):
  Sends: {"device_id": "user_123_RICE", ...}
  
Backend checks:
  Active device: "user_123_MAIZE" (just changed!)
  Submitted:     "user_123_RICE"
  → Use MAIZE instead!
  ↓
Data stored with MAIZE tag
  ↓
Frontend shows:
  ✅ MAIZE field data
  ✅ No serial bridge restart!
  ✅ No config file update!
  ✅ Instant switch!
```

---

## Backend Data Model

### Collections

#### users
```json
{
  "_id": ObjectId("..."),
  "name": "John Farmer",
  "email": "john@farm.com",
  "password_hash": "...",
  "created_at": ISODate("...")
}
```

#### devices
```json
[
  {
    "_id": ObjectId("..."),
    "device_id": "user_123_RICE",
    "owner_id": "user_123",
    "device_name": "Rice Field",
    "device_type": "rice",
    "status": "active",
    "created_at": ISODate("...")
  },
  {
    "_id": ObjectId("..."),
    "device_id": "user_123_WHEAT",
    "owner_id": "user_123",
    "device_name": "Wheat Field",
    "device_type": "wheat",
    "status": "active",
    "created_at": ISODate("...")
  }
  // ... 3 more (maize, vegetables, pulses)
]
```

#### user_sessions
```json
{
  "_id": ObjectId("..."),
  "user_id": "user_123",
  "active_device_id": "user_123_WHEAT",  ← Current selection
  "last_updated": ISODate("...")
}
```

#### sensor_readings
```json
[
  {
    "_id": ObjectId("..."),
    "device_id": "user_123_WHEAT",  ← Tagged with active device
    "owner_id": "user_123",
    "temperature": 28.5,
    "humidity": 65,
    "soil_moisture": 45,
    "raw_soil_score": 2800,
    "timestamp": ISODate("...")
  }
]
```

---

## API Flow

### 1. Registration
```
POST /api/auth/register
{
  "email": "john@farm.com",
  "password": "Test@123456",
  "name": "John Farmer"
}

Response:
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "name": "John Farmer"
  }
}

Backend action:
  - Stores user
  - Creates 5 devices (rice, wheat, maize, vegetables, pulses)
  - Sets user_123_RICE as default active device
```

### 2. Get Device List
```
GET /api/devices/list
Authorization: Bearer eyJhbGc...

Response:
{
  "success": true,
  "devices": [
    {
      "device_id": "user_123_RICE",
      "device_name": "Rice Field",
      "device_type": "rice"
    },
    {
      "device_id": "user_123_WHEAT",
      "device_name": "Wheat Field",
      "device_type": "wheat"
    },
    // ... 3 more
  ]
}
```

### 3. Set Active Device
```
POST /api/sessions/set-active-device
Authorization: Bearer eyJhbGc...
{
  "device_id": "user_123_WHEAT"
}

Response:
{
  "success": true,
  "active_device_id": "user_123_WHEAT"
}

Backend action:
  - Updates user_sessions collection
  - Next sensor readings tagged to this device
```

### 4. Get Active Device
```
GET /api/sessions/get-active-device
Authorization: Bearer eyJhbGc...

Response:
{
  "active_device_id": "user_123_WHEAT",
  "last_updated": "2024-01-15T10:30:00Z"
}
```

### 5. Ingest Sensor Data (No auth!)
```
POST /api/sensors/ingest
Content-Type: application/json
{
  "device_id": "user_123_RICE",
  "temperature": 28.5,
  "humidity": 65,
  "soil_moisture": 45,
  "raw_soil_score": 2800
}

Response:
{
  "success": true,
  "stored_device_id": "user_123_WHEAT",  ← Smart routing!
  "message": "Data ingested"
}

Backend logic:
  1. Get device_owner from device_id
  2. Query active device from user_sessions
  3. If active != submitted: use active
  4. Store with final device_id
  5. Return what device was used
```

### 6. Get Sensor History
```
GET /api/sensors/history?device_id=user_123_WHEAT&limit=100
Authorization: Bearer eyJhbGc...

Response:
{
  "success": true,
  "readings": [
    {
      "temperature": 28.5,
      "humidity": 65,
      "soil_moisture": 45,
      "timestamp": "2024-01-15T10:30:00Z"
    },
    // ... more readings
  ]
}
```

---

## Multi-User Multi-Device Scenario

### Setup
- User1 (farmer) has: rice, wheat, maize, vegetables, pulses
- User2 (neighbor) has: rice, wheat, maize, vegetables, pulses
- One Arduino on User1's rice field
- Serial bridge running: `python serial_bridge.py --device-id user1_RICE`

### Timeline

**T=0: User1 selects RICE**
- Backend: user1 active_device = user1_RICE
- Serial data arrives for user1_RICE
- Stored as: user1_RICE ✅

**T=1: User1 switches to WHEAT**
- Backend: user1 active_device = user1_WHEAT
- Serial data arrives (still coming from user1_RICE arduino)
- Backend: "Active is WHEAT, submitted is RICE, use WHEAT!"
- Stored as: user1_WHEAT ✅
- User1 dashboard: Shows WHEAT data ✅

**T=2: User2 logs in, selects MAIZE**
- Backend: user2 active_device = user2_MAIZE (independent!)
- User2 dashboard: Empty (no data for user2 devices yet)
- User1 still seeing WHEAT data
- No interference between users ✅

**T=3: User1 switches back to RICE**
- Backend: user1 active_device = user1_RICE
- User1 dashboard: Shows RICE data ✅
- If User1 had another browser tab on WHEAT: That tab still shows WHEAT history

---

## What Changed From Old System

| Aspect | Old (Claiming) | New (Session) |
|--------|---|---|
| Device provisioning | Manual claiming | Auto-create 5 |
| API key setup | Copy from dashboard | None! |
| Config files | config.json required | Command-line only |
| Authentication | X-API-KEY header | None (session-based) |
| Startup | "device registration" form | Auto on signup |
| Device visibility | Only claimed | All visible |
| Switching | Restart serial bridge | Click and done! |
| Terminal setup | Complex 5-param | Simple 3-param |
| Data routing | Direct to submitted | Smart active check |
| User experience | Technical, error-prone | Farmer-friendly |

---

## Summary

1. **Register** → Backend auto-creates 5 devices
2. **Select device** → Sets active in session
3. **Run serial bridge** → One time, no auth
4. **Data flows** → Auto-tagged to active device
5. **Switch device** → Dashboard click, no restart
6. **Multi-user safe** → Sessions keep users isolated

✅ **Simple, robust, farm-ready!**
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
