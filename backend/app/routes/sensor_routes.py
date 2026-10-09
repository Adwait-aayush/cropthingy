from flask import Blueprint

from app.controllers.sensor_controller import ingest, bulk_upload, latest, history, alerts
from app.middleware.auth_middleware import jwt_required


sensor_bp = Blueprint("sensors", __name__)

# Ingest: No auth required (backend checks active device session)
sensor_bp.post("/ingest")(ingest)

# Other endpoints: Require JWT authentication
sensor_bp.post("/bulk-upload")(jwt_required(bulk_upload))
sensor_bp.get("/latest/<device_id>")(jwt_required(latest))
sensor_bp.get("/history/<device_id>")(jwt_required(history))
sensor_bp.get("/alerts/<device_id>")(jwt_required(alerts))
