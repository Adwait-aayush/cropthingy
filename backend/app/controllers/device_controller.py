from flask import request, g

from app.schemas.device_schema import validate_device_payload, validate_claim_device_payload
from app.services.device_service import (
    register_device,
    get_user_devices,
    get_available_devices,
    get_device_details,
    claim_device,
    create_user_device,
)
from app.utils.response import success_response, error_response


def register():
    """Legacy endpoint - kept for backward compatibility"""
    payload = request.get_json(force=True)
    try:
        validate_device_payload(payload)
        data = register_device(payload, g.user["user_id"])
        return success_response(data, "Device registered", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


def list_devices():
    """List all claimed devices for the current user"""
    devices = get_user_devices(g.user["user_id"])
    return success_response(devices, "Devices fetched")


def list_available():
    """List all unclaimed devices available to claim for current user"""
    try:
        devices = get_available_devices(g.user["user_id"])
        return success_response(devices, "Available devices fetched")
    except ValueError as exc:
        return error_response(str(exc), 400)


def get_details(device_id: str):
    """Get full details of a claimed device including latest sensor reading and predictions"""
    try:
        data = get_device_details(device_id, g.user["user_id"])
        return success_response(data, "Device details fetched")
    except ValueError as exc:
        return error_response(str(exc), 404)


def claim():
    """Claim an unclaimed device"""
    payload = request.get_json(force=True)
    try:
        validate_claim_device_payload(payload)
        data = claim_device(payload["device_id"], g.user["user_id"])
        return success_response(data, "Device claimed successfully", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


def create_device():
    """Create a new device for user by selecting a crop type"""
    payload = request.get_json(force=True)
    try:
        crop_type = payload.get("crop_type", "").strip().lower()
        if not crop_type:
            return error_response("crop_type is required", 400)
        
        data = create_user_device(g.user["user_id"], crop_type)
        return success_response(data, "Device created successfully", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)
    except Exception as exc:
        return error_response(f"Failed to create device: {str(exc)}", 500)

