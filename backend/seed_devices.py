#!/usr/bin/env python3
"""
Seed script to populate DEVICES collection with test unclaimed devices.
Run this after deploying new devices to field locations.
"""

import os
from dotenv import load_dotenv
import pymongo
from pymongo import MongoClient
from datetime import datetime, timezone


def utc_now_iso():
    """Return current UTC time in ISO format"""
    return datetime.now(timezone.utc).isoformat()


def seed_devices():
    """Insert test devices into DEVICES collection"""
    load_dotenv()

    mongo_uri = os.getenv("MONGO_URI")
    mongo_db_name = os.getenv("MONGO_DB_NAME", "smart_farming")

    if not mongo_uri:
        raise ValueError("MONGO_URI not set in .env file")

    print(f"Connecting to MongoDB: {mongo_uri}")
    client = MongoClient(mongo_uri)
    db = client[mongo_db_name]
    devices_collection = db["devices"]

    # Test devices to seed
    test_devices = [
        {
            "device_id": "DEVICE_001",
            "name": "Main Field North",
            "crop_type": "Tomato",
            "location": "Field A, North End",
            "claimed": False,
            "created_at": utc_now_iso(),
        },
        {
            "device_id": "DEVICE_002",
            "name": "Main Field South",
            "crop_type": "Pepper",
            "location": "Field A, South End",
            "claimed": False,
            "created_at": utc_now_iso(),
        },
        {
            "device_id": "DEVICE_003",
            "name": "Greenhouse Row 1",
            "crop_type": "Cucumber",
            "location": "Greenhouse, Row 1",
            "claimed": False,
            "created_at": utc_now_iso(),
        },
        {
            "device_id": "DEVICE_004",
            "name": "Greenhouse Row 2",
            "crop_type": "Lettuce",
            "location": "Greenhouse, Row 2",
            "claimed": False,
            "created_at": utc_now_iso(),
        },
        {
            "device_id": "DEVICE_005",
            "name": "Field B Section 1",
            "crop_type": "Corn",
            "location": "Field B, Section 1",
            "claimed": False,
            "created_at": utc_now_iso(),
        },
    ]

    # Clear existing unclaimed devices (optional - comment out if you want to keep existing)
    # devices_collection.delete_many({"claimed": False})

    # Insert new devices
    print(f"\nInserting {len(test_devices)} test devices...")
    for device in test_devices:
        # Check if device already exists
        existing = devices_collection.find_one({"device_id": device["device_id"]})
        if existing:
            print(f"  ✓ {device['device_id']} already exists, skipping")
        else:
            result = devices_collection.insert_one(device)
            print(f"  ✓ {device['device_id']} inserted (ID: {result.inserted_id})")

    # Display all unclaimed devices
    print("\n--- Available Unclaimed Devices ---")
    unclaimed = devices_collection.find({"claimed": False})
    for device in unclaimed:
        print(f"  • {device['device_id']}: {device['name']} ({device['crop_type']}) at {device['location']}")

    client.close()
    print("\nSeeding complete!")


if __name__ == "__main__":
    seed_devices()
