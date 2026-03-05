import { useEffect, useState } from "react";
import {
  getAllOrdersAdmin,
  getOrderByIdAdmin,
  updateOrderStatusAdmin,
  updatePaymentStatusAdmin,
  getOrderInvoiceAdmin
} from "../../api/adminApi";

import "../../styles/admin-orders.css";

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Search
  const [searchOrderId, setSearchOrderId] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Premium UI States
  const [confirmDialog, setConfirmDialog] = useState({ 
    isOpen: false, 
    type: "", 
    id: "", 
    status: "", 
    selectElement: null 
  });
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const limit = 10;

  /* ================= LOAD ORDERS ================= */

  const loadOrders = async (page = 1) => {
    try {
      setLoading(true);

      const res = await getAllOrdersAdmin({
        page,
        limit,
        orderId: searchOrderId.trim(),
        orderStatus: orderStatusFilter,
        paymentStatus: paymentStatusFilter,
        paymentType: paymentTypeFilter
      });

      setOrders(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setCurrentPage(res.data.pagination?.currentPage || 1);

    } catch (err) {
      console.error("Load orders error:", err);
      showToast("Failed to load orders", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(1);
    // eslint-disable-next-line
  }, [orderStatusFilter, paymentStatusFilter, paymentTypeFilter]);

  useEffect(() => {
    loadOrders(currentPage);
    // eslint-disable-next-line
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadOrders(1);
  };

  /* ================= ACTIONS & PREMIUM UI ================= */

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const promptStatusChange = (type, id, event) => {
    const status = event.target.value;
    const selectElement = event.target;
    
    setConfirmDialog({
      isOpen: true,
      type,
      id,
      status,
      selectElement
    });
  };

  const executeStatusChange = async () => {
    const { type, id, status, selectElement } = confirmDialog;
    setConfirmDialog({ isOpen: false, type: "", id: "", status: "", selectElement: null });

    try {
      if (type === "Order") {
        await updateOrderStatusAdmin(id, { orderStatus: status });
      } else if (type === "Payment") {
        await updatePaymentStatusAdmin(id, { paymentStatus: status });
      }
      
      // Reset the dropdown visually so the pill handles the current status display
      if (selectElement) selectElement.value = "";
      
      showToast(`${type} status updated to ${status}`);
      loadOrders(currentPage);
    } catch (err) {
      console.error("Status update error:", err);
      showToast(`Failed to update ${type.toLowerCase()} status`, "error");
      if (selectElement) selectElement.value = ""; // Reset on fail too
    }
  };

  const cancelStatusChange = () => {
    if (confirmDialog.selectElement) {
      confirmDialog.selectElement.value = ""; // Revert the dropdown if cancelled
    }
    setConfirmDialog({ isOpen: false, type: "", id: "", status: "", selectElement: null });
  };

  const viewOrder = async (id) => {
    try {
      const res = await getOrderByIdAdmin(id);
      setSelectedOrder(res.data.data);
      setShowModal(true);
    } catch (err) {
      console.error("View order error:", err);
      showToast("Failed to load order details", "error");
    }
  };

  const downloadInvoice = async (id) => {
    try {
      const res = await getOrderInvoiceAdmin(id);
      const url = URL.createObjectURL(new Blob([res.data.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice_${id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Invoice error:", err);
      showToast("Failed to download invoice", "error");
    }
  };

  if (loading && orders.length === 0) return <div className="admin-loading">Loading Orders...</div>;

  return (
    <div className="admin-orders">
      <h1>Admin Orders Management</h1>

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`premium-toast toast-${toast.type}`}>
          {toast.type === "success" ? "✓" : "⚠"} {toast.message}
        </div>
      )}

      {/* FILTERS & SEARCH */}
      <div className="orders-filters-container">
        <form onSubmit={handleSearchSubmit} className="search-bar">
          <input 
            type="text" 
            placeholder="Search by exact Order ID..." 
            value={searchOrderId} 
            onChange={(e) => setSearchOrderId(e.target.value)} 
          />
          <button type="submit">Search</button>
        </form>

        <div className="orders-filters">
          <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
            <option value="">All Order Status</option>
            <option value="placed">Placed</option>
            <option value="confirmed">Confirmed</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>

          <select value={paymentStatusFilter} onChange={(e) => setPaymentStatusFilter(e.target.value)}>
            <option value="">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="captured">Captured</option>
            <option value="failed">Failed</option>
          </select>

          <select value={paymentTypeFilter} onChange={(e) => setPaymentTypeFilter(e.target.value)}>
            <option value="">All Payment Type</option>
            <option value="COD">COD</option>
            <option value="ONLINE">Online</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Order Status</th>
              <th>Payment</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="full-id">{order._id}</td>
                <td>{order.userId?.name || 'Guest'}</td>
                <td>₹{order.totalAmount.toFixed(2)}</td>

                <td>
                  <span className={`pill order-${order.orderStatus.toLowerCase()}`}>
                    {order.orderStatus}
                  </span>
                  <select
                    onChange={(e) => promptStatusChange("Order", order._id, e)}
                    defaultValue=""
                  >
                    <option value="" disabled>Change</option>
                    <option value="confirmed">Confirm</option>
                    <option value="shipped">Ship</option>
                    <option value="delivered">Deliver</option>
                    <option value="cancelled">Cancel</option>
                  </select>
                </td>

                <td>
                  <span className={`pill payment-${order.paymentStatus.toLowerCase()}`}>
                    {order.paymentStatus}
                  </span>
                  <select
                    onChange={(e) => promptStatusChange("Payment", order._id, e)}
                    defaultValue=""
                  >
                    <option value="" disabled>Change</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </td>

                <td>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>

                <td className="actions">
                  <button onClick={() => viewOrder(order._id)}>View</button>
                  <button onClick={() => downloadInvoice(order._id)}>Invoice</button>
                </td>
              </tr>
            ))}
            
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</button>
          <span>{currentPage} / {totalPages}</span>
          <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
        </div>
      )}

      {/* PREMIUM CONFIRMATION MODAL */}
      {confirmDialog.isOpen && (
        <div className="premium-modal-overlay">
          <div className="premium-modal-card">
            <div className="premium-modal-icon">⚠️</div>
            <h3>Confirm Update</h3>
            <p>Are you sure you want to change the <strong>{confirmDialog.type}</strong> status to <strong className="highlight-status">{confirmDialog.status}</strong>?</p>
            <div className="premium-modal-actions">
              <button className="cancel-btn" onClick={cancelStatusChange}>Cancel</button>
              <button className="confirm-btn" onClick={executeStatusChange}>Yes, Update</button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {showModal && selectedOrder && (
        <div className="orders-modal">
          <div className="modal-content">
            <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
            <h3>Order Details</h3>
            <p className="modal-order-id">ID: {selectedOrder._id}</p>
            <p><strong>Customer:</strong> {selectedOrder.userId?.name || 'Guest'}</p>
            <p><strong>Email:</strong> {selectedOrder.userId?.email || 'N/A'}</p>
            <p><strong>Payment Type:</strong> {selectedOrder.paymentType}</p>
            <p><strong>Total Amount:</strong> ₹{selectedOrder.totalAmount.toFixed(2)}</p>
            <p><strong>Created At:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>

            <h4>Items:</h4>
            {selectedOrder.items.map((item, i) => (
              <div key={i} className="item">
                <span>{item.productId?.name || 'Product'} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}

            <h4>Shipping Address:</h4>
            <p>{selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} {selectedOrder.shippingAddress?.pincode}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersAdmin;