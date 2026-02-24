import React, { useState, useEffect, useRef } from "react";
import "./StatCard.css";

const StatCard = ({ icon, value, suffix = "", label, color, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef(null);
  const rafRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 },
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible && value === 0) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 800;
    const start = performance.now();
    const to = value;

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(easeOut * to));
      if (progress < 1) rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, isVisible]);

  return (
    <div
      ref={cardRef}
      className={`stat-card border-${color} anim-fade-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="stat-icon-wrap">
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-value">
        {displayValue}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;
