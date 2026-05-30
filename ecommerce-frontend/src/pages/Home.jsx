import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  PackageSearch,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  X,
} from "lucide-react";
import { getAllProducts, searchProducts, addToCart } from "../api/productApi";
import { getAllActiveCategories } from "../api/categoryApi";
import { toast } from "react-hot-toast";
import "../styles/home.css";

const PAGE_LIMIT = 12;

const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const getPriceNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatPrice = (value) => priceFormatter.format(getPriceNumber(value));

const hasSalePrice = (product) => {
  const price = getPriceNumber(product.price);
  const salePrice = getPriceNumber(product.salePrice);
  return price > 0 && salePrice > 0 && salePrice < price;
};

const getCurrentPrice = (product) =>
  hasSalePrice(product) ? getPriceNumber(product.salePrice) : getPriceNumber(product.price);

const getDiscountPercent = (product) => {
  if (!hasSalePrice(product)) return 0;

  return Math.round(
    ((getPriceNumber(product.price) - getPriceNumber(product.salePrice)) /
      getPriceNumber(product.price)) *
      100
  );
};

const getStockState = (product) => {
  const stock = Number(product.stock);

  if (!Number.isFinite(stock)) return { label: "Available", tone: "neutral" };
  if (stock <= 0) return { label: "Out of stock", tone: "danger" };
  if (stock <= 5) return { label: `${stock} left`, tone: "warning" };

  return { label: "In stock", tone: "success" };
};

const getInitials = (value = "") => {
  const words = String(value).trim().split(/\s+/).filter(Boolean);

  if (!words.length) return "SC";

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const Home = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [addingProductId, setAddingProductId] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    let isCurrent = true;

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);

        const res = await getAllActiveCategories();
        if (!isCurrent) return;

        const data = normalizeArray(res.data?.data);
        setCategories(data.filter((category) => !category.parent).slice(0, 8));
      } catch (error) {
        console.error("Category load failed:", error);
        if (isCurrent) setCategories([]);
      } finally {
        if (isCurrent) setCategoryLoading(false);
      }
    };

    loadCategories();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        if (debouncedSearch) {
          const res = await searchProducts(debouncedSearch);
          if (!isCurrent) return;

          const data = normalizeArray(res.data?.data);
          setProducts(data);
          setTotalProducts(res.data?.meta?.totalProducts || data.length);
          setTotalPages(1);
          return;
        }

        const res = await getAllProducts(currentPage, PAGE_LIMIT);
        if (!isCurrent) return;

        const data = normalizeArray(res.data?.data);
        setProducts(data);
        setTotalProducts(res.data?.meta?.totalProducts || data.length);
        setTotalPages(res.data?.meta?.totalPages || 1);
      } catch (error) {
        console.error("Product load failed:", error);

        if (isCurrent) {
          setProducts([]);
          setErrorMessage("Unable to load products right now.");
          toast.error("Unable to load products");
        }
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    loadProducts();

    return () => {
      isCurrent = false;
    };
  }, [currentPage, debouncedSearch]);

  const featuredProducts = useMemo(() => products.slice(0, 3), [products]);

  const productStats = useMemo(() => {
    const prices = products.map(getCurrentPrice).filter((price) => price > 0);

    return {
      saleCount: products.filter(hasSalePrice).length,
      lowestPrice: prices.length ? Math.min(...prices) : 0,
      visibleCount: products.length,
    };
  }, [products]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddToCart = async (event, product) => {
    event.preventDefault();
    event.stopPropagation();

    if (Number(product.stock) <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      setAddingProductId(product._id);
      await addToCart(product._id);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add to cart");
    } finally {
      setAddingProductId("");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <div className="home-hero__content">
          <div className="home-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            SahimonCart marketplace
          </div>

          <h1 id="home-title">Shop premium products with a cleaner, faster experience.</h1>

          <p>
            Discover curated collections, compare pricing instantly, and move from search to
            checkout without friction.
          </p>

          <div className="home-search" role="search">
            <Search className="home-search__icon" size={21} aria-hidden="true" />
            <label className="home-sr-only" htmlFor="home-product-search">
              Search products
            </label>
            <input
              id="home-product-search"
              type="search"
              placeholder="Search products, brands, and collections..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />

            {searchTerm && (
              <button type="button" onClick={clearSearch} aria-label="Clear search">
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>

          <div className="home-hero__stats" aria-label="Store summary">
            <span>
              <strong>{totalProducts || productStats.visibleCount}</strong>
              Products
            </span>
            <span>
              <strong>{categories.length}</strong>
              Collections
            </span>
            <span>
              <strong>{productStats.saleCount}</strong>
              Deals
            </span>
          </div>
        </div>

        <div className="home-hero__visual" aria-label="Featured products">
          {featuredProducts.length > 0 ? (
            featuredProducts.map((product, index) => (
              <Link
                to={`/product/${product._id}`}
                className={`home-featured home-featured--${index + 1}`}
                key={product._id}
              >
                <ProductImage product={product} />
                <span>{product.name}</span>
              </Link>
            ))
          ) : (
            <div className="home-featured-empty">
              <ShoppingBag size={34} aria-hidden="true" />
              <span>Featured products</span>
            </div>
          )}
        </div>
      </section>

      <section className="home-categories" aria-labelledby="category-heading">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">Browse collections</span>
            <h2 id="category-heading">Popular Categories</h2>
          </div>

          <Link to="/categories" className="home-text-link">
            View all
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>

        <div className="home-category-row">
          {categoryLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div className="home-category-chip home-category-chip--loading" key={index} />
            ))
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <Link
                to={`/categories/${category._id}`}
                className="home-category-chip"
                key={category._id}
              >
                <span>{getInitials(category.name)}</span>
                {category.name}
              </Link>
            ))
          ) : (
            <span className="home-muted-note">Categories will appear here soon.</span>
          )}
        </div>
      </section>

      <section className="home-products" aria-labelledby="products-heading">
        <div className="home-section-heading">
          <div>
            <span className="home-section-kicker">
              {debouncedSearch ? "Search results" : "Fresh catalog"}
            </span>
            <h2 id="products-heading">
              {debouncedSearch ? `Results for "${debouncedSearch}"` : "Featured Products"}
            </h2>
            <p>
              {loading
                ? "Loading products..."
                : `${productStats.visibleCount} item${
                    productStats.visibleCount === 1 ? "" : "s"
                  } showing`}
            </p>
          </div>

          <div className="home-product-summary" aria-label="Product summary">
            <span>
              <Tag size={15} aria-hidden="true" />
              {productStats.saleCount} on sale
            </span>
            <span>
              <Star size={15} aria-hidden="true" />
              {productStats.lowestPrice > 0
                ? `From ${formatPrice(productStats.lowestPrice)}`
                : "Prices updating"}
            </span>
          </div>
        </div>

        {loading ? (
          <ProductSkeleton />
        ) : errorMessage ? (
          <StateCard
            title="Products unavailable"
            message={errorMessage}
            actionLabel="Try again"
            onAction={() => window.location.reload()}
          />
        ) : products.length > 0 ? (
          <>
            <div className="home-product-grid">
              {products.map((product) => {
                const sale = hasSalePrice(product);
                const discount = getDiscountPercent(product);
                const stock = getStockState(product);
                const isAdding = addingProductId === product._id;
                const isOutOfStock = Number(product.stock) <= 0;

                return (
                  <Link to={`/product/${product._id}`} className="home-card-link" key={product._id}>
                    <article className="home-product-card">
                      <div className="home-product-media">
                        <ProductImage product={product} />

                        {sale && (
                          <span className="home-product-badge">
                            <Tag size={14} aria-hidden="true" />
                            {discount}% off
                          </span>
                        )}
                      </div>

                      <div className="home-product-info">
                        <div className="home-product-meta">
                          <span>
                            <ShoppingBag size={15} aria-hidden="true" />
                            {product.brand || "SahimonCart"}
                          </span>

                          <span className={`home-stock home-stock--${stock.tone}`}>
                            {stock.label}
                          </span>
                        </div>

                        <h3>{product.name}</h3>

                        <div className="home-price">
                          {sale ? (
                            <>
                              <strong>{formatPrice(product.salePrice)}</strong>
                              <span>{formatPrice(product.price)}</span>
                            </>
                          ) : (
                            <strong>{formatPrice(product.price)}</strong>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={(event) => handleAddToCart(event, product)}
                          disabled={isAdding || isOutOfStock}
                        >
                          {isAdding ? (
                            <>
                              <Loader2 size={17} aria-hidden="true" />
                              Adding
                            </>
                          ) : isOutOfStock ? (
                            "Out of stock"
                          ) : (
                            <>
                              Add to cart
                              <ArrowRight size={17} aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {!debouncedSearch && totalPages > 1 && (
              <nav className="home-pagination" aria-label="Product pages">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>

                <span>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
        ) : (
          <StateCard
            title="No products found"
            message={
              debouncedSearch
                ? `No products matched "${debouncedSearch}". Try another keyword.`
                : "Products will appear here once they are available."
            }
            actionLabel={debouncedSearch ? "Clear search" : "Browse categories"}
            actionTo={debouncedSearch ? undefined : "/categories"}
            onAction={debouncedSearch ? clearSearch : undefined}
          />
        )}
      </section>
    </main>
  );
};

const ProductImage = ({ product }) => {
  const [failed, setFailed] = useState(false);
  const src = product.images?.[0];

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={product.name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div className="home-image-fallback" role="img" aria-label={product.name || "Product"}>
      <ShoppingBag size={30} aria-hidden="true" />
      <strong>{getInitials(product.name)}</strong>
    </div>
  );
};

const ProductSkeleton = () => (
  <div className="home-product-grid" aria-live="polite" aria-busy="true">
    {Array.from({ length: 8 }).map((_, index) => (
      <div className="home-skeleton-card" key={index}>
        <div className="home-skeleton-media" />
        <div className="home-skeleton-line home-skeleton-line--short" />
        <div className="home-skeleton-line" />
        <div className="home-skeleton-line home-skeleton-line--medium" />
      </div>
    ))}
  </div>
);

const StateCard = ({ title, message, actionLabel, actionTo, onAction }) => {
  const content = (
    <>
      <PackageSearch size={36} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && <span>{actionLabel}</span>}
    </>
  );

  if (actionTo) {
    return (
      <Link to={actionTo} className="home-state-card home-state-card--action">
        {content}
      </Link>
    );
  }

  return (
    <div className="home-state-card">
      <PackageSearch size={36} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{message}</p>
      {actionLabel && (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default Home;
