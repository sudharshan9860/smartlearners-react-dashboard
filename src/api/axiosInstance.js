import axios from "axios";
import { config } from "../config";

// ─── Token Persistence ─────────────────────────────────────────────────────────
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

let { access: accessToken, refresh: refreshToken } = loadTokens();
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ─── Axios Instance ────────────────────────────────────────────────────────────
const axiosInstance = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL || "https://autogen.aieducator.com",
  timeout: 30000,
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

      // ── Try standard token refresh first ──────────────────────────────────
      if (refreshToken) {
        try {
          const response = await axios.post(
            `${config.apiBaseUrl}/api/token/refresh/`,
            { refresh: refreshToken },
          );

          const newAccessToken = response.data.access;
          accessToken = newAccessToken;
          sessionStorage.setItem(TOKEN_KEYS.access, newAccessToken);

          processQueue(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          isRefreshing = false;
          return axiosInstance(originalRequest);
        } catch {
          // Refresh token also expired — fall through to re-login below
        }
      }

      // ── Refresh failed: attempt silent re-login with env credentials ──────
      // No redirect to /login — we auto-login instead
      try {
        const AUTO_USERNAME = import.meta.env.VITE_AUTO_USERNAME;
        const AUTO_PASSWORD = import.meta.env.VITE_AUTO_PASSWORD;

        if (AUTO_USERNAME && AUTO_PASSWORD) {
          const params = new URLSearchParams();
          params.append("username", AUTO_USERNAME);
          params.append("password", AUTO_PASSWORD);

          const reLoginResponse = await axios.post(
            `${config.apiBaseUrl}/api/token/`,
            params,
            {
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            },
          );

          const { access, refresh } = reLoginResponse.data;
          accessToken = access;
          refreshToken = refresh;
          persistTokens(access, refresh);

          processQueue(null, access);
          originalRequest.headers.Authorization = `Bearer ${access}`;
          isRefreshing = false;
          return axiosInstance(originalRequest);
        }
      } catch (reLoginError) {
        console.error("Silent re-login failed:", reLoginError);
        processQueue(reLoginError, null);
        isRefreshing = false;

        // ── Last resort: reload page to restart auto-login flow ────────────
        // No redirect to /login since that page doesn't exist anymore
        console.warn(
          "All auth attempts failed — reloading to restart session.",
        );
        window.location.reload();
        return Promise.reject(reLoginError);
      }

      isRefreshing = false;
    }

    return Promise.reject(error);
  },
);

// ─── Public API ────────────────────────────────────────────────────────────────
export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshToken = refresh;
  persistTokens(access, refresh);
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  wipeTokens();
};

export const getTokens = () => ({ accessToken, refreshToken });

export default axiosInstance;
