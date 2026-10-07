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

function activeStyle(isActive: boolean): React.CSSProperties {
  return isActive
    ? { background: "var(--navy)", color: "#fff", borderColor: "var(--navy)" }
    : {}
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
      <button onClick={() => setSelectedTool("select")} style={activeStyle(selectedTool === "select")}>
        Select
      </button>

      <button onClick={() => setSelectedTool("player")} style={activeStyle(selectedTool === "player")}>
        Player
      </button>

      <button onClick={() => setSelectedTool("ball")} style={activeStyle(selectedTool === "ball")}>
        Ball
      </button>

      <button onClick={() => setSelectedTool("arrow")} style={activeStyle(selectedTool === "arrow")}>
        Arrow
      </button>

      <button onClick={() => setSelectedTool("text")} style={activeStyle(selectedTool === "text")}>
        Text
      </button>

      <button onClick={() => setSelectedTool("switch")} style={activeStyle(selectedTool === "switch")}>
        Switch
      </button>

      <button onClick={() => setSelectedTool("rectangle")} style={activeStyle(selectedTool === "rectangle")}>
        Rectangle
      </button>

      {selectedTool === "arrow" && (
      <>

      <h3>Arrow Style</h3>

      <button onClick={() => setSelectedArrowStyle("arrow")} style={activeStyle(selectedArrowStyle === "arrow")}>
         Normal
      </button>

      <button onClick={() => setSelectedArrowStyle("double")} style={activeStyle(selectedArrowStyle === "double")}>
         Double
      </button>

      <button onClick={() => setSelectedArrowStyle("dashed")} style={activeStyle(selectedArrowStyle === "dashed")}>
         Dashed
      </button>

      <button onClick={() => setSelectedArrowStyle("line")} style={activeStyle(selectedArrowStyle === "line")}>
         Line
      </button>

      <button onClick={() => setSelectedArrowCurved(!selectedArrowCurved)} style={activeStyle(selectedArrowCurved)}>
         Curved {selectedArrowCurved ? "On" : "Off"}
      </button>

      <h3>Arrow Color</h3>

      <button onClick={() => setSelectedArrowColor("yellow")} style={activeStyle(selectedArrowColor === "yellow")}>
         Yellow
      </button>

      <button onClick={() => setSelectedArrowColor("red")} style={activeStyle(selectedArrowColor === "red")}>
         Red
      </button>

      <button onClick={() => setSelectedArrowColor("blue")} style={activeStyle(selectedArrowColor === "blue")}>
         Blue
      </button>

      <button onClick={() => setSelectedArrowColor("lime")} style={activeStyle(selectedArrowColor === "lime")}>
         Green
      </button>

        </>

        )}

        {selectedTool === "text" && (
        <>

        <h3>Text Color</h3>

        <button onClick={() => setSelectedTextColor("white")} style={activeStyle(selectedTextColor === "white")}>
         White
        </button>

        <button onClick={() => setSelectedTextColor("yellow")} style={activeStyle(selectedTextColor === "yellow")}>
         Yellow
        </button>

        <button onClick={() => setSelectedTextColor("red")} style={activeStyle(selectedTextColor === "red")}>
         Red
        </button>

        <button onClick={() => setSelectedTextColor("blue")} style={activeStyle(selectedTextColor === "blue")}>
         Blue
        </button>

        <button onClick={() => setSelectedTextColor("lime")} style={activeStyle(selectedTextColor === "lime")}>
         Green
        </button>

      </>


        )}

        {selectedTool === "rectangle" && (
<>

<h3>Rectangle Style</h3>

<button onClick={() => setSelectedRectStyle("solid")} style={activeStyle(selectedRectStyle === "solid")}>
         Solid
</button>

<button onClick={() => setSelectedRectStyle("dashed")} style={activeStyle(selectedRectStyle === "dashed")}>
         Dashed
</button>

<h3>Rectangle Color</h3>

<button onClick={() => setSelectedRectColor("yellow")} style={activeStyle(selectedRectColor === "yellow")}>
         Yellow
</button>

<button onClick={() => setSelectedRectColor("red")} style={activeStyle(selectedRectColor === "red")}>
         Red
</button>

<button onClick={() => setSelectedRectColor("blue")} style={activeStyle(selectedRectColor === "blue")}>
         Blue
</button>

<button onClick={() => setSelectedRectColor("lime")} style={activeStyle(selectedRectColor === "lime")}>
         Green
</button>

<h3>Rectangle Opacity</h3>

<button onClick={() => setSelectedRectOpacity(0)} style={activeStyle(selectedRectOpacity === 0)}>
         0%
</button>

<button onClick={() => setSelectedRectOpacity(0.25)} style={activeStyle(selectedRectOpacity === 0.25)}>
         25%
</button>

<button onClick={() => setSelectedRectOpacity(0.5)} style={activeStyle(selectedRectOpacity === 0.5)}>
         50%
</button>

<button onClick={() => setSelectedRectOpacity(0.75)} style={activeStyle(selectedRectOpacity === 0.75)}>
         75%
</button>

<button onClick={() => setSelectedRectOpacity(1)} style={activeStyle(selectedRectOpacity === 1)}>
         100%
</button>

</>

        )}

    </div>
  )
}

export default Toolbar
