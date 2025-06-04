'use client'

import { useEffect, useRef, useState } from "react"

export default function SpellingBee() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const socketRef = useRef<WebSocket | null>(null)

  const [word, setWord] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [prediction, setPrediction] = useState("")
  const [timer, setTimer] = useState(0)

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => setTimer(t => t + 1), 1000)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    })
  }, [])

  const startSpelling = () => {
    socketRef.current = new WebSocket("ws://localhost:8000/ws")

    socketRef.current.onmessage = async (event) => {
      const pred = event.data
      setPrediction(pred)

      if (pred.toLowerCase() === word[currentIndex].toLowerCase()) {
        await captureAndSaveFrame(word[currentIndex])
        setCurrentIndex(i => i + 1)

        if (currentIndex + 1 === word.length) {
          socketRef.current?.close()
          setIsPlaying(false)
        }
      }
    }

    setIsPlaying(true)
    setCurrentIndex(0)
    setTimer(0)

    startSendingFrames()
  }

  const startSendingFrames = () => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    const sendLoop = () => {
      if (!isPlaying || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return

      if (videoRef.current) {
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(blob => {
          if (blob) {
            const reader = new FileReader()
            reader.onloadend = () => {
              socketRef.current?.send(reader.result as string)
            }
            reader.readAsDataURL(blob)
          }
        }, "image/jpeg")
      }

      setTimeout(sendLoop, 400)
    }

    sendLoop()
  }

  const captureAndSaveFrame = async (letter: string) => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!

    if (!videoRef.current) return

    canvas.width = 224
    canvas.height = 224
    ctx.drawImage(videoRef.current, 0, 0, 224, 224)

    const blob = await new Promise<Blob>(res => canvas.toBlob(b => res(b!), "image/jpeg"))

    const form = new FormData()
    form.append("file", blob, "frame.jpg")

    await fetch(`http://localhost:8000/save_frame/${letter}`, {
      method: "POST",
      body: form
    })
  }

  return (
    <div className="flex flex-col items-center p-4">
      <input
        type="text"
        value={word}
        onChange={e => setWord(e.target.value)}
        placeholder="Escribe una palabra"
        className="p-2 border"
      />
      <button
        onClick={startSpelling}
        disabled={isPlaying || word.length === 0}
        className="mt-2 p-2 bg-blue-500 text-white rounded"
      >
        Listo
      </button>

      <div className="mt-4 flex space-x-2">
        {word.split("").map((char, idx) => (
          <div
            key={idx}
            className={`p-2 rounded border text-lg ${
              idx === currentIndex ? "bg-yellow-300" : idx < currentIndex ? "bg-green-300" : ""
            }`}
          >
            {char.toUpperCase()}
          </div>
        ))}
      </div>

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
        Predicción actual: <strong>{prediction.toUpperCase()}</strong>
      </div>

      <div className="mt-2">⏱ Tiempo: {timer} s</div>
    </div>
  )
}
