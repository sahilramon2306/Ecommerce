import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  User,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { registerUser } from "../api/authApi";
import "../styles/register.css";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  password: "",
  addresses: [
    {
      postOffice: "",
      policeStation: "",
      pincode: "",
      state: "",
      district: "",
      city: "",
      addressLine: "",
    },
  ],
};

const accountFields = [
  { name: "name", label: "Full name", type: "text", icon: User, autoComplete: "name" },
  { name: "email", label: "Email address", type: "email", icon: Mail, autoComplete: "email" },
  { name: "phone", label: "Phone number", type: "tel", icon: Phone, autoComplete: "tel" },
];

const addressFields = [
  { name: "addressLine", label: "Address line", placeholder: "House no, building, street", span: "full" },
  { name: "city", label: "City", placeholder: "City" },
  { name: "district", label: "District", placeholder: "District" },
  { name: "state", label: "State", placeholder: "State" },
  { name: "pincode", label: "Pincode", placeholder: "6 digit pincode" },
  { name: "postOffice", label: "Post office", placeholder: "Post office" },
  { name: "policeStation", label: "Police station", placeholder: "Police station" },
];

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const address = formData.addresses[0];

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

  const handleAddressChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => {
      const updatedAddress = {
        ...current.addresses[0],
        [name]: name === "pincode" ? value.replace(/\D/g, "").slice(0, 6) : value,
      };

      return {
        ...current,
        addresses: [updatedAddress],
      };
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Enter your full name");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      toast.error("Enter a valid email address");
      return false;
    }

    if (formData.phone.length !== 10) {
      toast.error("Enter a valid 10 digit phone number");
      return false;
    }

    if (passwordScore < 2) {
      toast.error("Choose a stronger password");
      return false;
    }

    if (formData.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!address.addressLine.trim() || !address.city.trim() || !address.district.trim() || !address.state.trim()) {
      toast.error("Complete your shipping address");
      return false;
    }

    if (address.pincode.length !== 6) {
      toast.error("Enter a valid 6 digit pincode");
      return false;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the terms to continue");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      await registerUser({
        ...formData,
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        addresses: [
          {
            ...address,
            addressLine: address.addressLine.trim(),
            city: address.city.trim(),
            district: address.district.trim(),
            state: address.state.trim(),
            pincode: address.pincode.trim(),
            postOffice: address.postOffice.trim(),
            policeStation: address.policeStation.trim(),
          },
        ],
      });

      toast.success("Registration successful. Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-shell">
        <aside className="register-brand-panel" aria-label="SahimonCart account benefits">
          <div className="register-brand-content">
            <span>
              <ShoppingBag size={16} aria-hidden="true" />
              SahimonCart
            </span>
            <h1>Create your shopping account</h1>
            <p>Save addresses, track orders, and move through checkout faster.</p>

            <div className="register-benefits">
              <div>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Secure account setup</span>
              </div>
              <div>
                <MapPin size={18} aria-hidden="true" />
                <span>Checkout-ready address</span>
              </div>
              <div>
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>Order history access</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="register-form-section" aria-labelledby="register-title">
          <div className="register-card">
            <div className="register-heading">
              <span>
                <User size={16} aria-hidden="true" />
                New account
              </span>
              <h2 id="register-title">Register</h2>
              <p>Enter your details and primary shipping address.</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              <div className="register-form-grid">
                {accountFields.map(({ name, label, type, icon: Icon, autoComplete }) => (
                  <label className="register-field" key={name}>
                    <span>{label}</span>
                    <div className="register-input-wrap">
                      <Icon size={18} aria-hidden="true" />
                      <input
                        name={name}
                        type={type}
                        value={formData[name]}
                        onChange={handleChange}
                        autoComplete={autoComplete}
                        inputMode={name === "phone" ? "numeric" : "text"}
                        required
                      />
                    </div>
                  </label>
                ))}

                <label className="register-field">
                  <span>Password</span>
                  <div className="register-input-wrap">
                    <Lock size={18} aria-hidden="true" />
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="register-icon-btn"
                      onClick={() => setShowPassword((current) => !current)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>

                <label className="register-field">
                  <span>Confirm password</span>
                  <div className="register-input-wrap">
                    <Lock size={18} aria-hidden="true" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      className="register-icon-btn"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="password-meter" data-strength={passwordScore}>
                <div>
                  <span />
                  <span />
                  <span />
                </div>
                <strong>{passwordStrength}</strong>
              </div>

              <div className="password-checks">
                {passwordChecks.map((check) => (
                  <span className={check.valid ? "is-valid" : ""} key={check.label}>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {check.label}
                  </span>
                ))}
              </div>

              <section className="register-address-section" aria-labelledby="address-title">
                <div className="register-section-heading">
                  <span>
                    <MapPin size={16} aria-hidden="true" />
                    Shipping
                  </span>
                  <h3 id="address-title">Primary Address</h3>
                </div>

                <div className="register-form-grid">
                  {addressFields.map((field) => (
                    <label
                      className={`register-field ${field.span === "full" ? "register-field--full" : ""}`}
                      key={field.name}
                    >
                      <span>{field.label}</span>
                      <input
                        name={field.name}
                        value={address[field.name]}
                        placeholder={field.placeholder}
                        onChange={handleAddressChange}
                        inputMode={field.name === "pincode" ? "numeric" : "text"}
                        required={!["postOffice", "policeStation"].includes(field.name)}
                      />
                    </label>
                  ))}
                </div>
              </section>

              <label className="register-terms">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                />
                <span>I agree to create an account and use SahimonCart services.</span>
              </label>

              <button type="submit" className="register-submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={18} aria-hidden="true" />
                    Creating account
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={18} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="auth-switch">
              Already have an account?
              <Link to="/login">Login</Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};

export default Register;
