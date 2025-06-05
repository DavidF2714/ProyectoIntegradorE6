import torch
import torch.nn as nn
import joblib as jl
import mediapipe as mp

class HandGestureModel:
    def __init__(self, model_path: str, label_encoder_path: str, device=None):
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = self._build_model()
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        self.label_encoder = jl.load(label_encoder_path)

    def _build_model(self):
        return nn.Sequential(
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

    def predict(self, landmark_vector: list) -> str:
        x = torch.tensor(landmark_vector, dtype=torch.float32).unsqueeze(0).to(self.device)
        logits = self.model(x)
        pred = torch.argmax(logits, dim=1).item()
        return str(self.label_encoder.inverse_transform([pred])[0])


# 🔧 Instancia global del modelo y mediapipe hand detector (para usar directamente en server.py)
gesture_model = HandGestureModel(
    model_path="LSM-V2/hand_landmarks_modelv2.pt",
    label_encoder_path="LSM-V2/label_encoder.pkl"
)

mp_hands = mp.solutions.hands
hand = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5
)
