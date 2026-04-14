def validate_register_payload(payload: dict):
    required = ["name", "email", "password"]
    missing = [k for k in required if not payload.get(k)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")


def validate_login_payload(payload: dict):
    required = ["email", "password"]
    missing = [k for k in required if not payload.get(k)]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
