import axiosInstance from "./axiosInstance";

export const getMyOrders = () => {
  return axiosInstance.get("/get-User-Orders");
};

export const getSingleOrderDetails = (orderId) => {
  return axiosInstance.get(`/get-Single-Order-Details/${orderId}`);
};

export const trackOrderStatus = (orderId) => {
  return axiosInstance.get(`/track-Order-Status/${orderId}`);
};

export const cancelOrder = (orderId, reason = "") => {
  return axiosInstance.put(`/cancel-Order/${orderId}`, { reason });
};

export const returnOrder = (orderId, reason = "") => {
  return axiosInstance.put(`/return-Order/${orderId}`, { reason });
};

export const publicTrackOrderStatus = (orderId) => {
  return axiosInstance.get(`/public-track-Order-Status/${orderId}`, {
    skipAuth: true,
  });
};