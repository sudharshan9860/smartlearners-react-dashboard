import React from "react";
import "./TabNavigation.css";

const TabNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: "quiz",
      label: "Exam Mode",
      icon: "📊",
    },
    {
      id: "exam",
      label: "Exam Correction",
      icon: "🎓",
    },
    {
      id: "self",
      label: "Self Assessment",
      icon: "📝",
    },
  ];

  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
          onClick={() => onTabChange(tab.id)}
          data-tab={tab.id}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
