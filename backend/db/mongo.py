import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://172.16.30.147:27017/")
DB_NAME = os.getenv("DB_NAME", "mydatabase")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_collection = db["users"]
frames_collection = db["frames"]
