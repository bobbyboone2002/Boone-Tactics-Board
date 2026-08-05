import { useState, useEffect } from "react"

type TextEditorProps = {
  textItem: {
    id: number
    text: string
    color: string
  } | null

  updateText: (
    id: number,
    text: string,
    color: string
  ) => void

  deleteText: (
    id: number
  ) => void
}

function TextEditor({
  textItem,
  updateText,
  deleteText
}: TextEditorProps) {

  const [text, setText] = useState(textItem?.text ?? "")
  const [color, setColor] = useState(textItem?.color ?? "white")

  useEffect(() => {
    if (textItem) {
      setText(textItem.text)
      setColor(textItem.color)
    }
  }, [textItem])

  if (!textItem) {
    return null
  }

  return (
    <div>
      <h2>Text Editor</h2>

      <label>
        Text:
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </label>

      <br />

      <h3>Color</h3>

      <button onClick={() => setColor("white")}>
        White {color === "white" && "✓"}
      </button>

      <button onClick={() => setColor("yellow")}>
        Yellow {color === "yellow" && "✓"}
      </button>

      <button onClick={() => setColor("red")}>
        Red {color === "red" && "✓"}
      </button>

      <button onClick={() => setColor("blue")}>
        Blue {color === "blue" && "✓"}
      </button>

      <button onClick={() => setColor("lime")}>
        Green {color === "lime" && "✓"}
      </button>

      <br />

      <button
        onClick={() =>
          updateText(textItem.id, text, color)
        }
      >
        Update Text
      </button>

      <button
        onClick={() => deleteText(textItem.id)}
      >
        Delete Text
      </button>

    </div>
  )
}

export default TextEditor