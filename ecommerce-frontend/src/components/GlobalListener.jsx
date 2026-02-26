import { useEffect, useState } from "react";
import "../styles/GlobalListener.css";

const calcSize = () => {
  if (typeof window === "undefined") return 60;
  const w = window.innerWidth;
  // size as a percentage of viewport, clamped between 36 and 90
  return Math.max(36, Math.min(90, Math.floor(w * 0.08)));
};

const GlobalListener = () => {
  const [loading, setLoading] = useState(false);
  const [size, setSize] = useState(calcSize());

  useEffect(() => {
    const onLoading = (e) => setLoading(Boolean(e?.detail));
    const onResize = () => setSize(calcSize());

    window.addEventListener("loading", onLoading);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("loading", onLoading);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="global-loading">
      <div className="loading-card" role="status" aria-live="polite">
        <div className="spinner-wrap" style={{ ['--loader-size']: `${size}px` }}>
          <div className="modern-spinner" aria-hidden="true">
            <svg className="spinner-svg" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="25%" stopColor="#8b5cf6" stopOpacity="1" />
                  <stop offset="75%" stopColor="#ec4899" stopOpacity="1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <g filter="url(#glow)">
                <circle className="spinner-bg" cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
                <circle className="spinner-ring-1" cx="70" cy="70" r="50" fill="none" stroke="url(#grad1)" strokeWidth="6" strokeLinecap="round" />
                <circle className="spinner-ring-2" cx="70" cy="70" r="38" fill="none" stroke="rgba(99,102,241,0.4)" strokeWidth="3" strokeLinecap="round" />
              </g>

              <g filter="url(#glow)">
                <circle className="spinner-dot-center" cx="70" cy="70" r="6" fill="url(#grad1)" />
              </g>
            </svg>

            <div className="spinner-dots">
              <span className="dot d1" />
              <span className="dot d2" />
              <span className="dot d3" />
            </div>
          </div>
        </div>

        <p className="loading-text">Processing...</p>
      </div>
    </div>
  );
};

export default GlobalListener;
