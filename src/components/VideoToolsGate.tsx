import { useState, useEffect, type ReactNode } from "react"

const API_BASE = "http://localhost:5001"

function VideoToolsGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<"checking" | "available" | "unavailable">("checking")

  function checkBackend() {
    setStatus("checking")
    fetch(`${API_BASE}/clips?profile=_healthcheck`, { signal: AbortSignal.timeout(2000) })
      .then((res) => setStatus(res.ok ? "available" : "unavailable"))
      .catch(() => setStatus("unavailable"))
  }

  useEffect(() => {
    checkBackend()
  }, [])

  if (status === "checking") {
    return <p>Checking for video tools...</p>
  }

  if (status === "available") {
    return <>{children}</>
  }

  return (
    <div style={{ border: "1px solid gold", borderRadius: "6px", padding: "6px 10px", textAlign: "left" }}>
      <h3>🎥 Video Tracking & Clip Playback</h3>
      <p>Runs locally on your computer. One-time setup:</p>
      <ol>
        <li>
          <a href="/downloads/server.py" download>Download server.py</a>
          {" "}+{" "}
          <a href="/downloads/requirements.txt" download>requirements.txt</a>
        </li>
        <li><code>pip3 install -r requirements.txt</code></li>
        <li><code>python3 server.py</code></li>
      </ol>
      <button onClick={checkBackend}>Check again</button>
    </div>
  )
}

export default VideoToolsGate
