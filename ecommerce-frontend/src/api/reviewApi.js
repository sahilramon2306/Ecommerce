import axiosInstance from "./axiosInstance";

export const addReview = (productId, data) => {
  return axiosInstance.post(`/add-Review/${productId}`, data);
};

export const updateReview = (productId, data) => {
  return axiosInstance.put(`/update-Review/${productId}`, data);
};

export const deleteReview = (productId) => {
  return axiosInstance.delete(`/delete-Review/${productId}`);
};

export const getProductReviews = (productId) => {
  return axiosInstance.get(`/get-Product-Reviews/${productId}`);
};

export const getRatingSummary = (productId) => {
  return axiosInstance.get(`/get-Rating-Summary/${productId}`);
};

//====================================================================================
// ADMIN
export const getAllReviewsAdmin = () => {
  return axiosInstance.get("/get-All-Reviews-Admin");
};


export const moderateReview = (reviewId, status) => {
  return axiosInstance.put(`/moderate-Review/${reviewId}`, {
    status
  });
};
