from functools import wraps
import jwt
from flask import request, g, current_app

from app.utils.helpers import decode_jwt
from app.utils.helpers import utc_now_iso
from app.utils.response import error_response
from app.db.mongo import get_db
from app.db.collections import DEVICES


def jwt_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return error_response("Missing Bearer token", 401)

        token = auth_header.split(" ", 1)[1]
        try:
            payload = decode_jwt(token)
            g.user = payload
        except jwt.ExpiredSignatureError:
            return error_response("Token expired", 401)
        except jwt.InvalidTokenError:
            return error_response("Invalid token", 401)

        return fn(*args, **kwargs)

    return wrapper


def device_api_key_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        api_key = request.headers.get("X-API-KEY", "")
        device_id = (request.get_json(silent=True) or {}).get("device_id")
        if not api_key or not device_id:
            return error_response("X-API-KEY header and device_id are required", 401)

        db = get_db()
        devices = db[DEVICES]
        now = utc_now_iso()
        device = devices.find_one({"device_id": device_id})

        master_key = current_app.config["DEVICE_MASTER_API_KEY"]
        if not device:
            if api_key != master_key:
                return error_response("Device not registered", 404)

            # First data from a field unit can bootstrap an unclaimed device record.
            devices.update_one(
                {"device_id": device_id},
                {
                    "$setOnInsert": {
                        "device_id": device_id,
                        "name": f"Auto {device_id}",
                        "crop_type": "unknown",
                        "location": "unknown",
                        "claimed": False,
                        "created_at": now,
                    },
                },
                upsert=True,
            )
            device = devices.find_one({"device_id": device_id})

        accepted_keys = {master_key}
        if device.get("api_key"):
            accepted_keys.add(device["api_key"])

        if api_key not in accepted_keys:
            return error_response("Invalid API key for device", 401)

        g.device = device
        return fn(*args, **kwargs)

    return wrapper
