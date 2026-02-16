import axiosInstance from "./axiosInstance";

export const registerUser = (data) => {
  return axiosInstance.post("/registration", data);
};

export const loginUser = (data) => {
  return axiosInstance.post("/user-login", data);
};

export const logoutUser = () => {
  return axiosInstance.post("/user-logout");
};

export const createRazorpayOrder = (orderId) => {
  return axiosInstance.post("/create-razorpay-order", { orderId });
};

export const verifyPayment = (paymentData) => {
  return axiosInstance.post("/verify-razorpay-payment", paymentData);
};

