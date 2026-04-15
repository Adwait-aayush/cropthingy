from flask import Blueprint

from app.controllers.device_controller import register, list_devices, list_available, claim
from app.middleware.auth_middleware import jwt_required


device_bp = Blueprint("devices", __name__)

# Legacy endpoint - kept for backward compatibility
device_bp.post("/register")(jwt_required(register))

# User's claimed devices
device_bp.route("/", methods=["GET"])(jwt_required(list_devices))

# Available devices to claim (public)
device_bp.route("/available", methods=["GET"])(list_available)

# Claim a device
device_bp.post("/claim")(jwt_required(claim))

