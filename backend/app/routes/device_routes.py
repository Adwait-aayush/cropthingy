from flask import Blueprint

from app.controllers.device_controller import register, list_devices, list_available, claim, get_details, create_device
from app.middleware.auth_middleware import jwt_required


device_bp = Blueprint("devices", __name__)

# Create new device by selecting crop type (MUST BE BEFORE get_details wildcard route!)
device_bp.post("/create")(jwt_required(create_device))

# Claim a device
device_bp.post("/claim")(jwt_required(claim))

# Legacy endpoint - kept for backward compatibility
device_bp.post("/register")(jwt_required(register))

# User's unclaimed devices to claim (for Claim Devices section)
device_bp.get("/available")(jwt_required(list_available))

# User's claimed devices (for Manage Devices / Active Sensor Network)
device_bp.get("/")(jwt_required(list_devices))

# Get details of a claimed device (with latest sensor reading and predictions) - MUST BE LAST!
device_bp.get("/<device_id>")(jwt_required(get_details))

