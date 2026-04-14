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
from datetime import datetime
import sys

class ArduinoSerialBridge:
    def __init__(self, port, baudrate, backend_url, device_id, api_key):
        self.port = port
        self.baudrate = baudrate
        self.backend_url = backend_url
        self.device_id = device_id
        self.api_key = api_key
        self.ser = None
        self.connected = False
        
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
        # Example: "[SENSOR] Temp: 28.50°C | Humidity: 65.30% | Soil: 45%"
        if "[SENSOR]" not in line:
            return None
        
        try:
            # Extract values using simple parsing
            parts = line.split("|")
            temp_part = parts[0].split(":")[-1].replace("°C", "").strip()
            humidity_part = parts[1].split(":")[-1].replace("%", "").strip()
            soil_part = parts[2].split(":")[-1].replace("%", "").strip()
            
            return {
                "temperature": float(temp_part),
                "humidity": float(humidity_part),
                "soil_moisture": float(soil_part),
            }
        except Exception as e:
            print(f"[PARSE ERROR] {e}: {line}")
            return None
    
    def send_to_backend(self, temp, humidity, soil):
        """Send sensor data to backend API"""
        payload = {
            "device_id": self.device_id,
            "temperature": temp,
            "humidity": humidity,
            "soil_moisture": soil,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        headers = {
            "X-API-KEY": self.api_key,
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
        print(f"[INFO] Device ID: {self.device_id}")
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
                        print(f"[DATA] {sensor_data}")
                        self.send_to_backend(
                            sensor_data["temperature"],
                            sensor_data["humidity"],
                            sensor_data["soil_moisture"]
                        )
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
    parser.add_argument("--port", default="COM3", help="Serial port (default: COM3)")
    parser.add_argument("--baudrate", type=int, default=9600, help="Baud rate (default: 9600)")
    parser.add_argument("--backend", default="http://localhost:5000", help="Backend URL")
    parser.add_argument("--device-id", default="device_001", help="Device ID")
    parser.add_argument("--api-key", default="dev-device-key", help="Device API key")
    
    args = parser.parse_args()
    
    bridge = ArduinoSerialBridge(
        port=args.port,
        baudrate=args.baudrate,
        backend_url=args.backend,
        device_id=args.device_id,
        api_key=args.api_key
    )
    
    bridge.run()

if __name__ == "__main__":
    main()
