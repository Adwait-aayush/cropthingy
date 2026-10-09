from __future__ import annotations

from app.db.mongo import get_db
from app.db.collections import SENSOR_READINGS, DEVICES


def get_summary(owner_id: str = None):
    db = get_db()
    
    device_filter = {"owner_id": owner_id} if owner_id else {}
    device_ids = [d["device_id"] for d in db[DEVICES].find(device_filter, {"device_id": 1})]
    
    total_devices = len(device_ids)
    reading_filter = {"device_id": {"$in": device_ids}} if owner_id else {}
    total_readings = db[SENSOR_READINGS].count_documents(reading_filter)
    
    pipeline = [
        {"$match": reading_filter},
        {
            "$group": {
                "_id": None,
                "avg_temperature": {"$avg": "$temperature"},
                "avg_humidity": {"$avg": "$humidity"},
                "avg_soil_moisture": {"$avg": "$soil_moisture"},
                "avg_health_score": {"$avg": "$health_score"},
            }
        }
    ]
    aggregate = list(db[SENSOR_READINGS].aggregate(pipeline))
    stats = aggregate[0] if aggregate else {}

    return {
        "total_devices": total_devices,
        "total_readings": total_readings,
        "avg_temperature": round(float(stats.get("avg_temperature", 0.0)), 2),
        "avg_humidity": round(float(stats.get("avg_humidity", 0.0)), 2),
        "avg_soil_moisture": round(float(stats.get("avg_soil_moisture", 0.0)), 2),
        "avg_health_score": round(float(stats.get("avg_health_score", 0.0)), 2),
    }


def get_trends(device_id: str, limit: int = 200):
    db = get_db()
    cursor = db[SENSOR_READINGS].find({"device_id": device_id}, sort=[("_id", -1)]).limit(limit)
    rows = list(cursor)
    rows.reverse()
    return [
        {
            "timestamp": r.get("timestamp"),
            "temperature": r.get("temperature"),
            "humidity": r.get("humidity"),
            "soil_moisture": r.get("soil_moisture"),
            "health_score": r.get("health_score"),
        }
        for r in rows
    ]


def get_crop_overview(owner_id: str = None):
    db = get_db()
    
    device_filter = {"owner_id": owner_id} if owner_id else {}
    device_ids = [d["device_id"] for d in db[DEVICES].find(device_filter, {"device_id": 1})]
    reading_filter = {"device_id": {"$in": device_ids}} if owner_id else {}

    pipeline = [
        {"$match": reading_filter},
        {
            "$group": {
                "_id": "$crop_type",
                "readings": {"$sum": 1},
                "avg_health_score": {"$avg": "$health_score"},
            }
        },
        {"$sort": {"readings": -1}},
    ]
    rows = list(db[SENSOR_READINGS].aggregate(pipeline))
    return [
        {
            "crop_type": r.get("_id", "unknown"),
            "readings": r.get("readings", 0),
            "avg_health_score": round(float(r.get("avg_health_score", 0.0)), 2),
        }
        for r in rows
    ]
