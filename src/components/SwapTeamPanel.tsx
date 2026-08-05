import type { Team } from "../types"

type SwapTeamPanelProps = {
  teams: Team[]
  swapAwayTeam: (teamId: number) => void
}

function SwapTeamPanel({
  teams,
  swapAwayTeam
}: SwapTeamPanelProps) {

  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >

      <h3>Swap Away Team</h3>

      {sorted.map((team) => (
        <button
          key={team.id}
          onClick={() => swapAwayTeam(team.id)}
        >
          {team.name}
        </button>
      ))}

    </div>
  )
}

export default SwapTeamPanel
