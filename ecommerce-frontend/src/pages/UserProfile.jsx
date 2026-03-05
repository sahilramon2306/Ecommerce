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

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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
        const addrRes = await axiosInstance.get(
          "/get-All-Address-Under-A-Single-User"
        );
        setAddresses(addrRes.data.data || []);
      } catch {
        setAddresses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const res = await axiosInstance.put("/change-Password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data.success) {
        toast.success("Password updated successfully");

        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });

        setShowPasswordForm(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    }
  };

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
        toast.success("Address updated");
      } else {
        await axiosInstance.post("/add-User-Address", addressForm);
        toast.success("Address added");
      }

      const addrRes = await axiosInstance.get(
        "/get-All-Address-Under-A-Single-User"
      );

      setAddresses(addrRes.data.data || []);

      handleCloseModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
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

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;

    try {
      await axiosInstance.delete(`/delete-Single-Address-Of-User/${id}`);

      toast.success("Address deleted");

      const addrRes = await axiosInstance.get(
        "/get-All-Address-Under-A-Single-User"
      );

      setAddresses(addrRes.data.data || []);
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div className="profile-loading">Loading...</div>;

  return (
    <div className="profile-container">
      <h1 className="profile-title">My Profile</h1>

      {/* PERSONAL INFO */}

      <div className="profile-card">
        <h2>Personal Information</h2>

        <div className="info-grid">
          <div>
            <span>Name</span>
            <p>{user?.name}</p>
          </div>

          <div>
            <span>Email</span>
            <p>{user?.email}</p>
          </div>

          <div>
            <span>Phone</span>
            <p>{user?.phone}</p>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD */}

      <div className="profile-card">
        <div className="section-header">
          <h2>Password</h2>

          <button
            className="add-address-btn"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            Change Password
          </button>
        </div>

        {showPasswordForm && (
          <form className="change-password-form" onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Old Password"
              value={passwordForm.oldPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  oldPassword: e.target.value,
                })
              }
              required
            />

            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
              required
            />

            <button className="save-btn">Update Password</button>
          </form>
        )}
      </div>

      {/* ADDRESS SECTION */}

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
              <div
                key={addr._id}
                className={`address-card ${
                  addr.isDefault ? "default" : ""
                }`}
              >
                {addr.isDefault && (
                  <div className="default-badge">Default</div>
                )}

                <div className="address-body">
                  <h4>{addr.addressLine}</h4>

                  <p>
                    {addr.postOffice}, {addr.policeStation}
                  </p>

                  <p>
                    {addr.city}, {addr.district}
                  </p>

                  <p>
                    {addr.state} - {addr.pincode}
                  </p>
                </div>

                <div className="address-actions">
                  <button onClick={() => handleEditAddress(addr)}>
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteAddress(addr._id)}
                  >
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

      {/* ADDRESS MODAL */}

      {showAddressForm && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingAddress ? "Edit Address" : "Add Address"}</h3>

            <form onSubmit={handleAddressSubmit}>
              {Object.keys(addressForm).map((field) =>
                field !== "isDefault" ? (
                  <input
                    key={field}
                    placeholder={field.replace(/([A-Z])/g, " $1")}
                    value={addressForm[field]}
                    onChange={(e) =>
                      setAddressForm({
                        ...addressForm,
                        [field]: e.target.value,
                      })
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
                    setAddressForm({
                      ...addressForm,
                      isDefault: e.target.checked,
                    })
                  }
                />
                Set Default Address
              </label>

              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>

                <button className="save-btn">
                  {editingAddress ? "Update" : "Save"}
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