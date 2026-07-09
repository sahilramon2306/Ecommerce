import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import "../styles/forgot-password.css";

const OTP_VALID_SECONDS = 10 * 60;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(OTP_VALID_SECONDS);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");

  const otpInputsRef = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!otpStep) return;

    const timer = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpStep, secondsLeft === OTP_VALID_SECONDS]);

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  const sendOtp = async (targetEmail, isResend = false) => {
    const cleanEmail = targetEmail.trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Enter a valid email address");
      return;
    }

    isResend ? setResendLoading(true) : setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post(
        "/forgot-Password",
        { email: cleanEmail },
        { skipAuth: true }
      );

      if (res.data.success) {
        setPendingEmail(cleanEmail);
        setOtpStep(true);
        setOtp("");
        setSecondsLeft(OTP_VALID_SECONDS);
        localStorage.setItem("resetEmail", cleanEmail);

        setTimeout(() => {
          otpInputsRef.current[0]?.focus();
        }, 100);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      isResend ? setResendLoading(false) : setLoading(false);
    }
  };

  const handleSendOtp = async (event) => {
    event.preventDefault();
    await sendOtp(email);
  };

  const handleResendOtp = async () => {
    await sendOtp(pendingEmail, true);
  };

  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(0, 1);
    const otpArray = Array.from({ length: 6 }, (_, digitIndex) => otp[digitIndex] || "");

    otpArray[index] = digit;
    setOtp(otpArray.join(""));

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();

    const pastedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    setOtp(pastedOtp);

    const nextIndex = Math.min(pastedOtp.length, 5);
    otpInputsRef.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();

    if (secondsLeft === 0) {
      setError("OTP expired. Please resend OTP.");
      return;
    }

    if (otp.trim().length !== 6) {
      setError("Enter valid 6 digit OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post(
        "/verify-Reset-OTP",
        {
          email: pendingEmail,
          otp: otp.trim(),
        },
        { skipAuth: true }
      );

      if (res.data.success) {
        navigate("/reset-password", {
          state: {
            email: pendingEmail,
            otp: otp.trim(),
          },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper forgot-password-wrapper">
      <div className="login-image">
        <div className="overlay">
          <h2>{otpStep ? "Verify OTP" : "Reset Your Password"}</h2>
          <p>
            {otpStep
              ? "Enter the verification code sent to your email."
              : "Enter your email to receive OTP."}
          </p>
        </div>
      </div>

      <div className="login-form-section">
        {otpStep ? (
          <form className="login-card forgot-otp-card" onSubmit={handleVerifyOtp}>
            <div className="forgot-otp-badge">
              <div className="forgot-otp-ring">
                <span>OTP</span>
              </div>
            </div>

            <h2>Verify OTP</h2>

            <p className="forgot-otp-copy">
              Enter the 6-digit code sent to <strong>{pendingEmail}</strong>
            </p>

            <div className={`forgot-otp-timer ${secondsLeft === 0 ? "expired" : ""}`}>
              {secondsLeft > 0 ? (
                <>OTP expires in <strong>{formattedTime}</strong></>
              ) : (
                <strong>OTP expired</strong>
              )}
            </div>

            {error && <div className="error-box">{error}</div>}

            <div className="forgot-otp-inputs" onPaste={handleOtpPaste}>
              {Array.from({ length: 6 }).map((_, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    otpInputsRef.current[index] = element;
                  }}
                  type="text"
                  value={otp[index] || ""}
                  onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  aria-label={`OTP digit ${index + 1}`}
                  disabled={secondsLeft === 0}
                  required
                />
              ))}
            </div>

            <button type="submit" disabled={loading || secondsLeft === 0}>
              {loading ? "Verifying OTP..." : "Verify OTP"}
            </button>

            <button
              type="button"
              className="forgot-otp-link"
              onClick={handleResendOtp}
              disabled={loading || resendLoading}
            >
              {resendLoading ? "Resending OTP..." : "Resend OTP"}
            </button>

            <button
              type="button"
              className="forgot-otp-link"
              onClick={() => {
                setOtpStep(false);
                setOtp("");
                setError("");
                setSecondsLeft(OTP_VALID_SECONDS);
              }}
              disabled={loading || resendLoading}
            >
              Change email address
            </button>
          </form>
        ) : (
          <form className="login-card" onSubmit={handleSendOtp}>
            <h2>Forgot Password</h2>

            {error && <div className="error-box">{error}</div>}

            <div className="floating-group">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder=" "
                required
              />
              <label>Email</label>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;