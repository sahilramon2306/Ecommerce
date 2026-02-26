import { NavLink, Outlet } from "react-router-dom";
import "../styles/admin-layout.css";

const AdminLayout = () => {
  return (
    <div className="admin-layout">

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <h2 className="admin-logo">Admin Panel</h2>

        <nav className="admin-nav">
          <NavLink to="dashboard" className="admin-link">
            Dashboard
          </NavLink>

          <NavLink to="products" className="admin-link">
            Products
          </NavLink>

          <NavLink to="categories" className="admin-link">
            Categories
          </NavLink>

          <NavLink to="orders" className="admin-link">
            OrdersAdmin
          </NavLink>

          <NavLink to="reviews" className="admin-link">
            Reviews
          </NavLink>

          <NavLink to="analytics" className="admin-link">
            Analytics
          </NavLink>
        </nav>
      </aside>

      {/* Content Area */}
      <main className="admin-content">
        <Outlet />
      </main>

    </div>
  );
};

export default AdminLayout;