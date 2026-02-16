import axiosInstance from "./axiosInstance";

export const addToCart = (productId, quantity = 1) => {
  return axiosInstance.post("/add-To-Cart", { productId, quantity });
};

export const getUserCart = () =>
  axiosInstance.get("/get-User-Cart");

export const updateCartQty = (productId, quantity) =>
  axiosInstance.put("/update-Cart-Item-Quantity", { productId, quantity });

export const removeCartItem = (productId) =>
  axiosInstance.delete(`/remove-Cart-Item/${productId}`);

export const clearCart = () =>
  axiosInstance.delete("/clear-Cart");


