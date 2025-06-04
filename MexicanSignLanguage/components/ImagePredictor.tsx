"use client";

import { useEffect, useRef, useState } from "react";

export default function HandPredictor() {
  const [prediction, setPrediction] = useState("Esperando...");
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws");

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
    style={{
      marginTop: "0",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "85vh",
      backgroundColor: "#f9fafb", // fondo general claro
    }}
  >
    <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
      Predicción: <span style={{ color: "#16a34a" }}>{prediction}</span>
    </h2>

    {/* Contenedor del borde */}
    <div
      style={{
        border: "2px solid #3b82f6", // borde azul delgado
        borderRadius: "12px",
        padding: "0",
        backgroundColor: "transparent", // fondo transparente
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        width={720}
        style={{
          borderRadius: "10px",
          display: "block",
          backgroundColor: "transparent", // fondo transparente
        }}
      />
    </div>
  </div>
);

}
