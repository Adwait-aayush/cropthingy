from app.utils.constants import (
    ALERT_TEMP_HIGH,
    ALERT_TEMP_LOW,
    ALERT_HUMIDITY_LOW,
    ALERT_SOIL_LOW,
    ALERT_SOIL_HIGH,
)


def normalize_and_enrich(sensor_doc: dict) -> dict:
    temp = float(sensor_doc["temperature"])
    humidity = float(sensor_doc["humidity"])
    soil = float(sensor_doc["soil_moisture"])

    temp_score = max(0.0, 100.0 - abs(28.0 - temp) * 5.0)
    humidity_score = max(0.0, 100.0 - abs(60.0 - humidity) * 1.2)
    soil_score = max(0.0, 100.0 - abs(55.0 - soil) * 1.7)

    health_score = round((temp_score + humidity_score + soil_score) / 3.0, 2)

    alerts = []
    if temp > ALERT_TEMP_HIGH:
        alerts.append("temperature_high")
    if temp < ALERT_TEMP_LOW:
        alerts.append("temperature_low")
    if humidity < ALERT_HUMIDITY_LOW:
        alerts.append("humidity_low")
    if soil < ALERT_SOIL_LOW:
        alerts.append("soil_moisture_low")
    if soil > ALERT_SOIL_HIGH:
        alerts.append("soil_moisture_high")

    return {
        **sensor_doc,
        "health_score": health_score,
        "alerts": alerts,
        "features": {
            "temp_delta": round(temp - 28.0, 3),
            "humidity_delta": round(humidity - 60.0, 3),
            "soil_delta": round(soil - 55.0, 3),
        },
    }
