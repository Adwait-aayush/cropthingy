import secrets

from app.db.mongo import get_db
from app.db.collections import DEVICES
from app.utils.helpers import utc_now_iso
from app.utils.logger import get_logger

logger = get_logger(__name__)


def _is_claimed_device(doc: dict) -> bool:
    """Support legacy docs where claimed may be missing but owner_id is present."""
    return bool(doc.get("claimed", False) or doc.get("owner_id"))


def get_available_devices(owner_id: str = None):
    """Get list of unclaimed devices available to claim.
    If owner_id provided, returns user's auto-provisioned unclaimed devices (for Claim Devices section).
    """
    db = get_db()
    devices = db[DEVICES]
    
    if owner_id:
        # User's auto-provisioned but unclaimed devices
        query = {
            "claimed": False,
            "owner_id": {"$exists": False},
            "device_id": {"$regex": f"^{owner_id}_"},  # Match user's provisioned devices
        }
    else:
        # All unclaimed devices (public)
        query = {"claimed": False}
    
    cursor = devices.find(query)
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


def create_user_device(user_id: str, crop_type: str):
    """Create a single device for user by crop type (on-demand, not bulk)."""
    crops_map = {
        "rice": {"type": "rice", "name": "Rice Field"},
        "wheat": {"type": "wheat", "name": "Wheat Field"},
        "maize": {"type": "maize", "name": "Maize Field"},
        "vegetables": {"type": "vegetables", "name": "Vegetable Plot"},
        "pulses": {"type": "pulses", "name": "Pulses Field"},
    }
    
    if crop_type.lower() not in crops_map:
        raise ValueError(f"Invalid crop type: {crop_type}")
    
    crop = crops_map[crop_type.lower()]
    device_id = f"{user_id}_{crop['type'].upper()}"
    
    db = get_db()
    devices = db[DEVICES]
    sessions = db["user_sessions"]
    timestamp = utc_now_iso()
    
    # Check if device already exists for this crop type
    existing = devices.find_one({"device_id": device_id})
    if existing:
        logger.warning(f"⚠️ Device {device_id} already exists")
        raise ValueError(f"You already have a device for {crop['name']}")
    
    # Create device with both legacy and current field names for compatibility.
    device_doc = {
        "device_id": device_id,
        "owner_id": user_id,
        "name": crop["name"],
        "device_name": crop["name"],
        "crop_type": crop["type"],
        "device_type": crop["type"],
        "location": "unknown",
        "claimed": True,
        "status": "active",
        "created_at": timestamp,
    }
    result = devices.insert_one(device_doc)
    device_doc["_id"] = result.inserted_id
    
    logger.info(f"✅ Created device: {device_id}")
    
    # Set as active device if it's the first one
    session = sessions.find_one({"user_id": user_id})
    if not session or not session.get("active_device_id"):
        sessions.update_one(
            {"user_id": user_id},
            {"$set": {
                "active_device_id": device_id,
                "last_updated": timestamp,
            }},
            upsert=True,
        )
        logger.info(f"✅ Set {device_id} as active device for user {user_id}")
    
    return {
        "id": str(device_doc["_id"]),
        "device_id": device_doc["device_id"],
        "name": device_doc["name"],
        "device_name": device_doc["device_name"],
        "crop_type": device_doc["crop_type"],
        "device_type": device_doc["device_type"],
        "location": device_doc["location"],
        "status": device_doc["status"],
        "created_at": device_doc["created_at"],
    }


def get_user_devices(owner_id: str):
    """Get all devices owned by user (session-based, no claiming needed)."""
    db = get_db()
    cursor = db[DEVICES].find({"owner_id": owner_id})
    return [
        {
            "id": str(doc["_id"]),
            "device_id": doc["device_id"],
            "name": doc.get("name", doc.get("device_name")),
            "device_name": doc.get("device_name", doc.get("name")),
            "crop_type": doc.get("crop_type", doc.get("device_type")),
            "device_type": doc.get("device_type", doc.get("crop_type")),
            "location": doc.get("location", "unknown"),
            "status": doc.get("status", "active"),
            "created_at": doc.get("created_at"),
        }
        for doc in cursor
    ]


def get_device_details(device_id: str, owner_id: str):
    """Get full details of a claimed device including latest sensor reading and predictions."""
    db = get_db()
    device = db[DEVICES].find_one({"device_id": device_id, "owner_id": owner_id})
    if not device:
        raise ValueError("Device not found or not owned by user")
    
    from app.db.collections import SENSOR_READINGS, PREDICTIONS
    
    # Get latest sensor reading
    latest_reading = db[SENSOR_READINGS].find_one({"device_id": device_id}, sort=[("_id", -1)])
    
    # Get latest prediction
    latest_prediction = db[PREDICTIONS].find_one({"device_id": device_id}, sort=[("_id", -1)])
    
    return {
        "id": str(device["_id"]),
        "device_id": device["device_id"],
        "name": device["name"],
        "crop_type": device["crop_type"],
        "location": device["location"],
        "api_key": device.get("api_key"),
        "created_at": device.get("created_at"),
        "claimed_at": device.get("claimed_at"),
        "latest_reading": {
            "timestamp": latest_reading.get("timestamp") if latest_reading else None,
            "temperature": latest_reading.get("temperature") if latest_reading else None,
            "humidity": latest_reading.get("humidity") if latest_reading else None,
            "soil_moisture": latest_reading.get("soil_moisture") if latest_reading else None,
            "raw_soil_score": latest_reading.get("raw_soil_score") if latest_reading else None,
        } if latest_reading else None,
        "latest_prediction": {
            "health_score": latest_prediction.get("health_score") if latest_prediction else None,
            "irrigation_needed": latest_prediction.get("irrigation_needed") if latest_prediction else None,
            "recommendation": latest_prediction.get("recommendation") if latest_prediction else None,
            "created_at": latest_prediction.get("created_at") if latest_prediction else None,
        } if latest_prediction else None,
    }

