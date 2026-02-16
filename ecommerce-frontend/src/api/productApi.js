import axiosInstance from "./axiosInstance";

export const getAllProducts = () => {
  return axiosInstance.get("/list-All-Products-Public");
};
