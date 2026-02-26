import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchProducts } from "../api/productApi";
import { addToCart } from "../api/cartApi";
import { toast } from "react-hot-toast";
import "../styles/search.css";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        const res = await searchProducts(query);
        setProducts(res.data.data || []);
        setTotalResults(res.data.meta?.totalProducts || 0);
      } catch (err) {
        console.error("Search failed", err);
        toast.error("Failed to search products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]);

  if (loading) {
    return <div className="search-loading">Searching for "{query}"...</div>;
  }

  return (
    <div className="search-container">
      <div className="search-header">
        <h1>Search Results for "{query}"</h1>
        <p className="results-count">{totalResults} products found</p>
      </div>

      {products.length > 0 ? (
        <div className="product-grid">
          {products.map((product) => (
            <Link 
              to={`/product/${product._id}`} 
              key={product._id} 
              className="product-card-link"
            >
              <div className="product-card">
                <div className="product-image-wrapper">
                  <img
                    src={product.images?.[0] || "https://via.placeholder.com/320x320?text=No+Image"}
                    alt={product.name}
                    className="product-image"
                    loading="lazy"
                    onError={(e) => e.target.src = "https://via.placeholder.com/320x320?text=Error"}
                  />
                </div>

                <div className="product-info">
                  <h3 className="product-title">{product.name}</h3>

                  <div className="price-container">
                    {product.salePrice && product.salePrice < product.price ? (
                      <>
                        <span className="current-price">₹{product.salePrice}</span>
                        <span className="original-price">₹{product.price}</span>
                      </>
                    ) : (
                      <span className="current-price">₹{product.price}</span>
                    )}
                  </div>

                  <button
                    className="add-to-cart-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      addToCart(product._id)
                        .then(() => toast.success("Added to cart"))
                        .catch(() => toast.error("Failed to add to cart"));
                    }}
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <h3>No products found for "{query}"</h3>
          <p>Try different keywords or check spelling</p>
          <Link to="/" className="back-to-home">Back to Home</Link>
        </div>
      )}
    </div>
  );
};

export default SearchResults;