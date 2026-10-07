import { useEffect, useState, useRef } from "react"
import './App.css'
import SoccerPitch from './components/SoccerPitch'
import Toolbar from "./components/Toolbar"
import PlayerEditor from "./components/PlayerEditor"
import PlayerCreator from "./components/PlayerCreator"
import TextEditor from "./components/TextEditor"
import FormationSelector from "./components/FormationSelector"
import { formations } from "./data/formations"
import TeamSelector from "./components/TeamSelector"
import { teams } from "./data/teams"
import TextCreator from "./components/TextCreator"
import BenchPanel from "./components/BenchPanel"
import KitSelector from "./components/KitSelector"
import PlaysPanel from "./components/PlaysPanel"
import FramesPanel from "./components/FramesPanel"
import SwapTeamPanel from "./components/SwapTeamPanel"
import ClipPlayer from "./components/ClipPlayer"
import type { Team } from "./types"
import MatchSetup from "./components/MatchSetup"
import KeyframeMarker from "./components/KeyframeMarker"
import VideoToolsGate from "./components/VideoToolsGate"

type Snapshot = {
  players: {
    id: number
    rosterId?: number
    side?: "home" | "away"
    number: number
    name: string
    position: string
    x: number
    y: number
    color: string
    numberColor: string
    slotIndex?: number
  }[]
  ballPosition: {
    x: number
    y: number
  } | null
  arrows: {
    id: number
    startX: number
    startY: number
    endX: number
    endY: number
    style: "arrow" | "double" | "dashed" | "line"
    color: string
    curved?: boolean
    controlX?: number
    controlY?: number
  }[]
  texts: {
    id: number
    x: number
    y: number
    text: string
    color: string
  }[]
  rectangles: {
    id: number
    x: number
    y: number
    width: number
    height: number
    style: "solid" | "dashed"
    color: string
    opacity: number
  }[]
}

type TacticsBoardProps = {
  profile: string
  onSwitchProfile: () => void
}

function getActiveKit(team: Team, overrides: Record<number, "home" | "away" | "third">): "home" | "away" | "third" {
  return overrides[team.id] ?? team.activeKit
}

function getKitColor(team: Team, overrides: Record<number, "home" | "away" | "third">): string {

  const kit = getActiveKit(team, overrides)

  if (kit === "home") {
    return team.homeColor
  }

  if (kit === "away") {
    return team.awayColor
  }

  return team.thirdColor
}

function getKitNumberColor(team: Team, overrides: Record<number, "home" | "away" | "third">): string {

  const kit = getActiveKit(team, overrides)

  if (kit === "home") {
    return team.homeNumberColor
  }

  if (kit === "away") {
    return team.awayNumberColor
  }

  return team.thirdNumberColor
}

function generateLineup(team: Team, formationName: string): (number | null)[] {

  const slots = formations[formationName]

  const assignment: (number | null)[] = slots.map(() => null)
  const used = new Set<number>()

  team.roster.forEach((player) => {

    const slotIndex = slots.findIndex(
      (slot, index) => assignment[index] === null && player.positions.includes(slot.role)
    )

    if (slotIndex !== -1) {
      assignment[slotIndex] = player.id
      used.add(player.id)
    }

  })

  return assignment
}

function buildPlayersFromAssignment(
  team: Team,
  formationName: string,
  assignment: (number | null)[],
  overrides: Record<number, "home" | "away" | "third">,
  side: "home" | "away"
) {

  const slots = formations[formationName]

  const kitColor = getKitColor(team, overrides)
  const kitNumberColor = getKitNumberColor(team, overrides)

  const idOffset = side === "home" ? 0 : 900000

  const built: {
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
    slotIndex: number
  }[] = []

  assignment.forEach((rosterId, index) => {

    if (rosterId === null) {
      return
    }

    const rosterPlayer = team.roster.find((player) => player.id === rosterId)

    if (!rosterPlayer) {
      return
    }

    built.push({
      id: rosterPlayer.id + idOffset,
      rosterId: rosterPlayer.id,
      side,
      number: rosterPlayer.number,
      name: rosterPlayer.name,
      position: slots[index].role,
      x: side === "home" ? slots[index].x : 960 - slots[index].x,
      y: side === "home" ? slots[index].y : 600 - slots[index].y,
      color: kitColor,
      numberColor: kitNumberColor,
      slotIndex: index
    })

  })

  return built
}

function TacticsBoard({ profile, onSwitchProfile }: TacticsBoardProps) {

  function storageKey(name: string) {
    return `tacticsBoard_${profile}_${name}`
  }

    function loadSavedSession(): {
    homeTeamId?: number | null
    awayTeamId?: number | null
    homeFormation?: string | null
    awayFormation?: string | null
    kitOverrides?: Record<number, "home" | "away" | "third">
    focusedSide?: "home" | "away"
  } {
    try {
      const stored = localStorage.getItem(storageKey("session"))
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  }

  function loadSavedBoardState(): Snapshot | null {
    try {
      const stored = localStorage.getItem(storageKey("boardState"))
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const savedBoardState = loadSavedBoardState()

  const [selectedTool, setSelectedTool] = useState("select")

  const [clipId, setClipId] = useState<string>("")

  const [videoUploaded, setVideoUploaded] = useState(false)

  const [homeTeamId, setHomeTeamId] = useState<number | null>(() => loadSavedSession().homeTeamId ?? null)
  const [awayTeamId, setAwayTeamId] = useState<number | null>(() => loadSavedSession().awayTeamId ?? null)

  const [focusedSide, setFocusedSide] = useState<"home" | "away">(() => loadSavedSession().focusedSide ?? "home")

  const [selectedArrowStyle, setSelectedArrowStyle] =
  useState<"arrow" | "double" | "dashed" | "line">("arrow")

  const [selectedArrowColor, setSelectedArrowColor] =
  useState("yellow")

  const [selectedArrowCurved, setSelectedArrowCurved] = useState(false)

  const [selectedArrow, setSelectedArrow] = useState<number | null>(null)

  const [newPlayerPosition, setNewPlayerPosition] = useState<{
  x: number
  y: number
} | null>(null)

  const [newTextPosition, setNewTextPosition] = useState<{
  x: number
  y: number
} | null>(null)

const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null)

    const [players, setPlayers] = useState <
    {
      id: number
      rosterId?: number
      side?: "home" | "away"
      number: number
      name: string
      position: string
      x: number
      y: number
      color: string
      numberColor: string
      slotIndex?: number
    }[]
  >(savedBoardState?.players ?? [])

    const [ballPosition, setBallPosition] = useState<{
  x: number
  y: number
} | null>(savedBoardState?.ballPosition ?? null)

const [arrows, setArrows] = useState <
  {
    id: number
    startX: number
    startY: number
    endX: number
    endY: number
    style: "arrow" | "double" | "dashed" | "line"
    color: string
    curved?: boolean
    controlX?: number
    controlY?: number
  }[]
>(savedBoardState?.arrows ?? [])

const [texts, setTexts] = useState <
  {
    id: number
    x: number
    y: number
    text: string
    color: string
  }[]
>(savedBoardState?.texts ?? [])

const [rectangles, setRectangles] = useState <
  {
    id: number
    x: number
    y: number
    width: number
    height: number
    style: "solid" | "dashed"
    color: string
    opacity: number
  }[]
>(savedBoardState?.rectangles ?? [])

const [selectedRectStyle, setSelectedRectStyle] =
  useState<"solid" | "dashed">("solid")

const [selectedRectColor, setSelectedRectColor] = useState("yellow")

const [selectedRectOpacity, setSelectedRectOpacity] = useState(0.5)

const [selectedRectangle, setSelectedRectangle] = useState<number | null>(null)

const [selectedTextColor, setSelectedTextColor] = useState("white")

const [selectedText, setSelectedText] = useState<number | null>(null)

const [past, setPast] = useState<Snapshot[]>([])
const [future, setFuture] = useState<Snapshot[]>([])

const [homeFormation, setHomeFormation] = useState<string | null>(() => loadSavedSession().homeFormation ?? null)
const [awayFormation, setAwayFormation] = useState<string | null>(() => loadSavedSession().awayFormation ?? null)

const [lineups, setLineups] = useState<Record<string, (number | null)[]>>(() => {

  try {
    const stored = localStorage.getItem(storageKey("lineups"))
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }

})

const [swapSource, setSwapSource] = useState<{ type: "pitch" | "bench"; id: number } | null>(null)

const [showBench, setShowBench] = useState(false)

const [showKit, setShowKit] = useState(false)

const [showFormation, setShowFormation] = useState(false)

const [selectedCategory, setSelectedCategory] = useState<"Custom" | "Premier League" | null>(null)

const [kitOverrides, setKitOverrides] = useState<Record<number, "home" | "away" | "third">>(() => loadSavedSession().kitOverrides ?? {})

const [multiSelection, setMultiSelection] = useState <
  { type: "player" | "ball" | "arrow" | "rectangle" | "text"; id: number }[]
>([])

const [playNamesByTeam, setPlayNamesByTeam] = useState<Record<number, string[]>>(() => {
  try {
    const stored = localStorage.getItem(storageKey("playNames"))
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
})

const [playFrames, setPlayFrames] = useState<Record<string, Snapshot[]>>(() => {
  try {
    const stored = localStorage.getItem(storageKey("playFrames"))
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
})

const [showPlays, setShowPlays] = useState(false)

const [selectedPlayName, setSelectedPlayName] = useState<string | null>(null)

const [activeFrameIndex, setActiveFrameIndex] = useState<number | null>(null)

const [showPlayerNames, setShowPlayerNames] = useState(true)
const [showPlayerPositions, setShowPlayerPositions] = useState(true)

const [showSwapTeam, setShowSwapTeam] = useState(false)

const [showConfirmClear, setShowConfirmClear] = useState(false)

const skipHistory = useRef(false)
const isFirstRender = useRef(true)

const previousSnapshot = useRef<Snapshot>({
  players,
  ballPosition,
  arrows,
  texts,
  rectangles
})

  function updatePlayerPosition(
  id: number,
  x: number,
  y: number
) {

  const current = players.find((player) => player.id === id)

  if (!current) {
    return
  }

  const deltaX = x - current.x
  const deltaY = y - current.y

  const inGroup = multiSelection.some((s) => s.type === "player" && s.id === id) && multiSelection.length > 1

  if (inGroup) {
    moveSelectedBy(deltaX, deltaY)
    return
  }

  setPlayers(
    players.map((player) =>
      player.id === id
        ? { ...player, x, y }
        : player
    )
  )
}

function updatePlayer(
  id: number,
  updatedPlayer: {
    number: number
    name: string
    position: string
    color: string
  }
) {
  setPlayers(
    players.map((player) =>
      player.id === id
        ? {
            ...player,
            ...updatedPlayer
          }
        : player
    )
  )
}

function deletePlayer(id: number) {
  setPlayers(
    players.filter((player) => player.id !== id)
  )

  setSelectedPlayer(null)
}

function createPlayer(
  name: string,
  number: number,
  position: string,
  color: string
) {

  if (!newPlayerPosition) {
    return
  }

  const newPlayer = {
    id: Date.now(),
    number,
    name,
    position,
    color,
    numberColor: "white",
    x: newPlayerPosition.x,
    y: newPlayerPosition.y
  }

  setPlayers([
    ...players,
    newPlayer
  ])

  setNewPlayerPosition(null)
}

function createText(text: string) {

  if (!newTextPosition) {
    return
  }

  setTexts([
    ...texts,
    {
      id: Date.now(),
      x: newTextPosition.x,
      y: newTextPosition.y,
      text,
      color: selectedTextColor
    }
  ])

  setNewTextPosition(null)
}

function updateText(id: number, text: string, color: string) {
  setTexts(
    texts.map((item) =>
      item.id === id
        ? { ...item, text, color }
        : item
    )
  )
}

function deleteText(id: number) {
  setTexts(
    texts.filter((item) => item.id !== id)
  )

  setSelectedText(null)
}

function undo() {

  if (past.length === 0) {
    return
  }

  const previous = past[past.length - 1]

  setFuture(current => [
    { players, ballPosition, arrows, texts, rectangles },
    ...current
  ])

  setPast(current => current.slice(0, -1))

  skipHistory.current = true

  setPlayers(previous.players)
  setBallPosition(previous.ballPosition)
  setArrows(previous.arrows)
  setTexts(previous.texts)
  setRectangles(previous.rectangles)

  setSelectedPlayer(null)
  setSelectedArrow(null)
  setSelectedText(null)
  setSelectedRectangle(null)
}

function redo() {

  if (future.length === 0) {
    return
  }

  const next = future[0]

  setPast(current => [
    ...current,
    { players, ballPosition, arrows, texts, rectangles }
  ])

  setFuture(current => current.slice(1))

  skipHistory.current = true

  setPlayers(next.players)
  setBallPosition(next.ballPosition)
  setArrows(next.arrows)
  setTexts(next.texts)
  setRectangles(next.rectangles)

  setSelectedPlayer(null)
  setSelectedArrow(null)
  setSelectedText(null)
  setSelectedRectangle(null)
}

function setPlayersFromClip(newPlayers: typeof players) {
  skipHistory.current = true
  setPlayers(newPlayers)
}

function setBallPositionFromClip(newBall: typeof ballPosition) {
  skipHistory.current = true
  setBallPosition(newBall)
}

function toggleMultiSelect(type: "player" | "ball" | "arrow" | "rectangle" | "text", id: number) {

  setMultiSelection((current) => {

    const exists = current.some((item) => item.type === type && item.id === id)

    if (exists) {
      return current.filter((item) => !(item.type === type && item.id === id))
    }

    return [...current, { type, id }]

  })

}

function moveSelectedBy(deltaX: number, deltaY: number) {

  setPlayers((current) =>
    current.map((player) =>
      multiSelection.some((s) => s.type === "player" && s.id === player.id)
        ? { ...player, x: player.x + deltaX, y: player.y + deltaY }
        : player
    )
  )

  if (ballPosition && multiSelection.some((s) => s.type === "ball")) {
    setBallPosition({ x: ballPosition.x + deltaX, y: ballPosition.y + deltaY })
  }

  setArrows((current) =>
    current.map((arrow) =>
      multiSelection.some((s) => s.type === "arrow" && s.id === arrow.id)
        ? {
            ...arrow,
            startX: arrow.startX + deltaX,
            startY: arrow.startY + deltaY,
            endX: arrow.endX + deltaX,
            endY: arrow.endY + deltaY,
            controlX: arrow.controlX !== undefined ? arrow.controlX + deltaX : arrow.controlX,
            controlY: arrow.controlY !== undefined ? arrow.controlY + deltaY : arrow.controlY
          }
        : arrow
    )
  )

  setRectangles((current) =>
    current.map((rect) =>
      multiSelection.some((s) => s.type === "rectangle" && s.id === rect.id)
        ? { ...rect, x: rect.x + deltaX, y: rect.y + deltaY }
        : rect
    )
  )

  setTexts((current) =>
    current.map((item) =>
      multiSelection.some((s) => s.type === "text" && s.id === item.id)
        ? { ...item, x: item.x + deltaX, y: item.y + deltaY }
        : item
    )
  )

}

function animateToSnapshot(target: Snapshot, duration = 800) {

  const before: Snapshot = { players, ballPosition, arrows, texts, rectangles }

  const startPlayers = players
  const startBall = ballPosition
  const startArrows = arrows
  const startRects = rectangles
  const startTexts = texts

  const startTime = performance.now()

  function step(now: number) {

    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)

    skipHistory.current = true

    setPlayers(
      target.players.map((targetPlayer) => {
        const startPlayer = startPlayers.find((p) => p.id === targetPlayer.id)
        return startPlayer
          ? {
              ...targetPlayer,
              x: startPlayer.x + (targetPlayer.x - startPlayer.x) * t,
              y: startPlayer.y + (targetPlayer.y - startPlayer.y) * t
            }
          : targetPlayer
      })
    )

    setBallPosition(
      target.ballPosition
        ? {
            x: (startBall?.x ?? target.ballPosition.x) + (target.ballPosition.x - (startBall?.x ?? target.ballPosition.x)) * t,
            y: (startBall?.y ?? target.ballPosition.y) + (target.ballPosition.y - (startBall?.y ?? target.ballPosition.y)) * t
          }
        : null
    )

    setArrows(
      target.arrows.map((targetArrow) => {
        const startArrow = startArrows.find((a) => a.id === targetArrow.id)
        if (!startArrow) return targetArrow
        return {
          ...targetArrow,
          startX: startArrow.startX + (targetArrow.startX - startArrow.startX) * t,
          startY: startArrow.startY + (targetArrow.startY - startArrow.startY) * t,
          endX: startArrow.endX + (targetArrow.endX - startArrow.endX) * t,
          endY: startArrow.endY + (targetArrow.endY - startArrow.endY) * t,
          controlX:
            targetArrow.controlX !== undefined && startArrow.controlX !== undefined
              ? startArrow.controlX + (targetArrow.controlX - startArrow.controlX) * t
              : targetArrow.controlX,
          controlY:
            targetArrow.controlY !== undefined && startArrow.controlY !== undefined
              ? startArrow.controlY + (targetArrow.controlY - startArrow.controlY) * t
              : targetArrow.controlY
        }
      })
    )

    setRectangles(
      target.rectangles.map((targetRect) => {
        const startRect = startRects.find((r) => r.id === targetRect.id)
        if (!startRect) return targetRect
        return {
          ...targetRect,
          x: startRect.x + (targetRect.x - startRect.x) * t,
          y: startRect.y + (targetRect.y - startRect.y) * t
        }
      })
    )

    setTexts(
      target.texts.map((targetText) => {
        const startText = startTexts.find((tx) => tx.id === targetText.id)
        if (!startText) return targetText
        return {
          ...targetText,
          x: startText.x + (targetText.x - startText.x) * t,
          y: startText.y + (targetText.y - startText.y) * t
        }
      })
    )

    if (t < 1) {
      requestAnimationFrame(step)
    } else {
      setPast((current) => [...current, before])
      setFuture([])
    }

  }

  requestAnimationFrame(step)

}

function addPlayName(name: string) {

  if (homeTeamId === null) {
    return
  }

  const existing = playNamesByTeam[homeTeamId] ?? []

  if (existing.includes(name)) {
    return
  }

  const updated = { ...playNamesByTeam, [homeTeamId]: [...existing, name] }

  setPlayNamesByTeam(updated)

  localStorage.setItem(storageKey("playNames"), JSON.stringify(updated))

}

function deletePlay(name: string) {

  if (homeTeamId === null) {
    return
  }

  const key = `${homeTeamId}_${name}`

  const updatedFrames = { ...playFrames }
  delete updatedFrames[key]

  setPlayFrames(updatedFrames)
  localStorage.setItem(storageKey("playFrames"), JSON.stringify(updatedFrames))

  const existingNames = playNamesByTeam[homeTeamId] ?? []
  const updatedNames = { ...playNamesByTeam, [homeTeamId]: existingNames.filter((n) => n !== name) }

  setPlayNamesByTeam(updatedNames)
  localStorage.setItem(storageKey("playNames"), JSON.stringify(updatedNames))

  if (selectedPlayName === name) {
    setSelectedPlayName(null)
    setActiveFrameIndex(null)
  }

}

function selectPlay(name: string) {
  setSelectedPlayName(name)
  setActiveFrameIndex(null)
}

function addFrame() {

  if (!selectedPlayName || homeTeamId === null) {
    return
  }

  const key = `${homeTeamId}_${selectedPlayName}`

  const snapshot: Snapshot = { players, ballPosition, arrows, texts, rectangles }

  const existing = playFrames[key] ?? []

  const updated = { ...playFrames, [key]: [...existing, snapshot] }

  setPlayFrames(updated)

  localStorage.setItem(storageKey("playFrames"), JSON.stringify(updated))

  setActiveFrameIndex(existing.length)

}

function savePlay() {

  if (!selectedPlayName || activeFrameIndex === null || homeTeamId === null) {
    return
  }

  const key = `${homeTeamId}_${selectedPlayName}`

  const snapshot: Snapshot = { players, ballPosition, arrows, texts, rectangles }

  const existing = playFrames[key] ?? []

  const updatedFrames = existing.map((frame, index) =>
    index === activeFrameIndex ? snapshot : frame
  )

  const updated = { ...playFrames, [key]: updatedFrames }

  setPlayFrames(updated)

  localStorage.setItem(storageKey("playFrames"), JSON.stringify(updated))

}

function loadFrame(index: number) {

  if (!selectedPlayName || homeTeamId === null) {
    return
  }

  const key = `${homeTeamId}_${selectedPlayName}`

  const frame = (playFrames[key] ?? [])[index]

  if (!frame) {
    return
  }

  animateToSnapshot(frame)

  setActiveFrameIndex(index)

}

function deleteFrame(index: number) {

  if (!selectedPlayName || homeTeamId === null) {
    return
  }

  const key = `${homeTeamId}_${selectedPlayName}`

  const existing = playFrames[key] ?? []

  const updatedFrames = existing.filter((_, i) => i !== index)

  const updated = { ...playFrames, [key]: updatedFrames }

  setPlayFrames(updated)

  localStorage.setItem(storageKey("playFrames"), JSON.stringify(updated))

  if (activeFrameIndex === index) {
    setActiveFrameIndex(null)
  } else if (activeFrameIndex !== null && activeFrameIndex > index) {
    setActiveFrameIndex(activeFrameIndex - 1)
  }

}

function swapAwayTeam(newTeamId: number) {

  if (!selectedPlayName || homeTeamId === null) {
    return
  }

  const newTeam = teams.find((t) => t.id === newTeamId)

  if (!newTeam) {
    return
  }

  const confirmedTeam = newTeam

  const formationName = awayFormation ?? "4-3-3"

  const assignment = generateLineup(confirmedTeam, formationName)

  const kitColor = getKitColor(confirmedTeam, kitOverrides)
  const kitNumberColor = getKitNumberColor(confirmedTeam, kitOverrides)

  const idOffset = 900000

  function remapPlayers(snapshotPlayers: Snapshot["players"]) {
    return snapshotPlayers.map((player) => {

      if (player.side !== "away" || player.slotIndex === undefined) {
        return player
      }

      const newRosterId = assignment[player.slotIndex]

      if (newRosterId === null || newRosterId === undefined) {
        return player
      }

      const rosterPlayer = confirmedTeam.roster.find((p) => p.id === newRosterId)

      if (!rosterPlayer) {
        return player
      }

      return {
        ...player,
        id: rosterPlayer.id + idOffset,
        rosterId: rosterPlayer.id,
        number: rosterPlayer.number,
        name: rosterPlayer.name,
        color: kitColor,
        numberColor: kitNumberColor
      }

    })
  }

  const key = `${homeTeamId}_${selectedPlayName}`

  const existingFrames = playFrames[key] ?? []

  const updatedFrames = existingFrames.map((frame) => ({
    ...frame,
    players: remapPlayers(frame.players)
  }))

  const updated = { ...playFrames, [key]: updatedFrames }

  setPlayFrames(updated)

  localStorage.setItem(storageKey("playFrames"), JSON.stringify(updated))

  setAwayTeamId(newTeamId)

  setPlayers((current) => remapPlayers(current))

}

function flipField() {

  const mirrorX = (x: number) => 960 - x
  const mirrorY = (y: number) => 600 - y

  setPlayers(current =>
    current.map(player => ({
      ...player,
      x: mirrorX(player.x),
      y: mirrorY(player.y)
    }))
  )

  setBallPosition(current =>
    current ? { x: mirrorX(current.x), y: mirrorY(current.y) } : current
  )

  setArrows(current =>
    current.map(arrow => ({
      ...arrow,
      startX: mirrorX(arrow.startX),
      startY: mirrorY(arrow.startY),
      endX: mirrorX(arrow.endX),
      endY: mirrorY(arrow.endY),
      controlX: arrow.controlX !== undefined ? mirrorX(arrow.controlX) : arrow.controlX,
      controlY: arrow.controlY !== undefined ? mirrorY(arrow.controlY) : arrow.controlY
    }))
  )

  setTexts(current =>
    current.map(item => ({
      ...item,
      x: mirrorX(item.x),
      y: mirrorY(item.y)
    }))
  )

  setRectangles(current =>
    current.map(rect => ({
      ...rect,
      x: mirrorX(rect.x + rect.width),
      y: mirrorY(rect.y + rect.height)
    }))
  )
}

function applyFormation(formationName: string, side: "home" | "away") {

  const slots = formations[formationName]

  if (!slots) {
    return
  }

  const teamId = side === "home" ? homeTeamId : awayTeamId

  if (teamId !== null) {

    const team = teams.find((t) => t.id === teamId)

    if (team) {

      const key = `${teamId}_${formationName}`

      const assignment = lineups[key] ?? generateLineup(team, formationName)

      if (!lineups[key]) {
        setLineups((current) => ({ ...current, [key]: assignment }))
      }

      const otherSidePlayers = players.filter((player) => player.side !== side)
      const newSidePlayers = buildPlayersFromAssignment(team, formationName, assignment, kitOverrides, side)

      setPlayers([...otherSidePlayers, ...newSidePlayers])

      if (side === "home") {
        setHomeFormation(formationName)
      } else {
        setAwayFormation(formationName)
      }

      return
    }
  }

  setPlayers((current) => {

    const sidePlayers = current.filter((player) => player.side === side)
    const otherPlayers = current.filter((player) => player.side !== side)

    const repositioned = sidePlayers.map((player, index) => ({
      ...player,
      x: side === "home" ? (slots[index]?.x ?? player.x) : 960 - (slots[index]?.x ?? player.x),
      y: side === "home" ? (slots[index]?.y ?? player.y) : 600 - (slots[index]?.y ?? player.y),
      position: slots[index]?.role ?? player.position,
      numberColor: player.numberColor ?? "white",
      slotIndex: index
    }))

    return [...otherPlayers, ...repositioned]
  })

  if (side === "home") {
    setHomeFormation(formationName)
  } else {
    setAwayFormation(formationName)
  }
}

function loadTeam(teamId: number, side: "home" | "away") {

  const team = teams.find((t) => t.id === teamId)

  if (!team) {
    return
  }

  const formationName = (side === "home" ? homeFormation : awayFormation) ?? "4-3-3"

  const key = `${teamId}_${formationName}`

  const assignment = lineups[key] ?? generateLineup(team, formationName)

  if (!lineups[key]) {
    setLineups((current) => ({ ...current, [key]: assignment }))
  }

  const otherSidePlayers = players.filter((player) => player.side !== side)
  const newSidePlayers = buildPlayersFromAssignment(team, formationName, assignment, kitOverrides, side)

  setPlayers([...otherSidePlayers, ...newSidePlayers])

  if (side === "home") {
    setHomeTeamId(team.id)
    setHomeFormation(formationName)
  } else {
    setAwayTeamId(team.id)
    setAwayFormation(formationName)
  }
}

function saveLineup(side: "home" | "away") {

  const teamId = side === "home" ? homeTeamId : awayTeamId
  const formationName = side === "home" ? homeFormation : awayFormation

  if (teamId === null || !formationName) {
    return
  }

  const slots = formations[formationName]

  const assignment: (number | null)[] = slots.map(() => null)

  players
    .filter((player) => player.side === side)
    .forEach((player) => {
      if (player.slotIndex !== undefined && player.rosterId !== undefined) {
        assignment[player.slotIndex] = player.rosterId
      }
    })

  const key = `${teamId}_${formationName}`

  const updated = { ...lineups, [key]: assignment }

  setLineups(updated)

  localStorage.setItem(storageKey("lineups"), JSON.stringify(updated))
}

function swapStarters(idA: number, idB: number) {

  setPlayers((current) => {

    const playerA = current.find((player) => player.id === idA)
    const playerB = current.find((player) => player.id === idB)

    if (!playerA || !playerB || playerA.side !== playerB.side) {
      return current
    }

    return current.map((player) => {

      if (player.id === idA) {
        return {
          ...player,
          x: playerB.x,
          y: playerB.y,
          position: playerB.position,
          slotIndex: playerB.slotIndex
        }
      }

      if (player.id === idB) {
        return {
          ...player,
          x: playerA.x,
          y: playerA.y,
          position: playerA.position,
          slotIndex: playerA.slotIndex
        }
      }

      return player
    })
  })
}

function swapBenchIn(pitchId: number, benchRosterId: number) {

  const outgoing = players.find((player) => player.id === pitchId)

  if (!outgoing || !outgoing.side) {
    return
  }

  const team = outgoing.side === "home" ? homeCurrentTeam : awayCurrentTeam

  if (!team) {
    return
  }

  const benchPlayer = team.roster.find((player) => player.id === benchRosterId)

  if (!benchPlayer) {
    return
  }

  const idOffset = outgoing.side === "home" ? 0 : 900000

  setPlayers((current) =>
    current.map((player) =>
      player.id === pitchId
        ? {
            id: benchPlayer.id + idOffset,
            rosterId: benchPlayer.id,
            side: outgoing.side,
            number: benchPlayer.number,
            name: benchPlayer.name,
            position: outgoing.position,
            x: outgoing.x,
            y: outgoing.y,
            color: getKitColor(team, kitOverrides),
            numberColor: getKitNumberColor(team, kitOverrides),
            slotIndex: outgoing.slotIndex
          }
        : player
    )
  )
}

function handlePitchSwitchSelect(id: number) {

  if (!swapSource) {
    setSwapSource({ type: "pitch", id })
    return
  }

  if (swapSource.type === "pitch") {

    if (swapSource.id === id) {
      setSwapSource(null)
      return
    }

    swapStarters(swapSource.id, id)
    setSwapSource(null)
    return
  }

  swapBenchIn(id, swapSource.id)
  setSwapSource(null)
}

function handleBenchSelect(rosterId: number) {

  if (!swapSource) {
    setSwapSource({ type: "bench", id: rosterId })
    return
  }

  if (swapSource.type === "bench") {
    setSwapSource({ type: "bench", id: rosterId })
    return
  }

  swapBenchIn(swapSource.id, rosterId)
  setSwapSource(null)
}

function handleClearSwitch() {
  setSwapSource(null)
}

function clearProfile() {

  const prefix = `tacticsBoard_${profile}_`

  const keysToRemove: string[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key))

  window.location.reload()

}

function changeKit(kit: "home" | "away" | "third", side: "home" | "away") {

  const team = side === "home" ? homeCurrentTeam : awayCurrentTeam

  if (!team) {
    return
  }

  setKitOverrides((current) => ({
    ...current,
    [team.id]: kit
  }))

  const color =
    kit === "home"
      ? team.homeColor
      : kit === "away"
      ? team.awayColor
      : team.thirdColor

  const numberColor =
    kit === "home"
      ? team.homeNumberColor
      : kit === "away"
      ? team.awayNumberColor
      : team.thirdNumberColor

  setPlayers((current) =>
    current.map((player) =>
      player.side === side
        ? { ...player, color, numberColor }
        : player
    )
  )
}

useEffect(() => {

  const session = {
    homeTeamId,
    awayTeamId,
    homeFormation,
    awayFormation,
    kitOverrides,
    focusedSide
  }

  localStorage.setItem(storageKey("session"), JSON.stringify(session))

}, [homeTeamId, awayTeamId, homeFormation, awayFormation, kitOverrides, focusedSide])

const persistTimeoutRef = useRef<number | null>(null)

useEffect(() => {

  if (persistTimeoutRef.current !== null) {
    clearTimeout(persistTimeoutRef.current)
  }

  persistTimeoutRef.current = window.setTimeout(() => {
    const boardState: Snapshot = { players, ballPosition, arrows, texts, rectangles }
    localStorage.setItem(storageKey("boardState"), JSON.stringify(boardState))
  }, 300)

  return () => {
    if (persistTimeoutRef.current !== null) {
      clearTimeout(persistTimeoutRef.current)
    }
  }

}, [players, ballPosition, arrows, texts, rectangles])

useEffect(() => {

  if (savedBoardState) {
    return
  }

  const rebuilt: typeof players = []

  if (homeTeamId !== null) {

    const team = teams.find((t) => t.id === homeTeamId)

    if (team) {
      const formationName = homeFormation ?? "4-3-3"
      const lookupKey = `${homeTeamId}_${formationName}`
      const assignment = lineups[lookupKey] ?? generateLineup(team, formationName)
      rebuilt.push(...buildPlayersFromAssignment(team, formationName, assignment, kitOverrides, "home"))
    }

  }

  if (awayTeamId !== null) {

    const team = teams.find((t) => t.id === awayTeamId)

    if (team) {
      const formationName = awayFormation ?? "4-3-3"
      const lookupKey = `${awayTeamId}_${formationName}`
      const assignment = lineups[lookupKey] ?? generateLineup(team, formationName)
      rebuilt.push(...buildPlayersFromAssignment(team, formationName, assignment, kitOverrides, "away"))
    }

  }

  if (rebuilt.length > 0) {
    skipHistory.current = true
    setPlayers(rebuilt)
  }

// eslint-disable-next-line react-hooks/exhaustive-deps
}, [])

useEffect(() => {

  if (isFirstRender.current) {
    isFirstRender.current = false
    return
  }

  if (skipHistory.current) {
    skipHistory.current = false
    previousSnapshot.current = {
      players,
      ballPosition,
      arrows,
      texts,
      rectangles
    }
    return
  }

  setPast(current => [
    ...current,
    previousSnapshot.current
  ])

  setFuture([])

  previousSnapshot.current = {
    players,
    ballPosition,
    arrows,
    texts,
    rectangles
  }

}, [players, ballPosition, arrows, texts, rectangles])

useEffect(() => {
  if (!clipId) return
  fetch(`http://localhost:5001/video_info?profile=${encodeURIComponent(profile)}&clip=${encodeURIComponent(clipId)}`)
    .then((res) => {
      if (res.ok) {
        setVideoUploaded(true)
      }
    })
    .catch(() => {})
}, [clipId, profile])

useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {

    if (
      (event.key === "Delete" || event.key === "Backspace") &&
      selectedArrow !== null
    ) {
      setArrows(current =>
        current.filter(
          arrow => arrow.id !== selectedArrow
        )
      )

      setSelectedArrow(null)
    }
    if (
      (event.key === "Delete" || event.key === "Backspace") &&
       selectedPlayer !== null
    ) {
       setPlayers(current =>
        current.filter(
          player => player.id !== selectedPlayer
        )
      )

      setSelectedPlayer(null)
    }

    if (
      (event.key === "Delete" || event.key === "Backspace") &&
       selectedText !== null
    ) {
       setTexts(current =>
        current.filter(
          item => item.id !== selectedText
        )
      )

      setSelectedText(null)
    }

    if (
      (event.key === "Delete" || event.key === "Backspace") &&
       selectedRectangle !== null
    ) {
       setRectangles(current =>
        current.filter(
          rect => rect.id !== selectedRectangle
        )
      )

      setSelectedRectangle(null)
    }

   }

  window.addEventListener("keydown", handleKeyDown)

  return () => {
    window.removeEventListener("keydown", handleKeyDown)
  }
}, [selectedArrow, selectedPlayer, selectedText, selectedRectangle])

const currentPlayer = players.find(
  (player) => player.id === selectedPlayer
)

const currentText = texts.find(
  (item) => item.id === selectedText
)

const homeCurrentTeam = teams.find((team) => team.id === homeTeamId) ?? null
const awayCurrentTeam = teams.find((team) => team.id === awayTeamId) ?? null

const homeKitColor = homeCurrentTeam ? getKitColor(homeCurrentTeam, kitOverrides) : "gray"
const homeKitNumberColor = homeCurrentTeam ? getKitNumberColor(homeCurrentTeam, kitOverrides) : "white"
const awayKitColor = awayCurrentTeam ? getKitColor(awayCurrentTeam, kitOverrides) : "gray"
const awayKitNumberColor = awayCurrentTeam ? getKitNumberColor(awayCurrentTeam, kitOverrides) : "white"

const rosterOptions = [
  ...(homeCurrentTeam?.roster.map((p) => ({ label: `home_${p.number}`, name: p.name })) ?? []),
  ...(awayCurrentTeam?.roster.map((p) => ({ label: `away_${p.number}`, name: p.name })) ?? []),
  { label: "ball", name: "Ball" }
]

const focusedTeam = focusedSide === "home" ? homeCurrentTeam : awayCurrentTeam

const currentPlayNames = homeTeamId !== null ? playNamesByTeam[homeTeamId] ?? [] : []

const currentPlayFrames = selectedPlayName && homeTeamId !== null
  ? playFrames[`${homeTeamId}_${selectedPlayName}`] ?? []
  : []

const benchPlayers = focusedTeam
  ? focusedTeam.roster.filter(
      (rosterPlayer) =>
        !players.some(
          (player) => player.side === focusedSide && player.rosterId === rosterPlayer.id
        )
    )
  : []

    return (
    <div style={{ paddingBottom: "80px" }}>
      <h1>Boone Tactics Board</h1>

      <p>Profile: {profile}</p>

      <button onClick={onSwitchProfile}>
        Switch Profile
      </button>

      <button onClick={() => setShowConfirmClear(true)}>
        Clear Profile
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "0 20px" }}>
        <div>
          {showConfirmClear && (
            <span style={{ marginLeft: "10px" }}>
              Confirm Clear:
              <button onClick={clearProfile} style={{ marginLeft: "6px" }}>Yes, clear</button>
              <button onClick={() => setShowConfirmClear(false)} style={{ marginLeft: "6px" }}>No, keep</button>
            </span>
          )}
        </div>

        <VideoToolsGate>
        <div style={{ fontSize: "13px" }}>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "16px" }}>
          <MatchSetup
            profile={profile}
            clipId={clipId}
            setClipId={(id) => { setClipId(id); setVideoUploaded(false) }}
            onVideoUploaded={() => setVideoUploaded(true)}
          />
          <KeyframeMarker profile={profile} clipId={clipId} rosterOptions={rosterOptions} videoReady={videoUploaded} />
          <ClipPlayer
            profile={profile}
            clipId={clipId}
            homeTeam={homeCurrentTeam}
            awayTeam={awayCurrentTeam}
            homeColor={homeKitColor}
            homeNumberColor={homeKitNumberColor}
            awayColor={awayKitColor}
            awayNumberColor={awayKitNumberColor}
            setPlayers={setPlayersFromClip}
            setBallPosition={setBallPositionFromClip}
          />
        </div>
        </div>
        </VideoToolsGate>
      </div>

      <div className="toolbar-row"> 
      <button onClick={undo} disabled={past.length === 0}>Undo</button>
      <button onClick={redo} disabled={future.length === 0}>Redo</button>
      <button onClick={() => saveLineup(focusedSide)} disabled={(focusedSide === "home" ? homeTeamId : awayTeamId) === null}>Save Formation</button>
      <button onClick={savePlay} disabled={!selectedPlayName || activeFrameIndex === null}>Save Play</button>
      <button onClick={() => setShowBench((current) => !current)}>Bench {showBench && "✓"}</button>
      <button onClick={flipField}>Flip Field</button>
      {focusedTeam !== null && (
        <button onClick={() => setShowKit((current) => !current)}>Kit {showKit && "✓"}</button>
      )}
      {focusedTeam !== null && (
        <button onClick={() => setShowFormation((current) => !current)}>Formation {showFormation && "✓"}</button>
      )}
      <button onClick={() => setFocusedSide("home")}>Editing: Home {focusedSide === "home" && "✓"}</button>
      <button onClick={() => setFocusedSide("away")}>Editing: Away {focusedSide === "away" && "✓"}</button>
      <button onClick={() => setShowPlays((current) => !current)}>Plays {showPlays && "✓"}</button>
      {selectedPlayName !== null && awayTeamId !== null && (
        <button onClick={() => setShowSwapTeam((current) => !current)}>Swap Away {showSwapTeam && "✓"}</button>
      )}
      <button onClick={() => setShowPlayerNames((current) => !current)}>Name {showPlayerNames && "✓"}</button>
      <button onClick={() => setShowPlayerPositions((current) => !current)}>Position {showPlayerPositions && "✓"}</button>
      </div>

      {newPlayerPosition && (
        <PlayerCreator createPlayer={createPlayer} cancelCreate={() => setNewPlayerPosition(null)} />
      )}
      {newTextPosition && (
        <TextCreator createText={createText} cancelCreate={() => setNewTextPosition(null)} />
      )}

<div
  style={{
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
    justifyContent: "center",
    width: "100%",
    paddingRight: "25%"
 }}
>

  <Toolbar 
    selectedTool={selectedTool}
    setSelectedTool={setSelectedTool}
    selectedArrowStyle={selectedArrowStyle}
    setSelectedArrowStyle={setSelectedArrowStyle}
    selectedArrowColor={selectedArrowColor}
    setSelectedArrowColor={setSelectedArrowColor}
    selectedArrowCurved={selectedArrowCurved}
    setSelectedArrowCurved={setSelectedArrowCurved}
    selectedTextColor={selectedTextColor}
    setSelectedTextColor={setSelectedTextColor}
    selectedRectStyle={selectedRectStyle}
    setSelectedRectStyle={setSelectedRectStyle}
    selectedRectColor={selectedRectColor}
    setSelectedRectColor={setSelectedRectColor}
    selectedRectOpacity={selectedRectOpacity}
    setSelectedRectOpacity={setSelectedRectOpacity}
  />

  <TeamSelector
    teams={teams}
    selectedCategory={selectedCategory}
    setSelectedCategory={setSelectedCategory}
    selectedTeamId={focusedSide === "home" ? homeTeamId : awayTeamId}
    loadTeam={(teamId) => loadTeam(teamId, focusedSide)}
  />

  {showFormation && (
    <FormationSelector
      formationNames={Object.keys(formations)}
      selectedFormation={focusedSide === "home" ? homeFormation : awayFormation}
      applyFormation={(name) => applyFormation(name, focusedSide)}
    />
  )}

  {showBench && (
    <BenchPanel
      benchPlayers={benchPlayers}
      switchMode={selectedTool === "switch"}
      swapSourceId={swapSource?.type === "bench" ? swapSource.id : null}
      onBenchSelect={handleBenchSelect}
    />
  )}

  {showKit && focusedTeam && (
    <KitSelector
      activeKit={getActiveKit(focusedTeam, kitOverrides)}
      changeKit={(kit) => changeKit(kit, focusedSide)}
    />
  )}

  {showPlays && (
    <PlaysPanel
      playNames={currentPlayNames}
      selectedPlayName={selectedPlayName}
      selectPlay={selectPlay}
      addPlayName={addPlayName}
      deletePlay={deletePlay}
    />
  )}

  {showPlays && selectedPlayName && (
    <FramesPanel
      playName={selectedPlayName}
      frameCount={currentPlayFrames.length}
      activeFrameIndex={activeFrameIndex}
      loadFrame={loadFrame}
      addFrame={addFrame}
      deleteFrame={deleteFrame}
    />
  )}

  {showSwapTeam && (
    <SwapTeamPanel
      teams={teams}
      swapAwayTeam={swapAwayTeam}
    />
  )}

  <SoccerPitch 
    players={players}
    selectedTool={selectedTool}
    updatePlayerPosition={updatePlayerPosition}
    selectedPlayer={selectedPlayer}
    setSelectedPlayer={setSelectedPlayer}
    setNewPlayerPosition={setNewPlayerPosition}
    setNewTextPosition={setNewTextPosition}
    ballPosition={ballPosition}
    setBallPosition={setBallPosition}
    arrows={arrows}
    setArrows={setArrows}
    texts={texts}
    setTexts={setTexts}
    selectedArrow={selectedArrow}
    setSelectedArrow={setSelectedArrow}
    selectedArrowStyle={selectedArrowStyle}
    selectedArrowColor={selectedArrowColor}
    selectedArrowCurved={selectedArrowCurved}
    selectedText={selectedText}
    setSelectedText={setSelectedText}
    switchMode={selectedTool === "switch"}
    onSwitchSelect={handlePitchSwitchSelect}
    onClearSwitch={handleClearSwitch}
    rectangles={rectangles}
    setRectangles={setRectangles}
    selectedRectStyle={selectedRectStyle}
    selectedRectColor={selectedRectColor}
    selectedRectOpacity={selectedRectOpacity}
    selectedRectangle={selectedRectangle}
    setSelectedRectangle={setSelectedRectangle}
    multiSelection={multiSelection}
    toggleMultiSelect={toggleMultiSelect}
    moveSelectedBy={moveSelectedBy}
    setMultiSelection={setMultiSelection}
    showPlayerNames={showPlayerNames}
    showPlayerPositions={showPlayerPositions}
  />

  <PlayerEditor 
    player={currentPlayer ?? null}
    updatePlayer={updatePlayer}
    deletePlayer={deletePlayer}
  />

  <TextEditor
    textItem={currentText ?? null}
    updateText={updateText}
    deleteText={deleteText}
  />

</div>

    </div>
  )
}

export default TacticsBoard
