

import React, { useRef, useState, useEffect } from "react";
import VideoPlayer from "./components/VideoPlayer";
import TagForm from "./components/TagForm";
import TagList from "./components/TagList";
import SidebarTags from "./components/SidebarTags";
import useTags from "./hooks/useTags";
import { formatTime } from "./utils/time";

import "./styles/index.css";

export default function App() {
    const videoRef = useRef(null);

    const base = import.meta.env.BASE_URL || "/";
    const [videoURL] = useState(`${base}IMG_5481.MOV`); // preloaded video in public/

    const [currentTime, setCurrentTime] = useState(0);
    const [tagText, setTagText] = useState("");

    const { tags, addTag, removeTag, searchTags, setTags } = useTags();

    function handleDrop() {
        if (!videoRef.current) return;
        const time = Math.round(videoRef.current.currentTime * 100) / 100;
        addTag({ text: tagText || "untitled", time });
        setTagText("");
    }

    function handleSeek(tag) {
        if (!videoRef.current) return;
        videoRef.current.currentTime = tag.time;
        videoRef.current.play?.();
    }

    return (
        <div className="app-shell">
        <div className="app-card">
            <h1 className="h1">🎥 Video Tagger</h1>

            <div className="controls">
            <div>Preloaded: <code>/IMG_5481.MOV</code></div>
            <div className="spacer">Current: {formatTime(currentTime)}</div>
            </div>

            <div className="main-grid">
            <div>
                <VideoPlayer
                ref={videoRef}
                src={videoURL}
                onTimeUpdate={(t) => setCurrentTime(t)}
                />

                <div style={{ marginTop: 12 }}>
                <TagForm tagText={tagText} setTagText={setTagText} onDrop={handleDrop} />
                </div>

                <div style={{ marginTop: 14 }}>
                <TagList tags={tags} onSeek={handleSeek} />
                </div>
            </div>

            <aside className="aside">
                <SidebarTags tags={tags} onSeek={handleSeek} onRemove={removeTag} />
                <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
                Tags persist to <code>localStorage</code>
                </div>
            </aside>
            </div>
        </div>
        </div>
    );
}
