import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import axiosInstance from "../api/axiosInstance";
import { createRazorpayOrder, verifyPayment } from "../api/paymentApi";
import { useNavigate } from "react-router-dom";
import "../styles/checkout.css";

const Checkout = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState(null);
  const [paymentType, setPaymentType] = useState("ONLINE");

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
        const user = userRes.data.data;

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
        console.error(err);
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

    try {
      setLoading(true);

      const orderRes = await axiosInstance.post("/create-Order-From-Cart", {
        paymentType,
        address,
      });

      const orderId = orderRes.data.data._id;

      // COD Flow
      if (paymentType === "COD") {
        toast.success("Order placed successfully!");
        setTimeout(() => navigate("/orders"), 1000);
        return;
      }

      // ONLINE Flow
      const razorpayRes = await createRazorpayOrder(orderId);
      const { id, amount } = razorpayRes.data.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "Sahil Ecommerce",
        description: "Secure Payment",
        order_id: id,
        handler: async function (response) {
          await verifyPayment(response);
          toast.success("Payment Successful 🎉");
          setTimeout(() => navigate("/orders"), 1000);
        },
        theme: { color: "#111827" },
      };

      const razor = new window.Razorpay(options);
      razor.open();

    } catch (err) {
      toast.error("Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return <div className="checkout-loading">Loading...</div>;

  return (
    <div className="checkout-wrapper">

      {/* Step Header */}
      <div className="checkout-steps">
        <div className="step active">Cart</div>
        <div className="step active">Address</div>
        <div className="step">Payment</div>
        <div className="step">Success</div>
      </div>

      <div className="checkout-container">

        {/* LEFT */}
        <div className="checkout-left">
          <h2>Shipping Details</h2>

          <form onSubmit={placeOrder}>

            {Object.keys(address).map((field) => (
              <div className="floating-group" key={field}>
                <input
                  name={field}
                  value={address[field]}
                  onChange={handleChange}
                  required
                />
                <label>{field.replace(/([A-Z])/g, " $1")}</label>
              </div>
            ))}

            {/* Payment Method */}
            <div className="payment-method">
              <label className={`payment-option ${paymentType === "ONLINE" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="ONLINE"
                  checked={paymentType === "ONLINE"}
                  onChange={(e) => setPaymentType(e.target.value)}
                />
                Online Payment
              </label>

              <label className={`payment-option ${paymentType === "COD" ? "selected" : ""}`}>
                <input
                  type="radio"
                  value="COD"
                  checked={paymentType === "COD"}
                  onChange={(e) => setPaymentType(e.target.value)}
                />
                Cash on Delivery
              </label>
            </div>

            <button type="submit" disabled={loading} className="pay-btn">
              {loading
                ? "Processing..."
                : paymentType === "COD"
                  ? "Place Order (COD)"
                  : `Pay ₹${cart.grandTotal.toLocaleString("en-IN")}`}
            </button>

          </form>
        </div>

        {/* RIGHT */}
        <div className="checkout-right">
          <h3>Order Summary</h3>

          <div className="order-items">
            {cart.items.map((item) => (
              <div className="summary-item" key={item.productId}>
                <img
                  src={
                    item.image ||
                    item.images?.[0] ||
                    "https://via.placeholder.com/80"
                  }
                  alt={item.name}
                />
                <div>
                  <p>{item.name}</p>
                  <span>× {item.quantity}</span>
                </div>
                <strong>
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </strong>
              </div>
            ))}
          </div>

          <div className="summary-total">
            <span>Total</span>
            <strong>₹{cart.grandTotal.toLocaleString("en-IN")}</strong>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Checkout;