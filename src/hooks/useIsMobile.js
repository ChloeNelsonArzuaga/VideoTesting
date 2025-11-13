

// src/hooks/useIsMobile.js
import { useState, useEffect } from "react";

/**
 * useIsMobile – tracks whether viewport width is below the given breakpoint.
 * @param {number} breakpoint - pixels, default 900.
 * @returns {boolean} true if window.innerWidth < breakpoint
 */
export default function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);

    // initial
    setIsMobile(mq.matches);

    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [breakpoint]);

  return isMobile;
}
