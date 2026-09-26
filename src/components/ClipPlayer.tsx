import { useState, useRef } from "react"
import type { Team } from "../types"

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

type PlayerOut = {
  id: number
  rosterId: number
  side: "home" | "away"
  number: number
  name: string
  position: string
  x: number
  y: number
  color: string
  numberColor: string
}

type ClipPlayerProps = {
  profile: string
  clipId: string
  homeTeam: Team | null
  awayTeam: Team | null
  homeColor: string
  homeNumberColor: string
  awayColor: string
  awayNumberColor: string
  setPlayers: (players: PlayerOut[]) => void
  setBallPosition: (pos: { x: number; y: number } | null) => void
}

// Matches the fixed constants in SoccerPitch.tsx exactly — this is what makes
// tracked positions line up correctly on the real board.
const PITCH_X = 25
const PITCH_Y = 25
const PITCH_WIDTH = 910
const PITCH_HEIGHT = 550
const SCALE_X = PITCH_WIDTH / 103
const SCALE_Y = PITCH_HEIGHT / 67
const FPS = 20

function meterToPixel(meterX: number, meterY: number) {
  return {
    x: PITCH_X + meterX * SCALE_X,
    y: PITCH_Y + meterY * SCALE_Y
  }
}

function ClipPlayer({
  profile,
  clipId,
  homeTeam,
  awayTeam,
  homeColor,
  homeNumberColor,
  awayColor,
  awayNumberColor,
  setPlayers,
  setBallPosition
}: ClipPlayerProps) {

  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [frameIndex, setFrameIndex] = useState(0)

  const intervalRef = useRef<number | null>(null)

  function applyFrame(data: TrackingData, index: number) {
    const frame = data.frames.find((f) => f.frameIndex === index) ?? data.frames[data.frames.length - 1]

    const newPlayers: PlayerOut[] = []
    let newBall: { x: number; y: number } | null = null

    frame.detections.forEach((d) => {
      if (d.label === "ball") {
        newBall = meterToPixel(d.meterX, d.meterY)
        return
      }

      const match = d.label.match(/^(home|away)_(\d+)$/)
      if (!match) return

      const side = match[1] as "home" | "away"
      const number = parseInt(match[2], 10)
      const team = side === "home" ? homeTeam : awayTeam
      const rosterPlayer = team?.roster.find((p) => p.number === number)
      if (!team || !rosterPlayer) return

      const idOffset = side === "home" ? 0 : 900000
      const { x, y } = meterToPixel(d.meterX, d.meterY)

      newPlayers.push({
        id: rosterPlayer.id + idOffset,
        rosterId: rosterPlayer.id,
        side,
        number: rosterPlayer.number,
        name: rosterPlayer.name,
        position: "",
        x,
        y,
        color: side === "home" ? homeColor : awayColor,
        numberColor: side === "home" ? homeNumberColor : awayNumberColor
      })
    })

    setPlayers(newPlayers)
    setBallPosition(newBall)
  }

  async function loadClip() {
    const res = await fetch(`${API_BASE}/tracking?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
    if (!res.ok) {
      alert(`Could not load tracking data (status ${res.status}).`)
      return
    }
    const data = await res.json()
    if (!data.frames || data.frames.length === 0) {
      alert("No tracking data found for this clip yet — run tracking first.")
      return
    }
    setTrackingData(data)
    setFrameIndex(0)
    applyFrame(data, 0)
  }

  function pause() {
    setIsPlaying(false)
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function play() {
    if (!trackingData) return
    setIsPlaying(true)

    intervalRef.current = window.setInterval(() => {
      setFrameIndex((current) => {
        const next = current + 1
        const maxFrame = trackingData.frames[trackingData.frames.length - 1].frameIndex
        if (next > maxFrame) {
          pause()
          return current
        }
        applyFrame(trackingData, next)
        return next
      })
    }, 1000 / FPS)
  }

  function scrub(index: number) {
    pause()
    setFrameIndex(index)
    if (trackingData) {
      applyFrame(trackingData, index)
    }
  }

  const maxFrame = trackingData ? trackingData.frames[trackingData.frames.length - 1].frameIndex : 0

  return (
    <div>
      <h2>Play Clip</h2>
      <button onClick={loadClip}>Load Clip: {clipId || "(no clip name set)"}</button>

      {trackingData && (
        <div>
          <button onClick={isPlaying ? pause : play}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <input
            type="range"
            min={0}
            max={maxFrame}
            value={frameIndex}
            onChange={(e) => scrub(parseInt(e.target.value, 10))}
            style={{ width: "400px", marginLeft: "10px" }}
          />
          <span style={{ marginLeft: "10px" }}>
            {(frameIndex / FPS).toFixed(1)}s / {(maxFrame / FPS).toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  )
}

export default ClipPlayer
