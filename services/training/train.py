"""
Lightweight training job for local testing.
Fits a simple linear model on normalized features and stores it to S3.
"""
import io
import json
import os

import boto3
import numpy as np
from dotenv import load_dotenv

load_dotenv()

PROC_BUCKET = os.getenv("S3_PROCESSED_BUCKET", "crop-analyzer-processed")
MODEL_BUCKET = os.getenv("S3_MODEL_BUCKET", "crop-analyzer-models")
MODEL_KEY = os.getenv("MODEL_KEY", "latest/crop_model.json")


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


def load_processed_records():
    paginator = s3.get_paginator("list_objects_v2")
    records = []
    for page in paginator.paginate(Bucket=PROC_BUCKET, Prefix="processed/"):
        for obj in page.get("Contents", []):
            body = s3.get_object(Bucket=PROC_BUCKET, Key=obj["Key"])["Body"].read()
            records.append(json.loads(body.decode("utf-8")))
    return records


def fit_linear_model(records):
    x = np.array(
        [[r["temp_norm"], r["humidity_norm"], r["soil_norm"]] for r in records],
        dtype=np.float64,
    )
    y = np.array([r["health_score"] / 100.0 for r in records], dtype=np.float64)

    x_bias = np.concatenate([x, np.ones((x.shape[0], 1), dtype=np.float64)], axis=1)
    coeff, *_ = np.linalg.lstsq(x_bias, y, rcond=None)

    return {
        "model_type": "linear",
        "features": ["temp_norm", "humidity_norm", "soil_norm"],
        "weights": coeff[:3].tolist(),
        "bias": float(coeff[3]),
        "training_rows": int(x.shape[0]),
    }


def save_model(model_payload):
    buf = io.BytesIO(json.dumps(model_payload).encode("utf-8"))
    s3.put_object(
        Bucket=MODEL_BUCKET,
        Key=MODEL_KEY,
        Body=buf.getvalue(),
        ContentType="application/json",
    )


def train():
    print("[Training] Loading processed records from S3...")
    records = load_processed_records()
    if len(records) < 20:
        print(f"[Training] Not enough data ({len(records)}). Need at least 20.")
        return

    model_payload = fit_linear_model(records)
    save_model(model_payload)
    print(
        f"[Training] Model saved to S3 -> {MODEL_KEY} | rows={model_payload['training_rows']}"
    )


if __name__ == "__main__":
    train()
