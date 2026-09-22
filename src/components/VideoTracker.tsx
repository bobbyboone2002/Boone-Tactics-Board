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

type RosterOption = { label: string; name: string }

type VideoTrackerProps = {
  profile: string
  clipId: string
  rosterOptions: RosterOption[]
}

function VideoTracker({ profile, clipId, rosterOptions }: VideoTrackerProps) {
  const fps = 20
  const [selections, setSelections] = useState<Selection[]>([])
  const [pendingLabel, setPendingLabel] = useState(rosterOptions[0]?.label ?? "")
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [correctingLabel, setCorrectingLabel] = useState<string>("")
  const [correctMode, setCorrectMode] = useState(false)
  const [videoDisplaySize, setVideoDisplaySize] = useState({ width: 600, height: 338 })

  const frameImgRef = useRef<HTMLImageElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const frameUrl = `${API_BASE}/frame/${encodeURIComponent(profile)}/${encodeURIComponent(clipId)}/0`
  const videoUrl = `${API_BASE}/video/${encodeURIComponent(profile)}/${encodeURIComponent(clipId)}`

  function handleFrameClick(event: React.MouseEvent<HTMLImageElement>) {
    const img = frameImgRef.current
    if (!img || !pendingLabel) return
    const rect = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    setSelections((current) => [...current.filter((s) => s.label !== pendingLabel), { label: pendingLabel, x, y }])
  }

  async function startTracking() {
    const res = await fetch(`${API_BASE}/initial_track?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`, {
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

    const res = await fetch(`${API_BASE}/correct_track?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`, {
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

  if (!clipId) {
    return <p>Enter a clip name above to begin tracking.</p>
  }

  return (
    <div>
      <h2>Video Tracker — clip: {clipId}</h2>

      {!trackingData && (
        <div>
          <p>Select who you're marking, then click their spot on the frame below.</p>
          <label>
            Marking:{" "}
            <select value={pendingLabel} onChange={(e) => setPendingLabel(e.target.value)}>
              {rosterOptions.map((r) => (
                <option key={r.label} value={r.label}>{r.name}</option>
              ))}
            </select>
          </label>

          <img
            ref={frameImgRef}
            src={frameUrl}
            onClick={handleFrameClick}
            style={{ maxWidth: "600px", display: "block", cursor: "crosshair" }}
          />
          <ul>
            {selections.map((s) => {
              const roster = rosterOptions.find((r) => r.label === s.label)
              return <li key={s.label}>{roster?.name ?? s.label} — ({Math.round(s.x)}, {Math.round(s.y)})</li>
            })}
          </ul>
          <button onClick={startTracking} disabled={selections.length === 0}>
            Start Tracking
          </button>
        </div>
      )}

      {trackingData && (
        <div>
          <div style={{ position: "relative", width: videoDisplaySize.width }} onClick={handleOverlayClick}>
            <video
              ref={videoRef}
              src={videoUrl}
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
            Fix:{" "}
            <select value={correctingLabel} onChange={(e) => setCorrectingLabel(e.target.value)}>
              <option value="">-- select --</option>
              {allLabels.map((l) => {
                const roster = rosterOptions.find((r) => r.label === l)
                return <option key={l} value={l}>{roster?.name ?? l}</option>
              })}
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
