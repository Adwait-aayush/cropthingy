import os
from flask import Flask
from flask_cors import CORS

from config import Config
from app.db.mongo import init_mongo
from app.middleware.error_handler import register_error_handlers
from app.routes.auth_routes import auth_bp
from app.routes.user_routes import user_bp
from app.routes.device_routes import device_bp
from app.routes.sensor_routes import sensor_bp
from app.routes.prediction_routes import prediction_bp
from app.routes.upload_routes import upload_bp
from app.routes.health_routes import health_bp
from app.routes.analytics_routes import analytics_bp
from app.routes.session_routes import session_bp


def create_app() -> Flask:
    app = Flask(__name__)
    # Disable strict slashes to prevent redirects
    app.url_map.strict_slashes = False
    
    # CORS(app, resources={r"/api/*": {"origins": "*"}})
    CORS(app, resources={r"/api/*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "Authorization", "X-API-KEY"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }})

    app.config.from_object(Config)

    os.makedirs(app.config["UPLOAD_DIR"], exist_ok=True)

    init_mongo(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(user_bp, url_prefix="/api/users")
    app.register_blueprint(device_bp, url_prefix="/api/devices")
    app.register_blueprint(sensor_bp, url_prefix="/api/sensors")
    app.register_blueprint(prediction_bp, url_prefix="/api/predictions")
    app.register_blueprint(upload_bp, url_prefix="/api/uploads")
    app.register_blueprint(health_bp, url_prefix="/api/health")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(session_bp, url_prefix="/api/sessions")

    register_error_handlers(app)

    return app
