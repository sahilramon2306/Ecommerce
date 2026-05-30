import { useEffect, useState } from "react";
import "../styles/GlobalListener.css";

const GlobalListener = () => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (event) => {
      setLoading(Boolean(event?.detail));
    };

    window.addEventListener("loading", handleLoading);

    return () => {
      window.removeEventListener("loading", handleLoading);
    };
  }, []);

  if (!loading) return null;

  return (
    <div className="global-loader">
      <div className="loader-card" role="status" aria-live="polite">
        <div className="loader-spinner" aria-hidden="true">
          <span className="loader-ring" />
          <span className="loader-dot" />
        </div>

        <div className="loader-content">
          <h2 className="loader-title">Loading</h2>
          <p className="loader-text">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalListener;