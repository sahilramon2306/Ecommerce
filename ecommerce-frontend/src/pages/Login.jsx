import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { FaEye, FaEyeSlash, FaGoogle, FaGithub } from "react-icons/fa";
import "../styles/login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let payload = { password: formData.password };

      if (formData.identifier.includes("@")) {
        payload.email = formData.identifier;
      } else {
        payload.phone = formData.identifier;
      }

      const res = await axiosInstance.post("/user-login", payload);

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        window.location.href = "/";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-wrapper ${animate ? "show" : ""}`}>
      
      {/* LEFT IMAGE PANEL */}
      <div className="login-image">
        <div className="overlay">
          <h2>Premium Shopping Experience</h2>
          <p>Discover curated collections crafted for excellence.</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="login-form-section">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Welcome Back</h2>

          {error && <div className="error-box">{error}</div>}

          {/* Floating Email/Phone */}
          <div className="floating-group">
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
            <label>Email or Phone</label>
          </div>

          {/* Floating Password */}
          <div className="floating-group password-group">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <label>Password</label>
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {/* Divider */}
          <div className="divider">
            <span>OR</span>
          </div>

          {/* Social Buttons */}
          <div className="social-login">
            <button type="button" className="google">
              <a
                href="http://localhost:5000/auth/google"
                className="social-btn google"
              >
              <FaGoogle />
               Continue with Google
              </a>
            </button>
            <button type="button" className="github">
              <FaGithub />Continue with GitHub
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;