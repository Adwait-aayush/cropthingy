def serialize_prediction(pred: dict) -> dict:
    return {
        "id": str(pred.get("_id")),
        "device_id": pred.get("device_id"),
        "source_reading_id": pred.get("source_reading_id"),
        "health_score": pred.get("health_score"),
        "recommendation": pred.get("recommendation"),
        "temperature": pred.get("temperature"),
        "humidity": pred.get("humidity"),
        "soil_moisture": pred.get("soil_moisture"),
        "crop": pred.get("crop"),
        "irrigation": pred.get("irrigation"),
        "probability": pred.get("probability"),
        "model_used": pred.get("model_used"),
        "created_at": pred.get("created_at"),
    }
