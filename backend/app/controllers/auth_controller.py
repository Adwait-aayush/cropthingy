from flask import request

from app.schemas.auth_schema import validate_register_payload, validate_login_payload
from app.services.auth_service import register_user, login_user
from app.utils.response import success_response, error_response


def register():
    payload = request.get_json(force=True)
    try:
        validate_register_payload(payload)
        data = register_user(payload)
        return success_response(data, "Registration successful", 201)
    except ValueError as exc:
        return error_response(str(exc), 400)


def login():
    payload = request.get_json(force=True)
    try:
        validate_login_payload(payload)
        data = login_user(payload)
        return success_response(data, "Login successful", 200)
    except ValueError as exc:
        return error_response(str(exc), 401)
