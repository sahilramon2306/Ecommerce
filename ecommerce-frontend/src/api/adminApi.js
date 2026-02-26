import axiosInstance from "./axiosInstance";


// // ADMIN DASHBOARD API's
export const getDashboardOverview = () =>
  axiosInstance.get("/dashboard-Overview");


export const getOrdersByMonth = (year) =>
  axiosInstance.get(`/orders-By-Month?year=${year}`);


export const getSalesByMonth = (year) =>
  axiosInstance.get(`/sales-By-Month?year=${year}`);


export const getTopProducts = (year, limit = 10) =>
  axiosInstance.get(`/top-Products?year=${year}&limit=${limit}`);


export const getLowStockProducts = (threshold = 10, page = 1, limit = 10) =>
  axiosInstance.get(`/lowStock-Products?threshold=${threshold}&page=${page}&limit=${limit}`);


export const getOrderStatusSummary = (year) =>
  axiosInstance.get(`/order-Status-Summary?year=${year}`);


//============================================================================================
// ADMIN PRODUCT API's
export const getAllProductsAdmin = () => {
  return axiosInstance.get("/list-All-Products-Admin");
};


export const addProduct = (productData) => {
  return axiosInstance.post("/add-Product", productData);
};


export const updateProduct = (productId, productData) => {
  return axiosInstance.put(
    `/update-Product/${productId}`,
    productData
  );
};


export const deleteProduct = (productId) => {
  return axiosInstance.delete(
    `/delete-Product/${productId}`
  );
};


export const uploadProductImages = (productId, formData) => {
  return axiosInstance.post(
    `/upload-Product-Images/${productId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};


export const updateProductStock = (productId, stockData) => {
  return axiosInstance.put(
    `/update-Product-Stock/${productId}`,
    stockData
  );
};


export const updateProductStatus = (productId, statusData) => {
  return axiosInstance.put(
    `/update-Product-Status/${productId}`,
    statusData
  );
};