import { useState } from "react";
import { registerUser } from "../api/authApi";
import { useNavigate } from "react-router-dom";
import "../styles/register.css";

const Register = () => {
  const navigate = useNavigate();
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
  const [loading, setLoading] = useState(false);

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
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Register</h2>

        <input name="name" placeholder="Name" onChange={handleChange} required />
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <input name="phone" placeholder="Phone" onChange={handleChange} required />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />

        <h4>Address</h4>
        <input name="postOffice" placeholder="Post Office" onChange={handleAddressChange} required />
        <input name="policeStation" placeholder="Police Station" onChange={handleAddressChange} required />
        <input name="pincode" placeholder="Pincode" onChange={handleAddressChange} required />
        <input name="state" placeholder="State" onChange={handleAddressChange} required />
        <input name="district" placeholder="District" onChange={handleAddressChange} required />
        <input name="city" placeholder="City" onChange={handleAddressChange} required />
        <input name="addressLine" placeholder="Address Line" onChange={handleAddressChange} required />

        <button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default Register;
