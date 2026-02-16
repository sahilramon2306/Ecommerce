import axiosInstance from "./axiosInstance";

export const getMyOrders = () => {
  return axiosInstance.get("/get-User-Orders");
};
