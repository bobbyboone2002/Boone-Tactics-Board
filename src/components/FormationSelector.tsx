type FormationSelectorProps = {
  formationNames: string[]
  selectedFormation: string | null
  applyFormation: (name: string) => void
}

function FormationSelector({
  formationNames,
  selectedFormation,
  applyFormation
}: FormationSelectorProps) {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >

      <h3>Formation</h3>

      {formationNames.map((name) => (
        <button
          key={name}
          onClick={() => applyFormation(name)}
        >
          {name} {selectedFormation === name && "✓"}
        </button>
      ))}

    </div>
  )
}

export default FormationSelector
