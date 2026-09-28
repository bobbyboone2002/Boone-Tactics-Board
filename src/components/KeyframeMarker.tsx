import { useState, useEffect, useRef } from "react"

const API_BASE = "http://localhost:5001"

type Mark = { timestamp: number; meterX: number; meterY: number }
type Keyframes = Record<string, Mark[]>

type RosterOption = { label: string; name: string }

type Calibration = { startTime: number }

type KeyframeMarkerProps = {
  profile: string
  clipId: string
  rosterOptions: RosterOption[]
  videoReady: boolean
}

function KeyframeMarker({ profile, clipId, rosterOptions, videoReady }: KeyframeMarkerProps) {
  const [fps, setFps] = useState(20)
  const [frameCount, setFrameCount] = useState(0)
  const [calibrationTimes, setCalibrationTimes] = useState<number[]>([])
  const [currentTime, setCurrentTime] = useState(0)
  const [pendingLabel, setPendingLabel] = useState(rosterOptions[0]?.label ?? "")
  const [keyframes, setKeyframes] = useState<Keyframes>({})

  const frameImgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!clipId || !videoReady) return

    fetch(`${API_BASE}/video_info?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.fps) setFps(data.fps)
        if (data.frameCount) setFrameCount(data.frameCount)
      })

    fetch(`${API_BASE}/calibrations?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then((data) => {
        const times = (data.calibrations ?? []).map((c: Calibration) => c.startTime)
        setCalibrationTimes(times)
      })

    fetch(`${API_BASE}/keyframes?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then(setKeyframes)
  }, [profile, clipId, videoReady])

  const currentFrameIndex = Math.min(Math.round(currentTime * fps), Math.max(frameCount - 1, 0))
  const frameUrl = `${API_BASE}/frame/${encodeURIComponent(profile)}/${encodeURIComponent(clipId)}/${currentFrameIndex}`
  const duration = frameCount > 0 ? (frameCount - 1) / fps : 0

  async function handleFrameClick(event: React.MouseEvent<HTMLImageElement>) {
    const img = frameImgRef.current
    if (!img || !pendingLabel) return

    const rect = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    const res = await fetch(
      `${API_BASE}/mark_keyframe?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: pendingLabel, timestamp: currentTime, x, y })
      }
    )

    if (!res.ok) {
      alert(`Could not mark keyframe (status ${res.status}). Is there a saved calibration covering this timestamp?`)
      return
    }

    const data = await res.json()
    setKeyframes(data)
  }

  async function handleDeleteMark(label: string, timestamp: number) {
    const res = await fetch(
      `${API_BASE}/delete_keyframe?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, timestamp })
      }
    )
    const data = await res.json()
    setKeyframes(data)
  }

  if (!clipId || !videoReady) {
    return null
  }

  const marksForPendingLabel = keyframes[pendingLabel] ?? []

  return (
    <div>
      <h2>Mark Keyframes — clip: {clipId}</h2>

      <label>
        Marking:{" "}
        <select value={pendingLabel} onChange={(e) => setPendingLabel(e.target.value)}>
          {rosterOptions.map((r) => (
            <option key={r.label} value={r.label}>{r.name}</option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: "10px" }}>
        <input
          type="range"
          min={0}
          max={duration}
          step={1 / fps}
          value={currentTime}
          onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
          style={{ width: "400px" }}
        />
        <span style={{ marginLeft: "10px" }}>{currentTime.toFixed(2)}s / {duration.toFixed(2)}s</span>
      </div>

      {calibrationTimes.length > 0 && (
        <div style={{ marginTop: "6px" }}>
          Jump to calibration:{" "}
          {calibrationTimes.map((t) => (
            <button key={t} onClick={() => setCurrentTime(t)} style={{ marginRight: "4px" }}>
              {t.toFixed(1)}s
            </button>
          ))}
        </div>
      )}

      <img
        ref={frameImgRef}
        src={frameUrl}
        onClick={handleFrameClick}
        style={{ maxWidth: "600px", display: "block", marginTop: "10px", cursor: "crosshair" }}
      />

      <h3>Marks for {rosterOptions.find((r) => r.label === pendingLabel)?.name ?? pendingLabel}</h3>
      <ul>
        {marksForPendingLabel.map((m) => (
          <li key={m.timestamp}>
            {m.timestamp.toFixed(2)}s
            <button onClick={() => handleDeleteMark(pendingLabel, m.timestamp)} style={{ marginLeft: "8px" }}>
              Delete
            </button>
            <button onClick={() => setCurrentTime(m.timestamp)} style={{ marginLeft: "8px" }}>
              Jump here
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default KeyframeMarker
