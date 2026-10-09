from flask import Flask
from werkzeug.exceptions import HTTPException

from app.utils.response import error_response


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(HTTPException)
    def handle_http_error(exc: HTTPException):
        return error_response(exc.description, exc.code)

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc: Exception):
        return error_response(str(exc), 500)
