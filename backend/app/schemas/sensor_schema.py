def validate_sensor_payload(payload: dict):
    required = ["device_id", "temperature", "humidity", "soil_moisture"]
    missing = [k for k in required if payload.get(k) is None]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
