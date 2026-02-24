import React, { useRef, useEffect, useCallback } from "react";
import "./TabNavigation.css";

const tabs = [
  { id: "quiz", label: "Exam Mode", icon: "📊" },
  { id: "exam", label: "Exam Correction", icon: "🎓" },
  { id: "self", label: "Self Assessment", icon: "📝" },
];

const TabNavigation = ({ activeTab, onTabChange }) => {
  const navRef = useRef(null);
  const bulletRef = useRef(null);
  const btnRefs = useRef([]);

  // Move the bullet to cover the currently active button
  const moveBullet = useCallback((btn) => {
    if (!navRef.current || !bulletRef.current || !btn) return;
    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const padding = 8; // matches CSS padding on nav
    bulletRef.current.style.left = btnRect.left - navRect.left - padding + "px";
    bulletRef.current.style.width = btnRect.width + "px";

    // Re-trigger the shimmer animation
    const b = bulletRef.current;
    b.style.animation = "none";
    // eslint-disable-next-line no-unused-expressions
    b.offsetHeight; // force reflow
    b.style.animation = "";
  }, []);

  // On tab change: move bullet + fire callback
  const handleClick = (id, idx) => {
    moveBullet(btnRefs.current[idx]);
    onTabChange(id);
  };

  // Init bullet on mount and on resize
  useEffect(() => {
    const initBullet = () => {
      const idx = tabs.findIndex((t) => t.id === activeTab);
      if (idx !== -1) {
        const btn = btnRefs.current[idx];
        if (btn) {
          // Snap without transition on first paint
          const b = bulletRef.current;
          if (b) {
            b.style.transition = "none";
            moveBullet(btn);
            requestAnimationFrame(() => {
              if (b) b.style.transition = "";
            });
          }
        }
      }
    };
    // Small RAF to ensure layout is complete
    requestAnimationFrame(initBullet);
    window.addEventListener("resize", initBullet);
    return () => window.removeEventListener("resize", initBullet);
  }, []); // eslint-disable-line

  // Move bullet when activeTab prop changes externally
  useEffect(() => {
    const idx = tabs.findIndex((t) => t.id === activeTab);
    if (idx !== -1) moveBullet(btnRefs.current[idx]);
  }, [activeTab, moveBullet]);

  return (
    <div className="tab-navigation" ref={navRef}>
      {/* Animated sliding bullet pill */}
      <div className="tab-bullet" ref={bulletRef} />

      {tabs.map((tab, idx) => (
        <button
          key={tab.id}
          ref={(el) => (btnRefs.current[idx] = el)}
          className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
          onClick={() => handleClick(tab.id, idx)}
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
