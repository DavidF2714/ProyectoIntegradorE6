from datetime import datetime
from db.mongo import db

def log_event(username: str, action: str, details: dict = None):
    print(f"[LOGGING] {username=} {action=} {details=}")  # 👈 debug
    db["logs"].insert_one({
        "username": username,
        "action": action,
        "timestamp": datetime.utcnow(),
        "details": details or {}
    })
