from flask import Blueprint

from app.controllers.device_controller import register, list_devices
from app.middleware.auth_middleware import jwt_required


device_bp = Blueprint("devices", __name__)

device_bp.post("/register")(jwt_required(register))
device_bp.route("/", methods=["GET"])(jwt_required(list_devices))

