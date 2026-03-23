import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { logoutUser } from "../api/authApi";
import "../styles/navbar.css";

import {
  FaHome,
  FaShoppingCart,
  FaHeart,
  FaBox,
  FaUser,
  FaSignOutAlt,
  FaThLarge
} from "react-icons/fa";

import { MdAdminPanelSettings } from "react-icons/md";

const Navbar = () => {

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {

    const token = localStorage.getItem("token");

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

      {/* LOGO */}

      <NavLink to="/" className="logo" onClick={closeMenu}>
        <img src="/logo.png" alt="Logo" className="logo-img" />
        <span>SahimonCart</span>
      </NavLink>


      {/* HAMBURGER */}

      <button
        className={`hamburger ${isMenuOpen ? "active" : ""}`}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>


      {/* NAV LINKS */}

      <div className={`nav-links ${isMenuOpen ? "active" : ""}`}>

        <NavLink to="/" onClick={closeMenu}>
          <FaHome /> Home
        </NavLink>

        <NavLink to="/categories" onClick={closeMenu}>
          <FaThLarge /> Categories
        </NavLink>

        <NavLink to="/cart" onClick={closeMenu}>
          <FaShoppingCart /> Cart
        </NavLink>

        {user && (
          <NavLink to="/wishlist" onClick={closeMenu}>
            <FaHeart /> Wishlist
          </NavLink>
        )}

        <NavLink to="/orders" onClick={closeMenu}>
          <FaBox /> Orders
        </NavLink>


        {!user ? (

          <>
            <NavLink to="/login" onClick={closeMenu}>
              <FaUser /> Login
            </NavLink>

            <NavLink to="/register" onClick={closeMenu}>
              <FaUser /> Register
            </NavLink>
          </>

        ) : (

          <>

            {user.role === "admin" && (
              <NavLink to="/admin/dashboard" onClick={closeMenu}>
                <MdAdminPanelSettings /> Admin
              </NavLink>
            )}

            <NavLink to="/profile" onClick={closeMenu}>
              <FaUser />
              <span className="username">Hello, {user.name}</span>
            </NavLink>

            <button className="logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>

          </>

        )}

      </div>

    </nav>

  );

};

export default Navbar;