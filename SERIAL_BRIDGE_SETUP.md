# Serial Bridge Configuration for Device Claiming

## Overview

The serial bridge script now needs to be configured with claimed device credentials instead of arbitrary device IDs. This document explains how to update `serial_bridge.py` for the new system.

## Setup Process

### Step 1: User Claims Device in Frontend
1. Login to http://localhost:3000/auth
2. Click "Claim Device" in dashboard
3. Select a device from the list
4. Note down:
   - `device_id`: e.g., "DEVICE_001"
   - `api_key`: e.g., "f3aaf3ad94222cab53a5abc123456789"

### Step 2: Update Serial Bridge Configuration

Create or update a config file `aurdino-setup/config.json`:

```json
{
  "api_base_url": "http://localhost:5000",
  "device_id": "DEVICE_001",
  "api_key": "f3aaf3ad94222cab53a5abc123456789",
  "serial_port": "COM4",
  "baud_rate": 9600
}
```

### Step 3: Update serial_bridge.py

Replace the hardcoded values with configuration file loading:

```python
#!/usr/bin/env python3
"""
Serial Bridge - Relay Arduino sensor data to backend
Now requires device claiming and API key authentication
"""

import serial
import json
import time
import requests
from datetime import datetime

# Load configuration
try:
    with open('config.json', 'r') as f:
        config = json.load(f)
except FileNotFoundError:
    print("ERROR: config.json not found!")
    print("Please create config.json with device_id and api_key from claimed device")
    exit(1)

# Configuration from claimed device
API_BASE_URL = config.get('api_base_url', 'http://localhost:5000')
DEVICE_ID = config.get('device_id')
API_KEY = config.get('api_key')
SERIAL_PORT = config.get('serial_port', 'COM4')
BAUD_RATE = config.get('baud_rate', 9600)

if not DEVICE_ID or not API_KEY:
    print("ERROR: device_id and api_key required in config.json!")
    print("Please claim a device first and add credentials to config.json")
    exit(1)

print(f"Serial Bridge Configuration:")
print(f"  Device ID: {DEVICE_ID}")
print(f"  API Key: {API_KEY[:20]}...")
print(f"  Serial Port: {SERIAL_PORT}")
print(f"  Baud Rate: {BAUD_RATE}")
print()

# Headers with device authentication
headers = {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY
}

# Try to connect to serial port
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print(f"✓ Connected to {SERIAL_PORT} at {BAUD_RATE} baud")
except Exception as e:
    print(f"✗ Failed to connect to {SERIAL_PORT}: {e}")
    exit(1)

# Data accumulation for multi-line Arduino output
pending_reading = {}

def send_to_backend(data):
    """Send sensor reading to backend"""
    try:
        response = requests.post(
            f"{API_BASE_URL}/api/sensors/ingest",
            json={
                "device_id": DEVICE_ID,
                **data
            },
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 201:
            print(f"✓ [{datetime.now().strftime('%H:%M:%S')}] Data sent successfully")
            return True
        else:
            print(f"✗ [{datetime.now().strftime('%H:%M:%S')}] API error: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"✗ [{datetime.now().strftime('%H:%M:%S')}] Network error: {e}")
        return False

def parse_arduino_reading(line):
    """Parse single line of Arduino output"""
    global pending_reading
    
    line = line.strip()
    if not line:
        return
    
    try:
        if line.startswith("Temperature:"):
            temp = float(line.split(":")[1].strip().split()[0])
            pending_reading['temperature'] = temp
            print(f"  Temperature: {temp}°C")
            
        elif line.startswith("Humidity:"):
            humidity = float(line.split(":")[1].strip().split()[0])
            pending_reading['humidity'] = humidity
            print(f"  Humidity: {humidity}%")
            
        elif line.startswith("Soil:"):
            soil = float(line.split(":")[1].strip().split()[0])
            pending_reading['soil_moisture'] = soil
            print(f"  Soil Moisture: {soil}%")
            
            # All three values received - send to backend
            if len(pending_reading) == 3:
                if send_to_backend(pending_reading):
                    pending_reading = {}
    except (IndexError, ValueError):
        print(f"  Warning: Could not parse line: {line}")

def main():
    """Main serial reading loop"""
    print("Starting serial bridge...")
    print(f"Listening for Arduino data on {SERIAL_PORT}...")
    print("(Press Ctrl+C to stop)\n")
    
    try:
        while True:
            if ser.in_waiting:
                line = ser.readline().decode('utf-8', errors='ignore')
                if line:
                    parse_arduino_reading(line)
            time.sleep(0.1)
    except KeyboardInterrupt:
        print("\n✓ Serial bridge stopped")
    finally:
        ser.close()
        print("✓ Serial port closed")

if __name__ == "__main__":
    main()
```

## Configuration File Format

### config.json Template
```json
{
  "api_base_url": "http://localhost:5000",
  "device_id": "DEVICE_001",
  "api_key": "YOUR_API_KEY_HERE",
  "serial_port": "COM4",
  "baud_rate": 9600,
  "retry_on_failure": true,
  "retry_delay_seconds": 5
}
```

### Windows Ports
- `COM1`, `COM2`, `COM3`, `COM4`, etc.

### Linux/Mac Ports
- `/dev/ttyUSB0`, `/dev/ttyUSB1`
- `/dev/ttyACM0`, `/dev/ttyACM1`
- `/dev/cu.usbserial-*`

## Complete Workflow

### 1. Admin Pre-deployment
```bash
cd backend
python seed_devices.py
```

### 2. User Claims Device
- Login to dashboard
- Click "Claim Device"
- Select device → Note ID and API key

### 3. Configure Serial Bridge
```bash
cd aurdino-setup
# Create config.json with:
# - device_id from step 2
# - api_key from step 2
# - serial_port (find using Device Manager on Windows)
```

### 4. Run Serial Bridge
```bash
python serial_bridge.py
```

### 5. Monitor Data Flow
- Backend receives data: `docker compose logs flask-backend | grep sensors`
- Frontend displays real-time charts
- Health score updates automatically

## Error Handling

### "Device ID does not exist"
- Device not claimed yet
- Verify device_id matches exactly (case-sensitive)
- Run backend test: `python test_device_claim.py`

### "Invalid API Key"
- API key incorrect or expired
- Claim device again to generate new key
- Update config.json with new key

### "Connection refused"
- Backend not running: `docker compose up -d`
- Wrong API_BASE_URL in config
- Check port: `docker ps`

### "Serial port COM4 not found"
- Arduino not connected
- Check Device Manager for COM port
- Install CH340 drivers if needed
- Try different COM port

## Security Notes

⚠️ **IMPORTANT:** Never commit config.json with real API keys to git!

```bash
# Add to .gitignore
echo "config.json" >> .gitignore
```

For team sharing, use template:
```bash
# Create template
cp config.json config.json.example

# Share example (without keys)
# Each user creates own config.json
```

## Testing Serial Bridge

### Quick Test Script
```python
import requests
import json

config = json.load(open('config.json'))

# Test 1: Verify device exists
response = requests.get(
    f"{config['api_base_url']}/api/devices/available",
    json={"device_id": config['device_id']}
)
print(f"Device exists: {response.status_code == 200}")

# Test 2: Send test data
headers = {"X-API-KEY": config['api_key'], "Content-Type": "application/json"}
test_data = {
    "device_id": config['device_id'],
    "temperature": 25.5,
    "humidity": 60.0,
    "soil_moisture": 45.0
}
response = requests.post(
    f"{config['api_base_url']}/api/sensors/ingest",
    json=test_data,
    headers=headers
)
print(f"Data ingestion: {response.status_code == 201}")
if response.status_code != 201:
    print(f"  Error: {response.text}")
```

## Summary

✓ Serial bridge now requires device claiming first
✓ Credentials stored in config.json (not git-tracked)
✓ Enhanced security with API key authentication
✓ Better error handling and logging
✓ Multi-device support (change config.json to switch devices)

**Status: Ready for integration** 🔌
