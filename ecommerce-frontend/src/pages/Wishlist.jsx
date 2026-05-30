import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Loader2,
  PackageSearch,
  Search,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { getUserWishlist, removeFromWishlist } from "../api/wishlistApi";
import { addToCart } from "../api/cartApi";
import "../styles/wishlist.css";

const SORT_OPTIONS = [
  { value: "recent", label: "Recently saved" },
  { value: "name", label: "Name A-Z" },
  { value: "price-low", label: "Price low-high" },
  { value: "price-high", label: "Price high-low" },
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

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const getWishlistProduct = (item) => {
  if (item?.productId && typeof item.productId === "object") return item.productId;
  return item || {};
};

const getProductId = (product, fallback) => {
  if (!product) return fallback || "";
  return product._id || product.id || fallback || "";
};

const getPriceNumber = (product) => {
  const value = Number(product?.salePrice || product?.price || 0);
  return Number.isFinite(value) ? value : 0;
};

const hasSalePrice = (product) => {
  const price = Number(product?.price);
  const salePrice = Number(product?.salePrice);
  return price > 0 && salePrice > 0 && salePrice < price;
};

const getDiscountPercent = (product) => {
  if (!hasSalePrice(product)) return 0;

  return Math.round(
    ((Number(product.price) - Number(product.salePrice)) / Number(product.price)) * 100
  );
};

const getStockState = (product) => {
  const stock = Number(product?.stock);

  if (!Number.isFinite(stock)) return { label: "Available", tone: "neutral", isOut: false };
  if (stock <= 0) return { label: "Out of stock", tone: "danger", isOut: true };
  if (stock <= 5) return { label: `${stock} left`, tone: "warning", isOut: false };

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

const Wishlist = () => {
  const navigate = useNavigate();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState("recent");
  const [actionId, setActionId] = useState("");

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await getUserWishlist();
      setWishlist(normalizeArray(res.data?.data));
    } catch (error) {
      console.error("Wishlist load error:", error);
      setWishlist([]);
      setErrorMessage("We could not load your wishlist right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const products = useMemo(() => {
    return wishlist
      .map((item) => {
        const product = getWishlistProduct(item);
        const productId = getProductId(product, item.productId || item._id);

        return {
          wishlistId: item._id || productId,
          productId,
          product,
        };
      })
      .filter((entry) => entry.productId);
  }, [wishlist]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const searched = products.filter(({ product }) => {
      if (!query) return true;

      return [product.name, product.brand, product.description].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });

    return [...searched].sort((a, b) => {
      if (sortMode === "name") {
        return String(a.product.name || "").localeCompare(String(b.product.name || ""));
      }

      if (sortMode === "price-low") {
        return getPriceNumber(a.product) - getPriceNumber(b.product);
      }

      if (sortMode === "price-high") {
        return getPriceNumber(b.product) - getPriceNumber(a.product);
      }

      return 0;
    });
  }, [products, searchTerm, sortMode]);

  const stats = useMemo(() => {
    const saleCount = products.filter(({ product }) => hasSalePrice(product)).length;
    const inStockCount = products.filter(({ product }) => !getStockState(product).isOut).length;
    const prices = products.map(({ product }) => getPriceNumber(product)).filter((price) => price > 0);

    return {
      total: products.length,
      saleCount,
      inStockCount,
      lowestPrice: prices.length ? Math.min(...prices) : 0,
    };
  }, [products]);

  const handleRemove = async (productId) => {
    try {
      setActionId(`${productId}-remove`);

      await removeFromWishlist(productId);

      setWishlist((current) =>
        current.filter((item) => {
          const product = getWishlistProduct(item);
          return getProductId(product, item.productId || item._id) !== productId;
        })
      );

      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Remove wishlist error:", error);
      toast.error(error.response?.data?.message || "Failed to remove");
    } finally {
      setActionId("");
    }
  };

  const handleAddToCart = async (product) => {
    const productId = getProductId(product);
    const stock = getStockState(product);

    if (stock.isOut) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      setActionId(`${productId}-cart`);

      await addToCart(productId);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setActionId("");
    }
  };

  if (loading) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-shell">
          <div className="wishlist-state-card" aria-live="polite" aria-busy="true">
            <Loader2 className="wishlist-spinner" size={30} aria-hidden="true" />
            <h2>Loading wishlist</h2>
            <p>Fetching your saved products.</p>
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-shell">
          <div className="wishlist-state-card">
            <PackageSearch size={38} aria-hidden="true" />
            <h2>Wishlist unavailable</h2>
            <p>{errorMessage}</p>
            <button type="button" onClick={loadWishlist}>
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!products.length) {
    return (
      <main className="wishlist-page">
        <div className="wishlist-shell">
          <div className="wishlist-state-card">
            <Heart size={38} aria-hidden="true" />
            <h2>Your wishlist is empty</h2>
            <p>Save favorite products here so you can return to them quickly.</p>
            <Link to="/">
              Start shopping
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <div className="wishlist-shell">
        <Link to="/" className="wishlist-back-link">
          <ArrowLeft size={18} aria-hidden="true" />
          Continue shopping
        </Link>

        <header className="wishlist-header">
          <span>
            <Heart size={16} aria-hidden="true" />
            Saved products
          </span>
          <h1>Your Wishlist</h1>
          <p>Compare saved items, move products to cart, or clean up your shortlist.</p>
        </header>

        <section className="wishlist-stats" aria-label="Wishlist summary">
          <div>
            <span>Saved</span>
            <strong>{stats.total}</strong>
          </div>
          <div>
            <span>In stock</span>
            <strong>{stats.inStockCount}</strong>
          </div>
          <div>
            <span>On sale</span>
            <strong>{stats.saleCount}</strong>
          </div>
          <div>
            <span>From</span>
            <strong>{stats.lowestPrice > 0 ? formatPrice(stats.lowestPrice) : "NA"}</strong>
          </div>
        </section>

        <section className="wishlist-toolbar" aria-label="Wishlist tools">
          <div className="wishlist-search">
            <Search size={20} aria-hidden="true" />
            <label className="wishlist-sr-only" htmlFor="wishlist-search">
              Search wishlist
            </label>
            <input
              id="wishlist-search"
              type="search"
              placeholder="Search saved products or brands..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <label className="wishlist-sort">
            <span className="wishlist-sr-only">Sort wishlist</span>
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              {SORT_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        {filteredProducts.length > 0 ? (
          <section className="wishlist-grid" aria-label="Saved products">
            {filteredProducts.map(({ productId, product }) => {
              const sale = hasSalePrice(product);
              const stock = getStockState(product);
              const isRemoving = actionId === `${productId}-remove`;
              const isAdding = actionId === `${productId}-cart`;

              return (
                <article className="wishlist-card" key={productId}>
                  <Link to={`/product/${productId}`} className="wishlist-image">
                    <WishlistImage product={product} />

                    {sale && (
                      <span className="wishlist-badge">
                        <Tag size={14} aria-hidden="true" />
                        {getDiscountPercent(product)}% off
                      </span>
                    )}
                  </Link>

                  <div className="wishlist-content">
                    <div className="wishlist-meta">
                      <span>
                        <ShoppingBag size={15} aria-hidden="true" />
                        {product.brand || "SahimonCart"}
                      </span>
                      <span className={`wishlist-stock wishlist-stock--${stock.tone}`}>
                        {stock.label}
                      </span>
                    </div>

                    <Link to={`/product/${productId}`} className="wishlist-name">
                      {product.name || "Product"}
                    </Link>

                    <div className="wishlist-price">
                      {sale ? (
                        <>
                          <strong>{formatPrice(product.salePrice)}</strong>
                          <span>{formatPrice(product.price)}</span>
                        </>
                      ) : (
                        <strong>{formatPrice(product.price)}</strong>
                      )}
                    </div>

                    <div className="wishlist-actions">
                      <button
                        type="button"
                        className="wishlist-cart-btn"
                        onClick={() => handleAddToCart(product)}
                        disabled={isAdding || isRemoving || stock.isOut}
                      >
                        {isAdding ? (
                          <>
                            <Loader2 size={17} aria-hidden="true" />
                            Adding
                          </>
                        ) : stock.isOut ? (
                          "Out of stock"
                        ) : (
                          <>
                            <ShoppingCart size={17} aria-hidden="true" />
                            Add to cart
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="wishlist-remove-btn"
                        onClick={() => handleRemove(productId)}
                        disabled={isRemoving || isAdding}
                        aria-label={`Remove ${product.name || "product"} from wishlist`}
                      >
                        {isRemoving ? (
                          <Loader2 size={17} aria-hidden="true" />
                        ) : (
                          <Trash2 size={17} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <div className="wishlist-state-card">
            <PackageSearch size={38} aria-hidden="true" />
            <h2>No saved products found</h2>
            <p>Try a different search keyword or reset the sort option.</p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSortMode("recent");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

const WishlistImage = ({ product }) => {
  const [failed, setFailed] = useState(false);
  const src = product?.images?.[0];

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={product.name || "Product"}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="wishlist-image-fallback" role="img" aria-label={product.name || "Product"}>
      <ShoppingBag size={30} aria-hidden="true" />
      <strong>{getInitials(product.name)}</strong>
    </div>
  );
};

export default Wishlist;
