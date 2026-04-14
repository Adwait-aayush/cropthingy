from flask import request, g

from app.schemas.device_schema import validate_device_payload
from app.services.device_service import register_device
from app.utils.response import success_response, error_response


def register():
    payload = request.get_json(force=True)
    try:
        validate_device_payload(payload)
        data = register_device(payload, g.user["user_id"])
        return success_response(data, "Device registered", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)
