import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError({
        title: "Missing Fields",
        message: "Please enter both username and password",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await login(username, password);

      if (result.success) {
        navigate("/dashboard");
      } else {
        setError({
          title: "Login Failed",
          message: result.error || "Invalid credentials",
        });
      }
    } catch (err) {
      setError({
        title: "Error",
        message: err.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e, nextField) => {
    if (e.key === "Enter") {
      if (nextField) {
        document.getElementById(nextField)?.focus();
      } else {
        handleSubmit(e);
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container anim-scale-in">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">S</span>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to your Smartlearners account</p>
        </div>

        {error && (
          <div className="error-box show">
            <div className="err-title">{error.title}</div>
            <div className="err-hint">{error.message}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, "password")}
              placeholder="Enter your username"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className={`login-btn ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-loader"></span>
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
