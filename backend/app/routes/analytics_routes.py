from flask import Blueprint

from app.controllers.analytics_controller import summary, trends, crop_overview
from app.middleware.auth_middleware import jwt_required


analytics_bp = Blueprint("analytics", __name__)

analytics_bp.get("/summary")(jwt_required(summary))
analytics_bp.get("/trends/<device_id>")(jwt_required(trends))
analytics_bp.get("/crop-overview")(jwt_required(crop_overview))
