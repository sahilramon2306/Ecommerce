import { useState } from "react";
import { registerUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
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
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressChange = (e) => {
    const updated = [...formData.addresses];
    updated[0][e.target.name] = e.target.value;
    setFormData({ ...formData, addresses: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await registerUser(formData);
      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      {/* Left Brand Panel */}
      <div className="register-brand">
        <div className="brand-content">
          <h1>SahimonCart</h1>
          <p>Experience luxury shopping like never before.</p>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="register-form-section">
        <div className="register-card">
          <h2>Create Your Account</h2>

          <form onSubmit={handleSubmit}>
            <div className="floating-group">
              <input name="name" required onChange={handleChange} />
              <label>Full Name</label>
            </div>

            <div className="floating-group">
              <input name="email" type="email" required onChange={handleChange} />
              <label>Email Address</label>
            </div>

            <div className="floating-group">
              <input name="phone" type="tel" required onChange={handleChange} />
              <label>Phone Number</label>
            </div>

            <div className="floating-group">
              <input name="password" type="password" required onChange={handleChange} />
              <label>Password</label>
            </div>

            <div className="address-section">
              <h4>Shipping Address</h4>

              <div className="floating-group">
                <input name="addressLine" required onChange={handleAddressChange} />
                <label>Address Line</label>
              </div>

              <div className="floating-group">
                <input name="city" required onChange={handleAddressChange} />
                <label>City</label>
              </div>

              <div className="floating-group">
                <input name="district" required onChange={handleAddressChange} />
                <label>District</label>
              </div>

              <div className="floating-group">
                <input name="state" required onChange={handleAddressChange} />
                <label>State</label>
              </div>

              <div className="floating-group">
                <input name="pincode" required onChange={handleAddressChange} />
                <label>Pincode</label>
              </div>

              <div className="floating-group">
                <input name="postOffice" required onChange={handleAddressChange} />
                <label>Post Office</label>
              </div>

              <div className="floating-group">
                <input name="policeStation" required onChange={handleAddressChange} />
                <label>Police Station</label>
              </div>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account?{" "}
            <span onClick={() => navigate("/login")}>Login here</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;