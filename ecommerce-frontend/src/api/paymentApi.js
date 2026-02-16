import axiosInstance from "./axiosInstance";


export const createRazorpayOrder = async (orderId) => {
  try {
    const response = await axiosInstance.post(
      "/create-razorpay-order",
      { orderId }
    );

    return response;
  } catch (error) {
    console.error("Create Razorpay Order API Error:", error);
    throw error;
  }
};



export const verifyPayment = async (paymentData) => {
  try {
    const response = await axiosInstance.post(
      "/verify-razorpay-payment",
      paymentData
    );

    return response;
  } catch (error) {
    console.error("Verify Payment API Error:", error);
    throw error;
  }
};
