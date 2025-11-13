

// src/components/BottomBar.jsx
import React from "react";

export default function BottomBar({ onPlay, onPause, onToggleTag, isPlaying }) {
  return (
    <div className="bottom-bar" role="toolbar" aria-label="Playback controls">
      <button
        className="control-btn play"
        onClick={onPlay}
        aria-label="Play"
        title="Play"
      >
        ▶
      </button>

      <button
        className="control-btn pause"
        onClick={onPause}
        aria-label="Pause"
        title="Pause"
      >
        ⏸
      </button>

      <button
        className="control-btn tag"
        onClick={onToggleTag}
        aria-label="Tags"
        title="Tags"
      >
        🏷
      </button>
    </div>
  );
}
