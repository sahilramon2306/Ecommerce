// authApi.js - Updated with Password Reset/Change Functions
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

// Password Reset Functions (Public - No Auth Required)
export const forgotPassword = (data) => {
  return axiosInstance.post("/forgot-password", data);
};

export const verifyResetOTP = (data) => {
  return axiosInstance.post("/verify-Reset-OTP", data);
};

export const resetPassword = (data) => {
  return axiosInstance.post("/reset-Password", data);
};

// Password Change (Authenticated - Uses PUT)
export const changePassword = (data) => {
  return axiosInstance.put("/change-Password", data);
};

// Razorpay Functions (Existing)
export const createRazorpayOrder = (orderId) => {
  return axiosInstance.post("/create-razorpay-order", { orderId });
};

export const verifyPayment = (paymentData) => {
  return axiosInstance.post("/verify-razorpay-payment", paymentData);
};