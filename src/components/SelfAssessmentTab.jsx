import React, { useEffect } from "react";
import { useDashboard } from "../contexts/DashboardContext";
import StatCard from "./StatCard";
import GapCard from "./GapCard";
import { useKatex } from "../hooks/useKatex";
import "./SelfAssessmentTab.css";

const SelfAssessmentTab = () => {
  const { selfAssessmentData } = useDashboard();
  const katexRef = useKatex();

  const data = Array.isArray(selfAssessmentData)
    ? selfAssessmentData
    : selfAssessmentData?.data || [];

  // Calculate statistics
  const total = data.length;
  const avgScore =
    total > 0
      ? Math.round(
          data.reduce((sum, d) => sum + (d.percentage || 0), 0) / total,
        )
      : 0;
  const perfect = data.filter((d) => d.student_score === d.max_marks).length;
  const subjects = [...new Set(data.map((d) => d.subject).filter(Boolean))];

  return (
    <div className="self-assessment-tab" ref={katexRef}>
      <div className="tab-header">
        <h2 className="tab-title">
          Self Assessment &{" "}
          <span className="highlight-orange">Gap Analysis</span>
        </h2>
        <p className="tab-subtitle">
          Your self-submitted answers and AI-evaluated performance gaps
        </p>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="📊"
          value={total}
          label="TOTAL SUBMISSIONS"
          color="orange"
          delay={0}
        />
        <StatCard
          icon="🎯"
          value={avgScore}
          suffix="%"
          label="AVG SCORE"
          color="blue"
          delay={0.1}
        />
        <StatCard
          icon="✅"
          value={perfect}
          label="FULL MARKS"
          color="green"
          delay={0.2}
        />
        <StatCard
          icon="📚"
          value={subjects.length}
          label="SUBJECTS COVERED"
          color="purple"
          delay={0.3}
        />
      </div>

      <div className="section-header">
        <h3>Detailed Gap Analysis</h3>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No submissions yet</h3>
          <p>Self assessment data will appear here</p>
        </div>
      ) : (
        <div className="gap-cards-container">
          {data.map((item, index) => (
            <GapCard key={index} data={item} index={index} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SelfAssessmentTab;
