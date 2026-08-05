type ToolbarProps = {
  selectedTool: string
  setSelectedTool: (tool: string) => void

  selectedArrowStyle:
  | "arrow"
  | "double"
  | "dashed"
  | "line"

setSelectedArrowStyle: (
  style:
    | "arrow"
    | "double"
    | "dashed"
    | "line"
) => void

  selectedArrowColor:string
  setSelectedArrowColor:(color:string)=>void

  selectedArrowCurved: boolean
  setSelectedArrowCurved: (curved: boolean) => void

  selectedTextColor:string
  setSelectedTextColor:(color:string)=>void

  selectedRectStyle: "solid" | "dashed"
  setSelectedRectStyle: (style: "solid" | "dashed") => void

  selectedRectColor: string
  setSelectedRectColor: (color: string) => void

  selectedRectOpacity: number
  setSelectedRectOpacity: (opacity: number) => void
}

function Toolbar({
  selectedTool,
  setSelectedTool,
  selectedArrowStyle,
  setSelectedArrowStyle,
  selectedArrowColor,
  setSelectedArrowColor,
  selectedArrowCurved,
  setSelectedArrowCurved,
  selectedTextColor,
  setSelectedTextColor,
  selectedRectStyle,
  setSelectedRectStyle,
  selectedRectColor,
  setSelectedRectColor,
  selectedRectOpacity,
  setSelectedRectOpacity
}: ToolbarProps) {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        padding: "10px",
      }}
    >
      <button onClick={() => setSelectedTool("select")}>
        Select
      </button>

      <button
        onClick={() => setSelectedTool("player")}
      >
        Player
      </button>

      <button
        onClick={() => setSelectedTool("ball")}
      >
        Ball
      </button>

      <button
        onClick={() => setSelectedTool("arrow")}
      >
        Arrow
      </button>

      <button
         onClick={() => setSelectedTool("text")}
        >
          Text
        </button>

        <button
        onClick={() => setSelectedTool("switch")}
        >
          Switch
        </button>

        <button
        onClick={() => setSelectedTool("rectangle")}
        >
          Rectangle
        </button>

      {selectedTool === "arrow" && (
      <>

      <h3>Arrow Style</h3>

      <button
         onClick={() => setSelectedArrowStyle("arrow")}
         >
         Normal {selectedArrowStyle === "arrow" && "✓"}
        </button>

        <button
         onClick={() => setSelectedArrowStyle("double")}
        >
         Double {selectedArrowStyle === "double" && "✓"}
        </button>

        <button
         onClick={() => setSelectedArrowStyle("dashed")}
        >
         Dashed {selectedArrowStyle === "dashed" && "✓"}
        </button>

        <button
        onClick={() => setSelectedArrowStyle("line")}
        >
         Line {selectedArrowStyle === "line" && "✓"}
        </button>

        <button
        onClick={() => setSelectedArrowCurved(!selectedArrowCurved)}
        >
         Curved {selectedArrowCurved ? "On ✓" : "Off"}
        </button>

        <h3>Arrow Color</h3>

        <button
         onClick={() => setSelectedArrowColor("yellow")}
        >
         Yellow {selectedArrowColor === "yellow" && "✓"}
        </button>

        <button
         onClick={() => setSelectedArrowColor("red")}
        >
         Red {selectedArrowColor === "red" && "✓"}
        </button>

        <button
         onClick={() => setSelectedArrowColor("blue")}
        >
         Blue {selectedArrowColor === "blue" && "✓"}
        </button>

        <button
         onClick={() => setSelectedArrowColor("lime")}
        >
         Green {selectedArrowColor === "lime" && "✓"}
        </button>

        </>

        )}

        {selectedTool === "text" && (
        <>

        <h3>Text Color</h3>

        <button onClick={() => setSelectedTextColor("white")}>
         White {selectedTextColor === "white" && "✓"}
        </button>

        <button onClick={() => setSelectedTextColor("yellow")}>
         Yellow {selectedTextColor === "yellow" && "✓"}
        </button>

        <button onClick={() => setSelectedTextColor("red")}>
         Red {selectedTextColor === "red" && "✓"}
        </button>

        <button onClick={() => setSelectedTextColor("blue")}>
         Blue {selectedTextColor === "blue" && "✓"}
        </button>

        <button onClick={() => setSelectedTextColor("lime")}>
         Green {selectedTextColor === "lime" && "✓"}
        </button>

      </>


        )}

        {selectedTool === "rectangle" && (
<>

<h3>Rectangle Style</h3>

<button onClick={() => setSelectedRectStyle("solid")}>
         Solid {selectedRectStyle === "solid" && "✓"}
</button>

<button onClick={() => setSelectedRectStyle("dashed")}>
         Dashed {selectedRectStyle === "dashed" && "✓"}
</button>

<h3>Rectangle Color</h3>

<button onClick={() => setSelectedRectColor("yellow")}>
         Yellow {selectedRectColor === "yellow" && "✓"}
</button>

<button onClick={() => setSelectedRectColor("red")}>
         Red {selectedRectColor === "red" && "✓"}
</button>

<button onClick={() => setSelectedRectColor("blue")}>
         Blue {selectedRectColor === "blue" && "✓"}
</button>

<button onClick={() => setSelectedRectColor("lime")}>
         Green {selectedRectColor === "lime" && "✓"}
</button>

<h3>Rectangle Opacity</h3>

<button onClick={() => setSelectedRectOpacity(0)}>
         0% {selectedRectOpacity === 0 && "✓"}
</button>

<button onClick={() => setSelectedRectOpacity(0.25)}>
         25% {selectedRectOpacity === 0.25 && "✓"}
</button>

<button onClick={() => setSelectedRectOpacity(0.5)}>
         50% {selectedRectOpacity === 0.5 && "✓"}
</button>

<button onClick={() => setSelectedRectOpacity(0.75)}>
         75% {selectedRectOpacity === 0.75 && "✓"}
</button>

<button onClick={() => setSelectedRectOpacity(1)}>
         100% {selectedRectOpacity === 1 && "✓"}
</button>

</>

        )}

    </div>
  )
}

export default Toolbar
