import { useState, useEffect } from "react"

type PlayerEditorProps = {
  player: {
    id: number
    number: number
    name: string
    position: string
    color: string
  } | null

  updatePlayer: (
    id: number,
    updatedPlayer: {
      number: number
      name: string
      position: string
      color: string
    }
  ) => void

  deletePlayer: (
    id: number
  ) => void
}

function PlayerEditor({
  player,
  updatePlayer,
  deletePlayer
}: PlayerEditorProps) {

  const [showPanel, setShowPanel] = useState(false)

  const [name, setName] = useState(player?.name ?? "")
  const [position, setPosition] = useState(player?.position ?? "")
  const [number, setNumber] = useState(player?.number ?? 0)
  const [color, setColor] = useState(player?.color ?? "blue")

  useEffect(() => {
    if (player) {
      setName(player.name)
      setPosition(player.position)
      setNumber(player.number)
      setColor(player.color)
    } else {
      setShowPanel(false)
    }
  }, [player])

  if (!player) {
    return null
  }

  if (!showPanel) {
    return (
      <button onClick={() => setShowPanel(true)}>
        Edit Player
      </button>
    )
  }

  return (
    <div>
      <button onClick={() => setShowPanel(false)}>Close</button>

      <h2>Edit Player</h2>

      <label>
        Name:
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      <br />

      <label>
        Position:
        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
        />
      </label>

      <br />

      <label>
        Number:
        <input
          type="number"
          value={number}
          onChange={(e) => setNumber(Number(e.target.value))}
        />
      </label>

      <br />

      <label>
        Color:
        <input
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>

      <br />

      <button
        onClick={() =>
          updatePlayer(player.id, {
            number,
            name,
            position,
            color
          })
        }
      >
        Update Player
      </button>

      <button
        onClick={() => deletePlayer(player.id)}
      >
        Delete Player
      </button>

    </div>
  )
}

export default PlayerEditor
