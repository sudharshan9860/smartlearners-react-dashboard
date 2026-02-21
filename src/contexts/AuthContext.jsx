import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth";
import { setTokens, clearTokens } from "../api/axiosInstance";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in (e.g., from localStorage)
    const checkAuth = async () => {
      try {
        const isValid = await authAPI.verifyToken();
        if (isValid) {
          // Token is valid, user is authenticated
          const username = localStorage.getItem("username");
          if (username) {
            setUser({ username });
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      const data = await authAPI.login(username, password);
      setUser({ username });
      localStorage.setItem("username", username);
      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.message ||
        "Login failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      localStorage.removeItem("username");
      clearTokens();
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
