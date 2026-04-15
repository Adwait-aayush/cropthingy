from flask import request

from app.schemas.prediction_schema import serialize_prediction
from app.services.prediction_service import (
    get_latest_prediction,
    get_prediction_history,
    compute_prediction_for_device,
)
from app.services.irrigation_prediction_service import predict_irrigation
from app.utils.response import success_response, error_response


def latest(device_id: str):
    try:
        pred = get_latest_prediction(device_id)
        return success_response(serialize_prediction(pred), "Prediction fetched")
    except ValueError as exc:
        return error_response(str(exc), 404)


def history(device_id: str):
    rows = [serialize_prediction(p) for p in get_prediction_history(device_id)]
    return success_response(rows, "Prediction history fetched")


def recompute(device_id: str):
    try:
        pred = compute_prediction_for_device(device_id)
        return success_response(serialize_prediction(pred), "Prediction recomputed", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


def irrigation():
    payload = request.get_json(silent=True) or {}

    try:
        result = predict_irrigation(payload)
        return success_response(result, "Irrigation prediction generated", 201)
    except LookupError as exc:
        return error_response(str(exc), 404)
    except ValueError as exc:
        return error_response(str(exc), 400)
    except RuntimeError as exc:
        return error_response(str(exc), 500)
