def validate_device_payload(payload: dict):
    required = ["device_id", "name", "crop_type", "location"]
    missing = [k for k in required if not payload.get(k)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
