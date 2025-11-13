

import React from "react";
import { formatTime } from "../utils/time";

export default function TagList({ tags, onSeek }) {
  if (!tags || tags.length === 0) {
    return <div className="muted">No tags yet</div>;
  }

  return (
    <div className="list">
      {tags.map((t) => (
        <div key={t.id} className="tag-item" onClick={() => onSeek(t)}>
          <div>
            <div style={{ fontWeight: 600 }}>{t.text}</div>
            <div className="muted">{formatTime(t.time)}</div>
          </div>
          <div style={{ color: "var(--accent)" }}>▶</div>
        </div>
      ))}
    </div>
  );
}
