import json
import os
from datetime import datetime
from pathlib import Path

import boto3


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
RAW_BUCKET = os.getenv("S3_RAW_BUCKET", "crop-analyzer-raw")
DISABLE_S3 = os.getenv("DISABLE_S3", "false").lower() == "true"


def upload_raw(payload: dict):
    now = datetime.utcnow()
    key = f"raw/{now.year}/{now.month:02d}/{now.day:02d}/{now.isoformat()}.json"
    if DISABLE_S3:
        local_path = Path("/tmp/crop-analyzer") / key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_text(json.dumps(payload), encoding="utf-8")
        return f"local://{key}"

    try:
        s3.put_object(
            Bucket=RAW_BUCKET,
            Key=key,
            Body=json.dumps(payload).encode("utf-8"),
            ContentType="application/json",
        )
    except Exception:
        local_path = Path("/tmp/crop-analyzer") / key
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_text(json.dumps(payload), encoding="utf-8")
        return f"local://{key}"
    return key