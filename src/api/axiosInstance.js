import axios from "axios";
import { config } from "../config";

// ─── Token Persistence (Fix #1) ───────────────────────────────────────────────
// Tokens are now kept in sessionStorage so they survive page refreshes
// but are cleared when the browser tab is closed (safer than localStorage).
const TOKEN_KEYS = { access: "sl_access", refresh: "sl_refresh" };

const loadTokens = () => ({
  access: sessionStorage.getItem(TOKEN_KEYS.access),
  refresh: sessionStorage.getItem(TOKEN_KEYS.refresh),
});

const persistTokens = (access, refresh) => {
  sessionStorage.setItem(TOKEN_KEYS.access, access);
  sessionStorage.setItem(TOKEN_KEYS.refresh, refresh);
};

const wipeTokens = () => {
  sessionStorage.removeItem(TOKEN_KEYS.access);
  sessionStorage.removeItem(TOKEN_KEYS.refresh);
};

// In-memory references (loaded from sessionStorage on module init)
let { access: accessToken, refresh: refreshToken } = loadTokens();
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

// ─── Axios Instance ────────────────────────────────────────────────────────────
const axiosInstance = axios.create({
baseURL: "/api/proxy",  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — inject Bearer token
axiosInstance.interceptors.request.use(
  (cfg) => {
    if (accessToken) {
      cfg.headers.Authorization = `Bearer ${accessToken}`;
    }
    return cfg;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — silent token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      if (refreshToken) {
        try {
          const response = await axios.post(
            `${config.apiBaseUrl}/api/token/refresh/`,
            { refresh: refreshToken },
          );

          const newAccessToken = response.data.access;
          accessToken = newAccessToken;

          // Persist updated access token
          sessionStorage.setItem(TOKEN_KEYS.access, newAccessToken);

          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          accessToken = null;
          refreshToken = null;
          wipeTokens();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ─── Public API ────────────────────────────────────────────────────────────────
export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  persistTokens(access, refresh); // write-through to sessionStorage
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  wipeTokens();
};

export const getTokens = () => ({ accessToken, refreshToken });

export default axiosInstance;
