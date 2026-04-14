from flask import g

from app.schemas.user_schema import sanitize_user_doc
from app.services.user_service import get_user_profile
from app.utils.response import success_response, error_response


def profile():
    try:
        user = get_user_profile(g.user["user_id"])
        return success_response(sanitize_user_doc(user), "Profile fetched")
    except ValueError as exc:
        return error_response(str(exc), 404)
