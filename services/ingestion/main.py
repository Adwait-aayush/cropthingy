import json
import os
import random
import threading
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import redis
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from s3_uploader import upload_raw

load_dotenv()

app = FastAPI(title="Ingestion Service")
rdb = redis.Redis(host=os.getenv("REDIS_HOST", "redis"), port=6379, db=0)

MQTT_BROKER = os.getenv("MQTT_BROKER", "mosquitto")
MQTT_PORT   = int(os.getenv("MQTT_PORT", 1883))
MQTT_TOPIC  = "crop/sensors"
CROPS = ["wheat", "rice", "cotton", "maize"]


class IngestPayload(BaseModel):
    device_id: str = "fake-device-01"
    crop_type: str = "wheat"
    temperature: float
    humidity: float
    soil_moisture: float


def process_payload(payload: dict):
    payload.setdefault("crop_type", "wheat")
    payload["server_ts"] = datetime.now(timezone.utc).isoformat()

    s3_key = upload_raw(payload)
    rdb.rpush("preprocess_queue", json.dumps(payload))
    return s3_key

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        s3_key = process_payload(payload)
        print(f"[S3] Uploaded raw → {s3_key}")
        print(f"[Redis] Queued payload from {payload.get('device_id')}")

    except Exception as e:
        print(f"[ERROR] on_message: {e}")

def start_mqtt():
    client = mqtt.Client()
    client.on_message = on_message
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.subscribe(MQTT_TOPIC)
    client.loop_forever()

@app.on_event("startup")
def startup():
    t = threading.Thread(target=start_mqtt, daemon=True)
    t.start()
    print("[MQTT] Subscriber started")

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/ingest")
def ingest(payload: IngestPayload):
    key = process_payload(payload.model_dump())
    return {"status": "queued", "s3_key": key}


@app.post("/ingest-fake")
def ingest_fake(count: int = 1):
    created = []
    for i in range(max(1, min(count, 200))):
        payload = {
            "device_id": f"fake-device-{(i % 4) + 1:02d}",
            "crop_type": random.choice(CROPS),
            "timestamp": int(datetime.now(timezone.utc).timestamp()),
            "temperature": round(random.uniform(12, 42), 2),
            "humidity": round(random.uniform(25, 95), 2),
            "soil_moisture": round(random.uniform(8, 92), 2),
        }
        key = process_payload(payload)
        created.append(key)
    return {"status": "queued", "count": len(created), "keys": created[-5:]}