type FramesPanelProps = {
  playName: string
  frameCount: number
  activeFrameIndex: number | null
  loadFrame: (index: number) => void
  addFrame: () => void
  deleteFrame: (index: number) => void
}

function FramesPanel({
  frameCount,
  activeFrameIndex,
  loadFrame,
  addFrame,
  deleteFrame
}: FramesPanelProps) {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >

      <h3>Frames</h3>

      {Array.from({ length: frameCount }).map((_, index) => (
        <div key={index} style={{ display: "flex", gap: "6px" }}>
          <button onClick={() => loadFrame(index)}>
            {index + 1} {activeFrameIndex === index && "✓"}
          </button>
          <button onClick={() => deleteFrame(index)}>
            ✕
          </button>
        </div>
      ))}

      {frameCount === 0 && (
        <p>No frames yet</p>
      )}

      <button onClick={addFrame}>
        + Add Frame
      </button>

    </div>
  )
}

export default FramesPanel
