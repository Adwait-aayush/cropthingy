from flask import Blueprint

from app.controllers.user_controller import profile
from app.middleware.auth_middleware import jwt_required


user_bp = Blueprint("users", __name__)

user_bp.get("/profile")(jwt_required(profile))
