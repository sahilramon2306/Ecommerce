import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  FileText,
  Loader2,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";
import {
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  updatePaymentStatusAdmin,
  getOrderInvoiceAdmin,
  refundRazorpayPayment,
} from "../../api/adminApi";
import "../../styles/admin-orders.css";

const PAGE_LIMIT = 10;

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "All order status" },
  { value: "placed", label: "Placed" },
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "returned", label: "Returned" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payment status" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "captured", label: "Captured" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_TYPE_OPTIONS = [
  { value: "", label: "All payment type" },
  { value: "COD", label: "COD" },
  { value: "ONLINE", label: "Online" },
];

const NEXT_ORDER_STATUSES = ["confirmed", "shipped", "delivered", "cancelled", "returned"];
const NEXT_PAYMENT_STATUSES = ["paid", "captured", "failed", "refunded"];

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value, withTime = false) => {
  if (!value) return "Unavailable";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
};

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const getStatusKey = (value, fallback = "pending") =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const formatLabel = (value, fallback = "Pending") =>
  String(value || fallback)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getCustomerName = (order) => order?.userId?.name || order?.user?.name || "Guest";

const getCustomerEmail = (order) => order?.userId?.email || order?.user?.email || "N/A";

const getOrderTotal = (order) => {
  const total = Number(order?.totalAmount || order?.grandTotal);
  if (Number.isFinite(total)) return total;

  return normalizeArray(order?.items).reduce((sum, item) => {
    return sum + Number(item.price || 0) * Number(item.quantity || 0);
  }, 0);
};

const getShippingAddress = (order) => {
  const address = order?.shippingAddress || order?.address || {};

  return [
    address.name,
    address.phone,
    address.addressLine || address.street,
    address.city,
    address.district,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [searchOrderId, setSearchOrderId] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "",
    id: "",
    status: "",
  });

  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchOrderId.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchOrderId]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    window.setTimeout(() => {
      setToast({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const loadOrders = useCallback(
    async (page = currentPage, { quiet = false } = {}) => {
      try {
        if (quiet) setTableLoading(true);
        else setLoading(true);

        setErrorMessage("");

        const res = await getAllOrdersAdmin({
          page,
          limit: PAGE_LIMIT,
          orderId: debouncedSearch,
          orderStatus: orderStatusFilter,
          paymentStatus: paymentStatusFilter,
          paymentType: paymentTypeFilter,
        });

        const pagination = res.data?.pagination || res.data?.meta || {};

        setOrders(normalizeArray(res.data?.data));
        setTotalPages(pagination.totalPages || 1);
        setTotalOrders(pagination.totalOrders || pagination.total || 0);
        setCurrentPage(pagination.currentPage || page);
      } catch (err) {
        console.error("Load orders error:", err);
        setOrders([]);
        setErrorMessage("Failed to load orders.");
      } finally {
        setLoading(false);
        setTableLoading(false);
      }
    },
    [currentPage, debouncedSearch, orderStatusFilter, paymentStatusFilter, paymentTypeFilter]
  );

  useEffect(() => {
    loadOrders(currentPage, { quiet: !loading });
  }, [currentPage, debouncedSearch, orderStatusFilter, paymentStatusFilter, paymentTypeFilter]);

  const stats = useMemo(() => {
    const pending = orders.filter(
      (order) => getStatusKey(order.orderStatus, "placed") === "placed"
    ).length;

    const shipped = orders.filter(
      (order) => getStatusKey(order.orderStatus) === "shipped"
    ).length;

    const paid = orders.filter((order) =>
      ["paid", "captured"].includes(getStatusKey(order.paymentStatus))
    ).length;

    const revenue = orders.reduce((sum, order) => sum + getOrderTotal(order), 0);

    return {
      visible: orders.length,
      pending,
      shipped,
      paid,
      revenue,
    };
  }, [orders]);

  const resetFilters = () => {
    setSearchOrderId("");
    setDebouncedSearch("");
    setOrderStatusFilter("");
    setPaymentStatusFilter("");
    setPaymentTypeFilter("");
    setCurrentPage(1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setDebouncedSearch(searchOrderId.trim());
    setCurrentPage(1);
  };

  const updateFilter = (setter) => (event) => {
    setter(event.target.value);
    setCurrentPage(1);
  };

  const promptStatusChange = (type, id, status) => {
    if (!status) return;

    setConfirmDialog({
      isOpen: true,
      type,
      id,
      status,
    });
  };

  const cancelStatusChange = () => {
    setConfirmDialog({ isOpen: false, type: "", id: "", status: "" });
  };

  const executeStatusChange = async () => {
    const { type, id, status } = confirmDialog;

    try {
      setActionLoading("status");

      if (type === "order") {
        await updateOrderStatusAdmin(id, { orderStatus: status });
      } else {
        await updatePaymentStatusAdmin(id, { paymentStatus: status });
      }

      showToast(`${formatLabel(type)} status updated to ${formatLabel(status)}`);
      cancelStatusChange();
      loadOrders(currentPage, { quiet: true });
    } catch (err) {
      console.error("Status update error:", err);
      showToast(`Failed to update ${type} status`, "error");
    } finally {
      setActionLoading("");
    }
  };

  const viewOrder = async (id) => {
    try {
      setActionLoading(`view-${id}`);

      const res = await getOrderByIdAdmin(id);

      setSelectedOrder(res.data?.data || null);
      setShowModal(true);
    } catch (err) {
      console.error("View order error:", err);
      showToast("Failed to load order details", "error");
    } finally {
      setActionLoading("");
    }
  };

  const downloadInvoice = async (id) => {
    try {
      setActionLoading(`invoice-${id}`);

      const res = await getOrderInvoiceAdmin(id);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `invoice_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast("Invoice downloaded");
    } catch (err) {
      console.error("Invoice error:", err);
      showToast("Failed to download invoice", "error");
    } finally {
      setActionLoading("");
    }
  };

  const refundOrder = async (id) => {
    const confirmed = window.confirm("Refund this Razorpay payment?");
    if (!confirmed) return;

    try {
      setActionLoading(`refund-${id}`);

      await refundRazorpayPayment(id);
      showToast("Refund initiated");
      loadOrders(currentPage, { quiet: true });
    } catch (err) {
      console.error("Refund error:", err);
      showToast(err.response?.data?.message || "Refund failed", "error");
    } finally {
      setActionLoading("");
    }
  };

  if (loading && orders.length === 0) {
    return (
      <main className="admin-orders">
        <StateCard
          icon={Loader2}
          title="Loading orders"
          message="Fetching order, payment, and customer details."
          loading
        />
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="admin-orders">
        <StateCard
          icon={PackageSearch}
          title="Orders unavailable"
          message={errorMessage}
          actionLabel="Try again"
          onAction={() => loadOrders(currentPage)}
        />
      </main>
    );
  }

  return (
    <main className="admin-orders">
      <header className="admin-orders-header">
        <div>
          <span className="admin-orders-kicker">
            <PackageCheck size={16} aria-hidden="true" />
            Order operations
          </span>
          <h1>Orders Management</h1>
          <p>Track order progress, payment state, invoices, and customer fulfillment details.</p>
        </div>

        <button
          type="button"
          className="admin-orders-secondary-btn"
          onClick={() => loadOrders(currentPage, { quiet: true })}
          disabled={tableLoading}
        >
          {tableLoading ? (
            <Loader2 size={16} aria-hidden="true" />
          ) : (
            <RefreshCw size={16} aria-hidden="true" />
          )}
          Refresh
        </button>
      </header>

      {toast.show && (
        <div className={`premium-toast toast-${toast.type}`} role="status">
          {toast.type === "success" ? "Success" : "Alert"}: {toast.message}
        </div>
      )}

      <section className="orders-admin-stats" aria-label="Order summary">
        <div>
          <span>Visible orders</span>
          <strong>{stats.visible}</strong>
        </div>
        <div>
          <span>Total orders</span>
          <strong>{totalOrders || stats.visible}</strong>
        </div>
        <div>
          <span>Placed</span>
          <strong>{stats.pending}</strong>
        </div>
        <div>
          <span>Shipped</span>
          <strong>{stats.shipped}</strong>
        </div>
        <div>
          <span>Paid</span>
          <strong>{stats.paid}</strong>
        </div>
        <div>
          <span>Visible revenue</span>
          <strong>{formatPrice(stats.revenue)}</strong>
        </div>
      </section>

      <section className="orders-filters-container" aria-label="Order filters">
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search exact order ID..."
            value={searchOrderId}
            onChange={(event) => setSearchOrderId(event.target.value)}
          />
          {searchOrderId && (
            <button
              type="button"
              className="search-clear"
              onClick={() => setSearchOrderId("")}
              aria-label="Clear search"
            >
              <X size={17} aria-hidden="true" />
            </button>
          )}
          <button type="submit">Search</button>
        </form>

        <div className="orders-filters">
          <select value={orderStatusFilter} onChange={updateFilter(setOrderStatusFilter)}>
            {ORDER_STATUS_OPTIONS.map((option) => (
              <option value={option.value} key={option.value || option.label}>
                {option.label}
              </option>
            ))}
          </select>

          <select value={paymentStatusFilter} onChange={updateFilter(setPaymentStatusFilter)}>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option value={option.value} key={option.value || option.label}>
                {option.label}
              </option>
            ))}
          </select>

          <select value={paymentTypeFilter} onChange={updateFilter(setPaymentTypeFilter)}>
            {PAYMENT_TYPE_OPTIONS.map((option) => (
              <option value={option.value} key={option.value || option.label}>
                {option.label}
              </option>
            ))}
          </select>

          <button type="button" className="reset-filters-btn" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </section>

      <section className="table-wrapper">
        {tableLoading && (
          <div className="orders-table-overlay">
            <Loader2 size={24} aria-hidden="true" />
          </div>
        )}

        <table className="orders-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Order Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="admin-empty-row">
                    <PackageSearch size={30} aria-hidden="true" />
                    <strong>No orders found</strong>
                    <span>Try changing search or filter criteria.</span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const orderStatus = getStatusKey(order.orderStatus, "placed");
                const paymentStatus = getStatusKey(order.paymentStatus, "pending");
                const viewLoading = actionLoading === `view-${order._id}`;
                const invoiceLoading = actionLoading === `invoice-${order._id}`;
                const refundLoading = actionLoading === `refund-${order._id}`;
                const canRefund =
                  order.paymentType === "ONLINE" &&
                  ["paid", "captured"].includes(paymentStatus);

                return (
                  <tr key={order._id}>
                    <td data-label="Order">
                      <div className="order-id-cell">
                        <strong>#{String(order._id).slice(-8).toUpperCase()}</strong>
                        <span>{order._id}</span>
                      </div>
                    </td>

                    <td data-label="Customer">
                      <div className="customer-cell">
                        <strong>{getCustomerName(order)}</strong>
                        <span>{getCustomerEmail(order)}</span>
                      </div>
                    </td>

                    <td data-label="Total">
                      <strong>{formatPrice(getOrderTotal(order))}</strong>
                    </td>

                    <td data-label="Order Status">
                      <StatusControl
                        type="order"
                        status={orderStatus}
                        orderId={order._id}
                        options={NEXT_ORDER_STATUSES}
                        onChange={promptStatusChange}
                      />
                    </td>

                    <td data-label="Payment">
                      <StatusControl
                        type="payment"
                        status={paymentStatus}
                        orderId={order._id}
                        options={NEXT_PAYMENT_STATUSES}
                        onChange={promptStatusChange}
                        subLabel={order.paymentType || "NA"}
                      />
                    </td>

                    <td data-label="Date">{formatDate(order.createdAt)}</td>

                    <td data-label="Actions">
                      <div className="actions">
                        <button type="button" onClick={() => viewOrder(order._id)} disabled={viewLoading}>
                          {viewLoading ? <Loader2 size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadInvoice(order._id)}
                          disabled={invoiceLoading}
                        >
                          {invoiceLoading ? (
                            <Loader2 size={15} aria-hidden="true" />
                          ) : (
                            <FileText size={15} aria-hidden="true" />
                          )}
                          Invoice
                        </button>

                        {canRefund && (
                          <button
                            type="button"
                            className="refund-btn"
                            onClick={() => refundOrder(order._id)}
                            disabled={refundLoading}
                          >
                            {refundLoading ? (
                              <Loader2 size={15} aria-hidden="true" />
                            ) : (
                              <RotateCcw size={15} aria-hidden="true" />
                            )}
                            Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {totalPages > 1 && (
        <nav className="pagination" aria-label="Order pages">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <ChevronLeft size={17} aria-hidden="true" />
            Prev
          </button>

          <span>
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            Next
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </nav>
      )}

      {confirmDialog.isOpen && (
        <div className="premium-modal-overlay" role="dialog" aria-modal="true">
          <div className="premium-modal-card">
            <AlertTriangle size={38} aria-hidden="true" />
            <h2>Confirm update</h2>
            <p>
              Change <strong>{formatLabel(confirmDialog.type)}</strong> status to{" "}
              <strong className="highlight-status">{formatLabel(confirmDialog.status)}</strong>?
            </p>

            <div className="premium-modal-actions">
              <button type="button" className="cancel-btn" onClick={cancelStatusChange}>
                Cancel
              </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={executeStatusChange}
                disabled={actionLoading === "status"}
              >
                {actionLoading === "status" ? (
                  <>
                    <Loader2 size={17} aria-hidden="true" />
                    Updating
                  </>
                ) : (
                  "Update"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && selectedOrder && (
        <div className="orders-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
          <div className="modal-content">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="close-btn"
              aria-label="Close order details"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <div className="modal-heading">
              <span>
                <ShoppingBag size={16} aria-hidden="true" />
                Order details
              </span>
              <h2 id="order-detail-title">#{String(selectedOrder._id).slice(-8).toUpperCase()}</h2>
              <p>{selectedOrder._id}</p>
            </div>

            <div className="detail-grid">
              <DetailItem label="Customer" value={getCustomerName(selectedOrder)} />
              <DetailItem label="Email" value={getCustomerEmail(selectedOrder)} />
              <DetailItem label="Payment Type" value={selectedOrder.paymentType || "NA"} />
              <DetailItem label="Payment Status" value={formatLabel(selectedOrder.paymentStatus)} />
              <DetailItem label="Order Status" value={formatLabel(selectedOrder.orderStatus, "Placed")} />
              <DetailItem label="Created" value={formatDate(selectedOrder.createdAt, true)} />
            </div>

            <section className="modal-section">
              <h3>Items</h3>
              {normalizeArray(selectedOrder.items).map((item, index) => (
                <div key={`${item.productId?._id || index}`} className="item">
                  <div>
                    <strong>{item.productId?.name || item.name || "Product"}</strong>
                    <span>Qty {item.quantity || 1}</span>
                  </div>
                  <span>{formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}</span>
                </div>
              ))}
            </section>

            <section className="modal-section">
              <h3>Shipping Address</h3>
              <p>{getShippingAddress(selectedOrder) || "Address unavailable"}</p>
            </section>

            <div className="modal-total">
              <span>Total amount</span>
              <strong>{formatPrice(getOrderTotal(selectedOrder))}</strong>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

const StatusControl = ({ type, status, orderId, options, onChange, subLabel }) => (
  <div className="status-control">
    <span className={`pill ${type}-${status}`}>{formatLabel(status)}</span>
    {subLabel && <small>{subLabel}</small>}

    <select value="" onChange={(event) => onChange(type, orderId, event.target.value)}>
      <option value="" disabled>
        Change
      </option>
      {options.map((option) => (
        <option value={option} key={option}>
          {formatLabel(option)}
        </option>
      ))}
    </select>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div className="detail-item">
    <span>{label}</span>
    <strong>{value || "NA"}</strong>
  </div>
);

const StateCard = ({ icon: Icon, title, message, actionLabel, onAction, loading }) => (
  <div className="admin-orders-state-card">
    <Icon className={loading ? "admin-orders-spinner" : ""} size={34} aria-hidden="true" />
    <h2>{title}</h2>
    <p>{message}</p>
    {actionLabel && (
      <button type="button" onClick={onAction}>
        {actionLabel}
      </button>
    )}
  </div>
);

export default OrdersAdmin;
