import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUserCart,
  updateCartQty,
  removeCartItem,
  clearCart,
} from "../api/cartApi";
import "../styles/cart.css";

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const res = await getUserCart();
      setCart(res.data.data);
    } catch {
      setCart({ items: [], grandTotal: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  if (loading) {
    return <div className="cart-loading">Loading your cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-container empty">
        <div className="empty-cart-wrapper">
          <div className="empty-icon-container">
            <svg
              className="empty-cart-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>

          <h2>Your cart is empty</h2>

          <p className="empty-cart-message">
            Looks like you haven’t added anything yet.<br />
            Start exploring our collection!
          </p>

          <button
            className="continue-shopping-btn"
            onClick={() => navigate("/")}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">My Cart</h1>

      <div className="cart-items-list">
        {cart.items.map((item) => (
          <div className="cart-item" key={item.productId}>
            <div className="cart-item-image">
              <img
                src={
                  item.image || item.images?.[0]
                    ? item.image || item.images[0]
                    : "https://via.placeholder.com/100x100?text=No+Image"
                }
                alt={item.name}
                loading="lazy"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/100x100?text=Error";
                }}
              />
            </div>

            <div className="cart-item-info">
              <h4 className="item-name">{item.name}</h4>
              <div className="item-price">
                ₹{item.price?.toLocaleString("en-IN") || item.price}
              </div>
            </div>

            <div className="cart-item-qty">
              <button
                className="qty-btn"
                onClick={() =>
                  updateCartQty(item.productId, item.quantity - 1).then(loadCart)
                }
                disabled={item.quantity <= 1}
              >
                −
              </button>

              <span className="qty-display">{item.quantity}</span>

              <button
                className="qty-btn"
                onClick={() =>
                  updateCartQty(item.productId, item.quantity + 1).then(loadCart)
                }
              >
                +
              </button>
            </div>

            <div className="cart-item-total">
              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
            </div>

            <button
              className="remove-btn"
              onClick={() => removeCartItem(item.productId).then(loadCart)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{cart.grandTotal?.toLocaleString("en-IN")}</span>
        </div>

        <div className="summary-row total">
          <strong>Total</strong>
          <strong>₹{cart.grandTotal?.toLocaleString("en-IN")}</strong>
        </div>

        <div className="cart-actions">
          <button className="clear-btn" onClick={() => clearCart().then(loadCart)}>
            Clear Cart
          </button>
          <button
            className="checkout-btn"
            onClick={() => navigate("/checkout")}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;