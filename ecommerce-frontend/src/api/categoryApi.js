import axiosInstance from "./axiosInstance";

/* Get all active categories */

export const getAllActiveCategories = () => {
  return axiosInstance.get("/get-All-Active-Categories-Public");
};

/* Get single category */

export const getSingleCategory = (categoryId) => {
  return axiosInstance.get(`/get-Single-Category-Public/${categoryId}`);
};

/* Get subcategories */

export const getSubcategories = (categoryId) => {
  return axiosInstance.get(`/get-Subcategories-Public/${categoryId}`);
};