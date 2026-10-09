def serialize_prediction(pred: dict) -> dict:
    return {
        "id": str(pred.get("_id")),
        "device_id": pred.get("device_id"),
        "health_score": pred.get("health_score"),
        "recommendation": pred.get("recommendation"),
        "model_used": pred.get("model_used"),
        "irrigation_needed": pred.get("irrigation_needed"),
        "irrigation_model": pred.get("irrigation_model"),
        "created_at": pred.get("created_at"),
    }
