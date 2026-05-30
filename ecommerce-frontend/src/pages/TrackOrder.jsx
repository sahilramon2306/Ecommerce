import { useState } from "react";
import { publicTrackOrderStatus } from "../api/orderApi";
import "../styles/track.css";

const steps = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const statusText = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentIndex = () => {
    const index = steps.findIndex((step) => step.key === order?.orderStatus);
    return index >= 0 ? index : 0;
  };

  const getProgress = () => {
    if (!order) return 0;

    if (["cancelled", "returned"].includes(order.orderStatus)) {
      return 100;
    }

    return ((getCurrentIndex() + 1) / steps.length) * 100;
  };

  const trackOrder = async (e) => {
    e.preventDefault();

    if (!orderId.trim()) {
      setError("Please enter your order ID.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setOrder(null);

      const res = await publicTrackOrderStatus(orderId.trim());

      setOrder(res.data?.data || null);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Order not found. Please check your order ID."
      );
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = getCurrentIndex();

  return (
    <div className="track-page">
      <section className="track-hero">
        <span>Order Tracking</span>
        <h1>Track Your Order</h1>
        <p>Enter your order ID to see the latest delivery and payment status.</p>
      </section>

      <main className="track-container">
        <form className="track-card" onSubmit={trackOrder}>
          <div className="track-input-wrap">
            <label>Order ID</label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => {
                setOrderId(e.target.value);
                setError("");
              }}
              placeholder="Example: 69f07e6ed47693e9be107ed1"
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Tracking..." : "Track Order"}
          </button>

          {error && <p className="track-error">{error}</p>}
        </form>

        {order && (
          <section className="track-result">
            <div className="track-result-head">
              <div>
                <p>Order ID</p>
                <h2>#{order.orderId}</h2>
              </div>

              <span className={`track-status ${order.orderStatus}`}>
                {statusText[order.orderStatus] || order.orderStatus}
              </span>
            </div>

            <div className="track-summary">
              <div>
                <span>Payment Status</span>
                <strong>{order.paymentStatus}</strong>
              </div>

              <div>
                <span>Ordered On</span>
                <strong>{formatDate(order.orderedOn)}</strong>
              </div>

              <div>
                <span>Last Updated</span>
                <strong>{formatDate(order.lastUpdatedOn)}</strong>
              </div>
            </div>

            <div className="track-progress">
              <div style={{ width: `${getProgress()}%` }}></div>
            </div>

            {["cancelled", "returned"].includes(order.orderStatus) ? (
              <div className="track-special">
                <h3>{statusText[order.orderStatus]}</h3>
                <p>
                  This order is currently marked as{" "}
                  {statusText[order.orderStatus].toLowerCase()}.
                </p>
              </div>
            ) : (
              <div className="track-timeline">
                {steps.map((step, index) => {
                  const completed = index < currentIndex;
                  const active = index === currentIndex;

                  return (
                    <div
                      key={step.key}
                      className={`track-step ${
                        completed ? "completed" : active ? "active" : "pending"
                      }`}
                    >
                      <div className="track-dot">
                        {completed ? "✓" : active ? "" : ""}
                      </div>

                      <div>
                        <h4>{step.label}</h4>
                        <p>
                          {completed
                            ? "Completed"
                            : active
                            ? "Current status"
                            : "Pending"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="track-help">
          <h3>Where can I find my Order ID?</h3>
          <p>
            You can find it in your order confirmation, invoice, or orders page.
            It is usually a 24-character ID.
          </p>
        </div>
      </main>
    </div>
  );
};

export default TrackOrder;
