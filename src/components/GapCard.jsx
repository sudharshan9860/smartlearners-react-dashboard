import React from "react";
import "./GapCard.css";

const GapCard = ({ data, index }) => {
  const {
    subject,
    chapter,
    question,
    student_score,
    max_marks,
    percentage,
    time_spent,
    difficulty,
    gap_identified,
    time_rating,
    type,
  } = data;

  const getDifficultyColor = (level) => {
    switch (level?.toLowerCase()) {
      case "easy":
        return "green";
      case "medium":
        return "orange";
      case "hard":
        return "red";
      default:
        return "gray";
    }
  };

  const getScoreColor = (pct) => {
    if (pct >= 80) return "green";
    if (pct >= 60) return "orange";
    return "red";
  };

  const difficultyColor = getDifficultyColor(difficulty);
  const scoreColor = getScoreColor(percentage);

  return (
    <div
      className="gap-card anim-fade-up"
      style={{ animationDelay: `${0.05 * index}s` }}
    >
      <div className="gap-header">
        <div className="gap-subject-info">
          <div className="gap-subject">{subject}</div>
          <div className="gap-chapter">{chapter}</div>
        </div>
        <div className="gap-badges">
          <span className={`badge badge-${difficultyColor}`}>{difficulty}</span>
          {gap_identified && (
            <span className="badge badge-red">Gap Identified</span>
          )}
        </div>
      </div>

      <div className="gap-question">{question}</div>

      <div className="gap-stats">
        <div className="gap-stat">
          <div className="gap-stat-label">Score</div>
          <div className={`gap-stat-value color-${scoreColor}`}>
            {student_score}/{max_marks}
            <span className="gap-stat-pct">({percentage}%)</span>
          </div>
        </div>
        <div className="gap-stat">
          <div className="gap-stat-label">Time</div>
          <div className="gap-stat-value">{time_spent}</div>
        </div>
        <div className="gap-stat">
          <div className="gap-stat-label">Time Rating</div>
          <div className="gap-stat-value">{time_rating}</div>
        </div>
        <div className="gap-stat">
          <div className="gap-stat-label">Type</div>
          <div className="gap-stat-value">{type}</div>
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className={`progress-bar progress-${scoreColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default GapCard;
