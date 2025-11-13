

// src/components/TagList.jsx
import React from "react";
import { formatTime } from "../utils/time";

/**
 * Props:
 * - tags: array of { id, text, time }
 * - onSeek(tag): called when clicking item
 * - onRemove(id) [optional]: if provided, show a Delete button and call it when clicked
 */
export default function TagList({ tags = [], onSeek, onRemove }) {
  if (!tags || tags.length === 0) {
    return <div className="muted">No tags yet</div>;
  }

  return (
    <div className="list" role="list">
      {tags.map((t) => (
        <div key={t.id} className="tag-item" role="listitem" style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <button
            onClick={() => onSeek?.(t)}
            style={{
              background: "transparent",
              border: "none",
              textAlign: "left",
              padding: 0,
              flex: 1,
              cursor: "pointer"
            }}
            // aria-label={`Play tag ${t.text}`}
          >
            ▶
            <div style={{ fontWeight: 600 }}>{t.text}</div>
            <div className="muted" style={{ marginTop: 4 }}>{formatTime(t.time)}</div>
          </button>

          {/* Delete button only shown when onRemove provided */}
          {typeof onRemove === "function" && (
            <button
              onClick={() => onRemove(t.id)}
              aria-label={`Delete tag ${t.text}`}
              className="btn"
              style={{
                marginLeft: 8,
                background: "transparent",
                border: "none",
                color: "var(--danger)",
                cursor: "pointer"
              }}
              title="Delete"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
