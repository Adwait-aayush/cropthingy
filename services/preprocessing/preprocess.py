import json
import os
from pathlib import Path

import boto3
import numpy as np
import redis
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

rdb = redis.Redis(host=os.getenv("REDIS_HOST", "redis"), port=6379, db=0)


def build_s3_client():
    endpoint = os.getenv("S3_ENDPOINT_URL")
    kwargs = {
        "aws_access_key_id": os.getenv("AWS_ACCESS_KEY_ID"),
        "aws_secret_access_key": os.getenv("AWS_SECRET_ACCESS_KEY"),
        "region_name": os.getenv("AWS_REGION", "ap-south-1"),
    }
    if endpoint:
        kwargs["endpoint_url"] = endpoint
    return boto3.client("s3", **kwargs)


s3 = build_s3_client()
PROC_BUCKET = os.getenv("S3_PROCESSED_BUCKET", "crop-analyzer-processed")
DISABLE_S3 = os.getenv("DISABLE_S3", "false").lower() == "true"

# ── Crop-specific ideal ranges (extend as needed) ────────────────────
CROP_RANGES = {
    "wheat":  {"temp": (15, 24), "humidity": (40, 70), "soil": (40, 60)},
    "rice":   {"temp": (22, 32), "humidity": (70, 90), "soil": (70, 90)},
    "cotton": {"temp": (21, 35), "humidity": (50, 75), "soil": (50, 70)},
    "maize":  {"temp": (18, 27), "humidity": (50, 80), "soil": (50, 75)},
}

def normalize(value: float, lo: float, hi: float) -> float:
    """Min-max normalize to [0, 1]."""
    return float(np.clip((value - lo) / (hi - lo + 1e-9), 0.0, 1.0))

def compute_health_score(temp, humidity, soil, crop: str) -> float:
    """
    Simple weighted health score 0-100.
    1.0 = perfectly in range, 0.0 = completely out of range.
    """
    ranges = CROP_RANGES.get(crop.lower(), CROP_RANGES["wheat"])
    t_score = 1.0 - abs(temp     - np.mean(ranges["temp"]))     / (ranges["temp"][1]     - ranges["temp"][0]     + 1)
    h_score = 1.0 - abs(humidity - np.mean(ranges["humidity"])) / (ranges["humidity"][1] - ranges["humidity"][0] + 1)
    s_score = 1.0 - abs(soil     - np.mean(ranges["soil"]))     / (ranges["soil"][1]     - ranges["soil"][0]     + 1)
    score = np.clip((0.35 * t_score + 0.30 * h_score + 0.35 * s_score) * 100, 0, 100)
    return round(float(score), 2)

def preprocess(raw: dict) -> dict:
    crop = raw.get("crop_type", "wheat").lower()
    temp     = float(raw["temperature"])
    humidity = float(raw["humidity"])
    soil     = float(raw["soil_moisture"])

    processed = {
        "device_id":        raw.get("device_id"),
        "crop_type":        crop,
        "server_ts":        raw.get("server_ts"),
        # raw values
        "temperature":      temp,
        "humidity":         humidity,
        "soil_moisture":    soil,
        # normalized features (model input)
        "temp_norm":        normalize(temp, -10, 50),
        "humidity_norm":    normalize(humidity, 0, 100),
        "soil_norm":        normalize(soil, 0, 100),
        # health score
        "health_score":     compute_health_score(temp, humidity, soil, crop),
        # alert flags
        "alert_temp":       temp < 5 or temp > 45,
        "alert_humidity":   humidity < 20 or humidity > 95,
        "alert_soil":       soil < 10 or soil > 95,
    }
    return processed

def upload_processed(data: dict):
    now = datetime.utcnow()
    key = f"processed/{now.year}/{now.month:02d}/{now.day:02d}/{now.isoformat()}.json"
    if DISABLE_S3:
        local_path = Path("/tmp/crop-analyzer") / key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_text(json.dumps(data), encoding="utf-8")
    else:
        try:
            s3.put_object(
                Bucket=PROC_BUCKET,
                Key=key,
                Body=json.dumps(data).encode("utf-8"),
                ContentType="application/json",
            )
        except Exception:
            local_path = Path("/tmp/crop-analyzer") / key
            local_path.parent.mkdir(parents=True, exist_ok=True)
            local_path.write_text(json.dumps(data), encoding="utf-8")
    # Also push to inference queue
    rdb.rpush("inference_queue", json.dumps(data))
    # Push to dashboard queue (live feed)
    rdb.lpush("dashboard_feed", json.dumps(data))
    rdb.ltrim("dashboard_feed", 0, 499)   # keep last 500 readings
    return key

def main():
    print("[Preprocessing] Worker started — waiting for data...")
    while True:
        item = rdb.blpop("preprocess_queue", timeout=5)
        if item:
            _, raw_bytes = item
            raw = json.loads(raw_bytes.decode("utf-8"))
            processed = preprocess(raw)
            key = upload_processed(processed)
            print(f"[Preprocessing] Done → {key} | health={processed['health_score']}")

if __name__ == "__main__":
    main()