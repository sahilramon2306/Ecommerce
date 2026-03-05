import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/reset-password.css";

const ResetPassword = () => {

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Load email & OTP safely
  useEffect(() => {

    const state = location.state || {};
    const savedEmail = localStorage.getItem("resetEmail");

    if (state.email) {
      setEmail(state.email);
      localStorage.setItem("resetEmail", state.email);
    } else if (savedEmail) {
      setEmail(savedEmail);
    }

    if (state.otp) {
      setOtp(state.otp);
    }

  }, [location.state]);



  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {

      const res = await axiosInstance.post(
        "/reset-Password",
        {
          email,
          otp,
          newPassword
        },
        { skipAuth: true }
      );

      if (res.data.success) {

        setMessage(res.data.message);

        // clear saved email
        localStorage.removeItem("resetEmail");

        setTimeout(() => {
          navigate("/login");
        }, 1500);

      }

    } catch (err) {
      setError(err.response?.data?.message || "Password reset failed");
    }

  };



  return (
    <div className="login-wrapper">

      {/* LEFT PANEL */}
      <div className="login-image">
        <div className="overlay">
          <h2>Reset Password</h2>
          <p>Create a strong password</p>
        </div>
      </div>


      {/* RIGHT PANEL */}
      <div className="login-form-section">

        <form className="login-card" onSubmit={handleSubmit}>

          <h2>Set New Password</h2>

          {error && <div className="error-box">{error}</div>}
          {message && <div className="success-box">{message}</div>}

          <div className="floating-group">
            <input type="text" value={email} readOnly />
            <label>Email</label>
          </div>

          <div className="floating-group">
            <input type="text" value={otp} readOnly />
            <label>OTP</label>
          </div>

          <div className="floating-group">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <label>New Password</label>
          </div>

          <div className="floating-group">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <label>Confirm Password</label>
          </div>

          <button type="submit">
            Reset Password
          </button>

        </form>

      </div>

    </div>
  );
};

export default ResetPassword;