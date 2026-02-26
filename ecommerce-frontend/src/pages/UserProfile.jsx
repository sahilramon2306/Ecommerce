import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-hot-toast";
import "../styles/profile.css";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const [addressForm, setAddressForm] = useState({
    addressLine: "",
    postOffice: "",
    policeStation: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axiosInstance.get("/get-User-Profile");
        setUser(userRes.data.data);
      } catch {
        toast.error("Failed to load profile");
      }

      try {
        const addrRes = await axiosInstance.get("/get-All-Address-Under-A-Single-User");
        setAddresses(addrRes.data.data || []);
      } catch {
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCloseModal = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm({
      addressLine: "",
      postOffice: "",
      policeStation: "",
      city: "",
      district: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
  };

  const handleAddNewAddress = () => {
    handleCloseModal();
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingAddress) {
        await axiosInstance.put(
          `/update-Single-Address-Of-User/${editingAddress._id}`,
          addressForm
        );
        toast.success("Address updated successfully");
      } else {
        await axiosInstance.post("/add-User-Address", addressForm);
        toast.success("Address added successfully");
      }

      const addrRes = await axiosInstance.get("/get-All-Address-Under-A-Single-User");
      setAddresses(addrRes.data.data || []);

      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save address");
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddressForm({
      addressLine: addr.addressLine || "",
      postOffice: addr.postOffice || "",
      policeStation: addr.policeStation || "",
      city: addr.city || "",
      district: addr.district || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      isDefault: addr.isDefault || false,
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Delete this address?")) return;

    try {
      await axiosInstance.delete(`/delete-Single-Address-Of-User/${addressId}`);
      toast.success("Address deleted");

      const addrRes = await axiosInstance.get("/get-All-Address-Under-A-Single-User");
      setAddresses(addrRes.data.data || []);
    } catch {
      toast.error("Failed to delete address");
    }
  };

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-container">

      <h1 className="profile-title">My Profile</h1>

      <div className="profile-card">
        <h2>Personal Information</h2>
        <div className="info-grid">
          <div><strong>Name</strong><span>{user?.name}</span></div>
          <div><strong>Email</strong><span>{user?.email}</span></div>
          <div><strong>Phone</strong><span>{user?.phone}</span></div>
        </div>
      </div>

      <div className="profile-card">
        <div className="section-header">
          <h2>My Addresses</h2>
          <button className="add-address-btn" onClick={handleAddNewAddress}>
            + Add Address
          </button>
        </div>

        <div className="addresses-grid">
          {addresses.length > 0 ? (
            addresses.map((addr) => (
              <div key={addr._id} className={`address-card ${addr.isDefault ? "default" : ""}`}>
                {addr.isDefault && <div className="default-badge">Default</div>}

                <div className="address-body">
                  <h4>{addr.addressLine}</h4>
                  <p>{addr.postOffice}, {addr.policeStation}</p>
                  <p>{addr.city}, {addr.district}</p>
                  <p>{addr.state} - {addr.pincode}</p>
                </div>

                <div className="address-actions">
                  <button onClick={() => handleEditAddress(addr)}>Edit</button>
                  <button onClick={() => handleDeleteAddress(addr._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="no-address">No addresses saved yet.</p>
          )}
        </div>
      </div>

      {showAddressForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingAddress ? "Edit Address" : "Add New Address"}</h3>

            <form onSubmit={handleAddressSubmit}>
              {Object.keys(addressForm).map((field) =>
                field !== "isDefault" ? (
                  <input
                    key={field}
                    placeholder={field.replace(/([A-Z])/g, " $1")}
                    value={addressForm[field]}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, [field]: e.target.value })
                    }
                    required
                  />
                ) : null
              )}

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefault: e.target.checked })
                  }
                />
                Set as Default Address
              </label>

              <div className="modal-buttons">
                <button type="button" onClick={handleCloseModal} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingAddress ? "Update Address" : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserProfile;