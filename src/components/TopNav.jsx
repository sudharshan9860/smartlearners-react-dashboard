import React from "react";
import { useAuth } from "../contexts/AuthContext";
import "./TopNav.css";

const TopNav = ({ username }) => {
  const { logout } = useAuth();

  const getInitial = () => {
    return "A";
  };

  return (
    <nav className="top-nav">
      <div className="nav-container">
        <div className="nav-brand">
          <span className="brand-icon">E</span>
          <span className="brand-name">
            <span className="brand-smart">Elpro NELO</span>
            <span className="brand-dash"> Smartlearners</span>
          </span>
        </div>

        <div className="nav-user">
          <div className="avatar">
            <span className="avatar-initial">{getInitial(username)}</span>
          </div>
          <div className="user-info">
            <div className="username">{"ANVESHA"}</div>
          </div>
          {/* <button onClick={logout} className="logout-btn" title="Logout">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            <span>Logout</span>
          </button> */}
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
