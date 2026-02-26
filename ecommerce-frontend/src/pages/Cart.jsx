import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSpring, animated } from "@react-spring/web";
import {
  getUserCart,
  updateCartQty,
  removeCartItem,
  clearCart,
} from "../api/cartApi";
import "../styles/cart.css";

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [], grandTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [pincode, setPincode] = useState("");
  const [shippingCost, setShippingCost] = useState(0);

  /* ================= LOAD CART ================= */

  const loadCart = async () => {
    try {
      const res = await getUserCart();
      setCart(res.data.data || { items: [], grandTotal: 0 });
    } catch {
      setCart({ items: [], grandTotal: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  /* ================= COUPON ================= */

  const applyCoupon = () => {
    if (coupon === "SAVE10") {
      setDiscount(cart.grandTotal * 0.1);
    } else {
      setDiscount(0);
      alert("Invalid coupon");
    }
  };

  /* ================= SHIPPING ================= */

  const estimateShipping = () => {
    if (pincode.startsWith("7")) setShippingCost(0);
    else setShippingCost(99);
  };

  const freeShippingThreshold = 5000;
  const remaining = freeShippingThreshold - cart.grandTotal;
  const progress = Math.min(
    (cart.grandTotal / freeShippingThreshold) * 100,
    100
  );

  const finalTotal = cart.grandTotal - discount + shippingCost;

  /* ================= ANIMATED TOTAL ================= */

  const spring = useSpring({
    number: finalTotal,
    from: { number: 0 },
    config: { tension: 120, friction: 14 },
  });

  /* ================= RIPPLE ================= */

  const createRipple = (e) => {
    const button = e.currentTarget;
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.nativeEvent.offsetX - diameter / 2}px`;
    circle.style.top = `${e.nativeEvent.offsetY - diameter / 2}px`;
    circle.classList.add("ripple");
    button.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
  };

  if (loading) return <div className="cart-loading">Loading...</div>;

  if (!cart.items.length)
    return (
      <div className="cart-empty">
        <h2>Your cart is empty</h2>
        <button onClick={() => navigate("/")}>Continue Shopping</button>
      </div>
    );

  return (
    <div className="cart-container">
      <h1 className="cart-title">My Cart</h1>

      <div className="cart-layout">
        {/* LEFT */}
        <div className="cart-left">
          <AnimatePresence>
            {cart.items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.4 }}
                className="cart-item"
              >
                <img
                  src={item.image || "https://via.placeholder.com/120"}
                  alt={item.name}
                />

                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>₹{item.price}</p>
                </div>

                <div className="qty-control">
                  <button
                    disabled={item.quantity <= 1}
                    onClick={() =>
                      updateCartQty(item.productId, item.quantity - 1).then(
                        loadCart
                      )
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateCartQty(item.productId, item.quantity + 1).then(
                        loadCart
                      )
                    }
                  >
                    +
                  </button>
                </div>

                <div className="item-total">
                  ₹{item.price * item.quantity}
                </div>

                <button
                  className="remove-btn"
                  onClick={() =>
                    removeCartItem(item.productId).then(loadCart)
                  }
                >
                  Remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* RIGHT */}
        <div className="cart-right">
          <div className="cart-summary">
            <div className="shipping-progress">
              {remaining > 0 ? (
                <p>₹{remaining} away from free shipping</p>
              ) : (
                <p>🎉 Free shipping unlocked!</p>
              )}

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="coupon-box">
              <input
                placeholder="Coupon"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
              />
              <button onClick={applyCoupon}>Apply</button>
            </div>

            <div className="shipping-box">
              <input
                placeholder="Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <button onClick={estimateShipping}>Check</button>
            </div>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cart.grandTotal}</span>
            </div>

            <div className="summary-row">
              <span>Discount</span>
              <span>- ₹{discount}</span>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <span>₹{shippingCost}</span>
            </div>

            <div className="summary-row total">
              <strong>Total</strong>
              <strong>
                ₹
                <animated.span>
                  {spring.number.to((n) => n.toFixed(0))}
                </animated.span>
              </strong>
            </div>

            <button
              className="checkout-btn ripple-btn"
              onClick={(e) => {
                createRipple(e);
                navigate("/checkout");
              }}
            >
              Proceed to Checkout
            </button>

            <button
              className="clear-btn"
              onClick={() => clearCart().then(loadCart)}
            >
              Clear Cart
            </button>

            <button
              className="drawer-toggle"
              onClick={() => setDrawerOpen(true)}
            >
              Open Mini Cart
            </button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="drawer-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />

            <motion.div
              className="cart-drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
            >
              <h3>Your Cart</h3>
              {cart.items.map((item) => (
                <div key={item.productId} className="drawer-item">
                  {item.name}
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Cart;