import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {
  FaEye,
  FaEyeSlash,
  FaGoogle,
  FaEnvelope,
  FaLock,
  FaArrowRight
} from "react-icons/fa";
import "../styles/login.css";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      let payload = {
        password: formData.password,
      };

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
      setError(
        err.response?.data?.message ||
          "Invalid credentials. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        
        {/* LEFT SIDE - Form */}
        <div className="login-left">
          <div className="login-form-wrapper">
            <div className="brand-header">
              {/* Optional: Add SahimonCart Logo Here 
              <div className="brand-logo">SahimonCart</div>
              <span className="brand-name">SahimonCart</span>*/}
            </div>

            <div className="login-header">
              <h1>Welcome back</h1>
              <p className="subtitle">
                Enter your details to access your account.
              </p>
            </div>

            {error && (
              <div className="error-box" role="alert">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label htmlFor="identifier">Email or Phone</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    id="identifier"
                    type="text"
                    name="identifier"
                    placeholder="Enter your email or phone"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="checkbox-container">
                  <input type="checkbox" />
                  <span className="checkmark"></span>
                  Remember me
                </label>
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() => navigate("/forgot-password")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                className={`signin-btn ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    Sign In <FaArrowRight className="btn-icon" />
                  </>
                )}
              </button>
            </form>

            <div className="divider">
              <span>Or continue with</span>
            </div>

            <a
              href="http://localhost:5000/auth/google"
              className="google-btn"
            >
              <FaGoogle className="google-icon" />
              Sign in with Google
            </a>

            <p className="register-link">
              Don't have an account?{" "}
              <button
                type="button"
                className="link-btn"
                onClick={() => navigate("/register")}
              >
                Create an account
              </button>
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Hero */}
        <div className="login-right">
          <div className="hero-overlay"></div>
          {/* Premium Unsplash Image replacement */}
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop"
            alt="Modern Shopping"
            className="hero-background"
          />
          
          <div className="hero-content">
            <div className="glass-panel">
              <h2>
                Elevate your shopping <br />
                <span className="text-gradient">experience.</span>
              </h2>
              <p>
                Join thousands of users enjoying secure payments, lightning-fast delivery, and exclusive premium deals.
              </p>
              
              <div className="hero-features">
                <div className="feature-chip">🔒 Secure</div>
                <div className="feature-chip">🚚 Fast Delivery</div>
                <div className="feature-chip">⭐ Best Deals</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;