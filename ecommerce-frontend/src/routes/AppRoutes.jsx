import { Routes, Route } from "react-router-dom";

/* ================= PUBLIC PAGES ================= */
import Home from "../pages/Home";
import Login from "../pages/Login";
import Register from "../pages/Register";
import SearchResults from "../pages/SearchResults";
import ProductDetail from "../pages/ProductDetail";
import OAuthSuccess from "../pages/OAuthSuccess";

/* ================= CATEGORIES ================= */
import PublicCategories from "../pages/PublicCategories";


/* ================= USER PAGES ================= */
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import Orders from "../pages/Orders";
import UserProfile from "../pages/UserProfile";
import Wishlist from "../pages/Wishlist";

/* ================= NEW STATIC PAGES ================= */
import AboutUs from "../pages/AboutUs";
import Careers from "../pages/Careers";
import OurStory from "../pages/OurStory";
import Blog from "../pages/Blog";
import ContactUs from "../pages/ContactUs";
import Accessibility from "../pages/Accessibility";
import TermsOfService from "../pages/TermsOfService";
import HelpCenter from "../pages/HelpCenter";
import ShippingInfo from "../pages/ShippingInfo";
import Returns from "../pages/Returns";
import TrackOrder from "../pages/TrackOrder";
import FAQ from "../pages/FAQ";

/* ================= PASSWORD RESET ================= */
import ForgotPassword from "../pages/ForgotPassword";
import VerifyOTP from "../pages/VerifyOTP";
import ResetPassword from "../pages/ResetPassword";
import ChangePassword from "../pages/ChangePassword";

/* ================= ADMIN ================= */
import AdminLayout from "../components/AdminLayout";
import Dashboard from "../pages/admin/Dashboard";
import Products from "../pages/admin/Products";
import OrdersAdmin from "../pages/admin/OrdersAdmin";
import Reviews from "../pages/admin/Reviews";
import Categories from "../pages/admin/Categories";
import AdminUsers from "../pages/admin/AdminUsers";

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

      {/* ================= NEW STATIC PAGES ================= */}
      <Route path="/about" element={<AboutUs />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/our-story" element={<OurStory />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/contact" element={<ContactUs />} />
      <Route path="/accessibility" element={<Accessibility />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/help-center" element={<HelpCenter />} />
      <Route path="/shipping-info" element={<ShippingInfo />} />
      <Route path="/returns" element={<Returns />} />
      <Route path="/track-order" element={<TrackOrder />} />
      <Route path="/faq" element={<FAQ />} />

      {/* ================= CATEGORY ROUTES ================= */}
      <Route path="/categories" element={<PublicCategories />} />
      <Route path="/categories/:categoryId" element={<PublicCategories />} />
      <Route path="/products/:childId" element={<SearchResults />} />
     

      {/* ================= AUTH ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/oauth-success" element={<OAuthSuccess />} />

      {/* ================= PASSWORD RESET ================= */}
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-otp" element={<VerifyOTP />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* ================= USER PROTECTED ================= */}
      <Route path="/wishlist" element={<Wishlist />} />

      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <Cart />
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <Orders />
          </ProtectedRoute>
        }
      />

      {/* ================= PROFILE ================= */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      >
        <Route path="change-password" element={<ChangePassword />} />
      </Route>

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* ================= 404 PAGE ================= */}
      <Route
        path="*"
        element={
          <div style={{ padding: "120px 20px", textAlign: "center" }}>
            <h1>404</h1>
            <h2>Page Not Found</h2>
            <p>The page you're looking for doesn't exist.</p>
          </div>
        }
      />

    </Routes>
  );
};

export default AppRoutes;