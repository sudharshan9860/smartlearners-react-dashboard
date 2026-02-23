import React from "react";
import { useAuth } from "../contexts/AuthContext";
import LoadingOverlay from "./LoadingOverlay";

// PrivateRoute no longer redirects to /login.
// Instead it waits for auto-login to complete (loading state),
// then shows the dashboard once isAuthenticated = true.
// If auto-login fails, the error is shown inside the dashboard shell.

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, error } = useAuth();

  // Auto-login in progress — show loading screen
  if (loading) {
    return <LoadingOverlay show={true} />;
  }

  // Auto-login failed — show error instead of blank screen or redirect
  if (!isAuthenticated && error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
          background: "#f8fafc",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <h2 style={{ color: "#111827", fontSize: "1.25rem", fontWeight: 700 }}>
          Connection Failed
        </h2>
        <p
          style={{
            color: "#6b7280",
            fontSize: "0.9rem",
            maxWidth: 380,
            textAlign: "center",
          }}
        >
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 24px",
            background: "#f97316",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // Auto-login succeeded — show dashboard
  return children;
};

export default PrivateRoute;
