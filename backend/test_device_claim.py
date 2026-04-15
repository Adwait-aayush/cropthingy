#!/usr/bin/env python3
"""
Test script to verify device claiming flow works end-to-end
"""

import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def test_device_claiming():
    print("=" * 60)
    print("Testing Device Claiming Flow")
    print("=" * 60)
    
    # Step 1: Register user
    print("\n1. Registering test user...")
    register_data = {
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "password123"
    }
    
    try:
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        reg_json = reg_response.json()
        
        if reg_response.status_code == 201 and reg_json.get("success"):
            token = reg_json["data"]["token"]
            print(f"✓ User registered successfully")
            print(f"  Token (first 20 chars): {token[:20]}...")
        else:
            print(f"✗ Registration failed: {reg_json}")
            return
    except Exception as e:
        print(f"✗ Registration error: {e}")
        return
    
    # Step 2: Get available devices
    print("\n2. Fetching available devices...")
    try:
        dev_response = requests.get(f"{BASE_URL}/api/devices/available")
        dev_json = dev_response.json()
        
        if dev_response.status_code == 200 and dev_json.get("success"):
            devices = dev_json["data"]
            print(f"✓ Found {len(devices)} available devices:")
            for device in devices:
                print(f"  - {device['device_id']}: {device['name']} ({device['crop_type']}) at {device['location']}")
        else:
            print(f"✗ Failed to fetch devices: {dev_json}")
            return
    except Exception as e:
        print(f"✗ Device fetch error: {e}")
        return
    
    # Step 3: Claim a device
    if devices:
        device_to_claim = devices[0]["device_id"]
        print(f"\n3. Claiming device: {device_to_claim}...")
        
        claim_data = {"device_id": device_to_claim}
        headers = {"Authorization": f"Bearer {token}"}
        
        try:
            claim_response = requests.post(
                f"{BASE_URL}/api/devices/claim",
                json=claim_data,
                headers=headers
            )
            claim_json = claim_response.json()
            
            if claim_response.status_code == 201 and claim_json.get("success"):
                claimed_device = claim_json["data"]
                print(f"✓ Device claimed successfully!")
                print(f"  Device ID: {claimed_device['device_id']}")
                print(f"  API Key: {claimed_device['api_key'][:20]}...")
                print(f"  Claimed at: {claimed_device.get('claimed_at', 'N/A')}")
            else:
                print(f"✗ Claim failed: {claim_json}")
                return
        except Exception as e:
            print(f"✗ Claim error: {e}")
            return
    
    # Step 4: Get user's claimed devices
    print(f"\n4. Fetching user's claimed devices...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        user_dev_response = requests.get(
            f"{BASE_URL}/api/devices/",
            headers=headers
        )
        user_dev_json = user_dev_response.json()
        
        if user_dev_response.status_code == 200 and user_dev_json.get("success"):
            user_devices = user_dev_json["data"]
            print(f"✓ User has {len(user_devices)} claimed device(s):")
            for device in user_devices:
                print(f"  - {device['device_id']}: {device['name']}")
        else:
            print(f"✗ Failed to fetch user devices: {user_dev_json}")
            return
    except Exception as e:
        print(f"✗ User devices fetch error: {e}")
        return
    
    print("\n" + "=" * 60)
    print("✓ All tests passed!")
    print("=" * 60)

if __name__ == "__main__":
    test_device_claiming()
