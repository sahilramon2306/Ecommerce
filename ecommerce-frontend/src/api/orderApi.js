import axiosInstance from "./axiosInstance";

export const getMyOrders = () => {
  return axiosInstance.get("/get-User-Orders");
};


export const publicTrackOrderStatus = (orderId) => {
  return axiosInstance.get(`/public-track-Order-Status/${orderId}`, {
    skipAuth: true,
  });
};
