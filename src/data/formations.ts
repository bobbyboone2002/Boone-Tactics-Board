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
    { role: "CAM", x: 330, y: 200 },
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
    { role: "CM", x: 285, y: 240 },
    { role: "CAM", x: 360, y: 300 },
    { role: "LW", x: 360, y: 140 },
    { role: "RW", x: 360, y: 460 },
    { role: "ST", x: 430, y: 300 }
  ],

  "4-4-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "CDM", x: 285, y: 360 },
    { role: "CM", x: 285, y: 240 },
    { role: "ST", x: 430, y: 240 },
    { role: "ST", x: 430, y: 360 },
    { role: "LW", x: 360, y: 80 },
    { role: "RW", x: 360, y: 520 }
  ],

  "4-5-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "CDM", x: 285, y: 300 },
    { role: "CM", x: 330, y: 200 },
    { role: "CM", x: 330, y: 400 },
    { role: "LW", x: 360, y: 80 },
    { role: "RW", x: 360, y: 520 },
    { role: "ST", x: 430, y: 300 }
  ],

  "4-2-2-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "ST", x: 430, y: 240 },
    { role: "ST", x: 430, y: 360 },
    { role: "CDM", x: 285, y: 360 },
    { role: "CM", x: 285, y: 240 },
    { role: "CAM", x: 360, y: 200 },
    { role: "CAM", x: 360, y: 400 }
  ],

  "4-1-4-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "CDM", x: 285, y: 300 },
    { role: "CM", x: 360, y: 200 },
    { role: "CAM", x: 360, y: 400 },
    { role: "LW", x: 360, y: 80 },
    { role: "ST", x: 430, y: 300 },
    { role: "RW", x: 360, y: 520 }
  ],

  "4-1-3-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "ST", x: 430, y: 240 },
    { role: "ST", x: 430, y: 360 },
    { role: "CDM", x: 285, y: 300 },
    { role: "LW", x: 360, y: 140 },
    { role: "RW", x: 360, y: 460 },
    { role: "CAM", x: 360, y: 300 }
  ],

  "4-3-2-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "CDM", x: 285, y: 300 },
    { role: "CM", x: 285, y: 190 },
    { role: "CM", x: 285, y: 410 },
    { role: "CAM", x: 360, y: 225 },
    { role: "CAM", x: 360, y: 375 },
    { role: "ST", x: 430, y: 300 }
  ],

  "4-3-1-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "RB", x: 220, y: 500 },
    { role: "CB", x: 180, y: 215 },
    { role: "CB", x: 180, y: 385 },
    { role: "LB", x: 220, y: 100 },
    { role: "ST", x: 430, y: 240 },
    { role: "ST", x: 430, y: 360 },
    { role: "CDM", x: 285, y: 300 },
    { role: "CM", x: 325, y: 200 },
    { role: "CM", x: 325, y: 400 },
    { role: "CAM", x: 360, y: 300 }
  ],

  "3-4-1-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 285, y: 80 },
    { role: "RWB", x: 285, y: 520 },
    { role: "ST", x: 430, y: 240 },
    { role: "ST", x: 430, y: 360 },
    { role: "CDM", x: 285, y: 250 },
    { role: "CAM", x: 355, y: 300 },
    { role: "CM", x: 285, y: 350 }
  ],

  "3-4-2-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 285, y: 80 },
    { role: "CDM", x: 285, y: 250 },
    { role: "CAM", x: 360, y: 400 },
    { role: "CM", x: 285, y: 350 },
    { role: "RWB", x: 285, y: 520 },
    { role: "CAM", x: 360, y: 200 },
    { role: "ST", x: 430, y: 300 }
  ],

  "3-4-3": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 285, y: 80 },
    { role: "CDM", x: 285, y: 250 },
    { role: "CM", x: 285, y: 350 },
    { role: "RWB", x: 285, y: 520 },
    { role: "LW", x: 420, y: 140 },
    { role: "ST", x: 430, y: 300 },
    { role: "RW", x: 420, y: 460 }
  ],

  "3-2-4-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "CDM", x: 285, y: 250 },
    { role: "CM", x: 285, y: 350 },
    { role: "CM", x: 360, y: 200 },
    { role: "CAM", x: 360, y: 400 },
    { role: "LW", x: 360, y: 80 },
    { role: "ST", x: 430, y: 300 },
    { role: "RW", x: 360, y: 520 }
  ],

  "3-2-3-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "ST", x: 430, y: 240 },
    { role: "ST", x: 430, y: 360 },
    { role: "CDM", x: 285, y: 250 },
    { role: "CM", x: 285, y: 350 },
    { role: "LW", x: 360, y: 140 },
    { role: "CAM", x: 360, y: 300 },
    { role: "RW", x: 360, y: 460 }
  ],

  "5-2-3": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 250, y: 80 },
    { role: "CDM", x: 310, y: 250 },
    { role: "CM", x: 310, y: 350 },
    { role: "RWB", x: 250, y: 520 },
    { role: "LW", x: 420, y: 140 },
    { role: "ST", x: 430, y: 300 },
    { role: "RW", x: 420, y: 460 }
  ],

  "5-3-2": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 250, y: 80 },
    { role: "RWB", x: 250, y: 520 },
    { role: "ST", x: 430, y: 240 },
    { role: "ST", x: 430, y: 360 },
    { role: "CDM", x: 285, y: 300 },
    { role: "CAM", x: 330, y: 200 },
    { role: "CM", x: 330, y: 400 }
    
  ],

  "5-4-1": [
    { role: "GK", x: 50, y: 300 },
    { role: "CB", x: 180, y: 180 },
    { role: "CB", x: 180, y: 300 },
    { role: "CB", x: 180, y: 420 },
    { role: "LWB", x: 250, y: 80 },
    { role: "RWB", x: 250, y: 520 },
    { role: "CDM", x: 285, y: 360 },
    { role: "CM", x: 285, y: 240 },
    { role: "LW", x: 360, y: 140 },
    { role: "RW", x: 360, y: 460 },
    { role: "ST", x: 430, y: 300 }
    
  ]

}
