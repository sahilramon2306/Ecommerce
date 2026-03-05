import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/verify-otp.css";

const VerifyOTP = () => {

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    const stateEmail = location.state?.email;
    const savedEmail = localStorage.getItem("resetEmail");

    if (stateEmail) {
      setEmail(stateEmail);
    } else if (savedEmail) {
      setEmail(savedEmail);
    }

  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      setError("Enter valid 6 digit OTP");
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
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      <div className="login-image">
        <div className="overlay">
          <h2>Verify OTP</h2>
          <p>Enter the OTP sent to your email</p>
        </div>
      </div>

      <div className="login-form-section">
        <form className="login-card" onSubmit={handleSubmit}>

          <h2>Verify OTP</h2>

          {error && <div className="error-box">{error}</div>}
          {message && <div className="success-box">{message}</div>}

          <div className="floating-group">
            <input value={email} readOnly />
            <label>Email</label>
          </div>

          <div className="floating-group">
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              required
            />
            <label>OTP</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;