

import React, { useRef, useState, useEffect } from "react";
import VideoPlayer from "./components/VideoPlayer";
import TagForm from "./components/TagForm";
import TagList from "./components/TagList";
import BottomBar from "./components/BottomBar";
import useTags from "./hooks/useTags";
import useIsMobile from "./hooks/useIsMobile";
import { formatTime } from "./utils/time";
import "./styles/index.css";

export default function App() {
    const videoRef = useRef(null);
    const tagInputRef = useRef(null);
    const asideRef = useRef(null);

    const base = import.meta.env.BASE_URL || "/";
    const [videoURL] = useState(`${base}IMG_5481.MOV`); // preloaded video in public/

    const [currentTime, setCurrentTime] = useState(0);
    const [tagText, setTagText] = useState("");
    const [showTagPanel, setShowTagPanel] = useState(false); // bring up the panel for editing the tags
    const isMobile = useIsMobile(900); // check if the website is wide or not and update acordingly

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
        if (isMobile) setShowTagPanel(false); // close panel on mobile after seeking
    }

    function handlePlay() {
        videoRef.current?.play();
    }
    function handlePause() {
        videoRef.current?.pause();
    }

    function toggleTagPanel() {
        if (isMobile) {
            setShowTagPanel((s) => !s);
        } else {
            // desktop: scroll/focus the sidebar
            asideRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            const firstInteractive = asideRef.current?.querySelector("button, input, a");
            firstInteractive?.focus?.();
        }
    }

    // Focus tag input when panel opens on mobile
    useEffect(() => {
        if (showTagPanel && isMobile) {
            setTimeout(() => tagInputRef.current?.focus(), 120);
        }
    }, [showTagPanel, isMobile]);

    // Close panel automatically if we switch to desktop
    useEffect(() => {
        if (!isMobile) setShowTagPanel(false);
    }, [isMobile]);

    return (
        <div className="app-shell">
            <div className="app-card">
                {/* <h1 className="h1">🎥 Video Tagger</h1> */}

                <div className="controls">
                    {/* <div>Preloaded: <code>/IMG_5481.MOV</code></div> */}
                    <div>Routine Name</div>
                    <div className="spacer">Current: {formatTime(currentTime)}</div>
                </div>

                <div className="main-grid">
                    <div>
                        <VideoPlayer
                        ref={videoRef}
                        src={videoURL}
                        onTimeUpdate={(t) => setCurrentTime(t)}
                        />
                    </div>

                    <aside ref={asideRef} className="aside" aria-hidden={isMobile}>
                        {/* <SidebarTags tags={tags} onSeek={handleSeek} onRemove={removeTag} /> */}
                        <TagForm tagText={tagText} setTagText={setTagText} onDrop={handleDrop}/>
                        <TagList tags={tags} onSeek={handleSeek} onRemove={removeTag}/>
                    </aside>
                </div>
            </div> {/*END APP CARD*/}



            {/* Tag slide-up panel (hidden by default) */}
            <div className={`tag-panel ${showTagPanel ? "open" : ""}`} role="dialog" aria-hidden={!showTagPanel}>
                <TagForm tagText={tagText} setTagText={setTagText} onDrop={handleDrop} />

                <div className="panel-content">
                    <TagList tags={tags} onSeek={handleSeek} onRemove={removeTag} />
                </div>
                
            </div>

            {/* Bottom control bar */}
            <BottomBar onPlay={handlePlay} onPause={handlePause} onToggleTag={toggleTagPanel} />

        </div>

    );
}
