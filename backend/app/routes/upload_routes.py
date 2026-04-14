from flask import Blueprint

from app.controllers.upload_controller import upload_csv, upload_report, files, download
from app.middleware.auth_middleware import jwt_required


upload_bp = Blueprint("uploads", __name__)

upload_bp.post("/csv")(jwt_required(upload_csv))
upload_bp.post("/report")(jwt_required(upload_report))
upload_bp.get("/files")(jwt_required(files))
upload_bp.get("/download/<file_id>")(jwt_required(download))
