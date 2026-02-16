import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { createRazorpayOrder, verifyPayment } from "../api/paymentApi";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    addressLine: "",
    city: "",
    district: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cartRes = await axiosInstance.get("/get-User-Cart");
        setCart(cartRes.data.data);

        const userRes = await axiosInstance.get("/get-User-Profile");
        const user = userRes.data.user;

        const defaultAddress =
          user.addresses?.find((a) => a.isDefault) || user.addresses?.[0];

        if (defaultAddress) {
          setAddress({
            name: user.name || "",
            phone: user.phone || "",
            addressLine: defaultAddress.addressLine || "",
            city: defaultAddress.city || "",
            district: defaultAddress.district || "",
            state: defaultAddress.state || "",
            pincode: defaultAddress.pincode || "",
          });
        }
      } catch (err) {
        console.error("Error fetching checkout data:", err);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    setAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const placeOrder = async (e) => {
    e.preventDefault();

    const form = e.target;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    try {
      setLoading(true);

      // Step 1: Create order on backend
      const orderRes = await axiosInstance.post("/create-Order-From-Cart", {
        paymentType: "ONLINE",
        address,
      });

      const orderId = orderRes.data.data._id;

      // Step 2: Create Razorpay order
      const razorpayRes = await createRazorpayOrder(orderId);
      const { id, amount } = razorpayRes.data.data;

      // Step 3: Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "Sahil Ecommerce",
        description: "Order Payment",
        order_id: id,

        handler: async function (response) {
          try {
            await verifyPayment(response);
            alert("Payment Successful 🎉");
            navigate("/orders");
          } catch (verificationError) {
            console.error("Payment verification failed:", verificationError);
            alert("Payment verification failed. Please contact support.");
          }
        },

        modal: {
          ondismiss: () => {
            alert("Payment was cancelled");
          },
        },

        theme: {
          color: "#3399cc",
        },
      };

      const razor = new window.Razorpay(options);
      razor.open();
    } catch (error) {
      console.error("Payment flow error:", error);
      alert(error.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <div className="checkout-loading">Loading checkout...</div>;

  return (
    <div className="checkout-container">
      <div className="checkout-left">
        <h2>Shipping Address</h2>

        <form onSubmit={placeOrder}>
          <div className="form-group">
            <label htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="name"
              name="name"
              value={address.name}
              onChange={handleChange}
              placeholder="Full Name"
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={address.phone}
              onChange={handleChange}
              placeholder="Phone"
              required
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="addressLine">
              Address Line <span className="required">*</span>
            </label>
            <input
              id="addressLine"
              name="addressLine"
              value={address.addressLine}
              onChange={handleChange}
              placeholder="House no, Street, Area"
              required
              autoComplete="address-line1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">
              City <span className="required">*</span>
            </label>
            <input
              id="city"
              name="city"
              value={address.city}
              onChange={handleChange}
              placeholder="City"
              required
              autoComplete="address-level2"
            />
          </div>

          <div className="form-group">
            <label htmlFor="district">
              District <span className="required">*</span>
            </label>
            <input
              id="district"
              name="district"
              value={address.district}
              onChange={handleChange}
              placeholder="District"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="state">
              State <span className="required">*</span>
            </label>
            <input
              id="state"
              name="state"
              value={address.state}
              onChange={handleChange}
              placeholder="State"
              required
              autoComplete="address-level1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="pincode">
              Pincode <span className="required">*</span>
            </label>
            <input
              id="pincode"
              name="pincode"
              value={address.pincode}
              onChange={handleChange}
              placeholder="Pincode"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              title="Please enter a valid 6-digit Indian PIN code"
              autoComplete="postal-code"
            />
          </div>

          <p className="form-hint">
            <span className="required">*</span> Required fields
          </p>

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Pay Now"}
          </button>
        </form>
      </div>

      <div className="checkout-right">
        <h2>Order Summary</h2>

        <div className="order-items-list">
          {cart.items.map((item) => (
            <div key={item.productId} className="summary-item">
              <div className="summary-item-image">
                <img
                  src={
                    item.image || item.images?.[0]
                      ? item.image || item.images[0]
                      : "https://via.placeholder.com/80x80?text=No+Image"
                  }
                  alt={item.name}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/80x80?text=Error";
                  }}
                />
              </div>

              <div className="summary-item-info">
                <div className="item-name">{item.name}</div>
                <div className="item-qty">× {item.quantity}</div>
              </div>

              <div className="item-price">
                ₹{(item.price * item.quantity).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>

        <div className="summary-total">
          <strong>Total:</strong>
          <strong>₹{cart.grandTotal?.toLocaleString("en-IN")}</strong>
        </div>
      </div>
    </div>
  );
};

export default Checkout;