def sanitize_user_doc(user_doc: dict) -> dict:
    return {
        "id": str(user_doc.get("_id")),
        "name": user_doc.get("name"),
        "email": user_doc.get("email"),
        "role": user_doc.get("role", "farmer"),
        "created_at": user_doc.get("created_at"),
    }
