def validate_sensor_payload(payload: dict):
    required = ["device_id", "temperature", "humidity", "soil_moisture", "raw_soil_score"]
    missing = [k for k in required if payload.get(k) is None]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
    
    # Validate numeric ranges
    try:
        temp = float(payload["temperature"])
        hum = float(payload["humidity"])
        soil = float(payload["soil_moisture"])
        raw_soil = float(payload["raw_soil_score"])
        
        # Soil moisture should be 0-100%
        if not (0 <= soil <= 100):
            raise ValueError("soil_moisture must be between 0 and 100")
        
        # Raw soil score should be 0-1023 (analog range)
        if not (0 <= raw_soil <= 1023):
            raise ValueError("raw_soil_score must be between 0 and 1023")
            
    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid numeric value: {str(e)}")
