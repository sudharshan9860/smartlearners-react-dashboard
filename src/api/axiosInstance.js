import axios from "axios";
import { config } from "../config";

// Create axios instance
const axiosInstance = axios.create({
  baseURL: config.apiBaseUrl || "", // Empty string for relative URLs
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let accessToken = null;
let refreshToken = null;
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add auth token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${config.apiBaseUrl}/api/token/refresh/`,
            {
              refresh: refreshToken,
            },
          );

          const newAccessToken = response.data.access;
          accessToken = newAccessToken;

          // Update the failed requests with new token
          processQueue(null, newAccessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Refresh failed, logout user
          accessToken = null;
          refreshToken = null;
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token, redirect to login
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// Public methods to manage tokens
export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
};

export const getTokens = () => ({
  accessToken,
  refreshToken,
});

export default axiosInstance;
