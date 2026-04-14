from __future__ import annotations

from datetime import datetime, timezone

from app.db.mongo import get_db
from app.db.collections import DEVICES, SENSOR_READINGS
from app.services.preprocessing_service import normalize_and_enrich
from app.services.s3_service import upload_json


def ingest_sensor_reading(payload: dict):
    db = get_db()
    device = db[DEVICES].find_one({"device_id": payload["device_id"]})
    if not device:
        raise ValueError("Device not found")

    reading = {
        "device_id": payload["device_id"],
        "timestamp": payload.get("timestamp") or datetime.now(timezone.utc).isoformat(),
        "temperature": float(payload["temperature"]),
        "humidity": float(payload["humidity"]),
        "soil_moisture": float(payload["soil_moisture"]),
        "crop_type": device.get("crop_type", "unknown"),
        "location": device.get("location", "unknown"),
        "metadata": payload.get("metadata", {}),
    }

    enriched = normalize_and_enrich(reading)
    result = db[SENSOR_READINGS].insert_one(enriched)

    upload_json("raw-sensor", f"{payload['device_id']}-{result.inserted_id}.json", enriched)

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


def get_latest_reading(device_id: str):
    db = get_db()
    return db[SENSOR_READINGS].find_one({"device_id": device_id}, sort=[("_id", -1)])


def get_history(device_id: str, limit: int = 100):
    db = get_db()
    cursor = db[SENSOR_READINGS].find({"device_id": device_id}, sort=[("_id", -1)]).limit(limit)
    return list(cursor)


def get_alerts(device_id: str, limit: int = 100):
    db = get_db()
    cursor = db[SENSOR_READINGS].find(
        {"device_id": device_id, "alerts": {"$exists": True, "$ne": []}},
        sort=[("_id", -1)],
    ).limit(limit)
    return list(cursor)
