import { useState, useEffect, useRef } from "react"

const API_BASE = "http://localhost:5001"

type Mark = { timestamp: number; meterX: number; meterY: number; pixelX: number; pixelY: number }
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
  const [calibrationTimes, setCalibrationTimes] = useState<number[]>([])
  const [calibrationIndex, setCalibrationIndex] = useState(0)
  const [pendingLabel, setPendingLabel] = useState(rosterOptions[0]?.label ?? "")
  const [keyframes, setKeyframes] = useState<Keyframes>({})
  const [imgDisplaySize, setImgDisplaySize] = useState({ width: 600, height: 338 })

  const frameImgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    if (!clipId || !videoReady) return

    fetch(`${API_BASE}/video_info?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.fps) setFps(data.fps)
      })

    fetch(`${API_BASE}/calibrations?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then((data) => {
        const times = (data.calibrations ?? [])
          .map((c: Calibration) => c.startTime)
          .sort((a: number, b: number) => a - b)
        setCalibrationTimes(times)
        setCalibrationIndex(0)
      })

    fetch(`${API_BASE}/keyframes?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
      .then((r) => r.json())
      .then(setKeyframes)
  }, [profile, clipId, videoReady])

  const currentTime = calibrationTimes[calibrationIndex] ?? 0
  const currentFrameIndex = Math.round(currentTime * fps)
  const frameUrl = `${API_BASE}/frame/${encodeURIComponent(profile)}/${encodeURIComponent(clipId)}/${currentFrameIndex}`

  async function handleFrameClick(event: React.MouseEvent<HTMLImageElement>) {
    const img = frameImgRef.current
    if (!img || !pendingLabel || calibrationTimes.length === 0) return

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
      alert(`Could not mark keyframe (status ${res.status}).`)
      return
    }

    const data = await res.json()
    setKeyframes(data)
  }

  async function recomputeAll() {
  const res = await fetch(
    `${API_BASE}/recompute_keyframes?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`,
    { method: "POST" }
  )
  const data = await res.json()
  setKeyframes(data)
  alert("Recomputed all keyframe positions from current calibration data.")
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

  if (calibrationTimes.length === 0) {
    return <p>No saved calibrations.</p>
  }

  const marksAtThisKeyframe = Object.entries(keyframes)
    .map(([label, marks]) => {
      const mark = marks.find((m) => Math.abs(m.timestamp - currentTime) < 0.001)
      return mark ? { label, mark } : null
    })
    .filter((entry): entry is { label: string; mark: Mark } => entry !== null)

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
        <button onClick={() => setCalibrationIndex((i) => Math.max(0, i - 1))} disabled={calibrationIndex === 0}>
          Previous Keyframe
        </button>
        <span style={{ margin: "0 10px" }}>
          Keyframe {calibrationIndex + 1} of {calibrationTimes.length} — {currentTime.toFixed(2)}s
        </span>
        <button
          onClick={() => setCalibrationIndex((i) => Math.min(calibrationTimes.length - 1, i + 1))}
          disabled={calibrationIndex === calibrationTimes.length - 1}
        >
          Next Keyframe
        </button>
        <button onClick={recomputeAll} style={{ marginTop: "10px" }}>
          Recompute All Positions From Current Calibrations
        </button>
      </div>

      <div style={{ position: "relative", width: imgDisplaySize.width, marginTop: "10px" }}>
        <img
          ref={frameImgRef}
          src={frameUrl}
          onClick={handleFrameClick}
          onLoad={(e) => {
            const img = e.currentTarget
            const width = Math.min(600, img.naturalWidth)
            const height = (img.naturalHeight / img.naturalWidth) * width
            setImgDisplaySize({ width, height })
          }}
          style={{ width: imgDisplaySize.width, display: "block", cursor: "crosshair" }}
        />
        {marksAtThisKeyframe.map(({ label, mark }) => {
          const naturalWidth = frameImgRef.current?.naturalWidth || 1
          const naturalHeight = frameImgRef.current?.naturalHeight || 1
          const displayX = (mark.pixelX / naturalWidth) * imgDisplaySize.width
          const displayY = (mark.pixelY / naturalHeight) * imgDisplaySize.height
          const name = rosterOptions.find((r) => r.label === label)?.name ?? label
          const isBall = label === "ball"
          return (
            <div
              key={label}
              style={{ position: "absolute", left: displayX - 6, top: displayY - 6, pointerEvents: "none" }}
            >
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "red", border: "2px solid white" }} />
              {!isBall && (
                <div style={{ color: "white", background: "black", fontSize: "11px", padding: "1px 4px", whiteSpace: "nowrap" }}>
                  {name}
                </div>
              )}
            </div>
          )
      })}
      </div>

      <h3>Marked at this keyframe</h3>
      <ul>
        {marksAtThisKeyframe.map(({ label, mark }) => {
          const name = rosterOptions.find((r) => r.label === label)?.name ?? label
          return (
            <li key={label}>
              {name}
              <button onClick={() => handleDeleteMark(label, mark.timestamp)} style={{ marginLeft: "8px" }}>
                Delete
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default KeyframeMarker
