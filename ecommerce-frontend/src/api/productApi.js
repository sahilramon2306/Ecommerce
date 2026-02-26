import axiosInstance from "./axiosInstance";

export const getAllProducts = (page = 1, limit = 12) => {
  return axiosInstance.get(`/list-All-Products-Public?page=${page}&limit=${limit}`);
};

// Get single product
export const getSingleProduct = (productId) => {
  return axiosInstance.get(`/get-Single-Product-Details/${productId}`);
};

export const searchProducts = (query) => {
  return axiosInstance.get(`/search-products?q=${encodeURIComponent(query)}`);
};

// Add to cart
export const addToCart = (productId, quantity = 1) => {
  return axiosInstance.post("/add-To-Cart", { productId, quantity });
};