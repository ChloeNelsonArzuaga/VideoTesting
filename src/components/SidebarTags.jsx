
import React from "react";
import { formatTime } from "../utils/time";

export default function SidebarTags({ tags = [], onSeek, onRemove }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>All tags</strong>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflow: "auto" }}>
        {tags.length === 0 ? (
          <div className="muted">No tags yet — drop some while the video plays.</div>
        ) : (
          tags.map((t) => (
            <div key={t.id} className="tag-item">
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.text}</div>
                <div className="muted">{formatTime(t.time)}</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => onSeek(t)} className="btn" style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer" }}>
                  Go
                </button>
                <button onClick={() => onRemove(t.id)} className="btn" style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer" }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
