import json
import os

import boto3
import numpy as np
import redis
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Inference Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_BUCKET = os.getenv("S3_MODEL_BUCKET", "crop-analyzer-models")
MODEL_KEY = os.getenv("MODEL_KEY", "latest/crop_model.json")

rdb = redis.Redis(host=os.getenv("REDIS_HOST", "redis"), port=6379, db=0)

CROP_RANGES = {
    "wheat": {"temp": (15, 24), "humidity": (40, 70), "soil": (40, 60)},
    "rice": {"temp": (22, 32), "humidity": (70, 90), "soil": (70, 90)},
    "cotton": {"temp": (21, 35), "humidity": (50, 75), "soil": (50, 70)},
    "maize": {"temp": (18, 27), "humidity": (50, 80), "soil": (50, 75)},
}


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
model = None


class PredictRequest(BaseModel):
    crop_type: str
    temperature: float
    humidity: float
    soil_moisture: float


def normalize(value: float, lo: float, hi: float) -> float:
    return float(np.clip((value - lo) / (hi - lo + 1e-9), 0.0, 1.0))


def compute_health_score(temp, humidity, soil, crop: str) -> float:
    ranges = CROP_RANGES.get(crop.lower(), CROP_RANGES["wheat"])
    t_score = 1.0 - abs(temp - np.mean(ranges["temp"])) / (ranges["temp"][1] - ranges["temp"][0] + 1)
    h_score = 1.0 - abs(humidity - np.mean(ranges["humidity"])) / (ranges["humidity"][1] - ranges["humidity"][0] + 1)
    s_score = 1.0 - abs(soil - np.mean(ranges["soil"])) / (ranges["soil"][1] - ranges["soil"][0] + 1)
    score = np.clip((0.35 * t_score + 0.30 * h_score + 0.35 * s_score) * 100, 0, 100)
    return round(float(score), 2)


def load_model():
    global model
    try:
        obj = s3.get_object(Bucket=MODEL_BUCKET, Key=MODEL_KEY)
        payload = json.loads(obj["Body"].read().decode("utf-8"))
        if payload.get("model_type") == "linear":
            model = payload
            print(f"[Inference] Loaded model from S3 -> {MODEL_KEY}")
            return
        model = None
        print("[Inference] Unknown model type in S3; using heuristic fallback")
    except Exception as exc:
        model = None
        print(f"[Inference] Model not available: {exc}. Using heuristic fallback.")


@app.on_event("startup")
def startup():
    load_model()


def linear_predict(req: PredictRequest):
    if not model:
        return None
    feats = np.array(
        [
            normalize(req.temperature, -10, 50),
            normalize(req.humidity, 0, 100),
            normalize(req.soil_moisture, 0, 100),
        ],
        dtype=np.float64,
    )
    weights = np.array(model["weights"], dtype=np.float64)
    bias = float(model["bias"])
    score = (float(np.dot(feats, weights) + bias)) * 100.0
    return float(np.clip(score, 0.0, 100.0))


def get_advice(score: float, req: PredictRequest) -> str:
    advice = []
    if req.temperature > 38:
        advice.append("High temperature; consider shade nets.")
    if req.temperature < 8:
        advice.append("Low temperature; frost protection needed.")
    if req.humidity < 30:
        advice.append("Low humidity; increase irrigation frequency.")
    if req.soil_moisture < 20:
        advice.append("Soil too dry; irrigate immediately.")
    if req.soil_moisture > 85:
        advice.append("Waterlogging risk; improve drainage.")

    note = " ".join(advice)
    if score >= 75:
        return "Conditions are healthy. " + note
    if score >= 50:
        return "Conditions are moderate. " + note
    return "Critical conditions detected. " + note


@app.post("/predict")
def predict(req: PredictRequest):
    score = linear_predict(req)
    model_used = "linear"

    if score is None:
        score = compute_health_score(
            req.temperature, req.humidity, req.soil_moisture, req.crop_type
        )
        model_used = "heuristic"

    return {
        "crop_type": req.crop_type,
        "health_score": round(score, 2),
        "advice": get_advice(score, req),
        "model_used": model_used,
    }


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.get("/reload-model")
def reload_model():
    load_model()
    return {"status": "reloaded", "model_loaded": model is not None}


@app.get("/history")
def history(limit: int = 200):
    safe_limit = max(1, min(limit, 500))
    items = rdb.lrange("dashboard_feed", 0, safe_limit - 1)
    parsed = [json.loads(i.decode("utf-8")) for i in items]
    return {"count": len(parsed), "items": list(reversed(parsed))}
