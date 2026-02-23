import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth";
import { clearTokens } from "../api/axiosInstance";

const AuthContext = createContext(null);

// ─── Credentials from environment variables ─────────────────────────────────
// Store these in your .env file as:
//   VITE_AUTO_USERNAME=your_username
//   VITE_AUTO_PASSWORD=your_password
// Never commit real credentials to git — add .env to .gitignore
const AUTO_USERNAME = import.meta.env.VITE_AUTO_USERNAME;
const AUTO_PASSWORD = import.meta.env.VITE_AUTO_PASSWORD;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // starts true → shows loader until auto-login completes
  const [error, setError] = useState(null);

  useEffect(() => {
    // ── Auto-login on app mount ──────────────────────────────────────────────
    // 1. First try to reuse existing valid token (avoids re-login on page refresh)
    // 2. If no valid token, auto-login with the hardcoded credentials
    const autoLogin = async () => {
      try {
        // Step 1: Check if we already have a valid token in sessionStorage
        const isValid = await authAPI.verifyToken();
        if (isValid) {
          // Token still valid — no need to re-login
          setUser({ username: AUTO_USERNAME || "Student" });
          setLoading(false);
          return;
        }
      } catch {
        // Token invalid or missing — fall through to auto-login below
      }

      // Step 2: Auto-login with credentials from .env
      try {
        if (!AUTO_USERNAME || !AUTO_PASSWORD) {
          throw new Error(
            "VITE_AUTO_USERNAME and VITE_AUTO_PASSWORD must be set in .env",
          );
        }

        await authAPI.login(AUTO_USERNAME, AUTO_PASSWORD);
        setUser({ username: AUTO_USERNAME });
        setError(null);
      } catch (err) {
        console.error("Auto-login failed:", err);
        setError(
          err.response?.data?.detail || err.message || "Auto-login failed",
        );
        // Even on failure, stop loading — show dashboard with whatever we have
        // API calls will fail gracefully (empty states) rather than hanging
      } finally {
        setLoading(false);
      }
    };

    autoLogin();
  }, []); // runs once on mount

  // ── Re-login helper ────────────────────────────────────────────────────────
  // Called automatically by axios interceptor when token expires mid-session.
  // Exposed so the interceptor can trigger a silent re-login instead of
  // redirecting to a login page that no longer exists.
  const silentReLogin = async () => {
    try {
      await authAPI.login(AUTO_USERNAME, AUTO_PASSWORD);
      setUser({ username: AUTO_USERNAME });
      return true;
    } catch {
      setUser(null);
      setError("Session expired. Please refresh the page.");
      return false;
    }
  };

  // Logout is kept but just clears state — no redirect to login page needed
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      clearTokens();
      // Auto re-login after a brief moment so user stays on dashboard
      setTimeout(() => {
        window.location.reload(); // simplest way to restart auto-login flow
      }, 500);
    }
  };

  const value = {
    user,
    loading,
    error,
    logout,
    silentReLogin,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
