import React, { useState, useMemo } from "react";
import { useDashboard } from "../contexts/DashboardContext";
import StatCard from "./StatCard";
import { useKatex } from "../hooks/useKatex";
import "./SelfAssessmentTab.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// ─── Filter options ───────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all", label: "All", icon: "📋" },
  { key: "correct", label: "Answered", icon: "✅" },
  { key: "gaps", label: "Has Gaps", icon: "⚠️" },
  { key: "perfect", label: "Full Marks", icon: "🏆" },
  { key: "not_solved", label: "Not Solved", icon: "❌" },
];

const CHAPTER_MAP = {
  1: "DIRECT AND INVERSE PROPORTION",
  2: "FACTORIZATION",
  3: "MENSURATION",
  4: "ALGEBRAIC EQUATIONS AND IDENTITIES",
  5: "LINEAR EQUATIONS IN ONE VARIABLE",
  6: "QUADRILATERALS",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="custom-tooltip">
        <p className="tooltip-title">
          CHAPTER {data.chapterNumber} - {CHAPTER_MAP[data.chapterNumber]}
        </p>
        <p>Attempted: {data.attempted}</p>
        <p style={{ color: "green" }}>Correct: {data.correct}</p>
        <p style={{ color: "red" }}>Wrong: {data.wrong}</p>
      </div>
    );
  }

  return null;
};

// ─── FIX: Correct avg score calculation ──────────────────────────────────────
// OLD BUG 1: `d.percentage` does not exist on the API response → always 0.
// OLD BUG 2: divided by ALL rows including unscored "explain" entries.
// FIX: filter to graded rows (max_marks > 0), use student_score / max_marks.
function computeStats(rows) {
  const graded = rows.filter((d) => d.max_marks && d.max_marks > 0);
  const avgScore =
    graded.length > 0
      ? Math.round(
          (graded.reduce((sum, d) => sum + d.student_score / d.max_marks, 0) /
            graded.length) *
            100,
        )
      : 0;
  const fullMarks = graded.filter(
    (d) => d.student_score === d.max_marks,
  ).length;
  const subjects = [...new Set(rows.map((d) => d.subject).filter(Boolean))];
  const gapCount = graded.filter(
    (d) => d.student_gaps && d.student_gaps !== "None" && d.student_gaps.trim(),
  ).length;
  return {
    total: rows.length,
    gradedCount: graded.length,
    avgScore,
    fullMarks,
    subjectCount: subjects.length,
    gapCount,
  };
}

// ─── Main component ───────────────────────────────────────────────────────────
const SelfAssessmentTab = () => {
  const { selfAssessmentData } = useDashboard();
  const katexRef = useKatex();

  // ── Silent data filter (not shown in UI) ─────────────────────────────────
  // Show a row if EITHER condition is true:
  //   1. subject contains "Mathematics -3"  (case-insensitive)
  //   2. submission date is after 21 Feb 2026 at 6:00 PM IST
  //      IST = UTC+5:30, so 6:00 PM IST = 12:30 UTC → stored as local time below
  const SILENT_SUBJECT = "mathematics -3";
  const SILENT_DATE_CUTOFF = new Date("2026-02-21T18:00:00"); // local time (IST)

  const allRows = useMemo(() => {
    const raw = Array.isArray(selfAssessmentData)
      ? selfAssessmentData
      : selfAssessmentData?.data || [];

    const silentFiltered = raw.filter((item) => {
      // Condition 1 — subject match
      const subjectMatch =
        item.subject?.toLowerCase().includes(SILENT_SUBJECT) ?? false;

      // Condition 2 — date after cutoff
      // Tries all common date field names your API might use
      const rawDate = item.submitted_at ?? item.created_at ?? item.date ?? null;
      const itemDate = rawDate ? new Date(rawDate) : null;
      const dateMatch = itemDate ? itemDate > SILENT_DATE_CUTOFF : false;

      return subjectMatch || dateMatch;
    });

    return [...silentFiltered].sort((a, b) => b.id - a.id); // newest first
  }, [selfAssessmentData]);

  const stats = useMemo(() => computeStats(allRows), [allRows]);

  // ─── Chapter Stats for Chart ─────────────────────────────────────
  const chartData = useMemo(() => {
    const chapterStats = {};

    allRows.forEach((item) => {
      const chapter = item.chapter_number;
      if (!chapter) return;

      if (!chapterStats[chapter]) {
        chapterStats[chapter] = {
          attempted: 0,
          correct: 0,
          wrong: 0,
        };
      }

      chapterStats[chapter].attempted += 1;

      if (item.max_marks && item.student_score === item.max_marks) {
        chapterStats[chapter].correct += 1;
      } else if (item.max_marks) {
        chapterStats[chapter].wrong += 1;
      }
    });

    return Object.keys(chapterStats).map((chapter) => ({
      chapter: CHAPTER_MAP[chapter] || `Chapter ${chapter}`,
      chapterNumber: Number(chapter),
      attempted: chapterStats[chapter].attempted,
      correct: chapterStats[chapter].correct,
      wrong: chapterStats[chapter].wrong,
    }));
  }, [allRows]);

  return (
    <div className="self-assessment-tab" ref={katexRef}>
      <div className="tab-header">
        <h2 className="tab-title">
          Self Assessment &amp;{" "}
          <span className="highlight-orange">Performance Summary</span>
        </h2>
        <p className="tab-subtitle">Your overall performance overview</p>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="📊"
          value={stats.total}
          label="TOTAL SUBMISSIONS"
          color="orange"
        />
        <StatCard
          icon="🎯"
          value={stats.avgScore}
          label="AVG SCORE"
          suffix="%"
          color="blue"
        />
        <StatCard
          icon="✅"
          value={stats.fullMarks}
          label="FULL MARKS"
          color="green"
        />
        <StatCard
          icon="📚"
          value={stats.subjectCount}
          label="SUBJECTS COVERED"
          color="purple"
        />
      </div>

      <div className="chapter-performance-card">
        <h3>Chapter Performance</h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="chapter" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="correct" stackId="a" fill="#22c55e" />
            <Bar dataKey="wrong" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SelfAssessmentTab;
