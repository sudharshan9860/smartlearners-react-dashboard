import React, { useState, useEffect, useRef } from "react";
import "./StatCard.css";

const StatCard = ({ icon, value, suffix = "", label, color, delay = 0 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef(null);
  const animatingRef = useRef(false); // tracks whether animation is in progress
  const rafRef = useRef(null); // stores requestAnimationFrame id for cleanup

  // ── Re-run animation whenever `value` changes ─────────────────────────────
  // The OLD bug: `hasAnimated` was set to true after the first animation
  // (which ran with value=0 because data hadn't loaded yet). When real data
  // arrived and value changed, `hasAnimated` blocked the second animation.
  //
  // Fix: use an IntersectionObserver only to know the card is visible,
  // then always re-animate when `value` changes (using a separate effect).
  const [isVisible, setIsVisible] = useState(false);

  // Observe when the card enters the viewport
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

  // Animate whenever value changes AND the card is visible
  useEffect(() => {
    // Don't animate if value is 0 AND card hasn't been visible yet
    // (avoids useless 0→0 run on first render)
    if (!isVisible && value === 0) return;

    // Cancel any in-progress animation before starting a new one
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = value;

    const update = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(from + (to - from) * easeOut));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, isVisible]); // ← re-runs whenever value changes (e.g. 0 → real number)

  return (
    <div
      ref={cardRef}
      className={`stat-card border-${color} anim-fade-up`}
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
