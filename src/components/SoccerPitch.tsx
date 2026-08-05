import { Stage, Layer, Rect, Line, Circle, Arrow, Arc, Text , Shape } from "react-konva"
import { useState } from "react"
import Player from "./Player"

type PlayerData = {
  id: number
  number: number
  name: string
  position: string
  x: number
  y: number
  color: string
  numberColor: string
}

type SoccerPitchProps = {
  players: PlayerData[]
  selectedTool: string

  arrows: {
    id:number
    startX:number
    startY:number
    endX:number
    endY:number
    style: "arrow" | "double" | "dashed" | "line"
    color:string
    curved?: boolean
    controlX?: number
    controlY?: number
  }[]

  selectedArrow: number | null

  setSelectedArrow: (
    id:number | null
  ) => void

  selectedArrowStyle: "arrow" | "double" | "dashed" | "line"

  selectedArrowColor: string

  selectedArrowCurved: boolean

  setArrows: React.Dispatch<
    React.SetStateAction<
      {
        id:number
        startX:number
        startY:number
        endX:number
        endY:number
        style: "arrow" | "double" | "dashed" | "line"
        color:string
        curved?: boolean
        controlX?: number
        controlY?: number
      }[]
    >
  >

      texts: {
      id: number
      x: number
      y: number
      text: string
      color: string
    }[]

    setTexts: React.Dispatch<
      React.SetStateAction<
    {
      id: number
      x: number
      y: number
      text: string
      color: string
    }[]
  >
>

  ballPosition: {
    x:number
    y:number
  } | null

  setBallPosition: (
    position:{
      x:number
      y:number
    }
  ) => void

  updatePlayerPosition: (
    number:number,
    x:number,
    y:number
  ) => void

  setNewPlayerPosition: (
    position:{
      x:number
      y:number
    }
  ) => void

  setNewTextPosition: (
    position: {
      x: number
      y: number
    }
  ) => void

  selectedText: number | null
  setSelectedText: (id: number | null) => void

  selectedPlayer:number | null
  setSelectedPlayer:(id:number | null)=>void

  switchMode: boolean
  onSwitchSelect: (id: number) => void
  onClearSwitch: () => void

  rectangles: {
    id: number
    x: number
    y: number
    width: number
    height: number
    style: "solid" | "dashed"
    color: string
    opacity: number
  }[]

  setRectangles: React.Dispatch<React.SetStateAction<{
    id: number
    x: number
    y: number
    width: number
    height: number
    style: "solid" | "dashed"
    color: string
    opacity: number
  }[]>>

  selectedRectStyle: "solid" | "dashed"
  selectedRectColor: string
  selectedRectOpacity: number

  selectedRectangle: number | null
  setSelectedRectangle: (id: number | null) => void

  multiSelection: { type: "player" | "ball" | "arrow" | "rectangle" | "text"; id: number }[]
  toggleMultiSelect: (type: "player" | "ball" | "arrow" | "rectangle" | "text", id: number) => void
  moveSelectedBy: (deltaX: number, deltaY: number) => void
  setMultiSelection: React.Dispatch<React.SetStateAction<{ type: "player" | "ball" | "arrow" | "rectangle" | "text"; id: number }[]>>

  showPlayerNames: boolean
  showPlayerPositions: boolean
}

function getDefaultControlPoint(startX: number, startY: number, endX: number, endY: number) {

  const midX = (startX + endX) / 2
  const midY = (startY + endY) / 2

  const dx = endX - startX
  const dy = endY - startY

  const length = Math.sqrt(dx * dx + dy * dy) || 1

  const offset = 40

  return {
    x: midX + (-dy / length) * offset,
    y: midY + (dx / length) * offset
  }

}

function drawArrowhead(context: any, x: number, y: number, angle: number, color: string) {

  const headLength = 12
  const headWidth = 12

  context.save()
  context.translate(x, y)
  context.rotate(angle)
  context.beginPath()
  context.moveTo(0, 0)
  context.lineTo(-headLength, headWidth / 2)
  context.lineTo(-headLength, -headWidth / 2)
  context.closePath()
  context.fillStyle = color
  context.fill()
  context.restore()

}

function colorToRgba(color: string, alpha: number): string {

  const canvas = document.createElement("canvas")
  canvas.width = 1
  canvas.height = 1

  const context = canvas.getContext("2d")

  if (!context) {
    return color
  }

  context.fillStyle = color
  context.fillRect(0, 0, 1, 1)

  const [r, g, b] = context.getImageData(0, 0, 1, 1).data

  return `rgba(${r}, ${g}, ${b}, ${alpha})`

}

function SoccerPitch({

players,
selectedTool,
updatePlayerPosition,
selectedPlayer,
setSelectedPlayer,
setNewPlayerPosition,
setNewTextPosition,
selectedText,
setSelectedText,
ballPosition,
setBallPosition,
arrows,
setArrows,
texts,
setTexts,
selectedArrow,
setSelectedArrow,
selectedArrowStyle,
selectedArrowColor,
selectedArrowCurved,
switchMode,
onSwitchSelect,
onClearSwitch,
rectangles,
setRectangles,
selectedRectStyle,
selectedRectColor,
selectedRectOpacity,
selectedRectangle,
setSelectedRectangle,
multiSelection,
toggleMultiSelect,
moveSelectedBy,
setMultiSelection,
showPlayerNames,
showPlayerPositions

}: SoccerPitchProps) {

const pitchX = 25
const pitchY = 25

const pitchWidth = 910
const pitchHeight = 550

const centerX = pitchX + pitchWidth / 2
const centerY = pitchY + pitchHeight / 2

// Penalty Areas

const penaltyDepth = 130
const penaltyWidth = 260

// Six-yard Boxes

const sixYardDepth = 50
const sixYardWidth = 120

// Goals

const goalDepth = 12
const goalWidth = 80

// Penalty Spots

const penaltySpotDistance = 80

const [arrowStart,setArrowStart] = useState<{
  x:number
  y:number
} | null>(null)

const [rectStart,setRectStart] = useState<{
  x:number
  y:number
} | null>(null)

function handleArrowDragEnd(e:any, arrowId:number){

  const deltaX = e.target.x()
  const deltaY = e.target.y()

  e.target.position({ x: 0, y: 0 })

  const inGroup = multiSelection.some(s => s.type === "arrow" && s.id === arrowId) && multiSelection.length > 1

  if (inGroup) {
    moveSelectedBy(deltaX, deltaY)
    return
  }

  setArrows(current =>
    current.map(a =>
      a.id === arrowId
        ? {
            ...a,
            startX: a.startX + deltaX,
            startY: a.startY + deltaY,
            endX: a.endX + deltaX,
            endY: a.endY + deltaY,
            controlX: a.controlX !== undefined ? a.controlX + deltaX : a.controlX,
            controlY: a.controlY !== undefined ? a.controlY + deltaY : a.controlY
          }
        : a
    )
  )

}

function handleMouseDown(e:any){

  if(selectedTool !== "arrow"){
    return
  }

  const stage = e.target.getStage()

  const position = stage.getPointerPosition()

  if(!position){
    return
  }

  setArrowStart({
    x:position.x,
    y:position.y
  })

}

function handleMouseUp(e:any){

  if(selectedTool !== "arrow"){
    return
  }

  if(!arrowStart){
    return
  }

  const stage = e.target.getStage()

  const position = stage.getPointerPosition()

  if(!position){
    return
  }

  const control = selectedArrowCurved
    ? getDefaultControlPoint(arrowStart.x, arrowStart.y, position.x, position.y)
    : null

  const newArrow = {
    id:Date.now(),
    startX:arrowStart.x,
    startY:arrowStart.y,
    endX:position.x,
    endY:position.y,
    style: selectedArrowStyle,
    color: selectedArrowColor,
    curved: selectedArrowCurved,
    controlX: control?.x,
    controlY: control?.y
  }

  setArrows([
    ...arrows,
    newArrow
  ])

  setArrowStart(null)

}

function handleRectMouseDown(e:any){

  if(selectedTool !== "rectangle"){
    return
  }

  const stage = e.target.getStage()

  const position = stage.getPointerPosition()

  if(!position){
    return
  }

  setRectStart({
    x:position.x,
    y:position.y
  })

}

function handleRectMouseUp(e:any){

  if(selectedTool !== "rectangle"){
    return
  }

  if(!rectStart){
    return
  }

  const stage = e.target.getStage()

  const position = stage.getPointerPosition()

  if(!position){
    return
  }

  const newRect = {
    id:Date.now(),
    x: Math.min(rectStart.x, position.x),
    y: Math.min(rectStart.y, position.y),
    width: Math.abs(position.x - rectStart.x),
    height: Math.abs(position.y - rectStart.y),
    style: selectedRectStyle,
    color: selectedRectColor,
    opacity: selectedRectOpacity
  }

  setRectangles([
    ...rectangles,
    newRect
  ])

  setRectStart(null)

}

function handlePitchClick(e:any){

  if(
    selectedTool !== "player" &&
    selectedTool !== "ball" &&
    selectedTool !== "text"
  ){
    return
  }

  const stage = e.target.getStage()

  const position = stage.getPointerPosition()

  if(!position){
    return
  }

  if (selectedTool === "text") {

    setNewTextPosition({
      x: position.x,
      y: position.y
    })

    return
  }

  if(selectedTool === "ball"){

    setBallPosition({
      x: position.x,
      y: position.y
    })

    return
  }

  setNewPlayerPosition({
    x: position.x,
    y: position.y
  })

}

return (

<Stage
 width={960}
 height={600}
>

<Layer>

{/* Background (invisible click layer, page background now comes from body CSS) */}

<Rect

name="background"
x={0}
y={0}
width={960}
height={600}
fill="transparent"

onClick={(e) => {
  if (
    selectedTool === "player" ||
    selectedTool === "ball" ||
    selectedTool === "text"
  ) {
    handlePitchClick(e)
  }

  if (selectedTool === "select") {
    setSelectedArrow(null)
    setSelectedText(null)
    setSelectedRectangle(null)
    setMultiSelection([])
  }

  if (selectedTool === "switch") {
    onClearSwitch()
  }
}}

onMouseDown={(e)=>{

 if(selectedTool==="arrow"){
   handleMouseDown(e)
 }

 if(selectedTool==="rectangle"){
   handleRectMouseDown(e)
 }

}}

onMouseUp={(e)=>{

 if(selectedTool==="arrow"){
   handleMouseUp(e)
 }

 if(selectedTool==="rectangle"){
   handleRectMouseUp(e)
 }

}}

/>

{/* Grass */}

<Rect

name="pitch"
x={pitchX - 20}
y={pitchY - 20}
width={pitchWidth + 40}
height={pitchHeight + 40}
fill="green"
listening={false}

/>

{/* Field markings */}

<Rect
x={pitchX}
y={pitchY}
width={pitchWidth}
height={pitchHeight}
stroke="white"
strokeWidth={2}
listening={false}
/>

<Line
points={[
  centerX,
  pitchY,
  centerX,
  pitchY + pitchHeight
]}
stroke="white"
strokeWidth={2}
listening={false}
/>

<Circle
x={centerX}
y={centerY}
radius={80}
stroke="white"
strokeWidth={2}
listening={false}
/>

<Rect
x={pitchX}
y={centerY - penaltyWidth / 2}
width={penaltyDepth}
height={penaltyWidth}
stroke="white"
strokeWidth={2}
listening={false}
/>

{/* Left 6-yard box */}

<Rect
  x={pitchX}
  y={centerY - sixYardWidth / 2}
  width={sixYardDepth}
  height={sixYardWidth}
  stroke="white"
  strokeWidth={2}
  listening={false}
/>

<Rect
x={pitchX + pitchWidth - penaltyDepth}
y={centerY - penaltyWidth / 2}
width={penaltyDepth}
height={penaltyWidth}
stroke="white"
strokeWidth={2}
listening={false}
/>

{/* Right 6-yard box */}

<Rect
  x={pitchX + pitchWidth - sixYardDepth}
  y={centerY - sixYardWidth / 2}
  width={sixYardDepth}
  height={sixYardWidth}
  stroke="white"
  strokeWidth={2}
  listening={false}
/>

<Circle
x={centerX}
y={centerY}
radius={5}
fill="white"
listening={false}
/>

{/* Left penalty spot */}

<Circle
  x={pitchX + penaltySpotDistance}
  y={centerY}
  radius={4}
  fill="white"
  listening={false}
/>

{/* Right penalty spot */}

<Circle
  x={pitchX + pitchWidth - penaltySpotDistance}
  y={centerY}
  radius={4}
  fill="white"
  listening={false}
/>

{/* Left goal */}

<Rect
  x={pitchX - goalDepth}
  y={centerY - goalWidth / 2}
  width={goalDepth}
  height={goalWidth}
  stroke="white"
  strokeWidth={2}
  listening={false}
/>

{/* Right goal */}

<Rect
  x={pitchX + pitchWidth}
  y={centerY - goalWidth / 2}
  width={goalDepth}
  height={goalWidth}
  stroke="white"
  strokeWidth={2}
  listening={false}
/>

{/* Left penalty arc */}

<Arc
  x={pitchX + penaltySpotDistance +10}
  y={centerY}
  innerRadius={67}
  outerRadius={67}
  angle={106}
  rotation={307}
  stroke="white"
  strokeWidth={2}
  listening={false}
/>

{/* Right penalty arc */}

<Arc
  x={pitchX + pitchWidth - penaltySpotDistance -10}
  y={centerY}
  innerRadius={67}
  outerRadius={67}
  angle={106}
  rotation={127}
  stroke="white"
  strokeWidth={2}
  listening={false}
/>

{/* Ball */}

{ballPosition && (

<Circle

x={ballPosition.x}
y={ballPosition.y}
radius={6}
fill="white"
stroke="black"
strokeWidth={1}
draggable

onClick={(e)=>{

 e.cancelBubble=true

 if (selectedTool !== "select") return

 if (e.evt.shiftKey) {
   toggleMultiSelect("ball", 0)
 }

}}

onDragEnd={(e)=>{

  const newX = e.target.x()
  const newY = e.target.y()

  const oldX = ballPosition?.x ?? newX
  const oldY = ballPosition?.y ?? newY

  const deltaX = newX - oldX
  const deltaY = newY - oldY

  const inGroup = multiSelection.some(s => s.type === "ball") && multiSelection.length > 1

  if (inGroup) {
    moveSelectedBy(deltaX, deltaY)
  } else {
    setBallPosition({ x: newX, y: newY })
  }

}}

/>

)}

{/* Rectangles */}

{rectangles.map((rect)=>(

<Rect

key={rect.id}

x={rect.x}
y={rect.y}
width={rect.width}
height={rect.height}

fill={colorToRgba(rect.color, rect.opacity)}

stroke={
 selectedRectangle === rect.id || multiSelection.some(s => s.type === "rectangle" && s.id === rect.id)
 ? "lime"
 : rect.color
}

strokeWidth={
 selectedRectangle === rect.id || multiSelection.some(s => s.type === "rectangle" && s.id === rect.id)
 ? 5
 : 3
}

dash={
 rect.style === "dashed"
 ? [26,16]
 : undefined
}

hitStrokeWidth={10}

draggable

onDragEnd={(e) => {

  const newX = e.target.x()
  const newY = e.target.y()

  const deltaX = newX - rect.x
  const deltaY = newY - rect.y

  const inGroup = multiSelection.some(s => s.type === "rectangle" && s.id === rect.id) && multiSelection.length > 1

  if (inGroup) {
    moveSelectedBy(deltaX, deltaY)
  } else {
    setRectangles(current =>
      current.map(r => r.id === rect.id ? { ...r, x: newX, y: newY } : r)
    )
  }

}}

onClick={(e)=>{

 e.cancelBubble=true

 setSelectedText(null)

 if(selectedTool !== "select"){
   return
 }

 if (e.evt.shiftKey) {
   toggleMultiSelect("rectangle", rect.id)
   return
 }

 if(selectedRectangle === rect.id){

   setSelectedRectangle(null)

 }
 else{

   setSelectedRectangle(rect.id)

 }

}}

/>

))}

{/* Arrows */}

{arrows.map((arrow) => {

  const handleClick = (e:any) => {

    e.cancelBubble = true

    setSelectedText(null)

    if (selectedTool !== "select") {
      return
    }

    if (e.evt.shiftKey) {
      toggleMultiSelect("arrow", arrow.id)
      return
    }

    if (selectedArrow === arrow.id) {
      setSelectedArrow(null)
    } else {
      setSelectedArrow(arrow.id)
    }

  }

  if (arrow.curved) {

    const cx = arrow.controlX ?? (arrow.startX + arrow.endX) / 2
    const cy = arrow.controlY ?? (arrow.startY + arrow.endY) / 2

    const strokeColor = (selectedArrow === arrow.id || multiSelection.some(s => s.type === "arrow" && s.id === arrow.id)) ? "lime" : arrow.color

    return (
      <Shape
        key={arrow.id}
        sceneFunc={(context, shape) => {

          context.beginPath()
          context.moveTo(arrow.startX, arrow.startY)
          context.quadraticCurveTo(cx, cy, arrow.endX, arrow.endY)
          context.strokeShape(shape)

          if (arrow.style !== "line") {

            const endAngle = Math.atan2(arrow.endY - cy, arrow.endX - cx)
            drawArrowhead(context, arrow.endX, arrow.endY, endAngle, strokeColor)

            if (arrow.style === "double") {
              const startAngle = Math.atan2(arrow.startY - cy, arrow.startX - cx)
              drawArrowhead(context, arrow.startX, arrow.startY, startAngle, strokeColor)
            }

          }

        }}
        stroke={strokeColor}
        strokeWidth={selectedArrow === arrow.id ? 6 : 4}
        dash={arrow.style === "dashed" ? [15,10] : undefined}
        hitStrokeWidth={20}
        draggable={selectedTool === "select"}
        onDragEnd={(e) => handleArrowDragEnd(e, arrow.id)}
        onClick={handleClick}
      />
    )
  }

  return (
    <Arrow

    key={arrow.id}

    points={[
     arrow.startX,
     arrow.startY,
     arrow.endX,
     arrow.endY
    ]}

    stroke={
     selectedArrow === arrow.id || multiSelection.some(s => s.type === "arrow" && s.id === arrow.id)
     ? "lime"
     : arrow.color
    }

    fill={
     selectedArrow === arrow.id || multiSelection.some(s => s.type === "arrow" && s.id === arrow.id)
     ? "lime"
     : arrow.color
    }

    strokeWidth={
     selectedArrow === arrow.id
     ? 6
     : 4
    }

    dash={
     arrow.style === "dashed"
     ? [15,10]
     : undefined
    }

    pointerLength={
     arrow.style === "line"
     ? 0
     : 12
    }

    pointerWidth={
     arrow.style === "line"
     ? 0
     : 12
    }

    pointerAtBeginning={
     arrow.style === "double"
    }

    hitStrokeWidth={20}

    draggable={selectedTool === "select"}
    onDragEnd={(e) => handleArrowDragEnd(e, arrow.id)}

    onClick={handleClick}

    />
  )

})}

{/* Curved arrow control handles */}

{arrows.map((arrow) => (

  arrow.curved && selectedArrow === arrow.id && selectedTool === "select" && (
    <Circle
      key={`handle-${arrow.id}`}
      x={arrow.controlX ?? (arrow.startX + arrow.endX) / 2}
      y={arrow.controlY ?? (arrow.startY + arrow.endY) / 2}
      radius={6}
      fill="lime"
      stroke={multiSelection.some(s => s.type === "ball") ? "lime" : "black"}
      strokeWidth={1}
      draggable
      onDragMove={(e) => {
        setArrows(current =>
          current.map(a =>
            a.id === arrow.id
              ? { ...a, controlX: e.target.x(), controlY: e.target.y() }
              : a
          )
        )
      }}
    />
  )

))}

{/* Text */}

{texts.map((item) => (

  <Text
    key={item.id}
    x={item.x}
    y={item.y}
    text={item.text}
    fontSize={12}
    fill={
      selectedText === item.id || multiSelection.some(s => s.type === "text" && s.id === item.id)
        ? "lime"
        : item.color
    }
    draggable

    onClick={(e) => {

      e.cancelBubble = true

      if (selectedTool !== "select") {
        return
      }

      if (e.evt.shiftKey) {
        toggleMultiSelect("text", item.id)
        return
      }

      setSelectedArrow(null)
      setSelectedPlayer(null)

      if (selectedText === item.id) {
        setSelectedText(null)
      } else {
        setSelectedText(item.id)
      }

    }}

    onDragEnd={(e) => {

      const newX = e.target.x()
      const newY = e.target.y()

      const deltaX = newX - item.x
      const deltaY = newY - item.y

      const inGroup = multiSelection.some(s => s.type === "text" && s.id === item.id) && multiSelection.length > 1

      if (inGroup) {
        moveSelectedBy(deltaX, deltaY)
      } else {
        setTexts(
          texts.map((text) =>
            text.id === item.id
              ? { ...text, x: newX, y: newY }
              : text
          )
        )
      }

    }}

  />

))}

{/* Players */}

{players.map((player)=>(

<Player

key={player.id}
id={player.id}
x={player.x}
y={player.y}
number={player.number}
color={player.color}
numberColor={player.numberColor}
name={player.name}
position={player.position}
selectedTool={selectedTool}
updatePlayerPosition={updatePlayerPosition}
selectedPlayer={selectedPlayer}
setSelectedPlayer={setSelectedPlayer}
setSelectedArrow={setSelectedArrow}
setSelectedText={setSelectedText}
switchMode={switchMode}
onSwitchSelect={onSwitchSelect}
isMultiSelected={multiSelection.some(s => s.type === "player" && s.id === player.id)}
onToggleMultiSelect={(playerId) => toggleMultiSelect("player", playerId)}
showName={showPlayerNames}
showPosition={showPlayerPositions}

/>

))}

</Layer>

</Stage>

)

}

export default SoccerPitch
