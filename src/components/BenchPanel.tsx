import type { RosterPlayer } from "../types"

type BenchPanelProps = {
  benchPlayers: RosterPlayer[]
  switchMode: boolean
  swapSourceId: number | null
  onBenchSelect: (id: number) => void
}

function BenchPanel({
  benchPlayers,
  switchMode,
  swapSourceId,
  onBenchSelect
}: BenchPanelProps) {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >

      <h3>Bench</h3>

      {benchPlayers.length === 0 && (
        <p>No bench players</p>
      )}

      {benchPlayers.map((player) => (
        <button
          key={player.id}
          disabled={!switchMode}
          onClick={() => onBenchSelect(player.id)}
        >
          #{player.number} {player.name} ({player.positions.join("/")}) {swapSourceId === player.id && "✓"}
        </button>
      ))}

    </div>
  )
}

export default BenchPanel
