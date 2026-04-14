from __future__ import annotations

import os
from datetime import datetime
from bson import ObjectId
from flask import current_app

from app.db.mongo import get_db
from app.db.collections import UPLOADS, REPORTS
from app.services.s3_service import upload_binary


def _ensure_upload_dir() -> str:
    upload_dir = current_app.config["UPLOAD_DIR"]
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


def save_upload(file_storage, category: str):
    upload_dir = _ensure_upload_dir()
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    safe_name = f"{timestamp}_{file_storage.filename}"
    full_path = os.path.join(upload_dir, safe_name)
    file_storage.save(full_path)

    with open(full_path, "rb") as f:
        raw = f.read()

    s3_key = upload_binary(category, safe_name, raw, file_storage.mimetype or "application/octet-stream")

    db = get_db()
    doc = {
        "filename": safe_name,
        "original_name": file_storage.filename,
        "content_type": file_storage.mimetype,
        "size": len(raw),
        "path": full_path,
        "category": category,
        "s3_key": s3_key,
        "created_at": datetime.utcnow().isoformat(),
    }
    collection = UPLOADS if category == "csv" else REPORTS
    result = db[collection].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def list_files():
    db = get_db()
    items = list(db[UPLOADS].find().sort("_id", -1)) + list(db[REPORTS].find().sort("_id", -1))
    items.sort(key=lambda x: str(x.get("_id")), reverse=True)
    return items


def get_file_by_id(file_id: str):
    db = get_db()
    oid = ObjectId(file_id)
    doc = db[UPLOADS].find_one({"_id": oid})
    if doc:
        return doc
    return db[REPORTS].find_one({"_id": oid})
