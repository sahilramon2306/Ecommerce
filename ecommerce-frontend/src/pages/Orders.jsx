import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Loader2,
  PackageCheck,
  PackageSearch,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import { getMyOrders } from "../api/orderApi";
import "../styles/orders.css";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "placed", label: "Placed" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatPrice = (value) => {
  const number = Number(value);
  return priceFormatter.format(Number.isFinite(number) ? number : 0);
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const getProductId = (product) => {
  if (!product) return "";
  if (typeof product === "object") return product._id || "";
  return product;
};

const getItemProduct = (item) =>
  typeof item?.productId === "object" && item.productId ? item.productId : {};

const getItemPrice = (item) => {
  const product = getItemProduct(item);
  const value = Number(product.salePrice || product.price || item?.price || 0);
  return Number.isFinite(value) ? value : 0;
};

const getOrderTotal = (order) => {
  const apiTotal = Number(order?.totalAmount);
  if (Number.isFinite(apiTotal)) return apiTotal;

  return normalizeArray(order?.items).reduce((sum, item) => {
    return sum + getItemPrice(item) * (Number(item.quantity) || 0);
  }, 0);
};

const formatDate = (dateValue) => {
  if (!dateValue) return "Date unavailable";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (value, fallback = "Placed") => {
  const text = value || fallback;

  return String(text)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStatusKey = (value) =>
  String(value || "placed")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const getInitials = (value = "") => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "SC";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const Orders = () => {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let isCurrent = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const res = await getMyOrders();

        if (!isCurrent) return;
        setOrders(normalizeArray(res.data?.data));
      } catch (error) {
        console.error("Orders load error:", error);

        if (isCurrent) {
          setOrders([]);
          setErrorMessage("We could not load your orders right now.");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadOrders();

    return () => {
      isCurrent = false;
    };
  }, []);

  const stats = useMemo(() => {
    const delivered = orders.filter(
      (order) => getStatusKey(order.orderStatus) === "delivered"
    ).length;

    const active = orders.filter((order) =>
      ["placed", "processing", "shipped"].includes(getStatusKey(order.orderStatus))
    ).length;

    const totalSpend = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);

    return {
      totalOrders: orders.length,
      active,
      delivered,
      totalSpend,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const statusKey = getStatusKey(order.orderStatus);

      if (statusFilter !== "all" && statusKey !== statusFilter) {
        return false;
      }

      if (!query) return true;

      const orderId = String(order._id || "").toLowerCase();
      const paymentType = String(order.paymentType || "").toLowerCase();
      const paymentStatus = String(order.paymentStatus || "").toLowerCase();

      const itemMatch = normalizeArray(order.items).some((item) => {
        const product = getItemProduct(item);
        return String(product.name || "Product").toLowerCase().includes(query);
      });

      return (
        orderId.includes(query) ||
        paymentType.includes(query) ||
        paymentStatus.includes(query) ||
        statusKey.includes(query) ||
        itemMatch
      );
    });
  }, [orders, searchTerm, statusFilter]);

  if (loading) {
    return (
      <main className="orders-page">
        <div className="orders-shell">
          <div className="orders-state-card" aria-live="polite" aria-busy="true">
            <Loader2 className="orders-spinner" size={30} aria-hidden="true" />
            <h2>Loading orders</h2>
            <p>Fetching your purchase history.</p>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="orders-page">
        <div className="orders-shell">
          <div className="orders-state-card">
            <PackageSearch size={38} aria-hidden="true" />
            <h2>Orders unavailable</h2>
            <p>{errorMessage}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!orders.length) {
    return (
      <main className="orders-page">
        <div className="orders-shell">
          <div className="orders-state-card">
            <ShoppingBag size={38} aria-hidden="true" />
            <h2>No orders yet</h2>
            <p>Start shopping and your orders will appear here with status updates.</p>
            <button type="button" onClick={() => navigate("/")}>
              Start shopping
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <div className="orders-shell">
        <Link to="/" className="orders-back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          Continue shopping
        </Link>

        <header className="orders-header">
          <span>
            <PackageCheck size={16} aria-hidden="true" />
            Account orders
          </span>
          <h1>My Orders</h1>
          <p>Track recent purchases, payment status, and order progress in one place.</p>
        </header>

        <section className="orders-stats" aria-label="Order summary">
          <div>
            <span>Total orders</span>
            <strong>{stats.totalOrders}</strong>
          </div>
          <div>
            <span>Active</span>
            <strong>{stats.active}</strong>
          </div>
          <div>
            <span>Delivered</span>
            <strong>{stats.delivered}</strong>
          </div>
          <div>
            <span>Total spend</span>
            <strong>{formatPrice(stats.totalSpend)}</strong>
          </div>
        </section>

        <section className="orders-toolbar" aria-label="Order filters">
          <div className="orders-search">
            <Search size={20} aria-hidden="true" />
            <label className="orders-sr-only" htmlFor="order-search">
              Search orders
            </label>
            <input
              id="order-search"
              type="search"
              placeholder="Search by product, order ID, payment, or status..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="orders-segmented" aria-label="Filter by status">
            {STATUS_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={statusFilter === option.value ? "is-active" : ""}
                onClick={() => setStatusFilter(option.value)}
                aria-pressed={statusFilter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        {filteredOrders.length > 0 ? (
          <section className="orders-list" aria-label="Orders list">
            {filteredOrders.map((order) => {
              const items = normalizeArray(order.items);
              const statusKey = getStatusKey(order.orderStatus);
              const total = getOrderTotal(order);

              return (
                <article className="order-card" key={order._id}>
                  <div className="order-card__header">
                    <div>
                      <span className="order-kicker">Order</span>
                      <h2>#{String(order._id || "").toUpperCase()}</h2>
                    </div>

                    <div className="order-meta">
                      <span>
                        <CalendarDays size={16} aria-hidden="true" />
                        {formatDate(order.createdAt)}
                      </span>
                      <span className={`status-badge status-${statusKey}`}>
                        {formatStatus(order.orderStatus)}
                      </span>
                    </div>
                  </div>

                  <div className="order-card__body">
                    {items.map((item, index) => {
                      const product = getItemProduct(item);
                      const productId = getProductId(item.productId);
                      const name = product.name || "Product";
                      const image = product.images?.[0] || "";
                      const quantity = Number(item.quantity) || 1;
                      const price = getItemPrice(item);
                      const itemTotal = price * quantity;

                      const media = image ? (
                        <img src={image} alt={name} loading="lazy" />
                      ) : (
                        <div className="order-image-fallback" role="img" aria-label={name}>
                          {getInitials(name)}
                        </div>
                      );

                      return (
                        <div className="order-item" key={`${productId || name}-${index}`}>
                          {productId ? (
                            <Link to={`/product/${productId}`} className="order-item__media">
                              {media}
                            </Link>
                          ) : (
                            <div className="order-item__media">{media}</div>
                          )}

                          <div className="order-item__info">
                            {productId ? (
                              <Link to={`/product/${productId}`}>{name}</Link>
                            ) : (
                              <strong>{name}</strong>
                            )}
                            <span>
                              Qty {quantity} • {formatPrice(price)} each
                            </span>
                          </div>

                          <div className="order-item__total">
                            <span>Subtotal</span>
                            <strong>{formatPrice(itemTotal)}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="order-card__footer">
                    <div className="order-payment">
                      <span>
                        <CreditCard size={16} aria-hidden="true" />
                        {formatStatus(order.paymentStatus, "Pending")}
                      </span>
                      <span>{order.paymentType || "Payment method unavailable"}</span>
                    </div>

                    <div className="order-total">
                      <span>Total paid</span>
                      <strong>{formatPrice(total)}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="orders-state-card">
            <PackageSearch size={38} aria-hidden="true" />
            <h2>No matching orders</h2>
            <p>Try changing the search keyword or status filter.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>
        )}

        <section className="orders-help-strip" aria-label="Order help">
          <div>
            <Truck size={18} aria-hidden="true" />
            <span>Track shipment updates from your order status.</span>
          </div>
          <div>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Payment confirmation appears after successful verification.</span>
          </div>
          <Link to="/help-center">
            Need help?
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  );
};

export default Orders;
