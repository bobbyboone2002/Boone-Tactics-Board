import { useState } from "react"

type PlayerCreatorProps = {
  createPlayer: (
    name: string,
    number: number,
    position: string,
    color: string
  ) => void

  cancelCreate: () => void
}

function PlayerCreator({ 
  createPlayer,
  cancelCreate
}: PlayerCreatorProps) {

  const [name, setName] = useState("")
  const [number, setNumber] = useState(1)
  const [position, setPosition] = useState("")
  const [color, setColor] = useState("blue")


  return (
    <div>
      <h2>Create Player</h2>

      <label>
        Name:
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        Position:
        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
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
        onClick={() => {
         createPlayer(
            name,
            number,
            position,
            color
          )

          setName("")
          setNumber(1)
          setPosition("")
          setColor("blue")
        }}
    >
        Create Player
    </button>

    <button
        onClick={cancelCreate}
    >
        Cancel
    </button>

    </div>
  )
}

export default PlayerCreator
