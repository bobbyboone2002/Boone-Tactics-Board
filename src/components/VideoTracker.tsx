import { useState, useRef } from "react"

const API_BASE = "http://localhost:5001"

type Detection = {
  label: string
  pixelX: number
  pixelY: number
  meterX: number
  meterY: number
}

type TrackingFrame = {
  frameIndex: number
  detections: Detection[]
}

type TrackingData = {
  frames: TrackingFrame[]
}

type Selection = { label: string; x: number; y: number }

function VideoTracker() {
  const [videoUploaded, setVideoUploaded] = useState(false)
  const [calibrationUploaded, setCalibrationUploaded] = useState(false)
  const [fps, setFps] = useState(20)
  const [selections, setSelections] = useState<Selection[]>([])
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [correctingLabel, setCorrectingLabel] = useState<string>("")
  const [correctMode, setCorrectMode] = useState(false)

  const frameImgRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  async function handleVideoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("video", file)
    const res = await fetch(`${API_BASE}/upload_video`, { method: "POST", body: formData })
    const data = await res.json()
    setFps(data.fps)
    setVideoUploaded(true)
  }

  async function handleCalibrationUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("calibration", file)
    await fetch(`${API_BASE}/upload_calibration`, { method: "POST", body: formData })
    setCalibrationUploaded(true)
  }

  function handleFrameClick(event: React.MouseEvent<HTMLImageElement>) {
    const img = frameImgRef.current
    if (!img) return
    const rect = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    const label = window.prompt("Label this point (e.g. home_7, away_10, ball):")
    if (!label) return

    setSelections((current) => [...current, { label, x, y }])
  }

  async function startTracking() {
    const res = await fetch(`${API_BASE}/initial_track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selections })
    })
    const data = await res.json()
    setTrackingData(data)
  }

  function handleVideoTimeUpdate() {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  async function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (!correctMode || !correctingLabel || !videoRef.current) return

    const rect = event.currentTarget.getBoundingClientRect()
    const scaleX = videoRef.current.videoWidth / rect.width
    const scaleY = videoRef.current.videoHeight / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    const frameIndex = Math.round(currentTime * fps)

    const res = await fetch(`${API_BASE}/correct_track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: correctingLabel, frameIndex, x, y })
    })
    const data = await res.json()
    setTrackingData(data)
    setCorrectMode(false)
  }

  const allLabels = trackingData
    ? Array.from(new Set(trackingData.frames.flatMap((f) => f.detections.map((d) => d.label))))
    : []

  const currentFrameIndex = Math.round(currentTime * fps)
  const currentDetections = trackingData?.frames.find((f) => f.frameIndex === currentFrameIndex)?.detections ?? []

  const [videoDisplaySize, setVideoDisplaySize] = useState({ width: 600, height: 338 })

  return (
    <div>
      <h2>Video Tracker</h2>

      {!videoUploaded && (
        <div>
          <label>Upload clip: <input type="file" accept="video/*" onChange={handleVideoUpload} /></label>
        </div>
      )}

      {videoUploaded && !calibrationUploaded && (
        <div>
          <label>Upload calibration.json: <input type="file" accept=".json" onChange={handleCalibrationUpload} /></label>
        </div>
      )}

      {videoUploaded && calibrationUploaded && !trackingData && (
        <div>
          <p>Click each player and the ball on frame 0. A prompt will ask for each label.</p>
          <img
            ref={frameImgRef}
            src={`${API_BASE}/frame/0`}
            onClick={handleFrameClick}
            style={{ maxWidth: "600px", display: "block", cursor: "crosshair" }}
          />
          <ul>
            {selections.map((s, i) => (
              <li key={i}>{s.label} — ({Math.round(s.x)}, {Math.round(s.y)})</li>
            ))}
          </ul>
          <button onClick={startTracking} disabled={selections.length === 0}>
            Start Tracking
          </button>
        </div>
      )}

      {trackingData && (
        <div>
          <div
            style={{ position: "relative", width: videoDisplaySize.width }}
            ref={overlayRef}
            onClick={handleOverlayClick}
          >
            <video
              ref={videoRef}
              src={`${API_BASE}/video/match.mp4`}
              controls
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget
                const width = 600
                const height = (v.videoHeight / v.videoWidth) * width
                setVideoDisplaySize({ width, height })
              }}
              style={{ width: videoDisplaySize.width, display: "block" }}
            />
            {currentDetections.map((d) => (
              <div
                key={d.label}
                style={{
                  position: "absolute",
                  left: (d.pixelX / (videoRef.current?.videoWidth ?? 1)) * videoDisplaySize.width - 6,
                  top: (d.pixelY / (videoRef.current?.videoHeight ?? 1)) * videoDisplaySize.height - 6,
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "red",
                  border: "2px solid white",
                  pointerEvents: "none"
                }}
                title={d.label}
              />
            ))}
          </div>

          <p>Time: {currentTime.toFixed(2)}s — Frame: {currentFrameIndex}</p>

          <label>
            Fix label:{" "}
            <select value={correctingLabel} onChange={(e) => setCorrectingLabel(e.target.value)}>
              <option value="">-- select --</option>
              {allLabels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>

          <button onClick={() => setCorrectMode(true)} disabled={!correctingLabel}>
            {correctMode ? "Click the correct position on the video..." : "Correct at current time"}
          </button>
        </div>
      )}
    </div>
  )
}

export default VideoTracker
