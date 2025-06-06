from fastapi import FastAPI, WebSocket

from model.model import gesture_model, hand, mp
from utils.image import decode_base64_image

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], #FRONTEND_URL
    allow_methods=["*"],
    allow_headers=["*"],
)

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
                    await websocket.send_text("No hay manos detectadas")
            else:
                await websocket.send_text("Formato de imagen no válido")
    except Exception as e:
        print(f"Error: {e}")
        await websocket.close()
