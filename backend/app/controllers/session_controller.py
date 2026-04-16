from flask import request, g

from app.services.session_service import set_active_device, get_active_device
from app.utils.response import success_response, error_response


def set_active():
    """Set the currently active device for the user."""
    payload = request.get_json(force=True)
    try:
        device_id = payload.get("device_id")
        if not device_id:
            raise ValueError("device_id is required")
        
        data = set_active_device(g.user["user_id"], device_id)
        return success_response(data, "Active device set successfully", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


def get_active():
    """Get the currently active device for the user."""
    try:
        active_device_id = get_active_device(g.user["user_id"])
        if not active_device_id:
            return error_response("No active device set", 404)
        
        return success_response(
            {"active_device_id": active_device_id},
            "Active device retrieved"
        )
    except ValueError as exc:
        return error_response(str(exc), 400)
