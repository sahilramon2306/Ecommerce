import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getAllProducts,
  searchProducts,
  addToCart
} from "../api/productApi";
import { toast } from "react-hot-toast";
import "../styles/home.css";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const limit = 12;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      let res;

      if (debouncedSearch) {
        res = await searchProducts(debouncedSearch);
        setProducts(res.data.data || []);
        setTotalPages(1);
      } else {
        res = await getAllProducts(page, limit);
        setProducts(res.data.data || []);
        setCurrentPage(page);
        setTotalPages(res.data.meta?.totalPages || 1);
      }
    } catch {
      toast.error("Unable to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
  }, [debouncedSearch]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    fetchProducts(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="home">

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <h1>
            Experience Shopping,
            <span> Reimagined</span>
          </h1>
          <p>
            Premium quality. Clean design. Seamless experience.
          </p>

          <div className="search">
            <input
              type="text"
              placeholder="Search premium products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="products">
        {loading ? (
          <div className="loader">Loading products...</div>
        ) : (
          <>
            <div className="grid">
              {products.length > 0 ? (
                products.map((product) => {
                  const discount =
                    product.salePrice &&
                    product.salePrice < product.price
                      ? Math.round(
                          ((product.price - product.salePrice) /
                            product.price) *
                            100
                        )
                      : null;

                  return (
                    <Link
                      to={`/product/${product._id}`}
                      key={product._id}
                      className="card-link"
                    >
                      <div className="card">

                        {discount && (
                          <div className="badge">
                            {discount}% OFF
                          </div>
                        )}

                        <div className="image">
                          <img
                            src={
                              product.images?.[0] ||
                              "https://via.placeholder.com/300x300"
                            }
                            alt={product.name}
                          />
                        </div>

                        <div className="info">
                          <h3>{product.name}</h3>

                          <div className="price">
                            {product.salePrice &&
                            product.salePrice < product.price ? (
                              <>
                                <span className="sale">
                                  ₹{product.salePrice}
                                </span>
                                <span className="original">
                                  ₹{product.price}
                                </span>
                              </>
                            ) : (
                              <span className="sale">
                                ₹{product.price}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              addToCart(product._id)
                                .then(() =>
                                  toast.success("Added to cart")
                                )
                                .catch(() =>
                                  toast.error("Failed")
                                );
                            }}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="no-products">
                  No products found.
                </div>
              )}
            </div>

            {!debouncedSearch && totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() =>
                    handlePageChange(currentPage - 1)
                  }
                  disabled={currentPage === 1}
                >
                  ←
                </button>

                <span>
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() =>
                    handlePageChange(currentPage + 1)
                  }
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home;