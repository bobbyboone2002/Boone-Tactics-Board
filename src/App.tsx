import { useState } from "react"
import ProfileLogin from './components/ProfileLogin'
import TacticsBoard from "./TacticsBoard"

function loadProfiles(): string[] {
  try {
    const stored = localStorage.getItem("tacticsBoard_profiles")
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function loadActiveProfile(): string | null {
  try {
    return localStorage.getItem("tacticsBoard_activeProfile")
  } catch {
    return null
  }
}

function App() {

  const [profiles, setProfiles] = useState<string[]>(() => loadProfiles())
  const [activeProfile, setActiveProfile] = useState<string | null>(() => loadActiveProfile())

  function selectProfile(name: string) {

    const updatedProfiles = profiles.includes(name) ? profiles : [...profiles, name]

    setProfiles(updatedProfiles)
    localStorage.setItem("tacticsBoard_profiles", JSON.stringify(updatedProfiles))

    setActiveProfile(name)
    localStorage.setItem("tacticsBoard_activeProfile", name)

  }

  function switchProfile() {
    setActiveProfile(null)
    localStorage.removeItem("tacticsBoard_activeProfile")
  }

  if (!activeProfile) {
    return (
      <ProfileLogin
        onSelectProfile={selectProfile}
      />
    )
  }

  return (
    <TacticsBoard
      key={activeProfile}
      profile={activeProfile}
      onSwitchProfile={switchProfile}
    />
  )

}

export default App
