import websockets
import os

MODEL_WS_URL = os.getenv("MODEL_WS_URL", "ws://localhost:8001/ws")
model_ws = None

async def connect_once():
    global model_ws
    if model_ws is None or model_ws.closed:
        model_ws = await websockets.connect(MODEL_WS_URL, max_size=None)

async def send_to_model(image_base64: str) -> str:
    try:
        await connect_once()
        await model_ws.send(image_base64)
        return await model_ws.recv()
    except Exception as e:
        print(f"[Model Proxy Error] {e}")
        return "model_error"
