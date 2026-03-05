import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/forgot-password.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {

      const res = await axiosInstance.post(
        "/forgot-Password",
        { email },
        { skipAuth: true }
      );

      if (res.data.success) {

        setMessage(res.data.message);

        // store email so refresh doesn't break flow
        localStorage.setItem("resetEmail", email);

        setTimeout(() => {
          navigate("/verify-otp", { state: { email } });
        }, 1500);
      }

    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">

      <div className="login-image">
        <div className="overlay">
          <h2>Reset Your Password</h2>
          <p>Enter your email to receive OTP.</p>
        </div>
      </div>

      <div className="login-form-section">
        <form className="login-card" onSubmit={handleSubmit}>

          <h2>Forgot Password</h2>

          {error && <div className="error-box">{error}</div>}
          {message && <div className="success-box">{message}</div>}

          <div className="floating-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <label>Email</label>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;