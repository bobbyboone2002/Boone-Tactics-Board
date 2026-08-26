import { useState } from "react"

type ProfileLoginProps = {
  onSelectProfile: (name: string) => void
}

function ProfileLogin({ onSelectProfile }: ProfileLoginProps) {
  const [newProfileName, setNewProfileName] = useState("")

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "800px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <h1>Soccer Tactics Board</h1>

      <h2>Create or Enter Profile Name</h2>

      <div>
        <label>
          Profile Name:{" "}
          <input
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder=" "
          />
        </label>

        <button
          onClick={() => {
            if (!newProfileName.trim()) return

            onSelectProfile(newProfileName.trim())
            setNewProfileName("")
          }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}

export default ProfileLogin
