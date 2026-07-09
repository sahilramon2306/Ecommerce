import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Loader2,
  MapPin,
  PackageSearch,
  ShieldCheck,
  ShoppingBag,
  Truck,
  Wallet,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { createRazorpayOrder, verifyPayment } from "../api/paymentApi";
import "../styles/checkout.css";

const ADDRESS_FIELDS = [
  { name: "name", label: "Full name", type: "text", span: "half" },
  { name: "phone", label: "Phone number", type: "tel", span: "half" },
  { name: "addressLine", label: "Address line", type: "text", span: "full" },
  { name: "city", label: "City", type: "text", span: "half" },
  { name: "district", label: "District", type: "text", span: "half" },
  { name: "state", label: "State", type: "text", span: "half" },
  { name: "pincode", label: "Pincode", type: "text", span: "half" },
];

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatPrice = (value) => {
  const number = Number(value);
  return priceFormatter.format(Number.isFinite(number) ? number : 0);
};

const normalizeItems = (items) => (Array.isArray(items) ? items : []);

const getItemId = (item) => {
  if (typeof item?.productId === "object") return item.productId?._id || item._id;
  return item?.productId || item?._id;
};

const getItemName = (item) => item?.name || item?.productId?.name || "Product";

const getItemImage = (item) =>
  item?.image || item?.images?.[0] || item?.productId?.images?.[0] || "";

const getItemPrice = (item) => {
  const value = Number(
    item?.price || item?.salePrice || item?.productId?.salePrice || item?.productId?.price
  );

  return Number.isFinite(value) ? value : 0;
};

const getInitials = (value = "") => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "SC";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const Checkout = () => {
  const navigate = useNavigate();

  const [pageLoading, setPageLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cart, setCart] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
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
    let isCurrent = true;

    const fetchCheckoutData = async () => {
      try {
        setPageLoading(true);
        setErrorMessage("");

        const [cartRes, userRes] = await Promise.all([
          axiosInstance.get("/get-User-Cart"),
          axiosInstance.get("/get-User-Profile"),
        ]);

        if (!isCurrent) return;

        const cartData = cartRes.data?.data || { items: [], grandTotal: 0 };
        const user = userRes.data?.data || {};
        const defaultAddress =
          user.addresses?.find((item) => item.isDefault) || user.addresses?.[0];

        setCart(cartData);

        setAddress((current) => ({
          ...current,
          name: user.name || current.name,
          phone: user.phone || current.phone,
          addressLine: defaultAddress?.addressLine || current.addressLine,
          city: defaultAddress?.city || current.city,
          district: defaultAddress?.district || current.district,
          state: defaultAddress?.state || current.state,
          pincode: defaultAddress?.pincode || current.pincode,
        }));
      } catch (error) {
        console.error("Checkout load error:", error);

        if (isCurrent) {
          setErrorMessage("We could not prepare checkout right now.");
          toast.error("Unable to load checkout");
        }
      } finally {
        if (isCurrent) setPageLoading(false);
      }
    };

    fetchCheckoutData();

    return () => {
      isCurrent = false;
    };
  }, []);

  const items = useMemo(() => normalizeItems(cart?.items), [cart]);

  const subtotal = useMemo(() => {
    const apiTotal = Number(cart?.grandTotal);

    if (Number.isFinite(apiTotal) && apiTotal > 0) return apiTotal;

    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      return sum + getItemPrice(item) * quantity;
    }, 0);
  }, [cart?.grandTotal, items]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items]
  );

  const isAddressComplete = ADDRESS_FIELDS.every((field) =>
    String(address[field.name] || "").trim()
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]:
        name === "phone" || name === "pincode"
          ? value.replace(/\D/g, "").slice(0, name === "phone" ? 10 : 6)
          : value,
    }));
  };

  const validateCheckout = () => {
    if (!items.length) {
      toast.error("Your cart is empty");
      return false;
    }

    if (!isAddressComplete) {
      toast.error("Please complete your shipping details");
      return false;
    }

    if (address.phone.length !== 10) {
      toast.error("Enter a valid 10 digit phone number");
      return false;
    }

    if (address.pincode.length !== 6) {
      toast.error("Enter a valid 6 digit pincode");
      return false;
    }

    return true;
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!validateCheckout()) return;

    try {
      setPlacingOrder(true);

      const orderRes = await axiosInstance.post("/create-Order-From-Cart", {
        paymentType,
        address,
      });

     const orderId = orderRes.data?.order?._id;

      if (!orderId) {
        toast.error("Order could not be created");
        return;
      }

      if (paymentType === "COD") {
        toast.success("Order placed successfully");
        navigate("/orders");
        return;
      }

      if (!window.Razorpay) {
        toast.error("Payment gateway is not ready. Please try again.");
        return;
      }

      const razorpayRes = await createRazorpayOrder(orderId);
      const { id: razorpayOrderId, amount } = razorpayRes.data?.data || {};

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency: "INR",
        name: "SahimonCart",
        description: "Secure checkout payment",
        order_id: razorpayOrderId,
        prefill: {
          name: address.name,
          contact: address.phone,
        },
        handler: async (response) => {
          try {
            await verifyPayment(response);
            toast.success("Payment successful");
            navigate("/orders");
          } catch (error) {
            toast.error("Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setPlacingOrder(false),
        },
        theme: { color: "#0f6b5f" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error(error.response?.data?.message || "Payment failed");
    } finally {
      if (paymentType === "COD") setPlacingOrder(false);
      if (paymentType === "ONLINE") setPlacingOrder(false);
    }
  };

  if (pageLoading) {
    return (
      <main className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-state-card" aria-live="polite" aria-busy="true">
            <Loader2 className="checkout-spinner" size={30} aria-hidden="true" />
            <h2>Preparing checkout</h2>
            <p>Loading cart, profile, and shipping details.</p>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-state-card">
            <PackageSearch size={38} aria-hidden="true" />
            <h2>Checkout unavailable</h2>
            <p>{errorMessage}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="checkout-page">
        <div className="checkout-shell">
          <div className="checkout-state-card">
            <ShoppingBag size={38} aria-hidden="true" />
            <h2>Your cart is empty</h2>
            <p>Add products to your cart before continuing to checkout.</p>
            <Link to="/">Continue shopping</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <div className="checkout-shell">
        <Link to="/cart" className="checkout-back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to cart
        </Link>

        <header className="checkout-header">
          <span>
            <ShieldCheck size={16} aria-hidden="true" />
            Secure checkout
          </span>
          <h1>Complete Your Order</h1>
          <p>Confirm shipping details, choose a payment method, and place your order.</p>
        </header>

        <div className="checkout-steps" aria-label="Checkout progress">
          <span className="step active">Cart</span>
          <span className="step active">Address</span>
          <span className={`step ${isAddressComplete ? "active" : ""}`}>Payment</span>
          <span className="step">Success</span>
        </div>

        <div className="checkout-layout">
          <section className="checkout-main-card" aria-labelledby="shipping-title">
            <div className="checkout-section-heading">
              <span>
                <MapPin size={16} aria-hidden="true" />
                Shipping address
              </span>
              <h2 id="shipping-title">Delivery Details</h2>
            </div>

            <form className="checkout-form" onSubmit={placeOrder}>
              {ADDRESS_FIELDS.map((field) => (
                <label
                  className={`checkout-field checkout-field--${field.span}`}
                  key={field.name}
                >
                  <span>{field.label}</span>
                  <input
                    name={field.name}
                    type={field.type}
                    value={address[field.name]}
                    onChange={handleChange}
                    autoComplete={field.name}
                    inputMode={
                      field.name === "phone" || field.name === "pincode"
                        ? "numeric"
                        : "text"
                    }
                    required
                  />
                </label>
              ))}

              <div className="checkout-payment-block">
                <div className="checkout-section-heading">
                  <span>
                    <CreditCard size={16} aria-hidden="true" />
                    Payment method
                  </span>
                  <h2>Choose Payment</h2>
                </div>

                <div className="payment-method">
                  <label className={`payment-option ${paymentType === "ONLINE" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="ONLINE"
                      checked={paymentType === "ONLINE"}
                      onChange={(event) => setPaymentType(event.target.value)}
                    />
                    <span>
                      <CreditCard size={19} aria-hidden="true" />
                      <strong>Online Payment</strong>
                      <small>Pay securely with Razorpay</small>
                    </span>
                  </label>

                  <label className={`payment-option ${paymentType === "COD" ? "selected" : ""}`}>
                    <input
                      type="radio"
                      name="paymentType"
                      value="COD"
                      checked={paymentType === "COD"}
                      onChange={(event) => setPaymentType(event.target.value)}
                    />
                    <span>
                      <Wallet size={19} aria-hidden="true" />
                      <strong>Cash on Delivery</strong>
                      <small>Pay when the order arrives</small>
                    </span>
                  </label>
                </div>
              </div>

              <button type="submit" disabled={placingOrder} className="pay-btn">
                {placingOrder ? (
                  <>
                    <Loader2 size={18} aria-hidden="true" />
                    Processing
                  </>
                ) : paymentType === "COD" ? (
                  "Place order"
                ) : (
                  `Pay ${formatPrice(subtotal)}`
                )}
              </button>
            </form>
          </section>

          <aside className="checkout-summary-card" aria-labelledby="summary-title">
            <div className="checkout-section-heading">
              <span>
                <ShoppingBag size={16} aria-hidden="true" />
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
              <h2 id="summary-title">Order Summary</h2>
            </div>

            <div className="order-items">
              {items.map((item) => {
                const itemId = getItemId(item);
                const name = getItemName(item);
                const image = getItemImage(item);
                const quantity = Number(item.quantity) || 1;
                const itemTotal = getItemPrice(item) * quantity;

                return (
                  <div className="summary-item" key={itemId || name}>
                    <div className="summary-image">
                      {image ? (
                        <img src={image} alt={name} loading="lazy" />
                      ) : (
                        <div className="summary-image-fallback" role="img" aria-label={name}>
                          {getInitials(name)}
                        </div>
                      )}
                    </div>

                    <div className="summary-copy">
                      <p>{name}</p>
                      <span>Qty {quantity}</span>
                    </div>

                    <strong>{formatPrice(itemTotal)}</strong>
                  </div>
                );
              })}
            </div>

            <div className="summary-lines">
              <div>
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>Calculated before payment</strong>
              </div>
              <div className="summary-total">
                <span>Total</span>
                <strong>{formatPrice(subtotal)}</strong>
              </div>
            </div>

            <div className="checkout-trust-list">
              <span>
                <ShieldCheck size={16} aria-hidden="true" />
                Encrypted payment flow
              </span>
              <span>
                <Truck size={16} aria-hidden="true" />
                Delivery details verified at dispatch
              </span>
              <span>
                <CheckCircle2 size={16} aria-hidden="true" />
                Order confirmation after payment
              </span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
