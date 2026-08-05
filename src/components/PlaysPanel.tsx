import { useState } from "react"

type PlaysPanelProps = {
  playNames: string[]
  selectedPlayName: string | null
  selectPlay: (name: string) => void
  addPlayName: (name: string) => void
  deletePlay: (name: string) => void
}

function PlaysPanel({
  playNames,
  selectedPlayName,
  selectPlay,
  addPlayName,
  deletePlay
}: PlaysPanelProps) {

  const [newPlayName, setNewPlayName] = useState("")

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >

      <h3>Plays</h3>

      {playNames.length === 0 && (
        <p>No plays yet</p>
      )}

      {playNames.map((name) => (
        <div key={name} style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => selectPlay(name)}>
            {name} {selectedPlayName === name && "✓"}
          </button>
          <button onClick={() => deletePlay(name)}>
            ✕
          </button>
        </div>
      ))}

      <input
        value={newPlayName}
        onChange={(e) => setNewPlayName(e.target.value)}
        placeholder="New play name"
      />

      <button
        onClick={() => {
          if (!newPlayName) return
          addPlayName(newPlayName)
          setNewPlayName("")
        }}
      >
        Add Play
      </button>

    </div>
  )
}

export default PlaysPanel
