from flask import Blueprint

from app.controllers.auth_controller import register, login


auth_bp = Blueprint("auth", __name__)

auth_bp.post("/register")(register)
auth_bp.post("/login")(login)
