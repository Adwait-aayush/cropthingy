from flask import Blueprint

from app.controllers.prediction_controller import latest, history, recompute
from app.middleware.auth_middleware import jwt_required


prediction_bp = Blueprint("predictions", __name__)

prediction_bp.get("/<device_id>")(jwt_required(latest))
prediction_bp.get("/history/<device_id>")(jwt_required(history))
prediction_bp.post("/recompute/<device_id>")(jwt_required(recompute))
