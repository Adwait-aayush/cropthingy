import json
import os
import random
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt

MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
MQTT_TOPIC = os.getenv("MQTT_TOPIC", "crop/sensors")
INTERVAL_SECONDS = float(os.getenv("FAKE_SENSOR_INTERVAL", "5"))

CROPS = ["wheat", "rice", "cotton", "maize"]


def make_payload():
    return {
        "device_id": f"fake-sensor-{random.randint(1, 3):02d}",
        "crop_type": random.choice(CROPS),
        "timestamp": int(datetime.now(timezone.utc).timestamp()),
        "temperature": round(random.uniform(12, 42), 2),
        "humidity": round(random.uniform(25, 95), 2),
        "soil_moisture": round(random.uniform(8, 92), 2),
    }


def main():
    client = mqtt.Client()
    while True:
        try:
            client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
            break
        except Exception as exc:
            print(f"[fake-sensor] MQTT connect failed: {exc}; retrying in 3s")
            time.sleep(3)

    print("[fake-sensor] Publishing fake telemetry...")
    while True:
        payload = make_payload()
        client.publish(MQTT_TOPIC, json.dumps(payload))
        print(f"[fake-sensor] published: {payload}")
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
