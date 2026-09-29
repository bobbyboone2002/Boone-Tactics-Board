import { useState, useRef, useEffect } from "react"
import cv from "@techstark/opencv-js"

type Landmark = {
  label: string
  meterX: number
  meterY: number
}

type MarkedPoint = Landmark & {
  pixelX: number
  pixelY: number
}

type Calibration = {
  id: number
  startTime: number
  matrix: number[]
  points: MarkedPoint[]
}

const API_BASE = "http://localhost:5001"

const LANDMARKS: Landmark[] = [
  { label: "Center spot", meterX: 51.5, meterY: 33.5 },
  { label: "Center circle, top intersection with halfway line", meterX: 51.5, meterY: 24.35 },
  { label: "Center circle, bottom intersection with halfway line", meterX: 51.5, meterY: 42.65 },
  { label: "Top-left corner flag", meterX: 0, meterY: 0 },
  { label: "Top-right corner flag", meterX: 103, meterY: 0 },
  { label: "Bottom-left corner flag", meterX: 0, meterY: 67 },
  { label: "Bottom-right corner flag", meterX: 103, meterY: 67 },
  { label: "Left 18-yard box, top corner", meterX: 16.5, meterY: 13.35 },
  { label: "Left 18-yard box, bottom corner", meterX: 16.5, meterY: 53.65 },
  { label: "Right 18-yard box, top corner", meterX: 86.5, meterY: 13.35 },
  { label: "Right 18-yard box, bottom corner", meterX: 86.5, meterY: 53.65 },
  { label: "Halfway line, top touchline", meterX: 51.5, meterY: 0 },
  { label: "Halfway line, bottom touchline", meterX: 51.5, meterY: 67 },
  { label: "Left 6-yard box, top corner", meterX: 5.5, meterY: 24.34 },
  { label: "Left 6-yard box, bottom corner", meterX: 5.5, meterY: 42.66 },
  { label: "Right 6-yard box, top corner", meterX: 97.5, meterY: 24.34 },
  { label: "Right 6-yard box, bottom corner", meterX: 97.5, meterY: 42.66 },
  { label: "Left penalty spot", meterX: 11, meterY: 33.5 },
  { label: "Right penalty spot", meterX: 92, meterY: 33.5 },
  { label: "Left D, top edge (meets 18-yard box)", meterX: 16.5, meterY: 26.19 },
  { label: "Left D, bottom edge (meets 18-yard box)", meterX: 16.5, meterY: 40.81 },
  { label: "Right D, top edge (meets 18-yard box)", meterX: 86.5, meterY: 26.19 },
  { label: "Right D, bottom edge (meets 18-yard box)", meterX: 86.5, meterY: 40.81 }
]

function applyHomography(matrix: number[], x: number, y: number) {
  const denom = matrix[6] * x + matrix[7] * y + matrix[8]
  const px = (matrix[0] * x + matrix[1] * y + matrix[2]) / denom
  const py = (matrix[3] * x + matrix[4] * y + matrix[5]) / denom
  return { px, py }
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function loadSavedCalibrations(id: string): Calibration[] {
  if (!id) {
    return []
  }
  try {
    const stored = localStorage.getItem(`matchCalibrations_${id}`)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

type MatchSetupProps = {
  profile: string
  clipId: string
  setClipId: (id: string) => void
  onVideoUploaded: () => void
}

function MatchSetup({ profile, clipId, setClipId, onVideoUploaded }: MatchSetupProps) {

  const [showUploadPanel, setShowUploadPanel] = useState(false)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isCvReady, setIsCvReady] = useState(false)
  const [capturedFrame, setCapturedFrame] = useState<HTMLImageElement | null>(null)
  const [capturedFrameTimestamp, setCapturedFrameTimestamp] = useState<number | null>(null)
  const [points, setPoints] = useState<MarkedPoint[]>([])
  const [selectedLandmark, setSelectedLandmark] = useState<string>(LANDMARKS[0].label)
  const [homographyMatrix, setHomographyMatrix] = useState<number[] | null>(null)
  const [calibrations, setCalibrations] = useState<Calibration[]>([])

  const cvRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cvPromise = cv as unknown as Promise<any>
    cvPromise.then((resolvedCv) => {
      cvRef.current = resolvedCv
      setIsCvReady(true)
    })
  }, [])

  useEffect(() => {
    setCalibrations(loadSavedCalibrations(clipId))
  }, [clipId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !capturedFrame) {
      return
    }
    const context = canvas.getContext("2d")
    if (!context) {
      return
    }

    context.drawImage(capturedFrame, 0, 0, canvas.width, canvas.height)

    points.forEach((point) => {
      context.beginPath()
      context.arc(point.pixelX, point.pixelY, 6, 0, 2 * Math.PI)
      context.fillStyle = "red"
      context.fill()
      context.strokeStyle = "white"
      context.lineWidth = 2
      context.stroke()
    })

    if (homographyMatrix) {
      LANDMARKS.forEach((landmark) => {
        const { px, py } = applyHomography(homographyMatrix, landmark.meterX, landmark.meterY)
        context.beginPath()
        context.arc(px, py, 4, 0, 2 * Math.PI)
        context.fillStyle = "blue"
        context.fill()
      })
    }
  }, [capturedFrame, points, homographyMatrix])

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    const url = URL.createObjectURL(file)
    setVideoSrc(url)
    setCapturedFrame(null)
    setPoints([])
    setHomographyMatrix(null)

    const formData = new FormData()
    formData.append("video", file)
    formData.append("profile", profile)
    formData.append("clip", clipId)

        try {
      const res = await fetch(`${API_BASE}/upload_video`, { method: "POST", body: formData })
      if (res.ok) {
        onVideoUploaded()
      } else {
        alert(`Upload failed (status ${res.status}). Check the server.py terminal for details.`)
      }
    } catch (err) {
      alert(`Could not reach the backend at all. Is server.py running? Error: ${err}`)
    }
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

    const image = new Image()
    image.onload = () => {
      setCapturedFrame(image)
    }
    image.src = canvas.toDataURL()

    setCapturedFrameTimestamp(video.currentTime)
    setPoints([])
    setHomographyMatrix(null)
  }

  function handleCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas || !capturedFrame) {
      return
    }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const pixelX = (event.clientX - rect.left) * scaleX
    const pixelY = (event.clientY - rect.top) * scaleY

    const landmark = LANDMARKS.find((l) => l.label === selectedLandmark)
    if (!landmark) {
      return
    }

    setPoints((current) => {
      const withoutThisLandmark = current.filter((p) => p.label !== landmark.label)
      return [...withoutThisLandmark, { ...landmark, pixelX, pixelY }]
    })
  }

  function removePoint(label: string) {
    setPoints((current) => current.filter((p) => p.label !== label))
  }

  function computeHomography() {
    const cvInstance = cvRef.current
    if (!cvInstance || points.length < 4) {
      return
    }

    const srcArray = points.flatMap((p) => [p.meterX, p.meterY])
    const dstArray = points.flatMap((p) => [p.pixelX, p.pixelY])

    const srcMat = cvInstance.matFromArray(points.length, 1, cvInstance.CV_32FC2, srcArray)
    const dstMat = cvInstance.matFromArray(points.length, 1, cvInstance.CV_32FC2, dstArray)

    const homography = cvInstance.findHomography(srcMat, dstMat)
    const matrixData = Array.from(homography.data64F as Float64Array)

    if (matrixData.length !== 9) {
      alert("Homography computation failed — try marking points that are more spread out across the frame, not clustered in a line.")
      setHomographyMatrix(null)
    } else {
      setHomographyMatrix(matrixData)
    }

    srcMat.delete()
    dstMat.delete()
    homography.delete()
  }

  function saveCalibration() {
    if (!homographyMatrix || capturedFrameTimestamp === null) {
      return
    }

    const newCalibration: Calibration = {
      id: Date.now(),
      startTime: capturedFrameTimestamp,
      matrix: homographyMatrix,
      points
    }

    setCalibrations((current) => {
      const updated = [...current, newCalibration].sort((a, b) => a.startTime - b.startTime)
      localStorage.setItem(`matchCalibrations_${clipId}`, JSON.stringify(updated))
      return updated
    })

    setCapturedFrame(null)
    setCapturedFrameTimestamp(null)
    setPoints([])
    setHomographyMatrix(null)
  }

  function deleteCalibration(id: number) {
    setCalibrations((current) => {
      const updated = current.filter((c) => c.id !== id)
      localStorage.setItem(`matchCalibrations_${clipId}`, JSON.stringify(updated))
      return updated
    })
  }

  async function saveCalibrationsToBackend() {
  try {
    const res = await fetch(`${API_BASE}/upload_calibration?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clipId,
        calibrations: calibrations.map((c) => ({
          startTime: c.startTime,
          matrix: c.matrix
        }))
      })
    })

    if (res.ok) {
      alert("Calibration saved to backend successfully.")
    } else {
      alert(`Save failed (status ${res.status}).`)
    }
  } catch (err) {
    alert(`Could not reach the backend. Error: ${err}`)
  }
}

  const markedLabels = new Set(points.map((p) => p.label))
  const remainingLandmarks = LANDMARKS.filter((l) => !markedLabels.has(l.label))

  if (!showUploadPanel) {
    return (
      <div>
        <button onClick={() => setShowUploadPanel(true)}>
          Video Upload
        </button>
      </div>
    )
  }

  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setShowUploadPanel(false)}>
        Close
      </button>

      {!isCvReady && <p>Loading OpenCV...</p>}

      <div style={{ marginTop: "10px" }}>
        <label>
          Video name: <input
            type="text"
            value={clipId}
            onChange={(e) => setClipId(e.target.value)}
            placeholder="FUL.CHE(0-1)20260824.mp4"
          />
        </label>
      </div>

      <div style={{ marginTop: "10px" }}>
        <input type="file" accept="video/*" onChange={handleFileSelect} disabled={!clipId} />
      </div>

      {videoSrc && (
        <div style={{ position: "relative" }}>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            onLoadedMetadata={handleLoadedMetadata}
            style={{ position: "relative", maxWidth: "600px", display: "block" }}
          />

          <button onClick={captureFrame} disabled={!isCvReady}>
            Capture Frame
          </button>

          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{
              position: "relative",
              top: "auto",
              left: "auto",
              border: "1px solid black",
              maxWidth: "600px",
              marginTop: "10px",
              display: "block",
              cursor: capturedFrame ? "crosshair" : "default"
            }}
          />

          {capturedFrame && (
            <div style={{ marginTop: "10px" }}>
              <p>Frame captured at {formatTime(capturedFrameTimestamp ?? 0)}</p>

              <label>
                Landmark to mark next:{" "}
                <select
                  value={selectedLandmark}
                  onChange={(e) => setSelectedLandmark(e.target.value)}
                >
                  {remainingLandmarks.map((l) => (
                    <option key={l.label} value={l.label}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>

              <ul>
                {points.map((point) => (
                  <li key={point.label}>
                    {point.label} — ({Math.round(point.pixelX)}, {Math.round(point.pixelY)})
                    <button onClick={() => removePoint(point.label)} style={{ marginLeft: "8px" }}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <p>{points.length} of {LANDMARKS.length} landmarks marked</p>

              <button onClick={computeHomography} disabled={points.length < 4}>
                Compute Homography
              </button>

              <button onClick={saveCalibration} disabled={!homographyMatrix || homographyMatrix.length !== 9} style={{ marginLeft: "8px" }}>
                Save Calibration
              </button>
            </div>
          )}

          {calibrations.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <h3>Saved Calibrations</h3>
              <ul>
                {calibrations.map((cal, index) => {
                  const nextCal = calibrations[index + 1]
                  const validUntil = nextCal ? formatTime(nextCal.startTime) : "end of video"
                  return (
                    <li key={cal.id}>
                      Valid from {formatTime(cal.startTime)} to {validUntil} ({cal.points.length} points)
                      <button onClick={() => deleteCalibration(cal.id)} style={{ marginLeft: "8px" }}>
                        Delete
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      <button onClick={saveCalibrationsToBackend} disabled={calibrations.length === 0} style={{ marginTop: "10px" }}>
        Save Calibration to Clip
      </button>
    </div>
  )
}

export default MatchSetup
