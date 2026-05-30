import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  ChevronRight,
  Grid3X3,
  Loader2,
  PackageSearch,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  X,
} from "lucide-react";
import { getAllActiveCategories, getSubcategories } from "../api/categoryApi";
import { getAllProducts } from "../api/productApi";
import "../styles/categories.css";

const formatPrice = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getId = (value) => {
  if (!value) return "";
  return typeof value === "object" ? value._id : value;
};

const PublicCategories = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [title, setTitle] = useState("Categories");
  const [view, setView] = useState("categories");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");
        setSearchTerm("");
        setCategories([]);
        setProducts([]);

        if (!categoryId) {
          const res = await getAllActiveCategories();
          const data = res.data?.data || [];
          const mainCategories = data.filter((cat) => !cat.parent);

          setCategories(mainCategories);
          setTitle("Categories");
          setView("categories");
          return;
        }

        const subRes = await getSubcategories(categoryId);
        const subCategories = subRes.data?.data || [];

        if (subCategories.length > 0) {
          setCategories(subCategories);
          setTitle(subRes.data?.parent?.name || "Sub Categories");
          setView("categories");
          return;
        }

        const productRes = await getAllProducts(1, 1000);
        const allProducts = productRes.data?.data || [];

        const categoryProducts = allProducts.filter((product) => {
          return (
            getId(product.category) === categoryId ||
            getId(product.subCategory) === categoryId ||
            getId(product.childCategory) === categoryId
          );
        });

        setProducts(categoryProducts);
        setTitle(subRes.data?.parent?.name || "Products");
        setView("products");
      } catch (error) {
        console.error("Category Load Error:", error);
        setErrorMessage("We could not load this collection right now.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [categoryId]);

  const filteredCategories = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return categories;

    return categories.filter((cat) =>
      cat.name?.toLowerCase().includes(query)
    );
  }, [categories, searchTerm]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) =>
      product.name?.toLowerCase().includes(query)
    );
  }, [products, searchTerm]);

  const totalItems = view === "categories" ? categories.length : products.length;
  const visibleItems =
    view === "categories" ? filteredCategories.length : filteredProducts.length;

  return (
    <main className="category-page">
      <section className="category-hero" aria-labelledby="category-title">
        <div className="category-hero__content">
          <button
            className="category-back-btn"
            type="button"
            onClick={() => (categoryId ? navigate(-1) : navigate("/"))}
          >
            <ArrowLeft size={18} aria-hidden="true" />
            {categoryId ? "Back" : "Home"}
          </button>

          <div className="category-eyebrow">
            <Sparkles size={16} aria-hidden="true" />
            Premium catalog
          </div>

          <h1 id="category-title">{title}</h1>
          <p>
            Explore curated SahimonCart collections, discover subcategories, and
            move smoothly from browsing to product details.
          </p>

          <div className="category-search-panel">
            <Search className="category-search-icon" size={21} aria-hidden="true" />

            <input
              type="search"
              className="category-search-input"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label={`Search ${title}`}
            />

            {searchTerm && (
              <button
                className="category-clear-search"
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <aside className="category-hero__panel" aria-label="Catalog summary">
          <div className="category-stat-card">
            <span>
              <Grid3X3 size={18} aria-hidden="true" />
              Current view
            </span>
            <strong>{view === "categories" ? "Collections" : "Products"}</strong>
          </div>

          <div className="category-stat-grid">
            <div className="category-stat">
              <span>Total items</span>
              <strong>{totalItems}</strong>
            </div>

            <div className="category-stat">
              <span>Showing</span>
              <strong>{visibleItems}</strong>
            </div>
          </div>

          <div className="category-trust-note">
            <PackageSearch size={18} aria-hidden="true" />
            Fast browsing, responsive cards, and clean product discovery.
          </div>
        </aside>
      </section>

      <section className="category-container">
        <div className="category-toolbar">
          <div>
            <span className="category-section-kicker">
              {view === "categories" ? "Browse categories" : "Shop products"}
            </span>
            <h2>{view === "categories" ? "Available Collections" : "Available Products"}</h2>
          </div>

          <p>
            {visibleItems} result{visibleItems === 1 ? "" : "s"}
          </p>
        </div>

        {isLoading ? (
          <div className="category-state-card">
            <Loader2 className="category-loader" size={34} aria-hidden="true" />
            <h3>Loading catalog</h3>
            <p>Please wait while we prepare this collection.</p>
          </div>
        ) : errorMessage ? (
          <div className="category-state-card category-state-card--error">
            <PackageSearch size={34} aria-hidden="true" />
            <h3>Something went wrong</h3>
            <p>{errorMessage}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : view === "categories" ? (
          filteredCategories.length > 0 ? (
            <div className="category-grid">
              {filteredCategories.map((cat) => (
                <Link
                  key={cat._id}
                  to={`/categories/${cat._id}`}
                  className="category-card"
                >
                  <div className="category-image-wrapper">
                    <img
                      src={cat.image || "/category-placeholder.png"}
                      alt={cat.name}
                      loading="lazy"
                    />
                  </div>

                  <div className="category-card-body">
                    <span>
                      <Boxes size={16} aria-hidden="true" />
                      Collection
                    </span>

                    <h3>{cat.name}</h3>

                    <div className="category-card-action">
                      Explore
                      <ChevronRight size={17} aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              searchTerm={searchTerm}
              type="categories"
              onClear={() => setSearchTerm("")}
            />
          )
        ) : filteredProducts.length > 0 ? (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const hasSalePrice =
                product.salePrice && Number(product.salePrice) < Number(product.price);

              return (
                <Link
                  to={`/product/${product._id}`}
                  key={product._id}
                  className="product-card-link"
                >
                  <article className="product-card">
                    <div className="product-image-wrapper">
                      <img
                        src={
                          product.images?.[0] ||
                          "https://via.placeholder.com/420x420?text=No+Image"
                        }
                        alt={product.name}
                        className="product-image"
                        loading="lazy"
                      />

                      {hasSalePrice && (
                        <span className="product-badge">
                          <Tag size={14} aria-hidden="true" />
                          Sale
                        </span>
                      )}
                    </div>

                    <div className="product-info">
                      <span className="product-meta">
                        <ShoppingBag size={15} aria-hidden="true" />
                        SahimonCart
                      </span>

                      <h3 className="product-title">{product.name}</h3>

                      <div className="price-container">
                        {hasSalePrice ? (
                          <>
                            <span className="current-price">
                              {formatPrice(product.salePrice)}
                            </span>
                            <span className="original-price">
                              {formatPrice(product.price)}
                            </span>
                          </>
                        ) : (
                          <span className="current-price">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>

                      <div className="product-card-action">
                        View Details
                        <ArrowRight size={17} aria-hidden="true" />
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            searchTerm={searchTerm}
            type="products"
            onClear={() => setSearchTerm("")}
          />
        )}
      </section>
    </main>
  );
};

const EmptyState = ({ searchTerm, type, onClear }) => (
  <div className="category-state-card">
    <PackageSearch size={34} aria-hidden="true" />
    <h3>No {type} found</h3>

    <p>
      {searchTerm
        ? `No ${type} matched "${searchTerm}". Try a different keyword.`
        : `There are no ${type} available in this collection yet.`}
    </p>

    {searchTerm && (
      <button type="button" onClick={onClear}>
        Clear Search
      </button>
    )}
  </div>
);

export default PublicCategories;
