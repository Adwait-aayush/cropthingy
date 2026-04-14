from __future__ import annotations

import os
import joblib
import numpy as np
from flask import current_app


_loaded_model = None
_model_error = None


def _load_model_once():
    global _loaded_model, _model_error
    if _loaded_model is not None or _model_error is not None:
        return

    model_path = current_app.config["MODEL_PATH"]
    if not os.path.exists(model_path):
        _model_error = f"model_not_found:{model_path}"
        return

    try:
        _loaded_model = joblib.load(model_path)
    except Exception as exc:
        _model_error = str(exc)


def _heuristic_score(temperature: float, humidity: float, soil_moisture: float) -> float:
    temp_score = max(0.0, 100.0 - abs(28.0 - temperature) * 5.0)
    humidity_score = max(0.0, 100.0 - abs(60.0 - humidity) * 1.2)
    soil_score = max(0.0, 100.0 - abs(55.0 - soil_moisture) * 1.7)
    return (temp_score + humidity_score + soil_score) / 3.0


def model_predict(temperature: float, humidity: float, soil_moisture: float):
    _load_model_once()
    features = np.array([[temperature, humidity, soil_moisture]], dtype=float)

    if _loaded_model is not None:
        prediction = float(_loaded_model.predict(features)[0])
        return max(0.0, min(100.0, prediction)), "trained_model"

    return _heuristic_score(temperature, humidity, soil_moisture), "heuristic_fallback"
