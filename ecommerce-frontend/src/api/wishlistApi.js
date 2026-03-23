import axiosInstance from "./axiosInstance";


// Add to wishlist
export const addToWishlist = (productId) => {
  return axiosInstance.post("/add-To-Wish-list", { productId });
};

// Remove from wishlist
export const removeFromWishlist = (productId) => {
  return axiosInstance.delete(`/remove-From-Wishlist/${productId}`);
};

// Get user wishlist
export const getUserWishlist = () => {
  return axiosInstance.get("/get-User-Wishlist");
};