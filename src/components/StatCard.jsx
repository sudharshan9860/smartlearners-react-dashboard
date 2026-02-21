import React, { useState, useEffect, useRef } from "react";
import "./StatCard.css";

const StatCard = ({ icon, value, suffix = "", label, color, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            animateValue(value);
          }
        });
      },
      { threshold: 0.1 },
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [value, hasAnimated]);

  const animateValue = (target) => {
    const duration = 800;
    const start = performance.now();
    const from = 0;

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (target - from) * easeOut);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    requestAnimationFrame(update);
  };

  const borderColorClass = `border-${color}`;

  return (
    <div
      ref={cardRef}
      className={`stat-card ${borderColorClass} anim-fade-up`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">
        {displayValue}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;
