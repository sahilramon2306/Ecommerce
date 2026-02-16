import { useEffect, useState } from "react";
import { getAllProducts } from "../api/productApi";
import { addToCart } from "../api/cartApi";
import "../styles/home.css";

const Home = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getAllProducts()
      .then((res) => {
        setProducts(res.data.data || []);
      })
      .catch((err) => {
        console.error("Failed to load products", err);
      });
  }, []);

  return (
    <div className="home-container">
      <h1>Products</h1>

      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product._id}>
            <div className="product-image-wrapper">
              <img
                src={
                  product.images?.[0] ||
                  "https://via.placeholder.com/320x320?text=No+Image"
                }
                alt={product.name || "Product"}
                className="product-image"
                loading="lazy"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/320x320?text=Load+Error";
                }}
              />
            </div>

            <div className="product-info">
              <h3 className="product-title">{product.name}</h3>

              <div className="price-container">
                {product.salePrice && product.salePrice < product.price ? (
                  <>
                    <span className="current-price">
                      ₹{product.salePrice.toLocaleString("en-IN")}
                    </span>
                    <span className="original-price">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                  </>
                ) : (
                  <span className="current-price">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                )}
              </div>

              <button
                className="add-to-cart-btn"
                onClick={() => addToCart(product._id)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;