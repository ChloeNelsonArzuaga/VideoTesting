
import React, { useRef, useState, useEffect } from "react";
import './index.css';

export default function App() {
    const videoRef = useRef(null);

    const [videoURL] = useState("IMG_5481.MOV"); // this is for direct link to video in public folder
    const [currentTime, setCurrentTime] = useState(0);
    const [tagText, setTagText] = useState("");
    const [tags, setTags] = useState([]);
    const [search, setSearch] = useState("");

        // load tags from localStorage on mount
    useEffect(() => {
        const raw = localStorage.getItem("vt-tags");
        if (raw) setTags(JSON.parse(raw));
    }, []);

    useEffect(() => {
        localStorage.setItem("vt-tags", JSON.stringify(tags));
    }, [tags]);

    function formatTime(t) {
        if (!Number.isFinite(t)) return "00:00";
        const total = Math.floor(t);
        const mm = Math.floor(total / 60)
        .toString()
        .padStart(2, "0");
        const ss = (total % 60).toString().padStart(2, "0");
        return `${mm}:${ss}`;
    }

    function dropTag() {
        if (!videoRef.current) return;
        const t = Math.round(videoRef.current.currentTime * 100) / 100;
        const text = tagText.trim() || "untitled";
        const newTag = { id: Date.now(), text, time: t };
        setTags((s) => [newTag, ...s]);
        setTagText("");
    }

    function seekTo(tag) {
        if (!videoRef.current) return;
        videoRef.current.currentTime = tag.time;
        videoRef.current.play();
    }

    function handleTimeUpdate() {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
    }

    function clearTags() {
        if (!confirm("Clear all tags?")) return;
        setTags([]);
    }

    const filtered = search
        ? tags.filter((t) => t.text.toLowerCase().includes(search.toLowerCase()))
        : tags;

    return (
    <div className="app-shell">
      <div className="app-card">
        <h1 className="h1">🎥 Video Tagger</h1>

        <div className="controls">
          <div>Preloaded video: <code>/sample.mp4</code></div>
          <div className="spacer">Current: {formatTime(currentTime)}</div>
        </div>

        <div className="main-grid">
          <div>
            <div className="video-wrap">
              <video
                ref={videoRef}
                src={videoURL}
                controls
                onTimeUpdate={handleTimeUpdate}
              />
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input
                value={tagText}
                onChange={(e) => setTagText(e.target.value)}
                placeholder="Tag text (e.g. 'dog appears')"
                className="input"
              />
              <button onClick={dropTag} className="btn btn-success">
                Drop Tag
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <label className="muted">Search tags</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="input"
                style={{ marginTop: 6 }}
              />

              <div className="list">
                {filtered.length === 0 ? (
                  <div className="muted">No tags yet</div>
                ) : (
                  filtered.map((t) => (
                    <div key={t.id} onClick={() => seekTo(t)} className="tag-item">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.text}</div>
                        <div className="muted">{formatTime(t.time)}</div>
                      </div>
                      <div style={{ color: "var(--accent)" }}>Play ▶</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <aside className="aside">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <strong>All tags</strong>
              <button onClick={clearTags} className="btn" style={{ background: "transparent", color: "var(--danger)", cursor: "pointer", border: "none" }}>Clear</button>
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
                    <div>
                      <button onClick={() => seekTo(t)} className="btn" style={{ background: "transparent", border: "none", color: "var(--accent)", cursor: "pointer" }}>Go</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
              Tags persist to <code>localStorage</code> in your browser.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
