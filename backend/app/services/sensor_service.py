from __future__ import annotations

from datetime import datetime, timezone

from app.db.mongo import get_db
from app.db.collections import DEVICES, SENSOR_READINGS
from app.services.preprocessing_service import normalize_and_enrich
from app.services.s3_service import upload_json


def _derive_crop_type(device: dict, device_id: str) -> str:
    crop = device.get("crop_type") or device.get("device_type")
    if crop:
        return str(crop).lower()

    if "_" in device_id:
        suffix = device_id.rsplit("_", 1)[-1].strip().lower()
        if suffix:
            return suffix

    return "unknown"


def ingest_sensor_reading(payload: dict):
    db = get_db()
    device = db[DEVICES].find_one({"device_id": payload["device_id"]})
    if not device:
        raise ValueError("Device not found")

    # Get the owner of the device (user who claimed it)
    owner_id = device.get("owner_id")
    
    # Check if there's an active device override for this user
    actual_device_id = payload["device_id"]
    if owner_id:
        sessions = db["user_sessions"]
        session = sessions.find_one({"user_id": owner_id})
        if session and session.get("active_device_id"):
            active_device_id = session["active_device_id"]
            # Use active device if it's different from the submitted device_id
            if active_device_id != payload["device_id"]:
                actual_device = db[DEVICES].find_one({"device_id": active_device_id})
                if actual_device:
                    actual_device_id = active_device_id
                    device = actual_device
                    owner_id = actual_device.get("owner_id")
    
    reading = {
        "device_id": actual_device_id,
        "owner_id": owner_id,
        "timestamp": payload.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        "temperature": float(payload["temperature"]),
        "humidity": float(payload["humidity"]),
        "soil_moisture": float(payload["soil_moisture"]),
        "raw_soil_score": int(payload.get("raw_soil_score", 0)),
        "crop_type": _derive_crop_type(device, actual_device_id),
        "location": device.get("location") or "unknown",
        "metadata": payload.get("metadata", {}),
    }

    enriched = normalize_and_enrich(reading)
    result = db[SENSOR_READINGS].insert_one(enriched)

    upload_json("raw-sensor", f"{actual_device_id}-{result.inserted_id}.json", enriched)

    return {
        "id": str(result.inserted_id),
        "device_id": enriched["device_id"],
        "health_score": enriched["health_score"],
        "alerts": enriched["alerts"],
        "timestamp": enriched["timestamp"],
    }


def bulk_ingest_sensor_readings(payload: dict):
    readings = payload.get("readings", [])
    if not readings:
        raise ValueError("No readings provided")

    inserted = []
    for item in readings:
        inserted.append(ingest_sensor_reading(item))
    return {"count": len(inserted), "items": inserted}


def _ensure_device_owner(device_id: str, owner_id: str):
    db = get_db()
    owned_device = db[DEVICES].find_one({"device_id": device_id, "owner_id": owner_id}, {"_id": 1})
    if not owned_device:
        raise ValueError("Device not found or not owned by user")


def get_latest_reading(device_id: str, owner_id: str):
    _ensure_device_owner(device_id, owner_id)
    db = get_db()
    return db[SENSOR_READINGS].find_one({"device_id": device_id, "owner_id": owner_id}, sort=[("_id", -1)])


def get_history(device_id: str, owner_id: str, limit: int = 100):
    _ensure_device_owner(device_id, owner_id)
    db = get_db()
    cursor = db[SENSOR_READINGS].find({"device_id": device_id, "owner_id": owner_id}, sort=[("_id", -1)]).limit(limit)
    return list(cursor)


def get_alerts(device_id: str, owner_id: str, limit: int = 100):
    _ensure_device_owner(device_id, owner_id)
    db = get_db()
    cursor = db[SENSOR_READINGS].find(
        {"device_id": device_id, "owner_id": owner_id, "alerts": {"$exists": True, "$ne": []}},
        sort=[("_id", -1)],
    ).limit(limit)
    return list(cursor)
