import { Circle, Text, Rect, Group } from "react-konva"

function measureTextWidth(text: string, fontSize: number): number {

  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    return text.length * 7
  }

  context.font = `${fontSize}px Arial`

  return context.measureText(text).width
}

type PlayerProps = {
  id: number
  x: number
  y: number
  number: number
  color: string
  numberColor: string
  name: string
  position: string
  selectedTool: string

updatePlayerPosition: (
    number: number,
    x: number,
    y: number
  ) => void

  selectedPlayer: number | null
  setSelectedPlayer: (id: number | null) => void

  setSelectedArrow: (id: number | null) => void
  switchMode: boolean
  onSwitchSelect: (id: number) => void
  setSelectedText: (id: number | null) => void

  isMultiSelected: boolean
  onToggleMultiSelect: (id: number) => void

  showName: boolean
  showPosition: boolean
}

function Player({ id, x, y, number, color, numberColor, name, position, selectedTool, updatePlayerPosition, 
    selectedPlayer, setSelectedPlayer, setSelectedArrow, setSelectedText,
    switchMode, onSwitchSelect, isMultiSelected, onToggleMultiSelect,
showName, showPosition
}: PlayerProps) {
  return (
    <Group
      x={x}
      y={y}
      draggable
      listening={selectedTool !== "arrow"}
      onClick={(e) => {
        e.cancelBubble = true

        if (switchMode) {
          onSwitchSelect(id)
          return
        }

        if (e.evt.shiftKey) {
          onToggleMultiSelect(id)
          return
        }

        // Deselect any selected arrow or text
        setSelectedArrow(null)
        setSelectedText(null)

        if (selectedPlayer === id) {
          setSelectedPlayer(null)
        } else {
          setSelectedPlayer(id)
        }
    }}
      onDragEnd={(e) => {
        updatePlayerPosition(
            id,
            e.target.x(),
            e.target.y()
        )
    }}
    >
      <Circle
        radius={10}
        fill={color}
        stroke={selectedPlayer === id || isMultiSelected ? "lime" : "white"}
        strokeWidth={selectedPlayer === id || isMultiSelected ? 4 : 2}
        />

      <Text
        text={number.toString()}
        fontSize={12}
        fill={numberColor}
        width={40}
        height={40}
        align="center"
        verticalAlign="middle"
        x={-20}
        y={-20}
      />

      {showName && (
  <>
    <Rect
    x={-(measureTextWidth(name, 12) / 2 + 4)}
    y={15}
    width={measureTextWidth(name, 12) + 8}
    height={16}
    fill={color}
    opacity={0.5}
    cornerRadius={3}
    />

    <Text
    text={name}
    fontSize={12}
    fill="white"
    x={-(measureTextWidth(name, 12) / 2 + 4)}
    y={16.5}
    width={measureTextWidth(name, 12) + 8}
    align="center"
    wrap="none"
    />
  </>
)}

{showPosition && (
  <Text
  text={position}
  fontSize={10}
  fill="yellow"
  x={-30}
  y={showName ? 30 : 15}
  width={60}
  align="center"
  />
)}
    </Group>
  )
}

export default Player
