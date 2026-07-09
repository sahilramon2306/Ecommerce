import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  FolderTree,
  LayoutDashboard,
  Mail,
  MessageSquareText,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  UsersRound,
} from "lucide-react";

import "../styles/admin-layout.css";

const adminNavItems = [
  {
    label: "Dashboard",
    path: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Products",
    path: "products",
    icon: ShoppingBag,
  },
  {
    label: "Orders",
    path: "orders",
    icon: PackageCheck,
  },
  {
    label: "Categories",
    path: "categories",
    icon: FolderTree,
  },
  {
    label: "Reviews",
    path: "reviews",
    icon: MessageSquareText,
  },
  {
    label: "Users",
    path: "users",
    icon: UsersRound,
  },
  {
    label: "Contact Messages",
    path: "contact-messages",
    icon: Mail,
  },
];

const pageTitles = {
  dashboard: {
    title: "Dashboard",
    description:
      "Monitor store performance, operations, and growth signals.",
  },

  products: {
    title: "Products",
    description:
      "Manage inventory, pricing, variants, and catalog visibility.",
  },

  orders: {
    title: "Orders",
    description:
      "Track fulfillment, payments, refunds, and delivery progress.",
  },

  categories: {
    title: "Categories",
    description:
      "Organize collections and improve product discovery.",
  },

  reviews: {
    title: "Reviews",
    description:
      "Moderate customer feedback and product trust signals.",
  },

  users: {
    title: "Users",
    description:
      "Manage customers, access, and account activity.",
  },

  "contact-messages": {
    title: "Contact Messages",
    description:
      "Manage customer inquiries, support requests, and communication history.",
  },
};

const AdminLayout = () => {
  const location = useLocation();

  const activeSegment = location.pathname
    .split("/")
    .filter(Boolean)
    .at(-1);

  const pageMeta =
    pageTitles[activeSegment] ||
    pageTitles.dashboard;

  return (
    <div className="admin-layout">
      <aside
        className="admin-sidebar"
        aria-label="Admin navigation"
      >
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <Boxes
              size={22}
              aria-hidden="true"
            />
          </div>

          <div className="admin-brand-text">
            <h2>SahimonCart</h2>
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-label">
            Workspace
          </div>

          {adminNavItems.map(
            ({
              label,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "admin-link active"
                    : "admin-link"
                }
              >
                <Icon
                  size={19}
                  aria-hidden="true"
                />

                <span>{label}</span>

                <ChevronRight
                  className="admin-link-arrow"
                  size={16}
                  aria-hidden="true"
                />
              </NavLink>
            )
          )}
        </nav>

        <div className="admin-sidebar-card">
          <div className="admin-sidebar-card-icon">
            <Sparkles
              size={18}
              aria-hidden="true"
            />
          </div>

          <div>
            <strong>
              Store Health
            </strong>

            <span>
              All systems running
              smoothly
            </span>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-page-heading">
            <span className="admin-kicker">
              <BarChart3
                size={15}
                aria-hidden="true"
              />
              Admin Overview
            </span>

            <div>
              <h1>
                {pageMeta.title}
              </h1>

              <p>
                {
                  pageMeta.description
                }
              </p>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-status">
              <span className="admin-status-dot" />
              Live
            </div>

            <div className="admin-secure-badge">
              <ShieldCheck
                size={16}
                aria-hidden="true"
              />
              Secure Session
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;