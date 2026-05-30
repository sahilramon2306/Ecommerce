import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getUserCart,
  updateCartQty,
  removeCartItem,
  clearCart,
} from "../api/cartApi";
import "../styles/cart.css";

const FREE_SHIPPING_THRESHOLD = 5000;
const VALID_COUPON = "SAVE10";

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

const getItemProductId = (item) => {
  if (!item) return "";
  if (typeof item.productId === "object") return item.productId?._id || "";
  return item.productId || item._id || "";
};

const getItemName = (item) =>
  item?.name || item?.productId?.name || "Product";

const getItemImage = (item) =>
  item?.image || item?.images?.[0] || item?.productId?.images?.[0] || "";

const getItemPrice = (item) => {
  const value = Number(item?.price || item?.salePrice || item?.productId?.salePrice || item?.productId?.price);
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

const Cart = () => {
  const navigate = useNavigate();

  const [cart, setCart] = useState({ items: [], grandTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [pincode, setPincode] = useState("");
  const [shippingChecked, setShippingChecked] = useState(false);
  const [shippingCost, setShippingCost] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCart = useCallback(async ({ quiet = false } = {}) => {
    try {
      if (!quiet) setLoading(true);
      setErrorMessage("");

      const res = await getUserCart();
      setCart(res.data?.data || { items: [], grandTotal: 0 });
    } catch (error) {
      console.error("Cart load error:", error);
      setCart({ items: [], grandTotal: 0 });
      setErrorMessage("We could not load your cart right now.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const items = useMemo(() => normalizeItems(cart.items), [cart.items]);

  const subtotal = useMemo(() => {
    const apiTotal = Number(cart.grandTotal);

    if (Number.isFinite(apiTotal) && apiTotal > 0) return apiTotal;

    return items.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      return sum + getItemPrice(item) * quantity;
    }, 0);
  }, [cart.grandTotal, items]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items]
  );

  const discount = appliedCoupon === VALID_COUPON ? subtotal * 0.1 : 0;
  const freeShippingRemaining = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const finalTotal = Math.max(subtotal - discount + shippingCost, 0);

  const applyCoupon = () => {
    const normalizedCoupon = coupon.trim().toUpperCase();

    if (!normalizedCoupon) {
      toast.error("Enter a coupon code");
      return;
    }

    if (normalizedCoupon !== VALID_COUPON) {
      setAppliedCoupon("");
      toast.error("Invalid coupon");
      return;
    }

    setAppliedCoupon(VALID_COUPON);
    setCoupon(VALID_COUPON);
    toast.success("Coupon applied");
  };

  const removeCoupon = () => {
    setAppliedCoupon("");
    setCoupon("");
    toast.success("Coupon removed");
  };

  const estimateShipping = () => {
    const cleanPincode = pincode.trim();

    if (!/^\d{6}$/.test(cleanPincode)) {
      toast.error("Enter a valid 6 digit pincode");
      return;
    }

    const cost = subtotal >= FREE_SHIPPING_THRESHOLD || cleanPincode.startsWith("7") ? 0 : 99;

    setShippingCost(cost);
    setShippingChecked(true);
    toast.success(cost === 0 ? "Free shipping available" : "Shipping estimate updated");
  };

  const handleQuantityUpdate = async (item, nextQuantity) => {
    const productId = getItemProductId(item);
    const quantity = Math.max(1, nextQuantity);

    if (!productId) {
      toast.error("Unable to update this item");
      return;
    }

    try {
      setUpdatingId(`${productId}-qty`);
      await updateCartQty(productId, quantity);
      await loadCart({ quiet: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update quantity");
    } finally {
      setUpdatingId("");
    }
  };

  const handleRemoveItem = async (item) => {
    const productId = getItemProductId(item);

    if (!productId) {
      toast.error("Unable to remove this item");
      return;
    }

    try {
      setUpdatingId(`${productId}-remove`);
      await removeCartItem(productId);
      await loadCart({ quiet: true });
      toast.success("Item removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove item");
    } finally {
      setUpdatingId("");
    }
  };

  const handleClearCart = async () => {
    if (!items.length) return;

    const confirmed = window.confirm("Clear all items from your cart?");
    if (!confirmed) return;

    try {
      setClearing(true);
      await clearCart();
      setAppliedCoupon("");
      setCoupon("");
      setShippingCost(0);
      setShippingChecked(false);
      await loadCart({ quiet: true });
      toast.success("Cart cleared");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to clear cart");
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <main className="cart-page">
        <div className="cart-shell">
          <CartSkeleton />
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="cart-page">
        <div className="cart-shell">
          <StateCard
            title="Cart unavailable"
            message={errorMessage}
            actionLabel="Try again"
            onAction={() => loadCart()}
          />
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="cart-page">
        <div className="cart-shell">
          <StateCard
            title="Your cart is empty"
            message="Add a few products and they will appear here for a faster checkout."
            actionLabel="Continue shopping"
            actionTo="/"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <div className="cart-shell">
        <div className="cart-header">
          <Link to="/" className="cart-back-link">
            <ArrowLeft size={18} aria-hidden="true" />
            Continue shopping
          </Link>

          <div className="cart-title-block">
            <span>
              <ShoppingBag size={16} aria-hidden="true" />
              Shopping cart
            </span>
            <h1>Your Cart</h1>
            <p>
              {itemCount} item{itemCount === 1 ? "" : "s"} ready for checkout
            </p>
          </div>
        </div>

        <div className="cart-layout">
          <section className="cart-items-panel" aria-labelledby="cart-items-title">
            <div className="cart-panel-heading">
              <div>
                <h2 id="cart-items-title">Cart Items</h2>
                <p>Review quantities, pricing, and availability before checkout.</p>
              </div>

              <button
                type="button"
                className="cart-clear-link"
                onClick={handleClearCart}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <Loader2 size={16} aria-hidden="true" />
                    Clearing
                  </>
                ) : (
                  <>
                    <Trash2 size={16} aria-hidden="true" />
                    Clear cart
                  </>
                )}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {items.map((item) => {
                const productId = getItemProductId(item);
                const name = getItemName(item);
                const image = getItemImage(item);
                const price = getItemPrice(item);
                const quantity = Number(item.quantity) || 1;
                const itemTotal = price * quantity;
                const isQtyUpdating = updatingId === `${productId}-qty`;
                const isRemoving = updatingId === `${productId}-remove`;

                return (
                  <motion.article
                    className="cart-item-card"
                    key={productId || name}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 24 }}
                    transition={{ duration: 0.22 }}
                  >
                    <Link to={productId ? `/product/${productId}` : "/"} className="cart-item-media">
                      {image ? (
                        <img src={image} alt={name} loading="lazy" />
                      ) : (
                        <div className="cart-image-fallback" role="img" aria-label={name}>
                          <ShoppingBag size={26} aria-hidden="true" />
                          <strong>{getInitials(name)}</strong>
                        </div>
                      )}
                    </Link>

                    <div className="cart-item-info">
                      <Link to={productId ? `/product/${productId}` : "/"}>{name}</Link>
                      <span>{formatPrice(price)} each</span>
                    </div>

                    <div className="cart-qty-control" aria-label={`Quantity for ${name}`}>
                      <button
                        type="button"
                        onClick={() => handleQuantityUpdate(item, quantity - 1)}
                        disabled={quantity <= 1 || isQtyUpdating || isRemoving}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} aria-hidden="true" />
                      </button>

                      <strong>
                        {isQtyUpdating ? (
                          <Loader2 size={16} aria-hidden="true" />
                        ) : (
                          quantity
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={() => handleQuantityUpdate(item, quantity + 1)}
                        disabled={isQtyUpdating || isRemoving}
                        aria-label="Increase quantity"
                      >
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </div>

                    <div className="cart-item-total">
                      <span>Item total</span>
                      <strong>{formatPrice(itemTotal)}</strong>
                    </div>

                    <button
                      type="button"
                      className="cart-remove-btn"
                      onClick={() => handleRemoveItem(item)}
                      disabled={isRemoving || isQtyUpdating}
                      aria-label={`Remove ${name}`}
                    >
                      {isRemoving ? (
                        <Loader2 size={18} aria-hidden="true" />
                      ) : (
                        <X size={18} aria-hidden="true" />
                      )}
                    </button>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </section>

          <aside className="cart-summary-panel" aria-labelledby="cart-summary-title">
            <div className="cart-summary-card">
              <div className="cart-summary-heading">
                <span>
                  <CreditCard size={16} aria-hidden="true" />
                  Checkout
                </span>
                <h2 id="cart-summary-title">Order Summary</h2>
              </div>

              <div className="cart-shipping-progress">
                {freeShippingRemaining > 0 ? (
                  <p>{formatPrice(freeShippingRemaining)} away from free shipping</p>
                ) : (
                  <p>Free shipping unlocked</p>
                )}

                <div className="cart-progress-bar" aria-hidden="true">
                  <span style={{ width: `${freeShippingProgress}%` }} />
                </div>
              </div>

              <div className="cart-form-row">
                <label htmlFor="cart-coupon">Coupon</label>
                <div>
                  <input
                    id="cart-coupon"
                    type="text"
                    placeholder="SAVE10"
                    value={coupon}
                    onChange={(event) => setCoupon(event.target.value)}
                    disabled={Boolean(appliedCoupon)}
                  />

                  {appliedCoupon ? (
                    <button type="button" onClick={removeCoupon}>
                      Remove
                    </button>
                  ) : (
                    <button type="button" onClick={applyCoupon}>
                      Apply
                    </button>
                  )}
                </div>
              </div>

              <div className="cart-form-row">
                <label htmlFor="cart-pincode">Shipping estimate</label>
                <div>
                  <input
                    id="cart-pincode"
                    type="text"
                    inputMode="numeric"
                    maxLength="6"
                    placeholder="Pincode"
                    value={pincode}
                    onChange={(event) =>
                      setPincode(event.target.value.replace(/\D/g, ""))
                    }
                  />
                  <button type="button" onClick={estimateShipping}>
                    Check
                  </button>
                </div>
              </div>

              <div className="cart-summary-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                <div>
                  <span>Discount</span>
                  <strong className="cart-discount">-{formatPrice(discount)}</strong>
                </div>

                <div>
                  <span>Shipping</span>
                  <strong>
                    {shippingChecked || shippingCost > 0
                      ? shippingCost === 0
                        ? "Free"
                        : formatPrice(shippingCost)
                      : "Check pincode"}
                  </strong>
                </div>

                <div className="cart-summary-total">
                  <span>Total</span>
                  <strong>{formatPrice(finalTotal)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="cart-checkout-btn"
                onClick={() => navigate("/checkout")}
              >
                Proceed to checkout
                <ArrowRight size={18} aria-hidden="true" />
              </button>

              <div className="cart-trust-list" aria-label="Checkout benefits">
                <span>
                  <ShieldCheck size={16} aria-hidden="true" />
                  Secure checkout
                </span>
                <span>
                  <Truck size={16} aria-hidden="true" />
                  Delivery estimate before payment
                </span>
                <span>
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Stock confirmed at order placement
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

const CartSkeleton = () => (
  <div className="cart-skeleton-wrap" aria-live="polite" aria-busy="true">
    <div className="cart-skeleton-heading">
      <Loader2 className="cart-spinner" size={22} aria-hidden="true" />
      Loading cart
    </div>

    <div className="cart-layout">
      <div className="cart-items-panel">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="cart-skeleton-item" key={index}>
            <div className="cart-skeleton-media" />
            <div className="cart-skeleton-lines">
              <span />
              <span />
            </div>
            <div className="cart-skeleton-pill" />
          </div>
        ))}
      </div>

      <div className="cart-summary-panel">
        <div className="cart-summary-card">
          <div className="cart-skeleton-line" />
          <div className="cart-skeleton-line" />
          <div className="cart-skeleton-line cart-skeleton-line--short" />
        </div>
      </div>
    </div>
  </div>
);

const StateCard = ({ title, message, actionLabel, actionTo, onAction }) => {
  const content = (
    <>
      <PackageSearch size={38} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && <span>{actionLabel}</span>}
    </>
  );

  if (actionTo) {
    return (
      <Link to={actionTo} className="cart-state-card cart-state-card--action">
        {content}
      </Link>
    );
  }

  return (
    <div className="cart-state-card">
      <PackageSearch size={38} aria-hidden="true" />
      <h2>{title}</h2>
      <p>{message}</p>
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default Cart;
