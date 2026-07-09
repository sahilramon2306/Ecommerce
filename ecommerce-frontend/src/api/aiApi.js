import axiosInstance from "./axiosInstance";

export const askShoppingAssistant = (message) => {
  return axiosInstance.post(
    "/ai-shopping-assistant",
    { message },
    { skipAuth: true }
  );
};