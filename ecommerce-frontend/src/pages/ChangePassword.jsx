// ChangePassword.jsx (For authenticated users, e.g., in profile page)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../styles/change-password.css";

const ChangePassword = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (oldPassword === newPassword) {
      setError("New password must be different from old password");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await axiosInstance.put("/change-Password", { 
        oldPassword, 
        newPassword 
      });
      if (res.data.success) {
        setMessage(res.data.message);
        setTimeout(() => navigate("/profile"), 2000); // Redirect to profile or dashboard
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper"> {/* Or profile-wrapper */}
      {/* LEFT IMAGE PANEL - Optional for profile */}
      <div className="login-image">
        <div className="overlay">
          <h2>Change Password</h2>
          <p>Update your account security.</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="login-form-section">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Change Password</h2>
          {error && <div className="error-box">{error}</div>}
          {message && <div className="success-box">{message}</div>}
          
          <div className="floating-group password-group">
            <input
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Old Password"
              required
            />
            <label>Old Password</label>
            <span
              className="toggle-password"
              onClick={() => setShowOldPassword(!showOldPassword)}
            >
              {showOldPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="floating-group password-group">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New Password"
              required
            />
            <label>New Password</label>
            <span
              className="toggle-password"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="floating-group password-group">
            <input
              type={showNewPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm New Password"
              required
            />
            <label>Confirm New Password</label>
            <span
              className="toggle-password"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </button>

          <button 
            type="button" 
            onClick={() => navigate("/profile")}
            className="back-btn"
          >
            Back to Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;