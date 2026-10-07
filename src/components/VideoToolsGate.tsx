import { useState, useEffect, type ReactNode } from "react"

const API_BASE = "http://localhost:5001"

function VideoToolsGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<
    "checking" | "available" | "unavailable"
  >("checking")

  function checkBackend() {
    setStatus("checking")

    fetch(`${API_BASE}/clips?profile=_healthcheck`, {
      signal: AbortSignal.timeout(2000),
    })
      .then((res) => setStatus(res.ok ? "available" : "unavailable"))
      .catch(() => setStatus("unavailable"))
  }

  useEffect(() => {
    checkBackend()
  }, [])

  if (status === "checking") {
    return (
      <div
        style={{
          width: "320px",
          padding: "8px 12px",
          fontSize: "12px",
          color: "#475569",
          boxSizing: "border-box",
        }}
      >
        Checking for video tools...
      </div>
    )
  }

  if (status === "available") {
    return <>{children}</>
  }

  return (
    <div
      style={{
        width: "360px",
        maxWidth: "100%",
        boxSizing: "border-box",
        border: "1px solid #e5c400",
        borderRadius: "8px",
        padding: "10px 12px",
        background: "rgba(255, 253, 235, 0.96)",
        color: "#172554",
        fontSize: "12px",
        lineHeight: "1.4",
      }}
    >
      <div
        style={{
          fontSize: "16px",
          fontWeight: 700,
          marginBottom: "6px",
        }}
      >
        🎥 Video Tracking & Clip Playback
      </div>

      <p
        style={{
          margin: "0 0 6px 0",
          fontSize: "11px",
          color: "#475569",
        }}
      >
        Runs locally on your computer. One-time setup:
      </p>

      <ol
        style={{
          margin: "0 0 8px 20px",
          padding: 0,
          fontSize: "11px",
        }}
      >
        <li style={{ marginBottom: "4px" }}>
          <a href="/downloads/server.py" download>
            Download server.py
          </a>
          {" + "}
          <a href="/downloads/requirements.txt" download>
            requirements.txt
          </a>
        </li>

        <li style={{ marginBottom: "4px" }}>
          <code
            style={{
              fontSize: "11px",
              background: "#f1f5f9",
              padding: "2px 4px",
              borderRadius: "3px",
            }}
          >
            pip3 install -r requirements.txt
          </code>
        </li>

        <li>
          <code
            style={{
              fontSize: "11px",
              background: "#f1f5f9",
              padding: "2px 4px",
              borderRadius: "3px",
            }}
          >
            python3 server.py
          </code>
        </li>
      </ol>

      <button
        onClick={checkBackend}
        style={{
          padding: "5px 10px",
          fontSize: "11px",
          borderRadius: "6px",
          border: "1px solid #cbd5e1",
          background: "white",
          cursor: "pointer",
        }}
      >
        Check again
      </button>
    </div>
  )
}

export default VideoToolsGate
