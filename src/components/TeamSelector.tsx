import type { Team } from "../types"

type TeamSelectorProps = {
  teams: Team[]
  selectedCategory: "Custom" | "Premier League" | null
  setSelectedCategory: (category: "Custom" | "Premier League" | null) => void
  selectedTeamId: number | null
  loadTeam: (teamId: number) => void
}

function TeamSelector({
  teams,
  selectedCategory,
  setSelectedCategory,
  selectedTeamId,
  loadTeam
}: TeamSelectorProps) {

  if (!selectedCategory) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          padding: "10px",
        }}
      >

        <h3>Select Team</h3>

        <button onClick={() => setSelectedCategory("Custom")}>
          Custom
        </button>

        <button onClick={() => setSelectedCategory("Premier League")}>
          Premier League
        </button>

      </div>
    )
  }

  const categoryTeams = teams
    .filter((team) => team.league === selectedCategory)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}
      >

        <button onClick={() => setSelectedCategory(null)}>
          ←
        </button>

        <h3>{selectedCategory}</h3>

      </div>

      {categoryTeams.length === 0 && (
        <p>No teams yet</p>
      )}

      {categoryTeams.map((team) => (
        <button
          key={team.id}
          onClick={() => loadTeam(team.id)}
        >
          {team.name} {selectedTeamId === team.id && "✓"}
        </button>
      ))}

    </div>
  )
}

export default TeamSelector
