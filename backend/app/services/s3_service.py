from __future__ import annotations

import io
import json
from flask import current_app

try:
    import boto3
except ImportError:  # pragma: no cover
    boto3 = None


def is_enabled() -> bool:
    return bool(current_app.config["S3_ENABLED"] and boto3)


def _client():
    return boto3.client(
        "s3",
        aws_access_key_id=current_app.config["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=current_app.config["AWS_SECRET_ACCESS_KEY"],
        region_name=current_app.config["AWS_REGION"],
    )


def upload_json(prefix: str, filename: str, payload: dict) -> str | None:
    if not is_enabled():
        return None

    key = f"{prefix}/{filename}"
    content = json.dumps(payload).encode("utf-8")
    _client().upload_fileobj(io.BytesIO(content), current_app.config["S3_BUCKET"], key)
    return key


def upload_binary(prefix: str, filename: str, raw_bytes: bytes, content_type: str = "application/octet-stream") -> str | None:
    if not is_enabled():
        return None

    key = f"{prefix}/{filename}"
    _client().put_object(Bucket=current_app.config["S3_BUCKET"], Key=key, Body=raw_bytes, ContentType=content_type)
    return key
