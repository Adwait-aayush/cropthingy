import os
from datetime import timedelta
from dotenv import load_dotenv


load_dotenv()


class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret")
    JWT_EXP_DELTA = timedelta(hours=int(os.getenv("JWT_EXP_HOURS", "24")))

    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "smart_farming")

    DEVICE_MASTER_API_KEY = os.getenv("DEVICE_MASTER_API_KEY", "dev-device-key")

    S3_ENABLED = os.getenv("S3_ENABLED", "false").lower() == "true"
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION = os.getenv("AWS_REGION", "ap-south-1")
    S3_BUCKET = os.getenv("S3_BUCKET", "")

    UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
    MODEL_PATH = os.getenv("MODEL_PATH", "trained_models/crop_health_model.pkl")
