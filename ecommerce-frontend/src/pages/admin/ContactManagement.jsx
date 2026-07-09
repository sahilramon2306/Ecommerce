import { useEffect, useState, useMemo } from "react";
import {
  getAllContactMessages,
  updateContactStatus,
  deleteContactMessage,
} from "../../api/contactApi";
import { 
  Search, Mail, Trash2, Clock, User, 
  CheckCircle, ArrowLeft, Filter, AlertCircle 
} from "lucide-react";

import "../../styles/admin-contact-management.css";

const ContactManagement = () => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  
  // UX Enhancements
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [toast, setToast] = useState(null);
  const [isMobileListOpen, setIsMobileListOpen] = useState(true);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await getAllContactMessages();
      const data = res.data?.data || [];
      setMessages(data);

      if (data.length > 0) {
        setSelectedMessage(data[0]);
        setStatus(data[0].status);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
      showToast("Failed to load messages", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    setStatus(message.status);
    setIsMobileListOpen(false); // Switch to detail view on mobile
  };

  const handleUpdateStatus = async () => {
    try {
      await updateContactStatus(selectedMessage._id, status);

      setMessages((prev) =>
        prev.map((item) =>
          item._id === selectedMessage._id ? { ...item, status } : item
        )
      );
      setSelectedMessage((prev) => ({ ...prev, status }));
      showToast("Status updated successfully");
    } catch (error) {
      console.error(error);
      showToast("Failed to update status", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      await deleteContactMessage(id);
      const updatedMessages = messages.filter((msg) => msg._id !== id);
      setMessages(updatedMessages);

      if (selectedMessage?._id === id) {
        setSelectedMessage(updatedMessages[0] || null);
        setIsMobileListOpen(true); // Go back to list if current is deleted
      }
      showToast("Message deleted");
    } catch (error) {
      console.error(error);
      showToast("Failed to delete message", "error");
    }
  };

  // Filter and Search Logic
  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesSearch = 
        msg.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || msg.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [messages, searchTerm, filterStatus]);

  const formatDate = (dateStr) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr));
  };

  if (loading) {
    return (
      <div className="contact-loading-state">
        <div className="spinner"></div>
        <p>Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="contact-management">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`saas-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Sidebar List */}
      <aside className={`messages-sidebar ${!isMobileListOpen ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <div className="header-title">
            <h2>Inbox</h2>
            <span className="badge">{filteredMessages.length}</span>
          </div>

          <div className="search-filter-container">
            <div className="search-box">
              <Search size={16} className="text-muted" />
              <input 
                type="text" 
                placeholder="Search messages..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-box">
              <Filter size={16} className="text-muted" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="new">New</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        <div className="messages-list">
          {filteredMessages.length === 0 ? (
            <div className="empty-list">
              <Mail size={32} />
              <p>No messages found</p>
            </div>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg._id}
                className={`message-card ${selectedMessage?._id === msg._id ? "active" : ""}`}
                onClick={() => handleSelectMessage(msg)}
              >
                <div className="message-card-top">
                  <div className="sender-info">
                    <div className="avatar">{msg.name.charAt(0).toUpperCase()}</div>
                    <h4>{msg.name}</h4>
                  </div>
                  <span className={`status-pill ${msg.status}`}>{msg.status}</span>
                </div>
                <p className="subject-line">{msg.subject}</p>
                <span className="timestamp">{formatDate(msg.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Message View */}
      <main className={`message-view ${isMobileListOpen ? 'mobile-hidden' : ''}`}>
        {selectedMessage ? (
          <div className="message-paper">
            
            {/* Mobile Back Button */}
            <button className="mobile-back-btn" onClick={() => setIsMobileListOpen(true)}>
              <ArrowLeft size={18} /> Back to Inbox
            </button>

            <header className="view-header">
              <div className="view-title">
                <h2>{selectedMessage.subject}</h2>
                <div className="meta-tags">
                  <span className="meta-tag"><Clock size={14} /> {formatDate(selectedMessage.createdAt)}</span>
                  <span className={`status-pill ${selectedMessage.status}`}>{selectedMessage.status}</span>
                </div>
              </div>
              <button 
                className="btn-icon-danger" 
                onClick={() => handleDelete(selectedMessage._id)}
                title="Delete Message"
              >
                <Trash2 size={18} />
              </button>
            </header>

            <div className="sender-profile">
              <div className="avatar lg">{selectedMessage.name.charAt(0).toUpperCase()}</div>
              <div className="sender-details">
                <h3>{selectedMessage.name}</h3>
                <a href={`mailto:${selectedMessage.email}`} className="email-link">
                  <Mail size={14} /> {selectedMessage.email}
                </a>
              </div>
            </div>

            <div className="message-body">
              <p>{selectedMessage.message}</p>
            </div>

            <footer className="view-footer">
              <div className="status-updater">
                <label>Update Status:</label>
                <div className="update-controls">
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  <button 
                    className="btn-primary" 
                    onClick={handleUpdateStatus}
                    disabled={status === selectedMessage.status}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </footer>

          </div>
        ) : (
          <div className="empty-state-view">
            <div className="empty-icon-wrapper">
              <Mail size={48} />
            </div>
            <h3>Your inbox is empty</h3>
            <p>Select a message from the list to view its details.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ContactManagement;