from __future__ import annotations

from app.db.mongo import get_db
from app.db.collections import SENSOR_READINGS, PREDICTIONS
from app.ml.crop_health_model import model_predict
from app.utils.helpers import utc_now_iso


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
        raise ValueError("No sensor readings found for device")

    pred_score, model_used = model_predict(
        temperature=float(latest["temperature"]),
        humidity=float(latest["humidity"]),
        soil_moisture=float(latest["soil_moisture"]),
    )

    doc = {
        "device_id": device_id,
        "source_reading_id": str(latest["_id"]),
        "health_score": round(float(pred_score), 2),
        "recommendation": _recommendation(float(pred_score)),
        "model_used": model_used,
        "created_at": utc_now_iso(),
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
