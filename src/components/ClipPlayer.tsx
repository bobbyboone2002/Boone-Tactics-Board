import { useState, useRef } from "react"
import type { Team } from "../types"

const API_BASE = "http://localhost:5001"

type Mark = { timestamp: number; meterX: number; meterY: number }
type Keyframes = Record<string, Mark[]>

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

const PITCH_X = 25
const PITCH_Y = 25
const PITCH_WIDTH = 910
const PITCH_HEIGHT = 550
const SCALE_X = PITCH_WIDTH / 103
const SCALE_Y = PITCH_HEIGHT / 67

function meterToPixel(meterX: number, meterY: number) {
  return {
    x: PITCH_X + meterX * SCALE_X,
    y: PITCH_Y + meterY * SCALE_Y
  }
}

// Position of a label at time t, interpolated between its own bracketing marks.
// Returns null if t is before the label's first mark or after its last one.
function interpolate(marks: Mark[], t: number): { meterX: number; meterY: number } | null {
  if (marks.length === 0) return null
  if (t < marks[0].timestamp || t > marks[marks.length - 1].timestamp) return null

  for (let i = 0; i < marks.length - 1; i++) {
    const a = marks[i]
    const b = marks[i + 1]
    if (t >= a.timestamp && t <= b.timestamp) {
      const span = b.timestamp - a.timestamp
      const frac = span === 0 ? 0 : (t - a.timestamp) / span
      return {
        meterX: a.meterX + (b.meterX - a.meterX) * frac,
        meterY: a.meterY + (b.meterY - a.meterY) * frac
      }
    }
  }
  return { meterX: marks[marks.length - 1].meterX, meterY: marks[marks.length - 1].meterY }
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

  const [keyframes, setKeyframes] = useState<Keyframes | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  const animationRef = useRef<number | null>(null)
  const lastTickRef = useRef<number>(0)

  function applyTime(data: Keyframes, t: number) {
    const newPlayers: PlayerOut[] = []
    let newBall: { x: number; y: number } | null = null

    Object.entries(data).forEach(([label, marks]) => {
      const result = interpolate(marks, t)
      if (!result) return

      if (label === "ball") {
        newBall = meterToPixel(result.meterX, result.meterY)
        return
      }

      const match = label.match(/^(home|away)_(\d+)$/)
      if (!match) return

      const side = match[1] as "home" | "away"
      const number = parseInt(match[2], 10)
      const team = side === "home" ? homeTeam : awayTeam
      const rosterPlayer = team?.roster.find((p) => p.number === number)
      if (!team || !rosterPlayer) return

      const idOffset = side === "home" ? 0 : 900000
      const { x, y } = meterToPixel(result.meterX, result.meterY)

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
    const res = await fetch(`${API_BASE}/keyframes?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
    if (!res.ok) {
      alert(`Could not load keyframes (status ${res.status}).`)
      return
    }
    const data: Keyframes = await res.json()

    const allTimestamps = Object.values(data).flat().map((m) => m.timestamp)
    if (allTimestamps.length === 0) {
      alert("No keyframes marked for this clip yet.")
      return
    }

    setKeyframes(data)
    setDuration(Math.max(...allTimestamps))
    setCurrentTime(0)
    applyTime(data, 0)
  }

  function pause() {
    setIsPlaying(false)
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
  }

  function startRecording() {
  const canvas = document.querySelector(".konvajs-content canvas") as HTMLCanvasElement | null
  if (!canvas) {
    alert("Could not find the pitch canvas to record.")
    return
  }

  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })
  recordedChunksRef.current = []

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordedChunksRef.current.push(e.data)
  }

  recorder.onstop = () => {
    const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${clipId}_replay.webm`
    link.click()
    URL.revokeObjectURL(url)
  }

  recorder.start()
  mediaRecorderRef.current = recorder
  setIsRecording(true)
}

function stopRecording() {
  mediaRecorderRef.current?.stop()
  setIsRecording(false)
}

async function playAndRecord() {
  startRecording()
  play()
}

  function tick(now: number) {
    const deltaSeconds = (now - lastTickRef.current) / 1000
    lastTickRef.current = now

    setCurrentTime((current) => {
      const next = current + deltaSeconds
      if (next >= duration) {
        pause()
        if (keyframes) applyTime(keyframes, duration)
        return duration
      }
      if (keyframes) applyTime(keyframes, next)
      return next
    })

    animationRef.current = requestAnimationFrame(tick)
  }

  function play() {
    if (!keyframes) return
    setIsPlaying(true)
    lastTickRef.current = performance.now()
    animationRef.current = requestAnimationFrame(tick)
  }

  function scrub(t: number) {
    pause()
    setCurrentTime(t)
    if (keyframes) applyTime(keyframes, t)
  }

  return (
    <div>
      <h2>Play Clip</h2>
      <button onClick={loadClip}>Load Clip: {clipId || "(no clip name set)"}</button>

      {keyframes && (
        <div>
          <button onClick={isPlaying ? pause : play}>
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button onClick={isRecording ? stopRecording : playAndRecord} style={{ marginLeft: "10px" }}>
          {isRecording ? "Stop & Download" : "Record & Download"}
          </button>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={(e) => scrub(parseFloat(e.target.value))}
            style={{ width: "400px", marginLeft: "10px" }}
          />
          <span style={{ marginLeft: "10px" }}>
            {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        </div>
      )}
    </div>
  )
}

export default ClipPlayer
