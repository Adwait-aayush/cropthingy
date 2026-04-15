from __future__ import annotations

from app.db.mongo import get_db
from app.db.collections import SENSOR_READINGS, PREDICTIONS, DEVICES
from app.utils.helpers import utc_now_iso


def model_predict(temperature: float, humidity: float, soil_moisture: float, crop_type: str):
    """Simple health score calculation based on sensor readings."""
    score = 50.0  # Base score
    
    # Temperature adjustment (ideal 20-30°C)
    if 20 <= temperature <= 30:
        score += 20
    elif 15 <= temperature <= 35:
        score += 10
    
    # Humidity adjustment (ideal 40-70%)
    if 40 <= humidity <= 70:
        score += 20
    elif 30 <= humidity <= 80:
        score += 10
    
    # Soil moisture adjustment (ideal 40-60%)
    if 40 <= soil_moisture <= 60:
        score += 30
    elif 30 <= soil_moisture <= 70:
        score += 15
    
    return min(100.0, score), "mock-health-calculator"


def _recommendation(score: float) -> str:
    if score >= 80:
        return "Crop conditions are good. Keep current irrigation and monitor daily."
    if score >= 60:
        return "Moderate risk. Slightly increase monitoring and adjust irrigation schedule."
    return "High stress detected. Irrigate soon and inspect for disease or nutrient issues."


def compute_prediction_for_device(device_id: str):
    db = get_db()
    latest = db[SENSOR_READINGS].find_one({"device_id": device_id}, sort=[("_id", -1)])
    if not latest:
        raise ValueError(f"No sensor readings found for device {device_id}")

    # Robust field extraction to support manually inserted mock data
    temp = float(latest.get("temperature", latest.get("temp", 28.0)))
    hum = float(latest.get("humidity", latest.get("hum", 60.0)))
    soil = float(latest.get("soil_moisture", latest.get("soil", 45.0)))

    # Fetch device details to get the crop type
    device = db[DEVICES].find_one({"device_id": device_id})
    crop_type = device.get("crop_type", "wheat") if device else "wheat"

    pred_score, model_used = model_predict(
        temperature=temp,
        humidity=hum,
        soil_moisture=soil,
        crop_type=crop_type
    )

    doc = {
        "device_id": device_id,
        "source_reading_id": str(latest["_id"]),
        "health_score": round(float(pred_score), 2),
        "recommendation": _recommendation(float(pred_score)),
        "model_used": model_used,
        "created_at": utc_now_iso(),
        "is_partial": "temperature" not in latest or "humidity" not in latest or "soil_moisture" not in latest
    }

    result = db[PREDICTIONS].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc




def get_latest_prediction(device_id: str):
    db = get_db()
    pred = db[PREDICTIONS].find_one({"device_id": device_id}, sort=[("_id", -1)])
    if pred:
        return pred
    return compute_prediction_for_device(device_id)


def get_prediction_history(device_id: str, limit: int = 50):
    db = get_db()
    cursor = db[PREDICTIONS].find({"device_id": device_id}, sort=[("_id", -1)]).limit(limit)
    return list(cursor)
