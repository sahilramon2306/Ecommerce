import { Routes, Route } from "react-router-dom";

import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import ProductDetail from "../pages/ProductDetail";
import UserProfile from "../pages/UserProfile";
import SearchResults from "../pages/SearchResults";
import OAuthSuccess from "../pages/OAuthSuccess";

/* ================= PASSWORD RESET PAGES ================= */
import ForgotPassword from "../pages/ForgotPassword";
import VerifyOTP from "../pages/VerifyOTP";
import ResetPassword from "../pages/ResetPassword";
import ChangePassword from "../pages/ChangePassword";

/* ================= ADMIN IMPORTS ================= */
import AdminLayout from "../components/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Products from "../pages/admin/Products";
import OrdersAdmin from "../pages/admin/OrdersAdmin";

/* ================= PROTECTION ================= */
import ProtectedRoute from "./ProtectedRoute";
import ProtectedAdminRoute from "./ProtectedAdminRoute";

const AppRoutes = () => {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/search" element={<SearchResults />} />

      {/* ================= AUTH ROUTES ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />
      <Route path="/register" element={<Register />} />

      {/* ================= PASSWORD RESET ROUTES (PUBLIC) ================= */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ================= PROTECTED USER ROUTES ================= */}
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />

      {/* ================= PROFILE WITH NESTED CHANGE PASSWORD ================= */}
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>}>
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* ================= ADMIN ROUTES (NESTED) ================= */}
      <Route path="/admin" element={<ProtectedAdminRoute><AdminLayout /></ProtectedAdminRoute>}>
        {/* Default /admin */}
        <Route index element={<Dashboard />} />

        {/* /admin/dashboard */}
        <Route path="dashboard" element={<Dashboard />} />

        {/* /admin/products */}
        <Route path="products" element={<Products />} />
        
        {/* /admin/orders */}
        <Route path="orders" element={<OrdersAdmin />} />
      </Route>

    </Routes>
  );
};

export default AppRoutes;