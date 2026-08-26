import { useState, useRef, useEffect } from "react"
import cv from "@techstark/opencv-js"

function MatchSetup() {

  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isCvReady, setIsCvReady] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    cv.onRuntimeInitialized = () => {
      setIsCvReady(true)
    }
  }, [])

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const url = URL.createObjectURL(file)
    setVideoSrc(url)
  }

  function handleLoadedMetadata() {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth
      canvasRef.current.height = videoRef.current.videoHeight
    }
  }

  function captureFrame() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      return
    }
    const context = canvas.getContext("2d")
    if (!context) {
      return
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
  }

  return (
    <div>
      <h2>Match Setup</h2>

      {!isCvReady && <p></p>}

      <input type="file" accept="video/*" onChange={handleFileSelect} />

      {videoSrc && (
        <div>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            style={{ maxWidth: "600px", display: "block" }}
          />

          <button onClick={captureFrame} disabled={!isCvReady}>
            Capture Frame
          </button>

          <canvas
            ref={canvasRef}
            style={{ border: "1px solid black", maxWidth: "600px", marginTop: "10px" }}
          />
        </div>
      )}
    </div>
  )
}

export default MatchSetup
