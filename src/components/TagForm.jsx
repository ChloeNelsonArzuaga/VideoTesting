

import React from "react";

export default function TagForm({ tagText, setTagText, onDrop }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        className="input"
        value={tagText}
        onChange={(e) => setTagText(e.target.value)}
        placeholder="Tag text (e.g. 'dog appears')"
      />
      <button className="btn btn-success" onClick={onDrop}>
        Add Tag
      </button>
    </div>
  );
}
