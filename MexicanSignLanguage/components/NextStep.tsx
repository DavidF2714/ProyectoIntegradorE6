"use client";

import { useEffect, useRef, useState } from "react";

export default function SpellingBee() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  
  // Refs para acceder a los valores actuales en el WebSocket
  const wordRef = useRef("");
  const currentIndexRef = useRef(0);
  const isPlayingRef = useRef(false);
  const lastCaptureTimeRef = useRef(0);
  const isCapturingRef = useRef(false);

  const [word, setWord] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [prediction, setPrediction] = useState("Esperando...");
  const [timer, setTimer] = useState(0);
  const [frameSaved, setFrameSaved] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

  // Timer solo cuando empieza el juego
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // Mantener los refs sincronizados con los estados
  useEffect(() => {
    wordRef.current = word;
  }, [word]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    lastCaptureTimeRef.current = lastCaptureTime;
  }, [lastCaptureTime]);

  useEffect(() => {
    isCapturingRef.current = isCapturing;
  }, [isCapturing]);

  // Aviso temporal de "foto guardada"
  useEffect(() => {
    if (frameSaved) {
      const timeout = setTimeout(() => setFrameSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [frameSaved]);

  useEffect(() => {
    let sendFramesInterval: NodeJS.Timeout | null = null;

    const initWebSocket = () => {
      socketRef.current = new WebSocket("ws://localhost:8000/ws");

      socketRef.current.onopen = () => {
        console.log("WebSocket conectado");
        // Iniciar envío de frames solo después de que el WebSocket esté conectado
        startSendingFrames();
      };

      socketRef.current.onmessage = (event) => {
        const pred = event.data;
        setPrediction(pred);
        
        // Usar refs para acceder a los valores actuales
        const currentWord = wordRef.current;
        const currentIdx = currentIndexRef.current;
        const playing = isPlayingRef.current;
        const capturing = isCapturingRef.current;
        const lastCapture = lastCaptureTimeRef.current;
        
        // Verificar si la predicción coincide con la letra actual
        if (
          playing &&
          currentWord &&
          pred.length === 1 &&
          currentIdx < currentWord.length &&
          pred.toLowerCase() === currentWord[currentIdx].toLowerCase() &&
          !capturing
        ) {
          const now = Date.now();
          // Esperar al menos 2 segundos entre capturas
          if (now - lastCapture > 2000) {
            const matchedLetter = currentWord[currentIdx];
            
            // Marcar que estamos capturando para evitar capturas múltiples
            setIsCapturing(true);
            setLastCaptureTime(now);
            
            // Esperar 1 segundo antes de capturar para estabilizar la pose
            setTimeout(() => {
              captureAndSaveFrame(matchedLetter);
              
              // Avanzar al siguiente índice después de la captura
              const nextIndex = currentIdx + 1;
              setCurrentIndex(nextIndex);
              
              // Si completamos la palabra, detener el juego
              if (nextIndex === currentWord.length) {
                setIsPlaying(false);
              }
              
              // Permitir nuevas capturas después de 1 segundo adicional
              setTimeout(() => {
                setIsCapturing(false);
              }, 1000);
            }, 1000);
          }
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("Error en WebSocket:", error);
      };

      socketRef.current.onclose = () => {
        console.log("WebSocket desconectado");
      };
    };

    const startSendingFrames = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        sendFramesInterval = setInterval(() => {
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
            if (blob && socketRef.current?.readyState === WebSocket.OPEN) {
              const reader = new FileReader();
              reader.onloadend = () => {
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                  socketRef.current.send(reader.result as string);
                }
              };
              reader.readAsDataURL(blob);
            }
          }, "image/jpeg");
        }, 300);
      } catch (err) {
        console.error("No se pudo acceder a la cámara:", err);
      }
    };

    initWebSocket();

    return () => {
      if (sendFramesInterval) {
        clearInterval(sendFramesInterval);
      }
      socketRef.current?.close();
    };
  }, []); // Removemos todas las dependencias para que solo se ejecute una vez

  const startSpelling = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setTimer(0);
    setPrediction("Esperando...");
    setFrameSaved(false);
  };

  const stopSpelling = () => {
    setIsPlaying(false);
  };

  const resetGame = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setTimer(0);
    setPrediction("Esperando...");
    setFrameSaved(false);
    setWord("");
    setLastCaptureTime(0);
    setIsCapturing(false);
  };

  const captureAndSaveFrame = async (letter: string) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    if (!videoRef.current) return;

    canvas.width = 224;
    canvas.height = 224;
    ctx.drawImage(videoRef.current, 0, 0, 224, 224);

    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg"));

    const form = new FormData();
    form.append("file", blob, "frame.jpg");

    try {
      await fetch(`http://localhost:8000/save_frame/${letter}`, {
        method: "POST",
        body: form,
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
        },
      });
      setFrameSaved(true);
    } catch (error) {
      console.error("Error saving frame:", error);
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <input
        type="text"
        value={word}
        onChange={e => setWord(e.target.value)}
        placeholder="Escribe una palabra"
        className="p-2 border"
        disabled={isPlaying}
      />
      <div className="flex gap-4 mt-2">
        <button
          onClick={startSpelling}
          disabled={isPlaying || word.length === 0}
          className="p-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Listo
        </button>
        <button
          onClick={stopSpelling}
          disabled={!isPlaying}
          className="p-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Detener
        </button>
        <button
          onClick={resetGame}
          className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reiniciar
        </button>
      </div>

      <div className="mt-4 flex space-x-2">
        {word.split("").map((char, idx) => (
          <div
            key={idx}
            className={`p-2 rounded border text-lg ${
              idx === currentIndex
                ? "bg-yellow-300"
                : idx < currentIndex
                ? "bg-green-300"
                : ""
            }`}
          >
            {char.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Mostrar progreso */}
      {word && (
        <div className="mt-2 text-sm text-gray-600">
          Progreso: {currentIndex}/{word.length} letras
          {currentIndex === word.length && !isPlaying && (
            <span className="text-green-600 font-semibold ml-2">¡Completado! 🎉</span>
          )}
        </div>
      )}

      <div
        style={{
          border: "2px solid #5d5dff",
          borderRadius: "12px",
          padding: "0",
          backgroundColor: "black",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          marginTop: "1rem",
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
            backgroundColor: "transparent",
          }}
        />
      </div>

      <div className="mt-2 text-xl">
        Predicción actual:{" "}
        <strong style={{ color: prediction === "No hand detected" ? "red" : "#5d5dff" }}>
          {prediction.toUpperCase()}
        </strong>
      </div>

      {/* Mostrar letra actual que se busca */}
      {isPlaying && word && currentIndex < word.length && (
        <div className="mt-2 text-lg">
          Buscando letra: <strong className="text-yellow-600">{word[currentIndex].toUpperCase()}</strong>
          {isCapturing && (
            <span className="ml-2 text-blue-600 animate-pulse">📸 Capturando en 1s...</span>
          )}
        </div>
      )}

      {frameSaved && (
        <div className="mt-1 text-green-600 font-semibold">
          📸 Foto guardada en la base de datos
        </div>
      )}

      <div className="mt-2">⏱ Tiempo: {timer} s</div>
    </div>
  );
}