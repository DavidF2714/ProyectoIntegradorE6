import base64
from fastapi import FastAPI, WebSocket, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from model.predictor import gesture_model, hand, mp
from utils.image import decode_base64_image
from auth.utils import hash_password, verify_password, create_access_token, get_current_user
from db.mongo import db, users_collection
from db.logs import log_event

from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class User(BaseModel):
    username: str
    password: str

@app.on_event("startup")
def test_mongo_connection():
    try:
        db.command("ping")
        print("[✓] MongoDB conectado correctamente")
    except Exception as e:
        print(f"[✗] Error de conexión con MongoDB: {e}")


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
                        landmark_vector = [
                            coord
                            for lm in hand_landmarks.landmark
                            for coord in (lm.x, lm.y, lm.z)
                        ]
                        prediction = gesture_model.predict(landmark_vector)
                        await websocket.send_text(prediction)
                else:
                    await websocket.send_text("No hand detected")
            else:
                await websocket.send_text("Invalid data format")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()

@app.post("/save_frame/{letter}")
async def save_frame(
    letter: str,
    file: UploadFile = File(...),
    username: str = Depends(get_current_user)
):
    contents = await file.read()
    encoded_image = base64.b64encode(contents).decode("utf-8")

    frame_doc = {
        "username": username,
        "letter": letter,
        "timestamp": datetime.utcnow(),
        "image_base64": encoded_image
    }

    db["frames"].insert_one(frame_doc)
    return {"message": "Frame saved to MongoDB", "letter": letter}

@app.post("/signup")
def signup(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    
    hashed_password = hash_password(user.password)
    users_collection.insert_one({
        "username": user.username,
        "password": hashed_password
    })
    
    log_event(user.username, "signup")
    return {"msg": "User created successfully"}

@app.post("/signin")
def signin(user: User):
    db_user = users_collection.find_one({"username": user.username})
    
    if not db_user:
        log_event(user.username, "failed_signin", {"reason": "user not found"})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user.password, db_user["password"]):
        log_event(user.username, "failed_signin", {"reason": "wrong password"})
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.username})
    log_event(user.username, "signin")
    return {"access_token": token, "token_type": "bearer"}
