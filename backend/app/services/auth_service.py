from app.db.mongo import get_db
from app.db.collections import USERS
from app.utils.helpers import hash_password, verify_password, generate_jwt, utc_now_iso
from app.utils.logger import get_logger

logger = get_logger(__name__)


def register_user(payload: dict):
    db = get_db()
    users = db[USERS]

    existing = users.find_one({"email": payload["email"].lower().strip()})
    if existing:
        raise ValueError("Email already registered")

    user_doc = {
        "name": payload["name"].strip(),
        "email": payload["email"].lower().strip(),
        "password": hash_password(payload["password"]),
        "role": payload.get("role", "farmer"),
        "created_at": utc_now_iso(),
    }
    result = users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    logger.info(f"✅ User registered: {user_id} ({user_doc['email']})")

    token = generate_jwt({"user_id": user_id, "email": user_doc["email"], "role": user_doc["role"]})
    return {
        "token": token,
        "user": {
            "id": user_id,
            "name": user_doc["name"],
            "email": user_doc["email"],
            "role": user_doc["role"],
        },
    }


def login_user(payload: dict):
    db = get_db()
    user = db[USERS].find_one({"email": payload["email"].lower().strip()})
    if not user:
        raise ValueError("Invalid credentials")

    if not verify_password(payload["password"], user.get("password", "")):
        raise ValueError("Invalid credentials")

    token = generate_jwt({"user_id": str(user["_id"]), "email": user["email"], "role": user.get("role", "farmer")})
    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role", "farmer"),
        },
    }
