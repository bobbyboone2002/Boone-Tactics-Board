export type RosterPlayer = {
  id: number
  number: number
  name: string
  positions: string[]
}

export type Team = {
  id: number
  name: string
  league: "Custom" | "Premier League"
  homeColor: string
  homeNumberColor: string
  awayColor: string
  awayNumberColor: string
  thirdColor: string
  thirdNumberColor: string
  activeKit: "home" | "away" | "third"
  roster: RosterPlayer[]
}
