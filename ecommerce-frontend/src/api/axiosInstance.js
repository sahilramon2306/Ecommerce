import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // 1. Dispatch loading event
    window.dispatchEvent(new CustomEvent('loading', { detail: true }));
    
    // 2. Attach the token from localStorage
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    window.dispatchEvent(new CustomEvent('loading', { detail: false }));
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    window.dispatchEvent(new CustomEvent('loading', { detail: false }));
    return response;
  },
  (error) => {
    window.dispatchEvent(new CustomEvent('loading', { detail: false }));
    return Promise.reject(error);
  }
);

export default axiosInstance;