from __future__ import annotations

from flask import current_app, g
from pymongo import MongoClient


client: MongoClient | None = None


def init_mongo(app) -> None:
    global client
    client = MongoClient(app.config["MONGO_URI"])

    @app.before_request
    def bind_db() -> None:
        g.mongo_db = client[app.config["MONGO_DB_NAME"]]


def get_db():
    db = getattr(g, "mongo_db", None)
    if db is None:
        db = client[current_app.config["MONGO_DB_NAME"]]
    return db
