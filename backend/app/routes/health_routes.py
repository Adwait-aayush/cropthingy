from flask import Blueprint

from app.controllers.health_controller import health, health_db, health_storage


health_bp = Blueprint("health", __name__)

health_bp.get("")(health)
health_bp.get("/")(health)
health_bp.get("/db")(health_db)
health_bp.get("/storage")(health_storage)
