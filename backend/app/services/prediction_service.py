from __future__ import annotations

from app.db.mongo import get_db
from app.db.collections import SENSOR_READINGS, PREDICTIONS, DEVICES
# from app.ml.crop_health_model import model_predict
from app.db.collections import SENSOR_READINGS, PREDICTIONS
from app.services.irrigation_prediction_service import predict_irrigation
from app.utils.helpers import utc_now_iso


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
        "source_reading_id": pred.get("source_reading_id") or str(latest["_id"]),
        "temperature": pred["temperature"],
        "humidity": pred["humidity"],
        "soil_moisture": pred["soil_moisture"],
        "crop": pred["crop"],
        "irrigation": pred["irrigation"],
        "probability": pred["probability"],
        "model_used": pred["model_used"],
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
