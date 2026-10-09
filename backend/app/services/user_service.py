from bson import ObjectId

from app.db.mongo import get_db
from app.db.collections import USERS


def get_user_profile(user_id: str):
    db = get_db()
    user = db[USERS].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise ValueError("User not found")
    return user
