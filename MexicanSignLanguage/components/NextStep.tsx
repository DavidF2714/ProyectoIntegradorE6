"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface Prediction {
  word: string
  word_id: string
  images: { letter: string; image_base64: string }[]
}


export default function SpellingBee() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const wordRef = useRef("");
  const wordUUIDRef = useRef("");
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
  const [savedFrames, setSavedFrames] = useState<{ letter: string; image_base64: string }[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([])

  useEffect(() => {
    const fetchPredictions = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      console.log("tok: ", token)

      try {
        const res = await fetch("http://localhost:8000/user_predictions/", {
          headers: {
             "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
          },
        })

        const data = await res.json()

        console.log(data)

        const enriched = await Promise.all(
          data.predictions.map(async (pred: any) => {
            const frameRes = await fetch(`http://localhost:8000/get_frames/${pred.word_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            const frameData = await frameRes.json()

            return {
              word: pred.word,
              word_id: pred.word_id,
              images: frameData.frames,
            }
          })
        )

        setPredictions(enriched)
      } catch (err) {
        console.error("Error loading predictions:", err)
      }
    }

    fetchPredictions()
  }, [])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  useEffect(() => { wordRef.current = word; }, [word]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { lastCaptureTimeRef.current = lastCaptureTime; }, [lastCaptureTime]);
  useEffect(() => { isCapturingRef.current = isCapturing; }, [isCapturing]);

  useEffect(() => {
    if (frameSaved) {
      const timeout = setTimeout(() => setFrameSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [frameSaved]);

  useEffect(() => {
    let sendFramesInterval: NodeJS.Timeout | null = null;

    const initWebSocket = () => {
      socketRef.current = new WebSocket("ws://localhost:8001/ws");

      socketRef.current.onopen = () => {
        console.log("WebSocket conectado");
        startSendingFrames();
      };

      socketRef.current.onmessage = (event) => {
        const pred = event.data;
        setPrediction(pred);

        const currentWord = wordRef.current;
        const currentIdx = currentIndexRef.current;
        const playing = isPlayingRef.current;
        const capturing = isCapturingRef.current;
        const lastCapture = lastCaptureTimeRef.current;

        if (
          playing &&
          currentWord &&
          pred.length === 1 &&
          currentIdx < currentWord.length &&
          pred.toLowerCase() === currentWord[currentIdx].toLowerCase() &&
          !capturing
        ) {
          const now = Date.now();
          if (now - lastCapture > 2000) {
            const matchedLetter = currentWord[currentIdx];
            setIsCapturing(true);
            setLastCaptureTime(now);

            setTimeout(() => {
              captureAndSaveFrame(matchedLetter);

              const nextIndex = currentIdx + 1;
              setCurrentIndex(nextIndex);

              if (nextIndex === currentWord.length) {
                setIsPlaying(false);
              }

              setTimeout(() => {
                setIsCapturing(false);
              }, 1000);
            }, 1000);
          }
        }
      };

      socketRef.current.onerror = (error) => console.error("Error en WebSocket:", error);
      socketRef.current.onclose = () => console.log("WebSocket desconectado");
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
          ) return;

          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          canvas.toBlob((blob) => {
            if (blob) {
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
      if (sendFramesInterval) clearInterval(sendFramesInterval);
      socketRef.current?.close();
    };
  }, []);

  const startSpelling = () => {
    setIsPlaying(true);
    setCurrentIndex(0);
    setTimer(0);
    setPrediction("Esperando...");
    setFrameSaved(false);
    wordUUIDRef.current = uuidv4();
    setSavedFrames([]);
  };

  const stopSpelling = () => setIsPlaying(false);

  const resetGame = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setTimer(0);
    setPrediction("Esperando...");
    setFrameSaved(false);
    setWord("");
    setLastCaptureTime(0);
    setIsCapturing(false);
    setSavedFrames([]);
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
    form.append("word_id", wordUUIDRef.current);

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

  async function getSpelledWord(wordId: string, token: string) {
    const res = await fetch(`http://localhost:8000/get_frames/${wordId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    return data.frames;
  }

  useEffect(() => {
  if (!isPlaying && word && currentIndex === word.length) {
    const token = localStorage.getItem("token") || "";

    const timeout = setTimeout(() => {
      getSpelledWord(wordUUIDRef.current, token)
        .then(frames => {
          setSavedFrames(frames);

          // 👉 Create FormData instead of JSON
          const form = new FormData();
          form.append("word", wordRef.current);
          form.append("word_id", wordUUIDRef.current);

          fetch("http://localhost:8000/save_prediction/", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
            body: form,
          }).catch(err =>
            console.error("Error saving prediction record:", err)
          );
        })
        .catch(err => console.error("Error al obtener imágenes guardadas:", err));
    }, 1000);

    return () => clearTimeout(timeout);
  }
}, [isPlaying, currentIndex, word]);



  return (
    <div className="flex flex-col items-center p-4 mt-20">
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

      {(savedFrames?.length ?? 0) > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-2 text-green-700">
            Palabra completada: <span className="underline">{word.toUpperCase()}</span>
          </h2>
          <h3 className="text-lg font-semibold mb-2">🖼️ Imágenes capturadas:</h3>
          <div className="grid grid-cols-3 gap-4">
            {savedFrames.map((frame, idx) => (
              <div key={idx} className="text-center">
                <img
                  src={`data:image/jpeg;base64,${frame.image_base64}`}
                  alt={`Letra ${frame.letter}`}
                  className="w-32 h-32 object-cover rounded border"
                />
                <div className="mt-1 text-sm">{frame.letter.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Historial de Palabras</h1>
      {predictions.map((p, i) => (
        <div key={i} className="mb-8 border p-4 rounded shadow">
          <h2 className="text-xl font-semibold text-purple-600">{p.word.toUpperCase()}</h2>
          <div className="grid grid-cols-3 gap-4 mt-2">
            {p.images.map((img, idx) => (
              <div key={idx} className="text-center">
                <img
                  src={`data:image/jpeg;base64,${img.image_base64}`}
                  alt={`Letra ${img.letter}`}
                  className="w-32 h-32 object-cover rounded border"
                />
                <div className="mt-1 text-sm">{img.letter.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}
