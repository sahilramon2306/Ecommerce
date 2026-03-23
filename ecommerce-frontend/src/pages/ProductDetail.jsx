import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSingleProduct } from "../api/productApi";
import { addToCart } from "../api/cartApi";

import {
  addToWishlist,
  removeFromWishlist,
  getUserWishlist
} from "../api/wishlistApi";

import { toast } from "react-hot-toast";

import RatingSummary from "../pages/RatingSummary";
import ReviewsList from "../pages/ReviewsList";
import ReviewForm from "../pages/ReviewForm";

import "../styles/product-detail.css";

const ProductDetail = () => {

  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const [inWishlist, setInWishlist] = useState(false);

  const [refreshReviews, setRefreshReviews] = useState(false);


  /* ================= FETCH PRODUCT ================= */

  useEffect(() => {

    const fetchProduct = async () => {

      try {

        setLoading(true);

        const res = await getSingleProduct(id);

        setProduct(res.data.data);

        setSelectedImage(0);
        setQuantity(1);

      } catch (error) {

        toast.error("Product not found");

      } finally {

        setLoading(false);

      }

    };


    const checkWishlist = async () => {

      if (!localStorage.getItem("token")) return;

      try {

        const res = await getUserWishlist();

        const exists = res.data.data.some(
          (item) => item._id === id
        );

        setInWishlist(exists);

      } catch (error) {

        console.log("Wishlist check error", error);

      }

    };

    fetchProduct();
    checkWishlist();

  }, [id]);


  /* ================= ADD TO CART ================= */

  const handleAddToCart = async () => {

    if (!localStorage.getItem("token")) {
      toast.error("Please login first");
      return;
    }

    try {

      await addToCart(product._id, quantity);

      toast.success(`${product.name} added to cart!`);

    } catch (error) {

      toast.error(
        error.response?.data?.message || "Failed to add to cart"
      );

    }

  };


  /* ================= WISHLIST TOGGLE ================= */

  const handleWishlistToggle = async () => {

    if (!localStorage.getItem("token")) {
      toast.error("Please login first");
      return;
    }

    try {

      if (inWishlist) {

        await removeFromWishlist(product._id);

        toast.success("Removed from wishlist");

        setInWishlist(false);

      } else {

        await addToWishlist(product._id);

        toast.success("Added to wishlist ❤️");

        setInWishlist(true);

      }

    } catch (error) {

      toast.error(
        error.response?.data?.message || "Wishlist error"
      );

    }

  };


  /* ================= LOADING ================= */

  if (loading) {
    return <div className="product-loading">Loading product...</div>;
  }

  if (!product) {
    return <div className="product-not-found">Product not found</div>;
  }


  return (

    <div className="product-detail-container">

      <div className="product-detail-grid">


        {/* PRODUCT IMAGES */}

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
                alt="thumbnail"
                className={`thumbnail ${
                  selectedImage === index ? "active" : ""
                }`}
                onClick={() => setSelectedImage(index)}
              />

            ))}

          </div>

        </div>


        {/* PRODUCT INFO */}

        <div className="product-info">

          <h1 className="product-name">{product.name}</h1>


          <div className="price-section">

            {product.salePrice && product.salePrice < product.price ? (

              <>
                <span className="sale-price">₹{product.salePrice}</span>
                <span className="original-price">₹{product.price}</span>

                <span className="discount">
                  {Math.round(
                    ((product.price - product.salePrice) / product.price) * 100
                  )}% OFF
                </span>
              </>

            ) : (

              <span className="regular-price">₹{product.price}</span>

            )}

          </div>


          <div className="stock-status">

            {product.stock > 0 ? (
              <span className="in-stock">
                ✅ In Stock ({product.stock} left)
              </span>
            ) : (
              <span className="out-of-stock">
                ❌ Out of Stock
              </span>
            )}

          </div>


          <div className="description">

            <h3>Description</h3>

            <p>{product.description}</p>

          </div>


          {/* QUANTITY */}

          <div className="quantity-selector">

            <label>Quantity</label>

            <div className="qty-buttons">

              <button
                onClick={() =>
                  setQuantity((prev) => Math.max(1, prev - 1))
                }
              >
                -
              </button>

              <span>{quantity}</span>

              <button
                onClick={() =>
                  setQuantity((prev) =>
                    Math.min(product.stock, prev + 1)
                  )
                }
              >
                +
              </button>

            </div>

          </div>


          {/* ACTION BUTTONS */}

          <div className="action-buttons">

            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </button>

            <button
              className="buy-now-btn"
              onClick={() => toast("Buy Now - Coming Soon")}
            >
              Buy Now
            </button>

            <button
              className={`wishlist-btn ${inWishlist ? "active" : ""}`}
              onClick={handleWishlistToggle}
            >
              {inWishlist ? "❤️ In Wishlist" : "🤍 Wishlist"}
            </button>

          </div>

        </div>

      </div>


      {/* REVIEWS */}

      <div className="reviews-section">

        <h2>Ratings & Reviews</h2>

        <RatingSummary productId={id} refresh={refreshReviews} />

        <ReviewsList productId={id} refresh={refreshReviews} />

        <ReviewForm
          productId={id}
          onReviewAdded={() =>
            setRefreshReviews((prev) => !prev)
          }
        />

      </div>

    </div>

  );

};

export default ProductDetail;