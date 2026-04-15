import secrets

from app.db.mongo import get_db
from app.db.collections import DEVICES
from app.utils.helpers import utc_now_iso


def _is_claimed_device(doc: dict) -> bool:
    """Support legacy docs where claimed may be missing but owner_id is present."""
    return bool(doc.get("claimed", False) or doc.get("owner_id"))


def get_available_devices():
    """Get list of unclaimed devices available to claim"""
    db = get_db()
    devices = db[DEVICES]
    cursor = devices.find(
        {
            "$or": [
                {"claimed": False},
                {
                    "$and": [
                        {"claimed": {"$exists": False}},
                        {
                            "$or": [
                                {"owner_id": {"$exists": False}},
                                {"owner_id": None},
                                {"owner_id": ""},
                            ]
                        },
                    ]
                },
            ]
        }
    )
    return [
        {
            "id": str(doc["_id"]),
            "device_id": doc["device_id"],
            "name": doc["name"],
            "crop_type": doc["crop_type"],
            "location": doc["location"],
        }
        for doc in cursor
    ]


def claim_device(device_id: str, owner_id: str):
    """Claim an unclaimed device by setting owner_id and claimed flag"""
    db = get_db()
    devices = db[DEVICES]

    # Find the device
    device = devices.find_one({"device_id": device_id})
    if not device:
        raise ValueError("Device not found")
    
    # Check if already claimed
    if _is_claimed_device(device):
        raise ValueError("Device already claimed by another user")
    
    # Claim the device
    api_key = secrets.token_hex(24)
    result = devices.update_one(
        {"device_id": device_id},
        {
            "$set": {
                "owner_id": owner_id,
                "claimed": True,
                "api_key": api_key,
                "claimed_at": utc_now_iso(),
            }
        },
    )

    if result.matched_count == 0:
        raise ValueError("Device not found")

    # Fetch and return updated device
    claimed_device = devices.find_one({"device_id": device_id})
    return {
        "id": str(claimed_device["_id"]),
        "device_id": claimed_device["device_id"],
        "name": claimed_device["name"],
        "crop_type": claimed_device["crop_type"],
        "location": claimed_device["location"],
        "api_key": claimed_device["api_key"],
        "claimed_at": claimed_device.get("claimed_at"),
    }


def register_device(payload: dict, owner_id: str):
    """Register a device in unclaimed state with the standard device schema."""
    db = get_db()
    devices = db[DEVICES]

    if devices.find_one({"device_id": payload["device_id"]}):
        raise ValueError("Device ID already exists")

    device_doc = {
        "device_id": payload["device_id"],
        "name": payload["name"],
        "crop_type": payload["crop_type"],
        "location": payload["location"],
        "claimed": False,
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
        "claimed": device_doc["claimed"],
        "created_at": device_doc["created_at"],
    }


def get_user_devices(owner_id: str):
    db = get_db()
    cursor = db[DEVICES].find(
        {
            "owner_id": owner_id,
            "$or": [
                {"claimed": True},
                {"claimed": {"$exists": False}},
            ],
        }
    )
    return [
        {
            "id": str(doc["_id"]),
            "device_id": doc["device_id"],
            "name": doc["name"],
            "crop_type": doc["crop_type"],
            "location": doc["location"],
            "api_key": doc.get("api_key"),
            "created_at": doc.get("created_at"),
            "claimed_at": doc.get("claimed_at"),
        }
        for doc in cursor
    ]

