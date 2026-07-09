import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  Truck,
  X
} from "lucide-react";
import axiosInstance from "../../api/axiosInstance";
import "../../styles/admin-orders.css";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const orderStatusOptions = [
  "placed",
  "confirmed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned"
];

const paymentStatusOptions = [
  "pending",
  "authorized",
  "captured",
  "failed",
  "refunded"
];

const refundStatusOptions = [
  "all",
  "not_requested",
  "requested",
  "processing",
  "processed",
  "failed"
];

const orderStatusLabels = {
  placed: "Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned"
};

const paymentStatusLabels = {
  pending: "Pending",
  authorized: "Authorized",
  captured: "Captured",
  failed: "Failed",
  refunded: "Refunded"
};

const refundStatusLabels = {
  not_requested: "Not Requested",
  requested: "Refund Requested",
  processing: "Processing",
  processed: "Refunded",
  failed: "Failed"
};

const getOrderId = (order) => order?._id || order?.id;

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

const getAssetUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const getProduct = (item) => {
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

const getProductImage = (product) => {
  const image = product?.images?.[0];
  return getAssetUrl(image);
};

const getInitial = (name = "P") => {
  return String(name).trim().charAt(0).toUpperCase() || "P";
};

const normalizeOrders = (payload) => {
  const data =
    payload?.orders ||
    payload?.data?.orders ||
    payload?.data ||
    payload?.orderList ||
    payload;

  return Array.isArray(data) ? data : [];
};

const adminOrderApi = {
  getAllOrders: () => axiosInstance.get("/get-All-Orders-Admin"),

  updateOrderStatus: (orderId, orderStatus) => {
    return axiosInstance.put(`/update-Order-Status-Admin/${orderId}`, {
      orderStatus,
      status: orderStatus
    });
  },

  updatePaymentStatus: (orderId, paymentStatus) => {
    return axiosInstance.put(`/update-Payment-Status-Admin/${orderId}`, {
      paymentStatus,
      status: paymentStatus
    });
  },

  processRefund: (orderId) => {
    return axiosInstance.post(`/refund-Razorpay-Payment/${orderId}`);
  }
};

const ProductImage = ({ product }) => {
  const [broken, setBroken] = useState(false);
  const name = product?.name || "Product";
  const image = getProductImage(product);

  if (!image || broken) {
    return <div className="admin-order-product-fallback">{getInitial(name)}</div>;
  }

  return (
    <img
      src={image}
      alt={name}
      className="admin-order-product-image"
      onError={() => setBroken(true)}
    />
  );
};

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refundFilter, setRefundFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await adminOrderApi.getAllOrders();
      setOrders(normalizeOrders(response.data));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to load admin orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const stats = useMemo(() => {
    const total = orders.length;
    const refundRequested = orders.filter(
      (order) => order.refundStatus === "requested"
    ).length;
    const delivered = orders.filter((order) => order.orderStatus === "delivered").length;
    const cancelledReturned = orders.filter((order) =>
      ["cancelled", "returned"].includes(order.orderStatus)
    ).length;

    return {
      total,
      refundRequested,
      delivered,
      cancelledReturned
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return [...orders]
      .filter((order) => {
        const orderId = String(getOrderId(order) || "").toLowerCase();
        const customerName = String(order.address?.name || "").toLowerCase();
        const customerPhone = String(order.address?.phone || "").toLowerCase();
        const customerCity = String(order.address?.city || "").toLowerCase();

        const matchesSearch =
          !query ||
          orderId.includes(query) ||
          customerName.includes(query) ||
          customerPhone.includes(query) ||
          customerCity.includes(query);

        const matchesStatus =
          statusFilter === "all" || order.orderStatus === statusFilter;

        const matchesRefund =
          refundFilter === "all" ||
          (order.refundStatus || "not_requested") === refundFilter;

        return matchesSearch && matchesStatus && matchesRefund;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [orders, searchText, statusFilter, refundFilter]);

  const canProcessRefund = (order) => {
    return (
      order.paymentType === "ONLINE" &&
      order.paymentStatus === "captured" &&
      ["requested", "failed"].includes(order.refundStatus) &&
      ["cancelled", "returned"].includes(order.orderStatus)
    );
  };

  const handleOrderStatusChange = async (order, nextStatus) => {
    const orderId = getOrderId(order);

    if (!orderId || nextStatus === order.orderStatus) return;

    const confirmed = window.confirm(
      `Update order status to ${orderStatusLabels[nextStatus] || nextStatus}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`order-${orderId}`);
      const response = await adminOrderApi.updateOrderStatus(orderId, nextStatus);

      alert(response.data?.message || "Order status updated successfully");
      await fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update order status");
    } finally {
      setActionLoading("");
    }
  };

  const handlePaymentStatusChange = async (order, nextStatus) => {
    const orderId = getOrderId(order);

    if (!orderId || nextStatus === order.paymentStatus) return;

    const confirmed = window.confirm(
      `Update payment status to ${paymentStatusLabels[nextStatus] || nextStatus}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`payment-${orderId}`);
      const response = await adminOrderApi.updatePaymentStatus(orderId, nextStatus);

      alert(response.data?.message || "Payment status updated successfully");
      await fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update payment status");
    } finally {
      setActionLoading("");
    }
  };

  const handleProcessRefund = async (order) => {
    const orderId = getOrderId(order);

    if (!orderId) return;

    const amount = Number(order.refundAmount || order.totalAmount || 0);
    const confirmed = window.confirm(
      `Process refund of ${formatPrice(amount)} for this order?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`refund-${orderId}`);
      const response = await adminOrderApi.processRefund(orderId);

      alert(response.data?.message || "Refund processed successfully");
      await fetchOrders();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to process refund");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <main className="admin-orders-page">
        <section className="admin-orders-shell">
          <div className="admin-orders-loading">
            <Loader2 size={34} />
            <p>Loading orders...</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-orders-page">
      <section className="admin-orders-shell">
        <div className="admin-orders-header">
          <div>
            <p>Order Management</p>
            <h1>Orders</h1>
            <span>Manage order status, payment status, refunds, and customer details.</span>
          </div>

          <button type="button" className="admin-orders-refresh" onClick={fetchOrders}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="admin-orders-stats">
          <div className="admin-orders-stat">
            <Package size={20} />
            <span>Total Orders</span>
            <strong>{stats.total}</strong>
          </div>

          <div className="admin-orders-stat warning">
            <RotateCcw size={20} />
            <span>Refund Requests</span>
            <strong>{stats.refundRequested}</strong>
          </div>

          <div className="admin-orders-stat success">
            <CheckCircle2 size={20} />
            <span>Delivered</span>
            <strong>{stats.delivered}</strong>
          </div>

          <div className="admin-orders-stat danger">
            <AlertCircle size={20} />
            <span>Cancelled / Returned</span>
            <strong>{stats.cancelledReturned}</strong>
          </div>
        </div>

        <div className="admin-orders-toolbar">
          <label className="admin-orders-search">
            <Search size={18} />
            <input
              type="text"
              value={searchText}
              placeholder="Search by order ID, customer, phone, city"
              onChange={(event) => setSearchText(event.target.value)}
            />
          </label>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All Order Status</option>
            {orderStatusOptions.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabels[status]}
              </option>
            ))}
          </select>

          <select
            value={refundFilter}
            onChange={(event) => setRefundFilter(event.target.value)}
          >
            {refundStatusOptions.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All Refund Status" : refundStatusLabels[status]}
              </option>
            ))}
          </select>
        </div>

        {errorMessage && <div className="admin-orders-alert">{errorMessage}</div>}

        {!errorMessage && filteredOrders.length === 0 && (
          <div className="admin-orders-empty">
            <Package size={38} />
            <h2>No orders found</h2>
            <p>Try changing your filters or refresh the list.</p>
          </div>
        )}

        <div className="admin-orders-list">
          {filteredOrders.map((order) => {
            const orderId = getOrderId(order);
            const refundStatus = order.refundStatus || "not_requested";
            const refundLoading = actionLoading === `refund-${orderId}`;
            const orderUpdating = actionLoading === `order-${orderId}`;
            const paymentUpdating = actionLoading === `payment-${orderId}`;

            return (
              <article className="admin-order-card" key={orderId}>
                <div className="admin-order-main">
                  <div className="admin-order-id-block">
                    <span>Order ID</span>
                    <strong>#{String(orderId).slice(-10).toUpperCase()}</strong>
                    <p>{formatDate(order.createdAt)}</p>
                  </div>

                  <div className="admin-order-customer">
                    <span>Customer</span>
                    <strong>{order.address?.name || "N/A"}</strong>
                    <p>
                      {order.address?.phone || "No phone"} - {order.address?.city || "No city"}
                    </p>
                  </div>

                  <div className="admin-order-amount">
                    <span>Total</span>
                    <strong>{formatPrice(order.totalAmount)}</strong>
                    <p>{order.items?.length || 0} item(s)</p>
                  </div>

                  <div className="admin-order-actions-top">
                    <button
                      type="button"
                      className="admin-order-icon-btn"
                      onClick={() => setSelectedOrder(order)}
                      title="View order details"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>

                <div className="admin-order-controls">
                  <label>
                    <span>Order Status</span>
                    <select
                      value={order.orderStatus || "placed"}
                      disabled={Boolean(actionLoading)}
                      onChange={(event) =>
                        handleOrderStatusChange(order, event.target.value)
                      }
                    >
                      {orderStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {orderStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span>Payment Status</span>
                    <select
                      value={order.paymentStatus || "pending"}
                      disabled={Boolean(actionLoading)}
                      onChange={(event) =>
                        handlePaymentStatusChange(order, event.target.value)
                      }
                    >
                      {paymentStatusOptions.map((status) => (
                        <option key={status} value={status}>
                          {paymentStatusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="admin-order-status-stack">
                    <span
                      className={`admin-order-status-badge status-${order.orderStatus}`}
                    >
                      {orderStatusLabels[order.orderStatus] || order.orderStatus}
                    </span>

                    <span
                      className={`admin-payment-status-badge payment-${order.paymentStatus}`}
                    >
                      <CreditCard size={14} />
                      {paymentStatusLabels[order.paymentStatus] || order.paymentStatus}
                    </span>
                  </div>
                </div>

                <div className="admin-refund-box">
                  <span className={`admin-refund-badge refund-${refundStatus}`}>
                    {refundStatusLabels[refundStatus] || "Not Requested"}
                  </span>

                  <span className="admin-refund-amount">
                    Refund Amount: {formatPrice(order.refundAmount || 0)}
                  </span>

                  {order.refundFailureReason && (
                    <span className="admin-refund-error">
                      {order.refundFailureReason}
                    </span>
                  )}

                  {canProcessRefund(order) && (
                    <button
                      type="button"
                      className="admin-process-refund-btn"
                      onClick={() => handleProcessRefund(order)}
                      disabled={Boolean(actionLoading)}
                    >
                      {refundLoading ? (
                        <>
                          <Loader2 size={16} />
                          Processing
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} />
                          Process Refund
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(orderUpdating || paymentUpdating) && (
                  <div className="admin-order-saving">
                    <Loader2 size={16} />
                    Updating order...
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {selectedOrder && (
        <div
          className="admin-order-modal-backdrop"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedOrder(null)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSelectedOrder(null);
          }}
        >
          <section
            className="admin-order-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="admin-order-modal-header">
              <div>
                <p>Order Details</p>
                <h2>#{String(getOrderId(selectedOrder)).slice(-10).toUpperCase()}</h2>
              </div>

              <button
                type="button"
                className="admin-order-icon-btn"
                onClick={() => setSelectedOrder(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-order-detail-grid">
              <div>
                <span>Customer</span>
                <strong>{selectedOrder.address?.name || "N/A"}</strong>
              </div>
              <div>
                <span>Phone</span>
                <strong>{selectedOrder.address?.phone || "N/A"}</strong>
              </div>
              <div>
                <span>Payment Type</span>
                <strong>{selectedOrder.paymentType || "N/A"}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong>{formatPrice(selectedOrder.totalAmount)}</strong>
              </div>
            </div>

            <div className="admin-order-address">
              <span>Shipping Address</span>
              <p>
                {selectedOrder.address?.addressLine || "N/A"},{" "}
                {selectedOrder.address?.city || ""},{" "}
                {selectedOrder.address?.district || ""},{" "}
                {selectedOrder.address?.state || ""} -{" "}
                {selectedOrder.address?.pincode || ""}
              </p>
            </div>

            <div className="admin-order-products">
              {(selectedOrder.items || []).map((item, index) => {
                const product = getProduct(item);
                const productId = getProductId(item);
                const name = product.name || "Product unavailable";

                return (
                  <div
                    className="admin-order-product-row"
                    key={`${productId || "product"}-${index}`}
                  >
                    <ProductImage product={product} />

                    <div>
                      <h3>{name}</h3>
                      <p>
                        Qty {item.quantity} - {formatPrice(item.price)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {(selectedOrder.cancelReason || selectedOrder.returnReason) && (
              <div className="admin-order-address">
                <span>
                  {selectedOrder.cancelReason ? "Cancel Reason" : "Return Reason"}
                </span>
                <p>{selectedOrder.cancelReason || selectedOrder.returnReason}</p>
              </div>
            )}

            {selectedOrder.invoiceUrl && (
              <a
                href={getAssetUrl(selectedOrder.invoiceUrl)}
                target="_blank"
                rel="noreferrer"
                className="admin-order-invoice-link"
              >
                View Invoice
              </a>
            )}
          </section>
        </div>
      )}
    </main>
  );
};

export default OrdersAdmin;