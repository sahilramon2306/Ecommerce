import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  ShieldCheck,
  Zap,
  User,
  LayoutTemplate
} from "lucide-react";
import { toast } from "react-hot-toast";
import { registerUser, verifyRegistrationOTP } from "../api/authApi";
import "../styles/register.css";

const OTP_VALID_SECONDS = 10 * 60;

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
};

const accountFields = [
  { name: "name", label: "Full name", type: "text", icon: User, autoComplete: "name", placeholder: "e.g. Jane Doe" },
  { name: "email", label: "Work email", type: "email", icon: Mail, autoComplete: "email", placeholder: "jane@company.com" },
  { name: "phone", label: "Phone number", type: "tel", icon: Phone, autoComplete: "tel", placeholder: "Enter 10 digits" },
];

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_VALID_SECONDS);

  const otpInputsRef = useRef([]);

  // Timer Logic
  useEffect(() => {
    if (!otpStep || secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [otpStep, secondsLeft]);

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  // Password Strength Logic
  const passwordChecks = useMemo(() => {
    const password = formData.password;
    return [
      { label: "At least 6 characters", valid: password.length >= 6 },
      { label: "Contains a number", valid: /\d/.test(password) },
      { label: "Contains a letter", valid: /[a-zA-Z]/.test(password) },
    ];
  }, [formData.password]);

  const passwordScore = passwordChecks.filter((item) => item.valid).length;
  const passwordStrength = ["Weak", "Weak", "Good", "Strong"][passwordScore];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value,
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) { toast.error("Enter your full name"); return false; }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) { toast.error("Enter a valid email address"); return false; }
    if (formData.phone.length !== 10) { toast.error("Enter a valid 10 digit phone number"); return false; }
    if (passwordScore < 2) { toast.error("Choose a stronger password"); return false; }
    if (formData.password !== confirmPassword) { toast.error("Passwords do not match"); return false; }
    if (!acceptedTerms) { toast.error("Please accept the terms to continue"); return false; }
    return true;
  };

  const getCleanRegistrationData = () => ({
    ...formData,
    email: formData.email.trim().toLowerCase(),
    name: formData.name.trim(),
    phone: formData.phone.trim(),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      const cleanData = getCleanRegistrationData();
      await registerUser(cleanData);
      setPendingEmail(cleanData.email);
      setOtpStep(true);
      setOtp("");
      setSecondsLeft(OTP_VALID_SECONDS);
      toast.success("OTP sent to your email.");
      setTimeout(() => { otpInputsRef.current[0]?.focus(); }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // WORKING OTP LOGIC START
  // ==========================================

  const handleOtpDigitChange = (index, value) => {
    if (isNaN(value)) return;

    // Create an array of exactly 6 elements to manage the string properly
    const otpArray = Array.from({ length: 6 }, (_, i) => otp[i] || "");
    
    // Take only the last character so users can overwrite
    otpArray[index] = value.substring(value.length - 1);
    const newOtp = otpArray.join("");
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    // Jump back on backspace if current box is empty
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1].focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    // Get pasted data, grab first 6 chars, remove letters/symbols
    const pastedData = event.clipboardData.getData("text/plain").slice(0, 6).replace(/\D/g, "");
    setOtp(pastedData);
    
    // Focus the end of the pasted string
    const focusIndex = Math.min(pastedData.length, 5);
    if (otpInputsRef.current[focusIndex]) {
      otpInputsRef.current[focusIndex].focus();
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    
    // Remove spaces in case user skipped a box
    const cleanOtp = otp.replace(/\s/g, ''); 
    
    if (cleanOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setLoading(true);
      await verifyRegistrationOTP({ email: pendingEmail, otp: cleanOtp });
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      const cleanData = getCleanRegistrationData();
      await registerUser(cleanData); 
      setSecondsLeft(OTP_VALID_SECONDS);
      setOtp("");
      toast.success("New OTP sent to your email.");
      setTimeout(() => { otpInputsRef.current[0]?.focus(); }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  // ==========================================
  // WORKING OTP LOGIC END
  // ==========================================

  return (
    <main className="saas-split-layout">
      
      {/* LEFT PANEL: Abstract SaaS Imagery (Desktop Only) */}
      <section className="saas-visual-panel">
        <div className="saas-visual-content">
          <div className="saas-logo">
            <LayoutTemplate size={24} />
            <span>SahimonCart</span>
          </div>
          <div className="saas-hero-text">
            <h1>Build faster.<br />Scale smarter.</h1>
            <p>Join thousands of teams shipping better products with our enterprise-grade platform.</p>
          </div>
          <div className="saas-feature-list">
            <div className="saas-feature-item">
              <ShieldCheck size={20} className="feature-icon" />
              <span>SOC2 Type II Certified Security</span>
            </div>
            <div className="saas-feature-item">
              <Zap size={20} className="feature-icon" />
              <span>Lightning fast global edge network</span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL: Form */}
      <section className="saas-form-panel">
        
        {/* CRAZY MOBILE HEADER */}
        <div className="mobile-crazy-header">
          <div className="mobile-logo">
            <LayoutTemplate size={28} />
            <span>SahimonCart</span>
          </div>
          <p>The premium shopping experience</p>
        </div>

        <div className="saas-form-container">
          
          <div className="saas-form-header">
            <h2>{otpStep ? "Verify your email" : "Create your account"}</h2>
            <p>
              {otpStep
                ? `We sent a 6-digit code to ${pendingEmail}`
                : "Start your 14-day free trial. No credit card required."}
            </p>
          </div>

          {otpStep ? (
            <form onSubmit={handleVerifyOtp} className="saas-otp-form">
              <div className="saas-otp-input-group" onPaste={handleOtpPaste}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpInputsRef.current[index] = el; }}
                    type="text"
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onFocus={(e) => e.target.select()} // Highlights text automatically on click
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    className="saas-otp-box"
                    disabled={secondsLeft === 0}
                    required
                  />
                ))}
              </div>

              <div className={`saas-otp-timer ${secondsLeft === 0 ? "expired" : ""}`}>
                {secondsLeft > 0 ? (
                  <span>Code expires in <strong>{formattedTime}</strong></span>
                ) : (
                  <span>Code expired</span>
                )}
              </div>

              <button type="submit" className="saas-primary-btn" disabled={loading || secondsLeft === 0}>
                {loading ? <Loader2 className="saas-spinner" size={18} /> : "Verify Email"}
              </button>

              <div className="saas-otp-actions">
                <button type="button" onClick={handleResendOtp} disabled={loading || resendLoading}>
                  {resendLoading ? "Sending..." : "Resend code"}
                </button>
                <span className="saas-dot-divider">•</span>
                <button type="button" onClick={() => { setOtpStep(false); setOtp(""); setSecondsLeft(OTP_VALID_SECONDS); }}>
                  Change email
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="saas-register-form">
              <div className="saas-form-grid">
                
                {accountFields.map(({ name, label, type, icon: Icon, autoComplete, placeholder }) => (
                  <div className="saas-input-group" key={name}>
                    <label htmlFor={name}>{label}</label>
                    <div className="saas-input-wrapper">
                      <Icon size={18} className="saas-input-icon" />
                      <input
                        id={name}
                        name={name}
                        type={type}
                        value={formData[name]}
                        onChange={handleChange}
                        autoComplete={autoComplete}
                        placeholder={placeholder}
                        required
                      />
                    </div>
                  </div>
                ))}

                <div className="saas-input-group">
                  <label htmlFor="password">Password</label>
                  <div className="saas-input-wrapper">
                    <Lock size={18} className="saas-input-icon" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      required
                    />
                    <button type="button" className="saas-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="saas-input-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="saas-input-wrapper">
                    <Lock size={18} className="saas-input-icon" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                    <button type="button" className="saas-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Minimalist Password Strength Meter */}
              <div className="saas-strength-meter" data-score={passwordScore}>
                <div className="saas-strength-bars">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
                <div className="saas-strength-labels">
                  <span className="strength-text">{passwordStrength}</span>
                </div>
              </div>

              <div className="saas-password-requirements">
                {passwordChecks.map((check) => (
                  <span key={check.label} className={check.valid ? "met" : ""}>
                    <CheckCircle2 size={14} /> {check.label}
                  </span>
                ))}
              </div>

              <label className="saas-checkbox-container">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                <span className="saas-custom-checkbox"></span>
                <span className="saas-checkbox-label">
                  I agree to the <Link to="/terms-of-service">Terms of Service</Link> and <Link to="/privacy-policy">Privacy policy</Link>. 
                </span>
              </label>

              <button type="submit" className="saas-primary-btn" disabled={loading}>
                {loading ? (
                  <Loader2 className="saas-spinner" size={18} />
                ) : (
                  <>Create Account <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          <div className="saas-auth-footer">
            Already have an account? <Link to="/login">Sign in to workspace</Link>
          </div>

        </div>
      </section>
    </main>
  );
};

export default Register;