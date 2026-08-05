type KitSelectorProps = {
  activeKit: "home" | "away" | "third"
  changeKit: (kit: "home" | "away" | "third") => void
}

function KitSelector({
  activeKit,
  changeKit
}: KitSelectorProps) {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >

      <h3>Kit</h3>

      <button onClick={() => changeKit("home")}>
        Home {activeKit === "home" && "✓"}
      </button>

      <button onClick={() => changeKit("away")}>
        Away {activeKit === "away" && "✓"}
      </button>

      <button onClick={() => changeKit("third")}>
        Third {activeKit === "third" && "✓"}
      </button>

    </div>
  )
}

export default KitSelector
