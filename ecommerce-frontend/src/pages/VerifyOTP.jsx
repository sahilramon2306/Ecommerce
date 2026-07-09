import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/verify-otp.css";

const VerifyOTP = () => {
  const [email, setEmail] = useState("");
  // State is now just a single standard string
  const [otp, setOtp] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    const stateEmail = location.state?.email;
    const savedEmail = localStorage.getItem("resetEmail");

    if (stateEmail) {
      setEmail(stateEmail);
    } else if (savedEmail) {
      setEmail(savedEmail);
    }

    // Auto-focus the hidden input on load
    if (hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }, [location]);

  const handleChange = (e) => {
    const value = e.target.value;
    // Only allow numbers and max 6 characters
    if (/^[0-9]*$/.test(value) && value.length <= 6) {
      setOtp(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axiosInstance.post(
        "/verify-Reset-OTP",
        { email, otp },
        { skipAuth: true }
      );

      if (res.data.success) {
        setMessage(res.data.message);
        setTimeout(() => {
          navigate("/reset-password", { state: { email, otp } });
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        
        {/* LEFT PANEL */}
        <div className="auth-left dark-theme">
          <div className="auth-brand">
            <span className="brand-logo">SC</span>
            <span className="brand-text">SahimonCart</span>
          </div>
          <div className="hero-text">
            <h1>Build faster.<br/>Scale smarter.</h1>
            <p>Join thousands of users shopping better products with our premium enterprise-grade platform.</p>
          </div>
          <div className="feature-badges">
            <div className="badge"><span>🛡️</span> SOC2 Type II Certified Security</div>
            <div className="badge"><span>⚡</span> Lightning fast global edge network</div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="auth-right">
          <div className="form-wrapper">
            <h2>Verify your email</h2>
            <p className="subtitle">
              We sent a 6-digit code to <span className="highlight-email">{email || "your email"}</span>
            </p>

            {error && <div className="error-box">{error}</div>}
            {message && <div className="success-box">{message}</div>}

            <form onSubmit={handleSubmit}>
              
              {/* THE HIDDEN INPUT ARCHITECTURE */}
              <div 
                className="otp-overlay-container" 
                onClick={() => hiddenInputRef.current?.focus()}
              >
                <input
                  ref={hiddenInputRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code" /* Tells mobile devices to suggest SMS codes */
                  value={otp}
                  onChange={handleChange}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="hidden-real-input"
                />

                <div className="fake-boxes-container">
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    // Determine which box should look "active" (glowing blue)
                    const isActive = isFocused && (otp.length === index || (otp.length === 6 && index === 5));
                    
                    return (
                      <div key={index} className={`fake-box ${isActive ? "active" : ""}`}>
                        {otp[index] || ""}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="timer-text">
                Code expires in <strong>08:08</strong>
              </div>

              <button type="submit" className="verify-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify Email"}
              </button>

              <div className="action-links">
                <button type="button" className="link-btn">Resend code</button>
                <span className="dot">•</span>
                <button type="button" className="link-btn" onClick={() => navigate("/forgot-password")}>
                  Change email
                </button>
              </div>
            </form>

            <div className="back-to-login">
              Already have an account? <span onClick={() => navigate("/login")}>Sign in to workspace</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VerifyOTP;