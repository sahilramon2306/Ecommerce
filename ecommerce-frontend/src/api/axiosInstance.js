// axiosInstance.js - Updated with Skip Auth Option for Public Endpoints
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
    
    // 2. Skip auth if explicitly set (for public endpoints like forgot-password)
    if (!config.skipAuth) {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
    
    // Handle 401 globally (e.g., redirect to login for auth errors)
    if (error.response?.status === 401 && !error.config.skipAuth) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;