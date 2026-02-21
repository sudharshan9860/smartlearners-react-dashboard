import React from "react";
import "./LoadingOverlay.css";

const LoadingOverlay = ({ show = true }) => {
  if (!show) return null;

  return (
    <div className={`loading-overlay ${!show ? "hidden" : ""}`}>
      <div className="loading-content">
        <div className="loader"></div>
        <h2>Loading Dashboard...</h2>
      </div>
    </div>
  );
};

export default LoadingOverlay;
