"use client";

import { useEffect, useRef, useState } from "react";

export default function HandPredictor() {
  const [prediction, setPrediction] = useState("Esperando...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8001/ws");

    socketRef.current.onmessage = (event) => {
      setPrediction(event.data);
    };

    const getVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        setInterval(() => {
          if (
            !videoRef.current ||
            !ctx ||
            !socketRef.current ||
            socketRef.current.readyState !== WebSocket.OPEN
          ) {
            return;
          }

          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onloadend = () => {
                socketRef.current?.send(reader.result as string);
              };
              reader.readAsDataURL(blob);
            }
          }, "image/jpeg");
        }, 300);
      } catch (err) {
        console.error("No se pudo acceder a la cámara:", err);
      }
    };

    getVideo();

    return () => {
      socketRef.current?.close();
    };
  }, []);

return (
  <div
    id="predictionTool"
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "920px",
      paddingBottom: "100px",
      paddingTop: "100px"
    }}
  >

    {/* Contenedor del borde */}
    <div
      style={{
        border: "2px solid #5d5dff",
        borderRadius: "12px",
        padding: "0",
        backgroundColor: "black", 
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={910}
        style={{
          borderRadius: "10px",
          display: "block",
          backgroundColor: "transparent",
        }}
      />
    </div>
        <h2 style={{ fontSize: "1.9rem", marginTop: "2.5rem", fontWeight:"bold" }}>
          Letra: <span style={{ color: "#5d5dff" }}>{prediction}</span>
        </h2>
  </div>
);

}
