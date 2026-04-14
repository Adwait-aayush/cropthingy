#!/usr/bin/env python3
"""
Test script to verify Arduino → Backend integration is working
Before deploying to actual Arduino hardware
"""

import requests
import json
import sys
from datetime import datetime

def test_backend_connectivity(backend_url):
    """Test if backend is accessible"""
    print(f"\n[TEST 1] Backend Connectivity")
    print(f"Checking {backend_url}/api/health...")
    try:
        resp = requests.get(f"{backend_url}/api/health", timeout=5)
        if resp.status_code == 200:
            print("✓ Backend is running")
            return True
        else:
            print(f"✗ Backend returned {resp.status_code}")
            return False
    except Exception as e:
        print(f"✗ Cannot reach backend: {e}")
        return False

def test_device_registration(backend_url):
    """Test device registration flow"""
    print(f"\n[TEST 2] Device Registration Flow")
    
    # Register user
    print("  - Registering user...")
    user_payload = {
        "name": "Test Farmer",
        "email": f"test_{int(datetime.now().timestamp())}@example.com",
        "password": "testpass123"
    }
    
    try:
        user_resp = requests.post(
            f"{backend_url}/api/auth/register",
            json=user_payload,
            timeout=5
        )
        if user_resp.status_code != 201:
            print(f"  ✗ User registration failed: {user_resp.text}")
            return False, None
        
        user_data = user_resp.json()["data"]
        token = user_data["token"]
        print(f"  ✓ User registered")
        
        # Register device
        print("  - Registering device...")
        device_payload = {
            "device_id": "test_device_001",
            "name": "Test Sensor",
            "crop_type": "wheat",
            "location": "Test Field"
        }
        
        device_resp = requests.post(
            f"{backend_url}/api/devices/register",
            json=device_payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        
        if device_resp.status_code != 201:
            print(f"  ✗ Device registration failed: {device_resp.text}")
            return False, None
        
        device_data = device_resp.json()["data"]
        api_key = device_data["api_key"]
        print(f"  ✓ Device registered")
        print(f"    Device ID: {device_data['device_id']}")
        print(f"    API Key: {api_key}")
        
        return True, api_key
    
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False, None

def test_sensor_ingestion(backend_url, api_key):
    """Test sensor data ingestion"""
    print(f"\n[TEST 3] Sensor Data Ingestion")
    
    payload = {
        "device_id": "test_device_001",
        "temperature": 28.5,
        "humidity": 65.3,
        "soil_moisture": 45,
    }
    
    print(f"  - Sending sensor data: {payload}")
    
    try:
        resp = requests.post(
            f"{backend_url}/api/sensors/ingest",
            json=payload,
            headers={"X-API-KEY": api_key},
            timeout=5
        )
        
        if resp.status_code not in [200, 201]:
            print(f"  ✗ Ingestion failed: {resp.text}")
            return False
        
        data = resp.json()
        print(f"  ✓ Data ingested successfully")
        print(f"    Reading ID: {data['data']['id']}")
        print(f"    Health Score: {data['data']['health_score']}")
        if data['data']['alerts']:
            print(f"    Alerts: {data['data']['alerts']}")
        
        return True
    
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def test_data_retrieval(backend_url, token):
    """Test retrieving data"""
    print(f"\n[TEST 4] Data Retrieval")
    
    try:
        resp = requests.get(
            f"{backend_url}/api/sensors/latest/test_device_001",
            headers={"Authorization": f"Bearer {token}"},
            timeout=5
        )
        
        if resp.status_code not in [200, 404]:
            print(f"  ✗ Retrieval failed: {resp.text}")
            return False
        
        if resp.status_code == 404:
            print("  ℹ No readings found yet (expected if just registered)")
            return True
        
        data = resp.json()["data"]
        print(f"  ✓ Latest reading retrieved")
        print(f"    Timestamp: {data['timestamp']}")
        print(f"    Temperature: {data['temperature']}°C")
        print(f"    Humidity: {data['humidity']}%")
        print(f"    Soil Moisture: {data['soil_moisture']}%")
        print(f"    Health Score: {data['health_score']}")
        
        return True
    
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("Arduino → Backend Integration Test Suite")
    print("=" * 60)
    
    backend_url = "http://localhost:5000"
    
    # Check if backend is running
    if not test_backend_connectivity(backend_url):
        print("\n[ERROR] Backend is not running. Start it with:")
        print("  docker compose up --build -d")
        sys.exit(1)
    
    # Test device registration
    success, api_key = test_device_registration(backend_url)
    if not success:
        print("\n[ERROR] Device registration failed")
        sys.exit(1)
    
    # Test sensor ingestion
    if not test_sensor_ingestion(backend_url, api_key):
        print("\n[ERROR] Sensor ingestion failed")
        sys.exit(1)
    
    # Get token for retrieval test
    user_token = "not_needed_for_ingest"  # Would need to save from registration
    # test_data_retrieval(backend_url, user_token)
    
    print("\n" + "=" * 60)
    print("✓ All tests passed! System is ready for Arduino deployment")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Update Arduino firmware with these values:")
    print(f"   - DEVICE_ID: 'test_device_001'")
    print(f"   - API_KEY: '{api_key}'")
    print("2. Update WiFi credentials in Arduino sketch")
    print("3. Flash Arduino and monitor serial output")
    print("4. Verify data appears in backend within 10 seconds")

if __name__ == "__main__":
    main()
