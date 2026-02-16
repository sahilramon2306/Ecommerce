import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { logoutUser } from "../api/authApi";
import "../styles/navbar.css";


const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  /* ===============================
     FETCH USER (CHECK AUTH)
  =============================== */
  useEffect(() => {
  console.log("Cookies:", document.cookie);

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("/get-User-Profile");
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch {
      setUser(null);
    }
  };

  fetchUser();
}, []);


  /* ===============================
     LOGOUT
  =============================== */
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.log("Logout error:", err);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="logo" onClick={closeMenu}>
        <img src="/logo.png" alt="E-Commerce Logo" className="logo-img" />
        <span>S. ECOMMERCE</span>
      </NavLink>

      <button
        className={`hamburger ${isMenuOpen ? "active" : ""}`}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>
        <NavLink to="/" onClick={closeMenu}>Home</NavLink>
        <NavLink to="/cart" onClick={closeMenu}>Cart</NavLink>
        <NavLink to="/orders" onClick={closeMenu}>Orders</NavLink>

        {!user ? (
          <>
            <NavLink to="/login" onClick={closeMenu}>Login</NavLink>
            <NavLink to="/register" onClick={closeMenu}>Register</NavLink>
          </>
        ) : (
          <>
            {/* 👤 USER NAME */}
            <span className="username">
              Hello, {user.name}
            </span>

            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
