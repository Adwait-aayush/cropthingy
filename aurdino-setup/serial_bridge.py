#!/usr/bin/env python3
"""
Serial Bridge for Arduino Sensor Data
Reads sensor data from Arduino serial port and relays to backend API
Useful for testing and debugging before deploying to production
"""

import serial
import json
import requests
import time
import argparse
import re
from datetime import datetime, timezone
import sys
import os
import base64
from pathlib import Path

CONFIG_FILE = Path.home() / ".bridge_auth"

def load_auth():
    """Load stored authentication from config file"""
    if CONFIG_FILE.exists():
        with open(CONFIG_FILE, 'r') as f:
            return json.load(f)
    return None

def save_auth(token, user_id, backend_url):
    """Save authentication to config file"""
    with open(CONFIG_FILE, 'w') as f:
        json.dump({
            "token": token,
            "user_id": user_id,
            "backend_url": backend_url
        }, f)
    os.chmod(CONFIG_FILE, 0o600)  # Restrict permissions
    print(f"[AUTH] Credentials saved to {CONFIG_FILE}")


def decode_jwt_claims(token):
    """Decode JWT payload without signature verification for display/debug only."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return {}
        payload = parts[1]
        padding = "=" * (-len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload + padding).decode("utf-8")
        return json.loads(decoded)
    except Exception:
        return {}

def authenticate_user(backend_url, email, password):
    """Authenticate user with backend and get JWT token"""
    try:
        url = f"{backend_url}/api/auth/login"
        payload = {"email": email, "password": password}
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("data", {}).get("token")
            user_id = data.get("data", {}).get("user", {}).get("id")
            if token and user_id:
                return token, user_id
            else:
                print("[ERROR] No token in response")
                return None, None
        else:
            print(f"[ERROR] Login failed: {response.text}")
            return None, None
    except Exception as e:
        print(f"[ERROR] Authentication error: {e}")
        return None, None

def get_active_device(backend_url, token):
    """Fetch active device ID from backend"""
    try:
        url = f"{backend_url}/api/sessions/get-active-device"
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            device_id = data.get("data", {}).get("active_device_id")
            if device_id:
                return device_id
            else:
                print("[ERROR] No active device configured")
                print("[TIP] Open dashboard and select a device first!")
                return None
        else:
            print(f"[ERROR] Failed to get active device: {response.text}")
            return None
    except Exception as e:
        print(f"[ERROR] Error fetching active device: {e}")
        return None

class ArduinoSerialBridge:
    def __init__(self, port, baudrate, backend_url, device_id=None, token=None):
        self.port = port
        self.baudrate = baudrate
        self.backend_url = backend_url
        self.device_id = device_id
        self.token = token
        self.ser = None
        self.connected = False
        self.pending_reading = {}
        self.backend_enabled = bool(backend_url)
        self.last_active_sync = 0.0
        self.active_sync_interval_seconds = 5.0

    def sync_active_device(self):
        """Sync active device from backend session at a fixed interval."""
        if not self.token or not self.backend_enabled:
            return

        now = time.time()
        if now - self.last_active_sync < self.active_sync_interval_seconds:
            return

        self.last_active_sync = now
        latest_device_id = get_active_device(self.backend_url, self.token)
        if latest_device_id and latest_device_id != self.device_id:
            old_device = self.device_id
            self.device_id = latest_device_id
            print(f"[INFO] Active device changed: {old_device} -> {self.device_id}")
        
    def connect(self):
        """Connect to Arduino serial port"""
        try:
            self.ser = serial.Serial(self.port, self.baudrate, timeout=5)
            self.connected = True
            print(f"[SUCCESS] Connected to {self.port} at {self.baudrate} baud")
            # Skip initial setup messages
            time.sleep(2)
            self.ser.reset_input_buffer()
            return True
        except Exception as e:
            print(f"[ERROR] Failed to connect: {e}")
            return False
    
    def parse_sensor_line(self, line):
        """Parse sensor data from Arduino serial output"""
        parsed = {}

        # Temperature: "🌡 Temp: 32.80 °C  |  💧 Humidity: 37.50 %"
        temp_humidity = re.search(
            r"Temp:\s*([+-]?\d+(?:\.\d+)?)\s*°?C\s*\|\s*.*Humidity:\s*([+-]?\d+(?:\.\d+)?)\s*%",
            line,
            re.IGNORECASE,
        )
        if temp_humidity:
            parsed["temperature"] = float(temp_humidity.group(1))
            parsed["humidity"] = float(temp_humidity.group(2))

        # Soil Moisture %: "🌱 Soil Moisture: 0 %"
        soil_moisture = re.search(r"Soil\s+Moisture:\s*([+-]?\d+(?:\.\d+)?)\s*%", line, re.IGNORECASE)
        if soil_moisture:
            parsed["soil_moisture"] = float(soil_moisture.group(1))

        # Raw Soil Value: "Raw Soil Value: 512"
        raw_soil = re.search(r"Raw\s+Soil\s+Value:\s*([+-]?\d+(?:\.\d+)?)", line, re.IGNORECASE)
        if raw_soil:
            parsed["raw_soil_score"] = int(float(raw_soil.group(1)))

        return parsed or None
    
    def send_to_backend(self, temp, humidity, soil, raw_soil):
        """Send sensor data to backend API"""
        if not self.backend_enabled:
            print("[BACKEND] Skipped (no backend configured)")
            return True

        self.sync_active_device()

        payload = {
            "device_id": self.device_id,
            "temperature": temp,
            "humidity": humidity,
            "soil_moisture": soil,
            "raw_soil_score": raw_soil,
            "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        url = f"{self.backend_url}/api/sensors/ingest"
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=5)
            if response.status_code == 201:
                data = response.json()
                print(f"[BACKEND] ✓ Ingested | Health Score: {data.get('data', {}).get('health_score', 'N/A')}")
                return True
            else:
                print(f"[BACKEND] ✗ HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            print(f"[BACKEND ERROR] {e}")
            return False
    
    def run(self):
        """Main loop - read from serial and relay to backend"""
        if not self.connect():
            return
        
        print(f"[INFO] Listening on {self.port}...")
        print(f"[INFO] Backend: {self.backend_url}")
        print(f"[INFO] Device ID (current): {self.device_id}")
        print("[INFO] Active device sync: every 5s")
        print("-" * 60)
        
        try:
            while True:
                if self.ser and self.ser.in_waiting:
                    line = self.ser.readline().decode('utf-8', errors='ignore').strip()
                    
                    if line:
                        print(f"[SERIAL] {line}")
                    
                    # Try to parse sensor data
                    sensor_data = self.parse_sensor_line(line)
                    if sensor_data:
                        self.pending_reading.update(sensor_data)

                        # Check if we have all required fields
                        required = ("temperature", "humidity", "soil_moisture", "raw_soil_score")
                        if all(k in self.pending_reading for k in required):
                            payload = {
                                "temperature": self.pending_reading["temperature"],
                                "humidity": self.pending_reading["humidity"],
                                "soil_moisture": self.pending_reading["soil_moisture"],
                                "raw_soil_score": self.pending_reading["raw_soil_score"],
                            }
                            print(f"[DATA] {payload}")
                            self.send_to_backend(
                                payload["temperature"],
                                payload["humidity"],
                                payload["soil_moisture"],
                                payload["raw_soil_score"],
                            )
                            self.pending_reading = {}
                            print("-" * 60)
                
                time.sleep(0.1)
        
        except KeyboardInterrupt:
            print("\n[INFO] Shutting down...")
        finally:
            if self.ser:
                self.ser.close()
                print("[INFO] Serial port closed")

def main():
    parser = argparse.ArgumentParser(description="Arduino Serial Bridge")
    parser.add_argument("--port", help="Serial port (default: auto-detect)")
    parser.add_argument("--baudrate", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("--backend", default="http://localhost:5000", help="Backend URL (default: http://localhost:5000)")
    parser.add_argument("--setup", action="store_true", help="Interactive setup - login and store credentials")
    parser.add_argument("--clear-auth", action="store_true", help="Clear stored credentials")
    
    args = parser.parse_args()

    # Handle --clear-auth
    if args.clear_auth:
        if CONFIG_FILE.exists():
            CONFIG_FILE.unlink()
            print("[INFO] Credentials cleared")
        return

    # Handle --setup
    if args.setup:
        print("\n" + "="*60)
        print("SERIAL BRIDGE SETUP")
        print("="*60)
        print("This will authenticate with your backend account.")
        print("Your credentials are stored securely on this machine.\n")
        
        backend_url = args.backend
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        
        print("\n[AUTH] Authenticating...")
        token, user_id = authenticate_user(backend_url, email, password)
        
        if token and user_id:
            save_auth(token, user_id, backend_url)
            print(f"[SUCCESS] Authenticated as: {email}")
            print("\n[NEXT] Run the bridge with:")
            print(f"  python serial_bridge.py --port COM3")
            print("\nThe active device will be fetched automatically from dashboard!")
            return
        else:
            print("[ERROR] Failed to authenticate. Try again with --setup")
            sys.exit(1)

    # Normal operation: load stored auth
    auth = load_auth()
    if not auth:
        print("\n[ERROR] No credentials stored. First run:")
        print("  python serial_bridge.py --setup")
        sys.exit(1)

    token = auth.get("token")
    user_id = auth.get("user_id")
    backend_url = args.backend or auth.get("backend_url", "http://localhost:5000")
    claims = decode_jwt_claims(token or "")
    auth_email = claims.get("email", "unknown")

    print(f"[AUTH] Using account: {auth_email}")
    print(f"[AUTH] User ID: {user_id}")

    # Auto-detect port if not provided
    port = args.port
    if not port:
        print("[INFO] No port specified, auto-detecting...")
        try:
            import serial.tools.list_ports as list_ports
            ports = [p.device for p in list_ports.comports()]
            if ports:
                port = ports[0]
                print(f"[INFO] Found port: {port}")
            else:
                print("[ERROR] No serial port detected")
                sys.exit(1)
        except Exception as e:
            print(f"[ERROR] Cannot auto-detect port: {e}")
            sys.exit(1)

    # Fetch active device
    print("[INFO] Fetching active device from dashboard...")
    device_id = get_active_device(backend_url, token)
    if not device_id:
        sys.exit(1)

    print(f"[INFO] Using device: {device_id}\n")
    
    bridge = ArduinoSerialBridge(
        port=port,
        baudrate=args.baudrate,
        backend_url=backend_url,
        device_id=device_id,
        token=token,
    )
    
    bridge.run()

if __name__ == "__main__":
    main()
