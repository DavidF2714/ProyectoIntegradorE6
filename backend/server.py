import torch 
import torch.nn as nn
import cv2
import joblib as jl
import mediapipe as mp
import numpy as np
import base64
import io

from fastapi import FastAPI, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

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