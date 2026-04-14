from app.services.analytics_service import get_summary, get_trends, get_crop_overview
from app.utils.response import success_response


def summary():
    return success_response(get_summary(), "Analytics summary fetched")


def trends(device_id: str):
    return success_response(get_trends(device_id), "Device trends fetched")


def crop_overview():
    return success_response(get_crop_overview(), "Crop overview fetched")
