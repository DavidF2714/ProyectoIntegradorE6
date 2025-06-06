import base64
import websockets

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from auth.utils import hash_password, verify_password, create_access_token, get_current_user
from db.mongo import db, users_collection
from db.logs import log_event   
from datetime import datetime
from ws.ws_client import send_to_model

from fastapi import FastAPI


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  #FRONTEND_URL
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


@app.post("/save_frame/{letter}")
async def save_frame(
    letter: str,
    word_id: str = Form(...),
    file: UploadFile = File(...),
    username: str = Depends(get_current_user)
):
    contents = await file.read()
    encoded_image = base64.b64encode(contents).decode("utf-8")


    print("received word id: ", word_id)

    frame_doc = {
        "username": username,
        "letter": letter,
        "word_id": word_id,
        "timestamp": datetime.utcnow(),
        "image_base64": encoded_image
    }

    db["frames"].insert_one(frame_doc)
    return {"message": "Foto enviada a MongoDB correctamente", "letra": letter}


@app.get("/get_frames/{word_id}")
async def get_frames(word_id: str, token: str = Depends(get_current_user)):
    try:
        frames_cursor = db["frames"].find({"word_id": word_id}).sort("timestamp", 1)

        frames = []
        for doc in frames_cursor:
            frames.append({
                "letter": doc["letter"],
                "image_base64": doc["image_base64"],
            })
        return {"frames": frames}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save_prediction")
def save_prediction(word:str=Form(...), word_id: str = Form(...), username: str = Depends(get_current_user)):
    db["predictions"].insert_one({
        "username": username,
        "word": word,
        "word_id": word_id
    })
    return {"status": "success"}


@app.get("/user_predictions")
def get_user_predictions(username: str = Depends(get_current_user)):
    predictions = list(db["predictions"].find({"username": username}))
    
    for p in predictions:
        p["_id"] = str(p["_id"])  

    return {"predictions": predictions}


@app.post("/signup")
def signup(user: User):
    if users_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")
    
    hashed_password = hash_password(user.password)
    users_collection.insert_one({
        "username": user.username,
        "password": hashed_password
    })
    
    log_event(user.username, "signup")
    return {"msg": "Usuario creado correctamente"}

@app.post("/signin")
def signin(user: User):
    db_user = users_collection.find_one({"username": user.username})
    
    if not db_user:
        log_event(user.username, "failed_signin", {"reason": "user not found"})
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    if not verify_password(user.password, db_user["password"]):
        log_event(user.username, "failed_signin", {"reason": "wrong password"})
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    token = create_access_token({"sub": user.username})
    log_event(user.username, "signin")
    return {"access_token": token, "token_type": "bearer"}

@app.post("/predict")
async def predict(file: UploadFile = File(...), username: str = Depends(get_current_user)):
    contents = await file.read()
    encoded_image = base64.b64encode(contents).decode("utf-8")
    prediction = await send_to_model(encoded_image)
    return {"prediction": prediction}

@app.websocket("/ws")
async def websocket_proxy(websocket: WebSocket):
    await websocket.accept()
    async with websockets.connect("ws://10.49.12.48:3002/ws") as back2_ws:
        try:
            while True:
                msg = await websocket.receive_text()
                await back2_ws.send(msg)
                response = await back2_ws.recv()
                await websocket.send_text(response)
        except Exception as e:
            await websocket.close()
