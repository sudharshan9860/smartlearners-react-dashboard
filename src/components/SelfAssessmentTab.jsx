import React, { useEffect } from "react";
import { useDashboard } from "../contexts/DashboardContext";
import StatCard from "./StatCard";
import GapCard from "./GapCard";
import { useKatex } from "../hooks/useKatex";
import "./SelfAssessmentTab.css";

// ── Filter constants (must be declared BEFORE they are used) ──────────────────
// "Cannot access before initialization" error happens when const is placed
// after the line that references it. Always declare constants at the top.
const FILTER_SUBJECT_KEYWORD = "mathematics -3"; // lowercase for comparison
const FILTER_DATE_CUTOFF = new Date("2026-02-21T18:00:00"); // 21 Feb 2026, 6 PM IST

const SelfAssessmentTab = () => {
  const { selfAssessmentData } = useDashboard();
  const katexRef = useKatex();

  // ── Real API shape: { message: "...", data: Array(122) } ──────────────────
  // So we always pull from .data — fall back to [] if missing
  const rawData = Array.isArray(selfAssessmentData)
    ? selfAssessmentData // in case API ever returns plain array
    : selfAssessmentData?.data || []; // normal shape from your backend

  // ── OR filter: subject keyword OR date after cutoff ───────────────────────
  // A row is shown if AT LEAST ONE condition is true.
  const data = rawData.filter((item) => {
    const subjectMatch =
      item.subject?.toLowerCase().includes(FILTER_SUBJECT_KEYWORD) ?? false;

    // Adjust field name if your API uses a different key for submission date
    const raw = item.submitted_at ?? item.created_at ?? item.date ?? null;
    const itemDate = raw ? new Date(raw) : null;
    const dateMatch = itemDate ? itemDate > FILTER_DATE_CUTOFF : false;

    return subjectMatch || dateMatch;
  });

  // ── Statistics (computed from filtered data) ──────────────────────────────
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
          <h3>No matching submissions</h3>
          <p>No data found for the active subject / date filter</p>
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
