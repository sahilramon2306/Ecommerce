import { useEffect, useState } from "react";
import { getMyOrders } from "../api/orderApi";
import { useNavigate } from "react-router-dom";
import "../styles/orders.css";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getMyOrders()
      .then((res) => {
        setOrders(res.data?.data || []);
      })
      .catch(() => {
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="orders-wrapper">
        <div className="loading-spinner">Loading your orders...</div>
      </div>
    );
  }

  /* ================= EMPTY STATE ================= */
  if (!orders.length) {
    return (
      <div className="orders-wrapper empty-orders">
        <div className="empty-orders-content">
          <div className="empty-icon-wrapper">
            <svg
              className="empty-orders-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>

          <h2>No Orders Yet</h2>

          <p className="empty-orders-message">
            You haven't placed any orders yet.  
            Start exploring our premium collection today.
          </p>

          <button
            className="start-shopping-btn"
            onClick={() => navigate("/")}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  /* ================= ORDERS LIST ================= */
  return (
    <div className="orders-wrapper">
      <h2>My Orders</h2>

      {orders.map((order) => (
        <div key={order._id} className="order-card">

          <div className="order-header">
            <div className="order-id">
              Order #{order._id.slice(-8)}
            </div>
            <div className="order-date">
              {new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <div className="order-items">
            {order.items.map((item, index) => {
              const product = item.productId || {};
              const price =
                product.salePrice ||
                product.price ||
                item.price ||
                0;

              return (
                <div key={index} className="order-item">
                  <img
                    src={
                      product.images?.[0] ||
                      "https://via.placeholder.com/100"
                    }
                    alt={product.name || "Product"}
                  />

                  <div className="order-item-info">
                    <div className="item-name">
                      {product.name || "Product"}
                    </div>
                    <div className="item-meta">
                      <span>Qty: {item.quantity}</span>
                      <span>
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="item-subtotal">
                    ₹{(price * item.quantity).toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="order-footer">
            <div className="order-total">
              ₹{order.totalAmount?.toLocaleString("en-IN")}
            </div>

            <div className="order-status">
              <span
                className={`status-badge status-${(order.orderStatus || "placed").toLowerCase()}`}
              >
                {order.orderStatus || "Placed"}
              </span>

              <span className="payment-info">
                {order.paymentStatus || "Pending"} • {order.paymentType || "—"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Orders;