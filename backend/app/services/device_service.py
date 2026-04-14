import secrets

from app.db.mongo import get_db
from app.db.collections import DEVICES
from app.utils.helpers import utc_now_iso


def register_device(payload: dict, owner_id: str):
    db = get_db()
    devices = db[DEVICES]

    if devices.find_one({"device_id": payload["device_id"]}):
        raise ValueError("Device ID already exists")

    device_doc = {
        "device_id": payload["device_id"],
        "name": payload["name"],
        "crop_type": payload["crop_type"],
        "location": payload["location"],
        "owner_id": owner_id,
        "metadata": payload.get("metadata", {}),
        "api_key": secrets.token_hex(24),
        "created_at": utc_now_iso(),
    }
    result = devices.insert_one(device_doc)
    device_doc["_id"] = result.inserted_id
    return {
        "id": str(device_doc["_id"]),
        "device_id": device_doc["device_id"],
        "name": device_doc["name"],
        "crop_type": device_doc["crop_type"],
        "location": device_doc["location"],
        "api_key": device_doc["api_key"],
        "created_at": device_doc["created_at"],
    }


def get_user_devices(owner_id: str):
    db = get_db()
    cursor = db[DEVICES].find({"owner_id": owner_id})
    return [
        {
            "id": str(doc["_id"]),
            "device_id": doc["device_id"],
            "name": doc["name"],
            "crop_type": doc["crop_type"],
            "location": doc["location"],
            "created_at": doc.get("created_at"),
        }
        for doc in cursor
    ]

