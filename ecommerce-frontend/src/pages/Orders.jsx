import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { cancelOrder, getMyOrders, returnOrder } from "../api/orderApi";
import "../styles/orders.css";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const orderSteps = ["placed", "confirmed", "shipped", "out_for_delivery", "delivered"];

const statusLabels = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned"
};

const refundLabels = {
  requested: "Refund Requested",
  processing: "Refund Processing",
  processed: "Refunded",
  failed: "Refund Failed"
};

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString("en-IN")}`;
};

const formatDate = (value) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getImageUrl = (image) => {
  if (!image) return "";
  if (/^https?:\/\//i.test(image)) return image;
  return `${BACKEND_URL}${image.startsWith("/") ? image : `/${image}`}`;
};

const getProductFromItem = (item) => {
  if (item?.productId && typeof item.productId === "object") {
    return item.productId;
  }

  return {};
};

const getProductId = (item) => {
  if (item?.productId && typeof item.productId === "object") {
    return item.productId._id;
  }

  return item?.productId;
};

const getInitial = (name = "P") => {
  return String(name).trim().charAt(0).toUpperCase() || "P";
};

const ProductThumb = ({ product }) => {
  const [broken, setBroken] = useState(false);
  const name = product?.name || "Product";
  const image = getImageUrl(product?.images?.[0]);

  if (!image || broken) {
    return <div className="order-product-fallback">{getInitial(name)}</div>;
  }

  return (
    <img
      src={image}
      alt={name}
      className="order-product-image"
      onError={() => setBroken(true)}
    />
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getMyOrders();
      const payload = response.data?.orders || response.data?.data || response.data || [];

      setOrders(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to load your orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders]);

  const handleCancelOrder = async (orderId) => {
    const input = window.prompt("Reason for cancellation");
    if (input === null) return;

    const confirmed = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmed) return;

    try {
      setActionLoading(`cancel-${orderId}`);

      const response = await cancelOrder(orderId, input.trim());
      alert(response.data?.message || "Order cancelled successfully");

      await fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order");
    } finally {
      setActionLoading("");
    }
  };

  const handleReturnOrder = async (orderId) => {
    const input = window.prompt("Reason for return");
    if (input === null) return;

    const reason = input.trim();

    if (!reason) {
      alert("Please enter a return reason");
      return;
    }

    const confirmed = window.confirm("Are you sure you want to return this order?");
    if (!confirmed) return;

    try {
      setActionLoading(`return-${orderId}`);

      const response = await returnOrder(orderId, reason);
      alert(response.data?.message || "Return request submitted successfully");

      await fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to return order");
    } finally {
      setActionLoading("");
    }
  };

  const renderProgress = (status) => {
    const activeIndex = orderSteps.indexOf(status);

    if (activeIndex === -1) {
      return null;
    }

    return (
      <div className="order-progress">
        {orderSteps.map((step, index) => (
          <div
            key={step}
            className={`order-progress-step ${index <= activeIndex ? "active" : ""}`}
          >
            <span />
            <p>{statusLabels[step]}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <main className="orders-page">
        <section className="orders-shell">
          <div className="orders-header">
            <p>Orders</p>
            <h1>My Orders</h1>
            <span>Track purchases, cancellations, returns, and refunds.</span>
          </div>

          <div className="orders-loading">
            <span />
            <p>Loading your orders...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <section className="orders-shell">
        <div className="orders-header">
          <div>
            <p>Orders</p>
            <h1>My Orders</h1>
            <span>Track purchases, cancellations, returns, and refunds.</span>
          </div>

          <button type="button" className="orders-refresh-btn" onClick={fetchOrders}>
            Refresh
          </button>
        </div>

        {errorMessage && <div className="orders-alert error">{errorMessage}</div>}

        {!errorMessage && sortedOrders.length === 0 && (
          <div className="orders-empty">
            <h2>No orders yet</h2>
            <p>Your placed orders will appear here.</p>
            <Link to="/products">Start Shopping</Link>
          </div>
        )}

        <div className="orders-list">
          {sortedOrders.map((order) => {
            const orderId = order._id || order.id;
            const canCancel = ["placed", "confirmed"].includes(order.orderStatus);
            const canReturn = order.orderStatus === "delivered";
            const refundLabel = refundLabels[order.refundStatus];

            return (
              <article className="order-card" key={orderId}>
                <div className="order-card-top">
                  <div>
                    <span className="order-id">Order #{String(orderId).slice(-8).toUpperCase()}</span>
                    <h2>{formatPrice(order.totalAmount)}</h2>
                    <p>Placed on {formatDate(order.createdAt)}</p>
                  </div>

                  <div className="order-badges">
                    <span className={`status-badge status-${order.orderStatus}`}>
                      {statusLabels[order.orderStatus] || order.orderStatus}
                    </span>

                    {refundLabel && (
                      <span className={`refund-badge refund-${order.refundStatus}`}>
                        {refundLabel}
                      </span>
                    )}
                  </div>
                </div>

                {renderProgress(order.orderStatus)}

                <div className="order-meta-grid">
                  <div>
                    <span>Payment</span>
                    <strong>{order.paymentType || "N/A"}</strong>
                  </div>
                  <div>
                    <span>Payment Status</span>
                    <strong>{order.paymentStatus || "N/A"}</strong>
                  </div>
                  <div>
                    <span>Items</span>
                    <strong>{order.items?.length || 0}</strong>
                  </div>
                  <div>
                    <span>Refund Amount</span>
                    <strong>{formatPrice(order.refundAmount || 0)}</strong>
                  </div>
                </div>

                <div className="order-products">
                  {(order.items || []).map((item, index) => {
                    const product = getProductFromItem(item);
                    const productId = getProductId(item);
                    const name = product.name || "Product unavailable";

                    return (
                      <div className="order-product" key={`${productId || "item"}-${index}`}>
                        <ProductThumb product={product} />

                        <div className="order-product-info">
                          <h3>{name}</h3>
                          <p>
                            Qty {item.quantity} · {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {(order.cancelReason || order.returnReason) && (
                  <div className="order-reason">
                    <span>{order.cancelReason ? "Cancel Reason" : "Return Reason"}</span>
                    <p>{order.cancelReason || order.returnReason}</p>
                  </div>
                )}

                <div className="order-actions">
                  {order.invoiceUrl && (
                    <a
                      className="order-link-btn"
                      href={getImageUrl(order.invoiceUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Invoice
                    </a>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      className="order-action-btn cancel"
                      onClick={() => handleCancelOrder(orderId)}
                      disabled={Boolean(actionLoading)}
                    >
                      {actionLoading === `cancel-${orderId}` ? "Cancelling..." : "Cancel Order"}
                    </button>
                  )}

                  {canReturn && (
                    <button
                      type="button"
                      className="order-action-btn return"
                      onClick={() => handleReturnOrder(orderId)}
                      disabled={Boolean(actionLoading)}
                    >
                      {actionLoading === `return-${orderId}` ? "Submitting..." : "Return Order"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Orders;