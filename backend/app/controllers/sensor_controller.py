from flask import request, g

from app.schemas.sensor_schema import validate_sensor_payload
from app.services.sensor_service import (
    ingest_sensor_reading,
    bulk_ingest_sensor_readings,
    get_latest_reading,
    get_history,
    get_alerts,
)
from app.utils.constants import MAX_HISTORY_LIMIT
from app.utils.response import success_response, error_response


def _serialize_reading(doc: dict):
    if not doc:
        return None
    return {
        "id": str(doc.get("_id")),
        "device_id": doc.get("device_id"),
        "owner_id": doc.get("owner_id"),
        "timestamp": doc.get("timestamp"),
        "temperature": doc.get("temperature"),
        "humidity": doc.get("humidity"),
        "soil_moisture": doc.get("soil_moisture"),
        "raw_soil_score": doc.get("raw_soil_score"),
        "crop_type": doc.get("crop_type"),
        "location": doc.get("location"),
        "health_score": doc.get("health_score"),
        "alerts": doc.get("alerts", []),
    }


def ingest():
    payload = request.get_json(force=True)
    try:
        validate_sensor_payload(payload)
        data = ingest_sensor_reading(payload)
        return success_response(data, "Sensor reading ingested", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


def bulk_upload():
    payload = request.get_json(force=True)
    try:
        data = bulk_ingest_sensor_readings(payload)
        return success_response(data, "Bulk upload complete", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


def latest(device_id: str):
    try:
        doc = get_latest_reading(device_id, g.user["user_id"])
        if not doc:
            return error_response("No readings found", 404)
        return success_response(_serialize_reading(doc), "Latest reading fetched")
    except ValueError as exc:
        return error_response(str(exc), 404)


def history(device_id: str):
    try:
        limit = int(request.args.get("limit", 100))
        limit = min(limit, MAX_HISTORY_LIMIT)
        rows = [_serialize_reading(d) for d in get_history(device_id, g.user["user_id"], limit)]
        return success_response(rows, "History fetched")
    except ValueError as exc:
        return error_response(str(exc), 404)


def alerts(device_id: str):
    try:
        limit = int(request.args.get("limit", 100))
        limit = min(limit, MAX_HISTORY_LIMIT)
        rows = [_serialize_reading(d) for d in get_alerts(device_id, g.user["user_id"], limit)]
        return success_response(rows, "Alerts fetched")
    except ValueError as exc:
        return error_response(str(exc), 404)
