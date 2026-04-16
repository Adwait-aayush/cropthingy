from __future__ import annotations

import os
import pickle
import numpy as np
from app.db.mongo import get_db
from app.db.collections import SENSOR_READINGS, PREDICTIONS, DEVICES
from app.utils.helpers import utc_now_iso

# Try to load trained model at module import time
_trained_model = None
_scaler = None

def _load_trained_model():
    """Lazy load the trained Keras model and scaler."""
    global _trained_model, _scaler
    if _trained_model is not None:
        return _trained_model, _scaler
    
    try:
        from tensorflow.keras.models import load_model
        model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'trained_models', 'irrigation_model.keras')
        scaler_path = os.path.join(os.path.dirname(__file__), '..', '..', 'trained_models', 'scaler.pkl')
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            _trained_model = load_model(model_path)
            with open(scaler_path, 'rb') as f:
                _scaler = pickle.load(f)
            return _trained_model, _scaler
    except Exception as e:
        print(f"Warning: Could not load trained model: {e}")
    
    return None, None


def _resolve_device_crop_type(device: dict | None, device_id: str) -> str:
    if device:
        crop_type = device.get("crop_type") or device.get("device_type")
        if crop_type:
            return str(crop_type).lower()

    if "_" in device_id:
        suffix = device_id.rsplit("_", 1)[-1].strip().lower()
        if suffix:
            return suffix

    return "wheat"


def model_predict_irrigation(temperature: float, humidity: float, raw_soil_score: float, crop_type: str) -> tuple[int, str]:
    """Predict irrigation need using trained Keras model."""
    model, scaler = _load_trained_model()
    if model is None or scaler is None:
        return 0, "model-unavailable"
    
    try:
        # Map crop type to numeric value
        crop_map = {"rice": 0, "wheat": 1, "maize": 2, "vegetables": 3, "pulses": 4}
        crop_numeric = crop_map.get(crop_type.lower(), 1)  # Default to wheat
        
        # Convert soil sensor reading (0-1023 raw analog) to normalized value
        soil_normalized = 1 - (raw_soil_score / 1023.0)
        
        # Prepare input
        input_data = np.array([[temperature, humidity, soil_normalized, crop_numeric]])
        input_scaled = scaler.transform(input_data)
        
        # Get prediction
        pred = model.predict(input_scaled, verbose=0)
        irrigation_needed = int(pred[0][0] > 0.5)
        
        return irrigation_needed, "trained-logistic-model"
    except Exception as e:
        print(f"Error in model prediction: {e}")
        return 0, "model-error"


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
    soil_moisture = float(latest.get("soil_moisture", latest.get("soil", 45.0)))
    raw_soil_score = float(latest.get("raw_soil_score", latest.get("raw_soil", 512.0)))

    # Fetch device details to get the crop type
    device = db[DEVICES].find_one({"device_id": device_id})
    crop_type = _resolve_device_crop_type(device, device_id)

    # Get rule-based health score (uses soil_moisture%)
    pred_score, model_used = model_predict(
        temperature=temp,
        humidity=hum,
        soil_moisture=soil_moisture,
        crop_type=crop_type
    )

    # Get trained model irrigation prediction (uses raw_soil_score 0-1023)
    irrigation_needed, irrigation_model = model_predict_irrigation(
        temperature=temp,
        humidity=hum,
        raw_soil_score=raw_soil_score,
        crop_type=crop_type
    )

    doc = {
        "device_id": device_id,
        "source_reading_id": str(latest["_id"]),
        "health_score": round(float(pred_score), 2),
        "recommendation": _recommendation(float(pred_score)),
        "model_used": model_used,
        "irrigation_needed": irrigation_needed,
        "irrigation_model": irrigation_model,
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
