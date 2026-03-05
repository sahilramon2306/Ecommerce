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

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 🚀 Do not call API if user is not logged in
    if (!token) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get("/get-User-Profile");

        if (res.data?.data) {
          setUser(res.data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        // If token expired or invalid → clear it
        localStorage.removeItem("token");
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      navigate("/login");
      closeMenu();
    }
  };

  return (
    <nav className="navbar">
      <NavLink to="/" className="logo" onClick={closeMenu}>
        <img src="/logo.png" alt="Logo" className="logo-img" />
        <span>SahimonCart</span>
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
          
            {user.role === "admin" && (
              <NavLink to="/admin/dashboard" onClick={closeMenu}>
                ⚙️ Admin
              </NavLink>
            )}

            <NavLink to="/profile" onClick={closeMenu}>
              <span className="username">Hello, {user.name}</span>
            </NavLink>

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