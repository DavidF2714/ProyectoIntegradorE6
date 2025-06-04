import torch 
import torch.nn as nn
import cv2
import joblib as jl
import mediapipe as mp
import numpy as np
import base64
import os

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from pymongo import MongoClient
from jose import jwt, JWTError
from datetime import datetime, timedelta
from passlib.context import CryptContext

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "mydatabase")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
users_collection = db["users"]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity; adjust as needed
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
    # expose_headers=["*"],  # Expose all headers
    # max_age=3600,  # Cache preflight response for 1 hour
    # allow_origin_regex="https?://.*"  # Allow any origin that starts with http or https
)

# Model
model = nn.Sequential(
    nn.Linear(63, 512),
    nn.BatchNorm1d(512),
    nn.ReLU(),
    nn.Dropout(0.3),

    nn.Linear(512, 256),
    nn.BatchNorm1d(256),
    nn.ReLU(),
    nn.Dropout(0.3),

    nn.Linear(256, 128),
    nn.BatchNorm1d(128),
    nn.ReLU(),

    nn.Linear(128, 26)
)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.load_state_dict(torch.load("LSM-V2/hand_landmarks_modelv2.pt"))
model = model.to(device)
model.eval()
label_encoder = jl.load("LSM-V2/label_encoder.pkl")

mp_hands = mp.solutions.hands
hand = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.7)

def predict_landmarks(landmark_vector):
    x = torch.tensor(landmark_vector, dtype=torch.float32).unsqueeze(0).to(device)
    logits = model(x)
    pred = torch.argmax(logits, dim=1).item()
    return str(label_encoder.inverse_transform([pred])[0])

def decode_base64_image(data):
    image_data = base64.b64decode(data.split(",")[1])  # Split to remove the metadata part
    np_arr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return image


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            if data.startswith("data:image"):
                image = decode_base64_image(data)
                results = hand.process(image)

                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        landmark_vector = []
                        for landmark in hand_landmarks.landmark:
                            landmark_vector.extend([landmark.x, landmark.y, landmark.z])
                        prediction = predict_landmarks(landmark_vector)
                        await websocket.send_text(prediction)
                else:
                    await websocket.send_text("No hand detected")
            else:
                await websocket.send_text("Invalid data format")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

#auth
fake_users_db = {}

class User(BaseModel):
    username: str
    password: str

@app.post("/signup")
def signup(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = hash_password(user.password)
    users_collection.insert_one({
        "username": user.username,
        "password": hashed_password
    })
    print("User inserted with ID:", users_collection.inserted_id)
    return {"msg": "User created successfully"}

@app.post("/signin")
def signin(user: User):
    db_user = users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.username})
    return {"access_token": token, "token_type": "bearer"}


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)