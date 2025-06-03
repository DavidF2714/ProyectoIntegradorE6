import torch 
import torch.nn as nn
import torch.nn.functional as F
import cv2
import joblib as jl
import mediapipe as mp

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

def predict_landmarks(landmark_vector):
    x = torch.tensor(landmark_vector, dtype=torch.float32).unsqueeze(0).to(device)
    logits = model(x)
    pred = torch.argmax(logits, dim=1).item()
    return str(label_encoder.inverse_transform([pred])[0])


mp_hands = mp.solutions.hands
hand = mp_hands.Hands(static_image_mode=False, max_num_hands=1, min_detection_confidence=0.5)
mp_drawing = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = hand.process(frame_rgb)

    if results.multi_hand_landmarks:
        for hand_landmarks in results.multi_hand_landmarks:
            landmarks = [coord for lm in hand_landmarks.landmark for coord in (lm.x, lm.y, lm.z)]  

            pred_label = predict_landmarks(landmarks)

            mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            cv2.putText(frame, pred_label, (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    
    cv2.imshow('Hand Landmarks', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break   


# Release the video capture and close windows   
cap.release()
cv2.destroyAllWindows() 
