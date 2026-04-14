from flask import jsonify


def success_response(data=None, message="OK", status=200):
    payload = {"success": True, "message": message, "data": data}
    return jsonify(payload), status


def error_response(message="Error", status=400, errors=None):
    payload = {"success": False, "message": message, "errors": errors or []}
    return jsonify(payload), status
