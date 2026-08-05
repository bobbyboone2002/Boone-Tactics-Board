import { useState } from "react"

type TextCreatorProps = {
  createText: (text: string) => void
  cancelCreate: () => void
}

function TextCreator({ createText, cancelCreate }: TextCreatorProps) {
  const [text, setText] = useState("")

  return (
    <div>
      <h2>Add Text</h2>

      <label>
        Text:
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      </label>

      <br />

      <button
        onClick={() => {
          if (!text) return
          createText(text)
          setText("")
        }}
      >
        Add
      </button>

      <button onClick={cancelCreate}>
        Cancel
      </button>
    </div>
  )
}

export default TextCreator