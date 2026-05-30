import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Heart,
  Loader2,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Tag,
  Truck,
} from "lucide-react";
import { getSingleProduct } from "../api/productApi";
import { addToCart } from "../api/cartApi";
import {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist,
} from "../api/wishlistApi";
import { toast } from "react-hot-toast";
import RatingSummary from "../pages/RatingSummary";
import ReviewsList from "../pages/ReviewsList";
import ReviewForm from "../pages/ReviewForm";
import "../styles/product-detail.css";

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const getPriceNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatPrice = (value) => priceFormatter.format(getPriceNumber(value));

const hasSalePrice = (product) => {
  const price = getPriceNumber(product?.price);
  const salePrice = getPriceNumber(product?.salePrice);
  return price > 0 && salePrice > 0 && salePrice < price;
};

const getDiscountPercent = (product) => {
  if (!hasSalePrice(product)) return 0;

  return Math.round(
    ((getPriceNumber(product.price) - getPriceNumber(product.salePrice)) /
      getPriceNumber(product.price)) *
      100
  );
};

const getStockState = (product) => {
  const stock = Number(product?.stock);

  if (!Number.isFinite(stock)) {
    return { label: "Available", tone: "neutral", isOut: false };
  }

  if (stock <= 0) {
    return { label: "Out of stock", tone: "danger", isOut: true };
  }

  if (stock <= 5) {
    return { label: `${stock} left`, tone: "warning", isOut: false };
  }

  return { label: "In stock", tone: "success", isOut: false };
};

const getInitials = (value = "") => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "SC";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [inWishlist, setInWishlist] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const res = await getSingleProduct(id);
        if (!isCurrent) return;

        setProduct(res.data?.data || null);
        setSelectedImage(0);
        setQuantity(1);
        setImageFailed(false);
      } catch (error) {
        console.error("Product fetch error:", error);

        if (isCurrent) {
          setProduct(null);
          toast.error("Product not found");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    const checkWishlist = async () => {
      if (!localStorage.getItem("token")) return;

      try {
        const res = await getUserWishlist();
        if (!isCurrent) return;

        const wishlist = Array.isArray(res.data?.data) ? res.data.data : [];
        const exists = wishlist.some((item) => {
          const productId = item.productId?._id || item.productId || item._id;
          return productId === id;
        });

        setInWishlist(exists);
      } catch (error) {
        console.error("Wishlist check error:", error);
      }
    };

    fetchProduct();
    checkWishlist();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  useEffect(() => {
    setImageFailed(false);
  }, [selectedImage, product?.images]);

  const productImages = useMemo(() => {
    if (!Array.isArray(product?.images)) return [];
    return product.images.filter(Boolean);
  }, [product]);

  const activeImage = productImages[selectedImage];
  const sale = hasSalePrice(product);
  const discountPercent = getDiscountPercent(product);
  const stockState = getStockState(product);
  const stockCount = Number(product?.stock);
  const hasKnownStock = Number.isFinite(stockCount);
  const maxQuantity = stockState.isOut ? 1 : hasKnownStock ? stockCount : 99;
  const currentPrice = sale ? product.salePrice : product?.price;

  const handleQuantityChange = (nextQuantity) => {
    setQuantity(Math.min(maxQuantity, Math.max(1, nextQuantity)));
  };

  const requireLogin = () => {
    if (localStorage.getItem("token")) return true;

    toast.error("Please login first");
    navigate("/login");
    return false;
  };

  const handleAddToCart = async () => {
    if (!product || !requireLogin()) return;

    if (stockState.isOut) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      setActionLoading("cart");
      await addToCart(product._id, quantity);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setActionLoading("");
    }
  };

  const handleBuyNow = async () => {
    if (!product || !requireLogin()) return;

    if (stockState.isOut) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      setActionLoading("buy");
      await addToCart(product._id, quantity);
      navigate("/checkout");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to continue checkout");
    } finally {
      setActionLoading("");
    }
  };

  const handleWishlistToggle = async () => {
    if (!product || !requireLogin()) return;

    try {
      setActionLoading("wishlist");

      if (inWishlist) {
        await removeFromWishlist(product._id);
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product._id);
        setInWishlist(true);
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Wishlist error");
    } finally {
      setActionLoading("");
    }
  };

  if (loading) {
    return (
      <main className="pdp-page">
        <div className="pdp-shell">
          <div className="pdp-loading-card" aria-live="polite" aria-busy="true">
            <Loader2 className="pdp-spinner" size={28} aria-hidden="true" />
            <h2>Loading product</h2>
            <p>Preparing the product details for you.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="pdp-page">
        <div className="pdp-shell">
          <div className="pdp-state-card">
            <PackageSearch size={38} aria-hidden="true" />
            <h2>Product not found</h2>
            <p>This product may be unavailable or has been removed.</p>
            <Link to="/">Back to home</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pdp-page">
      <div className="pdp-shell">
        <Link to="/" className="pdp-back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          Back to shopping
        </Link>

        <section className="pdp-layout" aria-labelledby="product-title">
          <div className="pdp-gallery">
            <div className="pdp-main-image">
              {activeImage && !imageFailed ? (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="pdp-image"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div className="pdp-image-fallback" role="img" aria-label={product.name}>
                  <ShoppingBag size={42} aria-hidden="true" />
                  <strong>{getInitials(product.name)}</strong>
                </div>
              )}

              {sale && (
                <span className="pdp-sale-badge">
                  <Tag size={15} aria-hidden="true" />
                  {discountPercent}% off
                </span>
              )}
            </div>

            {productImages.length > 1 && (
              <div className="pdp-thumbnails" aria-label="Product images">
                {productImages.map((image, index) => (
                  <button
                    type="button"
                    className={`pdp-thumbnail ${selectedImage === index ? "is-active" : ""}`}
                    key={`${image}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`View product image ${index + 1}`}
                    aria-pressed={selectedImage === index}
                  >
                    <img src={image} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pdp-info">
            <div className="pdp-meta-row">
              <span className="pdp-brand">
                <ShoppingBag size={16} aria-hidden="true" />
                {product.brand || "SahimonCart"}
              </span>

              <span className={`pdp-stock pdp-stock--${stockState.tone}`}>
                {stockState.label}
              </span>
            </div>

            <h1 id="product-title">{product.name}</h1>

            <div className="pdp-rating-pill">
              <Star size={16} aria-hidden="true" />
              Customer reviewed
            </div>

            <div className="pdp-price-row">
              {sale ? (
                <>
                  <strong>{formatPrice(product.salePrice)}</strong>
                  <span>{formatPrice(product.price)}</span>
                  <em>Save {formatPrice(getPriceNumber(product.price) - getPriceNumber(product.salePrice))}</em>
                </>
              ) : (
                <strong>{formatPrice(currentPrice)}</strong>
              )}
            </div>

            <div className="pdp-service-grid" aria-label="Shopping benefits">
              <div>
                <Truck size={18} aria-hidden="true" />
                <span>Fast delivery</span>
              </div>
              <div>
                <ShieldCheck size={18} aria-hidden="true" />
                <span>Secure checkout</span>
              </div>
              <div>
                <RotateCcw size={18} aria-hidden="true" />
                <span>Easy returns</span>
              </div>
            </div>

            <section className="pdp-description" aria-labelledby="description-title">
              <h2 id="description-title">Description</h2>
              <p>
                {product.description ||
                  "Product details are being updated. Please check back soon for more information."}
              </p>
            </section>

            <div className="pdp-purchase-panel">
              <div className="pdp-quantity">
                <div>
                  <label htmlFor="product-quantity">Quantity</label>
                  <span>
                    {hasKnownStock && !stockState.isOut
                      ? `Maximum ${maxQuantity}`
                      : "Adjust before checkout"}
                  </span>
                </div>

                <div className="pdp-qty-control">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>

                  <input
                    id="product-quantity"
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={quantity}
                    onChange={(event) => handleQuantityChange(Number(event.target.value) || 1)}
                    disabled={stockState.isOut}
                  />

                  <button
                    type="button"
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity || stockState.isOut}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="pdp-actions">
                <button
                  type="button"
                  className="pdp-primary-btn"
                  onClick={handleAddToCart}
                  disabled={stockState.isOut || actionLoading === "cart"}
                >
                  {actionLoading === "cart" ? (
                    <>
                      <Loader2 size={18} aria-hidden="true" />
                      Adding
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} aria-hidden="true" />
                      Add to cart
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="pdp-secondary-btn"
                  onClick={handleBuyNow}
                  disabled={stockState.isOut || actionLoading === "buy"}
                >
                  {actionLoading === "buy" ? (
                    <>
                      <Loader2 size={18} aria-hidden="true" />
                      Opening checkout
                    </>
                  ) : (
                    <>
                      <CreditCard size={18} aria-hidden="true" />
                      Buy now
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={`pdp-wishlist-btn ${inWishlist ? "is-active" : ""}`}
                  onClick={handleWishlistToggle}
                  disabled={actionLoading === "wishlist"}
                  aria-pressed={inWishlist}
                >
                  {actionLoading === "wishlist" ? (
                    <>
                      <Loader2 size={18} aria-hidden="true" />
                      Updating
                    </>
                  ) : (
                    <>
                      <Heart size={18} aria-hidden="true" />
                      {inWishlist ? "In wishlist" : "Wishlist"}
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pdp-trust-note">
              <CheckCircle2 size={18} aria-hidden="true" />
              Price, stock, and checkout details are confirmed before order placement.
            </div>
          </div>
        </section>

        <section className="pdp-reviews" aria-labelledby="reviews-title">
          <div className="pdp-section-heading">
            <span>Customer feedback</span>
            <h2 id="reviews-title">Ratings & Reviews</h2>
          </div>

          <div className="pdp-review-grid">
            <div className="pdp-review-summary">
              <RatingSummary productId={id} refresh={refreshReviews} />
            </div>

            <div className="pdp-review-content">
              <ReviewsList productId={id} refresh={refreshReviews} />
              <ReviewForm
                productId={id}
                onReviewAdded={() => setRefreshReviews((current) => !current)}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ProductDetail;
