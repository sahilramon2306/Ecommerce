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
export const getAllProductsAdmin = (params) => {
  return axiosInstance.get("/list-All-Products-Admin", {
    params,
  });
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

//============================================================================================
// ADMIN ORDERS API's


// Get all orders (pagination + search supported)
export const getAllOrdersAdmin = (params) => {
  return axiosInstance.get("/get-All-Orders-Admin", {
    params,
  });
};

// Get single order by ID
export const getOrderByIdAdmin = (orderId) => {
  return axiosInstance.get(
    `/get-Order-By-Id-Admin/${orderId}`
  );
};

// Update order status
export const updateOrderStatusAdmin = (
  orderId,
  data
) => {
  return axiosInstance.put(
    `/update-Order-Status-Admin/${orderId}`,
    data
  );
};

// Update payment status
export const updatePaymentStatusAdmin = (
  orderId,
  data
) => {
  return axiosInstance.put(
    `/update-Payment-Status-Admin/${orderId}`,
    data
  );
};

// Download invoice (returns file)
export const getOrderInvoiceAdmin = (orderId) => {
  return axiosInstance.get(`/get-order-invoice/${orderId}`, {
    responseType: "blob"
  });
};


// Refund Razorpay Payment (Admin)
export const refundRazorpayPayment = (orderId) => {
  return axiosInstance.post(`/refund-Razorpay-Payment/${orderId}`);
};

//============================================================================================
//CATEGORY ADMIN 
export const createCategoryAdmin = (data) => {
  return axiosInstance.post("/create-Category", data);
};

export const updateCategoryAdmin = (id, data) => {
  return axiosInstance.put(`/update-Category/${id}`, data);
};

export const deleteCategoryAdmin = (id, type = "soft") => {
  return axiosInstance.delete(`/delete-Category/${id}?type=${type}`);
};

export const uploadCategoryImageAdmin = (id, formData) => {
  return axiosInstance.post(
    `/upload-Category-Image/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
};

export const changeCategoryStatusAdmin = (id, status) => {
  return axiosInstance.put(`/change-Category-Status/${id}`, { status });
};

export const getAllCategoriesAdmin = (params) => {
  return axiosInstance.get("/get-All-Categories", { params });
};

