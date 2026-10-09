from flask import Blueprint

from app.controllers.session_controller import set_active, get_active
from app.middleware.auth_middleware import jwt_required


session_bp = Blueprint("sessions", __name__)

# Set active device for current user
session_bp.post("/set-active-device")(jwt_required(set_active))

# Get active device for current user
session_bp.get("/get-active-device")(jwt_required(get_active))
