export type Slot = {
  role: string
  x: number
  y: number
}

export const formations: Record<string, Slot[]> = {

  "4-3-3": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "CDM", x: 285, y: 300 },
    { role: "CM", x: 330, y: 200 },
    { role: "CM", x: 330, y: 400 },
    { role: "LW", x: 420, y: 80 },
    { role: "ST", x: 430, y: 300 },
    { role: "RW", x: 420, y: 520 }
  ],

  "4-2-3-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "CDM", x: 285, y: 360 },
    { role: "CDM", x: 285, y: 240 },
    { role: "LW", x: 360, y: 80 },
    { role: "CAM", x: 360, y: 300 },
    { role: "RW", x: 360, y: 520 },
    { role: "ST", x: 430, y: 300 }
  ],

  "4-1-4-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "CDM", x: 285, y: 300 },
    { role: "CAM", x: 360, y: 200 },
    { role: "CAM", x: 360, y: 400 },
    { role: "LW", x: 360, y: 80 },
    { role: "ST", x: 430, y: 300 },
    { role: "RW", x: 360, y: 520 }
  ],

  "3-4-1-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 285, y: 80 },
    { role: "CDM", x: 285, y: 250 },
    { role: "CAM", x: 355, y: 300 },
    { role: "CDM", x: 285, y: 350 },
    { role: "RWB", x: 285, y: 520 },
    { role: "ST", x: 430, y: 200 },
    { role: "ST", x: 430, y: 400 }
  ],

  "3-4-2-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 285, y: 80 },
    { role: "CDM", x: 285, y: 250 },
    { role: "CAM", x: 360, y: 400 },
    { role: "CDM", x: 285, y: 350 },
    { role: "RWB", x: 285, y: 520 },
    { role: "CAM", x: 360, y: 200 },
    { role: "ST", x: 430, y: 300 }
  ]

}
