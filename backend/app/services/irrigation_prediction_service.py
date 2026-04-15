from __future__ import annotations

import os
import pickle

import numpy as np
from flask import current_app
from tensorflow.keras.models import load_model

from app.db.collections import DEVICES, SENSOR_READINGS
from app.db.mongo import get_db


_loaded_model = None
_loaded_scaler = None
_model_error = None

_CROP_MAP = {"rice": 0, "wheat": 1, "maize": 2, "vegetables": 3, "pulses": 4}


def _load_artifacts_once():
    global _loaded_model, _loaded_scaler, _model_error
    if _loaded_model is not None and _loaded_scaler is not None:
        return
    if _model_error is not None:
        return

    model_path = current_app.config["IRRIGATION_MODEL_PATH"]
    scaler_path = current_app.config["IRRIGATION_SCALER_PATH"]

    if not os.path.exists(model_path):
        _model_error = f"model_not_found:{model_path}"
        return
    if not os.path.exists(scaler_path):
        _model_error = f"scaler_not_found:{scaler_path}"
        return

    try:
        _loaded_model = load_model(model_path)
        with open(scaler_path, "rb") as handle:
            _loaded_scaler = pickle.load(handle)
    except Exception as exc:
        _model_error = str(exc)


def _normalize_crop(crop_value) -> float:
    if crop_value is None:
        raise ValueError("crop is required")

    crop_key = str(crop_value).strip().lower()
    if crop_key not in _CROP_MAP:
        raise ValueError("crop must be one of: rice, wheat, maize, vegetables, pulses")

    return float(_CROP_MAP[crop_key])


def _normalize_soil(soil_value) -> float:
    if soil_value is None:
        raise ValueError("soil is required")

    soil = float(soil_value)
    if soil < 0:
        raise ValueError("soil must be non-negative")

    if soil <= 1.5:
        return soil
    if soil <= 100.0:
        return soil / 100.0
    return max(0.0, min(1.0, 1.0 - (soil / 1023.0)))


def _resolve_payload(payload: dict) -> tuple[float, float, float, float, str | None, str | None]:
    device_id = payload.get("device_id")

    if device_id:
        db = get_db()
        reading = db[SENSOR_READINGS].find_one({"device_id": device_id}, sort=[("_id", -1)])
        if not reading:
            raise LookupError("No sensor readings found for device")

        device = db[DEVICES].find_one({"device_id": device_id}) or {}

        temperature = float(reading["temperature"])
        humidity = float(reading["humidity"])
        soil = _normalize_soil(reading["soil_moisture"])
        crop_value = reading.get("crop_type") or device.get("crop_type")
        crop = _normalize_crop(crop_value)
        return temperature, humidity, soil, crop, device_id, str(reading.get("_id"))

    temperature = payload.get("temperature", payload.get("temp"))
    humidity = payload.get("humidity")
    soil_value = payload.get("soil_moisture", payload.get("soil"))
    crop_value = payload.get("crop_type", payload.get("crop"))

    if temperature is None:
        raise ValueError("temperature is required")
    if humidity is None:
        raise ValueError("humidity is required")

    return float(temperature), float(humidity), _normalize_soil(soil_value), _normalize_crop(crop_value), None, None


def predict_irrigation(payload: dict) -> dict:
    _load_artifacts_once()
    if _model_error is not None:
        raise RuntimeError(_model_error)

    temperature, humidity, soil, crop, device_id, source_reading_id = _resolve_payload(payload)
    features = np.array([[temperature, humidity, soil, crop]], dtype=float)
    scaled_features = _loaded_scaler.transform(features)
    prediction = _loaded_model.predict(scaled_features, verbose=0)
    probability = float(np.ravel(prediction)[0])
    irrigation = int(probability >= 0.5)

    return {
        "device_id": device_id,
        "source_reading_id": source_reading_id,
        "temperature": round(temperature, 3),
        "humidity": round(humidity, 3),
        "soil_moisture": round(soil, 6),
        "crop": int(crop),
        "irrigation": irrigation,
        "probability": round(probability, 4),
        "model_used": "trained_model",
    }