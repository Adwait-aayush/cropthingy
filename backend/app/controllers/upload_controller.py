from flask import request, send_file

from app.services.upload_service import save_upload, list_files, get_file_by_id
from app.utils.response import success_response, error_response


def _serialize(doc: dict):
    return {
        "id": str(doc.get("_id")),
        "filename": doc.get("filename"),
        "original_name": doc.get("original_name"),
        "content_type": doc.get("content_type"),
        "size": doc.get("size"),
        "category": doc.get("category"),
        "s3_key": doc.get("s3_key"),
        "created_at": doc.get("created_at"),
    }


def upload_csv():
    file = request.files.get("file")
    if not file:
        return error_response("No file uploaded", 400)
    doc = save_upload(file, "csv")
    return success_response(_serialize(doc), "CSV uploaded", 201)


def upload_report():
    file = request.files.get("file")
    if not file:
        return error_response("No file uploaded", 400)
    doc = save_upload(file, "report")
    return success_response(_serialize(doc), "Report uploaded", 201)


def files():
    rows = [_serialize(d) for d in list_files()]
    return success_response(rows, "Files fetched")


def download(file_id: str):
    doc = get_file_by_id(file_id)
    if not doc:
        return error_response("File not found", 404)

    return send_file(
        doc["path"],
        mimetype=doc.get("content_type") or "application/octet-stream",
        as_attachment=True,
        download_name=doc.get("original_name") or doc.get("filename"),
    )
