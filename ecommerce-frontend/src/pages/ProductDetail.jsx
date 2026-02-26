import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSingleProduct } from "../api/productApi";
import { addToCart } from "../api/cartApi";
import { toast } from "react-hot-toast";
import "../styles/product-detail.css";

const ProductDetail = () => {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await getSingleProduct(id);
        setProduct(res.data.data);
      } catch (error) {
        console.error("Failed to load product:", error);
        toast.error("Product not found");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      await addToCart(product._id, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      console.error("Add to cart failed:", error);
      toast.error("Failed to add to cart");
    }
  };

  if (loading) return <div className="product-loading">Loading product...</div>;
  if (!product) return <div className="product-not-found">Product not found</div>;

  return (
    <div className="product-detail-container">
      <div className="product-detail-grid">
        {/* Image Gallery */}
        <div className="product-images">
          <div className="main-image">
            <img
              src={
                product.images?.[selectedImage] ||
                "https://via.placeholder.com/600?text=No+Image"
              }
              alt={product.name}
              className="main-product-image"
            />
          </div>

          <div className="thumbnail-list">
            {product.images?.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className={`thumbnail ${selectedImage === index ? "active" : ""}`}
                onClick={() => setSelectedImage(index)}
              />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="product-info">
          <h1 className="product-name">{product.name}</h1>

          <div className="price-section">
            {product.salePrice && product.salePrice < product.price ? (
              <>
                <span className="sale-price">₹{product.salePrice}</span>
                <span className="original-price">₹{product.price}</span>
                <span className="discount">
                  {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="regular-price">₹{product.price}</span>
            )}
          </div>

          <div className="stock-status">
            {product.stock > 0 ? (
              <span className="in-stock">✅ In Stock ({product.stock} left)</span>
            ) : (
              <span className="out-of-stock">❌ Out of Stock</span>
            )}
          </div>

          <div className="description">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="quantity-selector">
            <label>Quantity</label>
            <div className="qty-buttons">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
          </div>

          <div className="action-buttons">
            <button className="add-to-cart-btn" onClick={handleAddToCart}>
              Add to Cart
            </button>
            <button className="buy-now-btn" onClick={() => toast("Buy Now - Coming Soon")}>
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;