

// src/components/VideoPlayer.jsx
import React, { forwardRef, useEffect } from "react";

const VideoPlayer = forwardRef(({ src, onTimeUpdate }, ref) => {

  return (
    <div className="video-wrap">
      <video
        ref={ref}
        src={src}
        controls
        playsInline         // important for iOS to avoid fullscreen hijack
        webkit-playsinline  // older iOS Safari
        // muted               // often needed if you want to autoplay (optional)
        preload="metadata"  // saves bandwidth, loads video poster/time metadata
        // poster={posterUrl}  // show a thumbnail while loading THIS IS CAUSING BREAKING
        onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime)}
        crossOrigin="anonymous"
        style={{ width: "100%", display: "block", background: "#000" }}
      />
    </div>
  );
});

export default VideoPlayer;


