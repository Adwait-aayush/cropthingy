from app.db.mongo import get_db
from app.db.collections import DEVICES
from app.utils.helpers import utc_now_iso


def set_active_device(user_id: str, device_id: str):
    """Set the currently active device for a user.
    When serial bridge sends sensor data, it will be tagged with this device.
    """
    db = get_db()
    devices = db[DEVICES]
    
    # Verify device is owned by user
    device = devices.find_one({"device_id": device_id, "owner_id": user_id})
    if not device:
        raise ValueError("Device not found or not owned by user")
    
    # Store active device in a simple sessions collection or in devices collection
    # For simplicity, we'll use a sessions collection
    sessions = db["user_sessions"]
    
    result = sessions.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "active_device_id": device_id,
                "last_updated": utc_now_iso(),
            }
        },
        upsert=True,
    )
    
    return {
        "user_id": user_id,
        "active_device_id": device_id,
        "last_updated": utc_now_iso(),
    }


def get_active_device(user_id: str):
    """Get the currently active device for a user."""
    db = get_db()
    sessions = db["user_sessions"]
    devices = db[DEVICES]
    
    session = sessions.find_one({"user_id": user_id})
    if session and session.get("active_device_id"):
        active_device_id = session["active_device_id"]
        # Ensure active device still belongs to the user.
        if devices.find_one({"device_id": active_device_id, "owner_id": user_id}):
            return active_device_id

    # No valid active session entry yet: fall back to first owned device.
    first_device = devices.find_one(
        {"owner_id": user_id},
        sort=[("created_at", 1)],
    )
    if first_device:
        return first_device["device_id"]

    return None
