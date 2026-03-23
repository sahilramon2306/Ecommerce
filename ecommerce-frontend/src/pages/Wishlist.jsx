import { useEffect, useState } from "react";
import {
  getUserWishlist,
  removeFromWishlist
} from "../api/wishlistApi";

import {addToCart} from "../api/productApi";
import { toast } from "react-hot-toast";

import { FaHeartBroken } from "react-icons/fa";

import "../styles/wishlist.css";

const Wishlist = () => {

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWishlist = async () => {
    try {
      const res = await getUserWishlist();
      setWishlist(res.data.data || []);
    } catch (err) {
      console.error("Wishlist load error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const handleRemove = async (productId) => {

    try {

      await removeFromWishlist(productId);

      setWishlist(prev =>
        prev.filter(item => item._id !== productId)
      );

    } catch (err) {
      console.error("Remove wishlist error", err);
    }

  };

  if (loading) {
    return (
      <div className="wishlist-loading">
        Loading your wishlist...
      </div>
    );
  }

  return (

    <div className="wishlist-container">

      <h1 className="wishlist-title">
        ❤️ Your Wishlist
      </h1>

      {wishlist.length === 0 && (

        <div className="wishlist-empty">

          <FaHeartBroken className="empty-icon"/>

          <h2>Your wishlist is empty</h2>

          <p>
            Save your favorite products here so you can find them easily later.
          </p>

        </div>

      )}

      <div className="wishlist-grid">

        {wishlist.map(product => (

          <div key={product._id} className="wishlist-card">

            <div className="wishlist-image">

              <img
                src={product.images?.[0]}
                alt={product.name}
              />

              <span className="wishlist-badge">
                  <button
                  className="remove-button"
                  onClick={() => handleRemove(product._id)}
                >
                  ❤️
                </button>
              </span>

            </div>

            <div className="wishlist-content">

              <h3 className="wishlist-name">
                {product.name}
              </h3>

              <p className="wishlist-price">
                ₹{product.salePrice || product.price}
              </p>

              <div className="wishlist-actions">
              <button
                  className="addtocart-btn"
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

          </div>

        ))}

      </div>

    </div>

  );

};

export default Wishlist;