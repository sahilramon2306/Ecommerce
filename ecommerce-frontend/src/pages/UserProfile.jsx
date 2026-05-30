import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Home,
  Loader2,
  Lock,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  User,
  X,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { toast } from "react-hot-toast";
import "../styles/profile.css";

const emptyAddressForm = {
  addressLine: "",
  postOffice: "",
  policeStation: "",
  city: "",
  district: "",
  state: "",
  pincode: "",
  isDefault: false,
};

const emptyPasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const addressFields = [
  { name: "addressLine", label: "Address line", placeholder: "House no, building, street", span: "full", required: true },
  { name: "city", label: "City", placeholder: "City", required: true },
  { name: "district", label: "District", placeholder: "District", required: true },
  { name: "state", label: "State", placeholder: "State", required: true },
  { name: "pincode", label: "Pincode", placeholder: "6 digit pincode", required: true },
  { name: "postOffice", label: "Post office", placeholder: "Post office" },
  { name: "policeStation", label: "Police station", placeholder: "Police station" },
];

const getInitials = (name = "") => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "U";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const formatAddressLine = (address) => {
  return [
    address.postOffice,
    address.policeStation,
    address.city,
    address.district,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [userRes, addressRes] = await Promise.allSettled([
        axiosInstance.get("/get-User-Profile"),
        axiosInstance.get("/get-All-Address-Under-A-Single-User"),
      ]);

      if (userRes.status === "fulfilled") {
        setUser(userRes.value.data?.data || null);
      } else {
        throw userRes.reason;
      }

      if (addressRes.status === "fulfilled") {
        setAddresses(addressRes.value.data?.data || []);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error("Profile load error:", error);
      setErrorMessage("We could not load your profile right now.");
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const reloadAddresses = async () => {
    const addressRes = await axiosInstance.get("/get-All-Address-Under-A-Single-User");
    setAddresses(addressRes.data?.data || []);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const profileStats = useMemo(() => {
    return {
      addresses: addresses.length,
      primary: addresses.some((address) => address.isDefault) ? "Set" : "Missing",
      phone: user?.phone ? "Added" : "Missing",
    };
  }, [addresses, user]);

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setActionLoading("password");

      const res = await axiosInstance.put("/change-Password", {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.success !== false) {
        toast.success("Password updated successfully");
        setPasswordForm(emptyPasswordForm);
        setShowPasswordForm(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setActionLoading("");
    }
  };

  const resetAddressModal = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressForm(emptyAddressForm);
  };

  const handleAddNewAddress = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddressForm);
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(addressForm.pincode)) {
      toast.error("Enter a valid 6 digit pincode");
      return;
    }

    try {
      setActionLoading("address");

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

      await reloadAddresses();
      resetAddressModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save address");
    } finally {
      setActionLoading("");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      addressLine: address.addressLine || "",
      postOffice: address.postOffice || "",
      policeStation: address.policeStation || "",
      city: address.city || "",
      district: address.district || "",
      state: address.state || "",
      pincode: address.pincode || "",
      isDefault: Boolean(address.isDefault),
    });
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (addressId) => {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;

    try {
      setActionLoading(`delete-${addressId}`);
      await axiosInstance.delete(`/delete-Single-Address-Of-User/${addressId}`);
      await reloadAddresses();
      toast.success("Address deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setActionLoading("");
    }
  };

  const handleChangeAddress = (event) => {
    const { name, value, type, checked } = event.target;

    setAddressForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? checked
          : name === "pincode"
            ? value.replace(/\D/g, "").slice(0, 6)
            : value,
    }));
  };

  if (loading) {
    return (
      <main className="profile-page">
        <div className="profile-shell">
          <div className="profile-state-card" aria-live="polite" aria-busy="true">
            <Loader2 className="profile-spinner" size={30} aria-hidden="true" />
            <h2>Loading profile</h2>
            <p>Fetching your account details and saved addresses.</p>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="profile-page">
        <div className="profile-shell">
          <div className="profile-state-card">
            <User size={38} aria-hidden="true" />
            <h2>Profile unavailable</h2>
            <p>{errorMessage}</p>
            <button type="button" onClick={loadProfile}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-hero">
          <div className="profile-avatar" aria-hidden="true">
            {getInitials(user?.name)}
          </div>

          <div className="profile-hero__copy">
            <span>
              <ShieldCheck size={16} aria-hidden="true" />
              Account settings
            </span>
            <h1>Welcome, {user?.name || "User"}</h1>
            <p>Manage your contact details, password, and delivery addresses.</p>
          </div>
        </header>

        <section className="profile-stats" aria-label="Profile summary">
          <div>
            <span>Saved addresses</span>
            <strong>{profileStats.addresses}</strong>
          </div>
          <div>
            <span>Primary address</span>
            <strong>{profileStats.primary}</strong>
          </div>
          <div>
            <span>Phone number</span>
            <strong>{profileStats.phone}</strong>
          </div>
        </section>

        <section className="profile-layout">
          <div className="profile-main">
            <section className="profile-card" aria-labelledby="personal-title">
              <div className="profile-section-header">
                <div>
                  <span>
                    <User size={16} aria-hidden="true" />
                    Profile
                  </span>
                  <h2 id="personal-title">Personal Information</h2>
                </div>
              </div>

              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <User size={18} aria-hidden="true" />
                  <div>
                    <span>Full name</span>
                    <strong>{user?.name || "Not provided"}</strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <Mail size={18} aria-hidden="true" />
                  <div>
                    <span>Email address</span>
                    <strong>{user?.email || "Not provided"}</strong>
                  </div>
                </div>

                <div className="profile-info-item">
                  <Phone size={18} aria-hidden="true" />
                  <div>
                    <span>Phone number</span>
                    <strong>{user?.phone || "Not provided"}</strong>
                  </div>
                </div>
              </div>
            </section>

            <section className="profile-card" aria-labelledby="security-title">
              <div className="profile-section-header">
                <div>
                  <span>
                    <Lock size={16} aria-hidden="true" />
                    Security
                  </span>
                  <h2 id="security-title">Password</h2>
                </div>

                <button
                  type="button"
                  className="profile-outline-btn"
                  onClick={() => setShowPasswordForm((current) => !current)}
                >
                  {showPasswordForm ? "Cancel" : "Change password"}
                </button>
              </div>

              {showPasswordForm ? (
                <form className="profile-password-form" onSubmit={handlePasswordSubmit}>
                  <label className="profile-field profile-field--full">
                    <span>Current password</span>
                    <input
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          oldPassword: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label className="profile-field">
                    <span>New password</span>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          newPassword: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <label className="profile-field">
                    <span>Confirm password</span>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      required
                    />
                  </label>

                  <div className="profile-form-actions profile-field--full">
                    <button
                      type="submit"
                      className="profile-primary-btn"
                      disabled={actionLoading === "password"}
                    >
                      {actionLoading === "password" ? (
                        <>
                          <Loader2 size={17} aria-hidden="true" />
                          Updating
                        </>
                      ) : (
                        "Update password"
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="profile-security-note">
                  <CheckCircle2 size={18} aria-hidden="true" />
                  Use a strong password and keep your login details private.
                </div>
              )}
            </section>
          </div>

          <aside className="profile-side-card" aria-label="Account shortcuts">
            <div>
              <PackageCheck size={20} aria-hidden="true" />
              <span>Orders</span>
              <strong>Track purchases and payment status.</strong>
            </div>
            <a href="/orders">View orders</a>
          </aside>
        </section>

        <section className="profile-address-section" aria-labelledby="address-title">
          <div className="profile-section-header">
            <div>
              <span>
                <MapPin size={16} aria-hidden="true" />
                Delivery
              </span>
              <h2 id="address-title">Saved Addresses</h2>
            </div>

            <button type="button" className="profile-primary-btn" onClick={handleAddNewAddress}>
              <Plus size={17} aria-hidden="true" />
              Add address
            </button>
          </div>

          <div className="profile-address-grid">
            {addresses.length > 0 ? (
              addresses.map((address) => (
                <article
                  key={address._id}
                  className={`profile-address-card ${address.isDefault ? "is-default" : ""}`}
                >
                  <div className="profile-address-icon">
                    <Home size={19} aria-hidden="true" />
                  </div>

                  <div className="profile-address-copy">
                    <div className="profile-address-title">
                      <h3>{address.addressLine || "Saved address"}</h3>
                      {address.isDefault && <span>Primary</span>}
                    </div>

                    <p>{formatAddressLine(address) || "Address details unavailable"}</p>
                  </div>

                  <div className="profile-address-actions">
                    <button type="button" onClick={() => handleEditAddress(address)}>
                      <Edit3 size={16} aria-hidden="true" />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => handleDeleteAddress(address._id)}
                      disabled={actionLoading === `delete-${address._id}`}
                    >
                      {actionLoading === `delete-${address._id}` ? (
                        <Loader2 size={16} aria-hidden="true" />
                      ) : (
                        <Trash2 size={16} aria-hidden="true" />
                      )}
                      Delete
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="profile-empty-address">
                <MapPin size={34} aria-hidden="true" />
                <h3>No saved addresses</h3>
                <p>Add a delivery address to make checkout faster.</p>
                <button type="button" onClick={handleAddNewAddress}>
                  Add address
                </button>
              </div>
            )}
          </div>
        </section>

        {showAddressForm && (
          <div className="profile-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="address-modal-title">
            <div className="profile-modal">
              <div className="profile-modal-header">
                <div>
                  <span>
                    <MapPin size={16} aria-hidden="true" />
                    Address book
                  </span>
                  <h2 id="address-modal-title">
                    {editingAddress ? "Edit Address" : "Add Address"}
                  </h2>
                </div>

                <button type="button" onClick={resetAddressModal} aria-label="Close address form">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <form className="profile-address-form" onSubmit={handleAddressSubmit}>
                {addressFields.map((field) => (
                  <label
                    key={field.name}
                    className={`profile-field ${field.span === "full" ? "profile-field--full" : ""}`}
                  >
                    <span>{field.label}</span>
                    <input
                      name={field.name}
                      value={addressForm[field.name]}
                      placeholder={field.placeholder}
                      onChange={handleChangeAddress}
                      inputMode={field.name === "pincode" ? "numeric" : "text"}
                      required={field.required}
                    />
                  </label>
                ))}

                <label className="profile-checkbox profile-field--full">
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={addressForm.isDefault}
                    onChange={handleChangeAddress}
                  />
                  <span>Set as primary delivery address</span>
                </label>

                <div className="profile-modal-actions profile-field--full">
                  <button type="button" className="profile-secondary-btn" onClick={resetAddressModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="profile-primary-btn"
                    disabled={actionLoading === "address"}
                  >
                    {actionLoading === "address" ? (
                      <>
                        <Loader2 size={17} aria-hidden="true" />
                        Saving
                      </>
                    ) : editingAddress ? (
                      "Save changes"
                    ) : (
                      "Add address"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default UserProfile;
