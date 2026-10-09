from __future__ import annotations

from datetime import datetime, timezone
import jwt
from flask import current_app
from werkzeug.security import generate_password_hash, check_password_hash


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return check_password_hash(hashed, password)


def generate_jwt(payload: dict) -> str:
    exp_delta = current_app.config["JWT_EXP_DELTA"]
    token_payload = {
        **payload,
        "exp": datetime.now(timezone.utc) + exp_delta,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(token_payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def decode_jwt(token: str) -> dict:
    return jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
