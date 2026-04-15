from flask import request, g

from app.schemas.device_schema import validate_device_payload, validate_claim_device_payload
from app.services.device_service import (
    register_device,
    get_user_devices,
    get_available_devices,
    claim_device,
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
    """List all devices claimed by the current user"""
    devices = get_user_devices(g.user["user_id"])
    return success_response(devices, "Devices fetched")


def list_available():
    """List all unclaimed devices available to claim"""
    try:
        devices = get_available_devices()
        return success_response(devices, "Available devices fetched")
    except ValueError as exc:
        return error_response(str(exc), 400)


def claim():
    """Claim an unclaimed device"""
    payload = request.get_json(force=True)
    try:
        validate_claim_device_payload(payload)
        data = claim_device(payload["device_id"], g.user["user_id"])
        return success_response(data, "Device claimed successfully", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)

