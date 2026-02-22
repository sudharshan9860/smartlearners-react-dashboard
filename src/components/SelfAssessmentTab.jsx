import React, { useState, useMemo } from "react";
import { useDashboard } from "../contexts/DashboardContext";
import StatCard from "./StatCard";
import GapCard from "./GapCard";
import { useKatex } from "../hooks/useKatex";
import "./SelfAssessmentTab.css";

// ─── Filter options ───────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all", label: "All", icon: "📋" },
  { key: "correct", label: "Answered", icon: "✅" },
  { key: "gaps", label: "Has Gaps", icon: "⚠️" },
  { key: "perfect", label: "Full Marks", icon: "🏆" },
  { key: "not_solved", label: "Not Solved", icon: "❌" },
];

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

// ─── Apply quick filter ───────────────────────────────────────────────────────
function applyFilter(rows, key) {
  switch (key) {
    case "correct":
      return rows.filter((d) => d.answering_type === "correct");
    case "gaps":
      return rows.filter(
        (d) =>
          d.student_gaps && d.student_gaps !== "None" && d.student_gaps.trim(),
      );
    case "perfect":
      return rows.filter((d) => d.max_marks && d.student_score === d.max_marks);
    case "not_solved":
      return rows.filter((d) => d.answering_type === "not solved");
    default:
      return rows;
  }
}

// ─── Group rows: Subject → Chapter ───────────────────────────────────────────
function groupBySubjectChapter(rows) {
  return rows.reduce((acc, item) => {
    const sub = item.subject || "Unknown";
    const ch = `Chapter ${item.chapter_number || "?"}`;
    if (!acc[sub]) acc[sub] = {};
    if (!acc[sub][ch]) acc[sub][ch] = [];
    acc[sub][ch].push(item);
    return acc;
  }, {});
}

// ─── Score Distribution chart ─────────────────────────────────────────────────
function ScoreDistribution({ allRows }) {
  const graded = allRows.filter((d) => d.max_marks && d.max_marks > 0);
  const unscored = allRows.length - graded.length;
  const buckets = [
    { label: "0–40%", color: "#ef4444", count: 0 },
    { label: "41–60%", color: "#f97316", count: 0 },
    { label: "61–80%", color: "#eab308", count: 0 },
    { label: "81–100%", color: "#22c55e", count: 0 },
  ];
  graded.forEach((d) => {
    const p = (d.student_score / d.max_marks) * 100;
    if (p <= 40) buckets[0].count++;
    else if (p <= 60) buckets[1].count++;
    else if (p <= 80) buckets[2].count++;
    else buckets[3].count++;
  });
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="score-distribution">
      <p className="score-dist-title">
        📊 Score Distribution
        <span className="score-dist-sub">
          {" "}
          · {graded.length} graded answers
        </span>
      </p>
      <div className="score-dist-bars">
        {buckets.map((b) => (
          <div key={b.label} className="dist-bar-col">
            <span className="dist-bar-count" style={{ color: b.color }}>
              {b.count}
            </span>
            <div className="dist-bar-track">
              <div
                className="dist-bar-fill"
                style={{
                  width: `${Math.max((b.count / maxCount) * 100, b.count > 0 ? 8 : 0)}%`,
                  background: b.color,
                }}
              />
            </div>
            <span className="dist-bar-label">{b.label}</span>
          </div>
        ))}
      </div>
      {unscored > 0 && (
        <p className="score-dist-note">
          ℹ️ {unscored} submission{unscored !== 1 ? "s" : ""} are Explain / Not
          Solved (no score) — avg is calculated from graded answers only.
        </p>
      )}
    </div>
  );
}

// ─── Subject collapsible section ──────────────────────────────────────────────
function SubjectSection({ subject, chapters }) {
  const [open, setOpen] = useState(true);
  const allRows = Object.values(chapters).flat();
  const graded = allRows.filter((d) => d.max_marks && d.max_marks > 0);
  const avg =
    graded.length > 0
      ? Math.round(
          (graded.reduce((s, d) => s + d.student_score / d.max_marks, 0) /
            graded.length) *
            100,
        )
      : null;
  const avgColor =
    avg === null
      ? "#94a3b8"
      : avg >= 80
        ? "#22c55e"
        : avg >= 60
          ? "#eab308"
          : avg >= 40
            ? "#f97316"
            : "#ef4444";

  return (
    <div className="subject-section">
      <button
        className="subject-header"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
      >
        <div className="subject-header-left">
          <span className="subject-dot" />
          <span className="subject-name">{subject}</span>
          <span className="subject-meta">
            {allRows.length} submissions · {Object.keys(chapters).length}{" "}
            chapter{Object.keys(chapters).length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="subject-header-right">
          {avg !== null && (
            <div className="subject-avg">
              <div className="subject-avg-track">
                <div
                  className="subject-avg-fill"
                  style={{ width: `${avg}%`, background: avgColor }}
                />
              </div>
              <span className="subject-avg-pct" style={{ color: avgColor }}>
                {avg}%
              </span>
            </div>
          )}
          <span className={`chevron ${open ? "chevron-open" : ""}`}>▾</span>
        </div>
      </button>

      {open && (
        <div className="subject-body">
          {Object.entries(chapters).map(([ch, rows]) => (
            <ChapterSection key={ch} chapter={ch} rows={rows} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chapter section ──────────────────────────────────────────────────────────
function ChapterSection({ chapter, rows }) {
  const unique = useMemo(() => {
    const seen = {};
    rows.forEach((r) => {
      const k = r.question_text;
      if (!seen[k] || (!seen[k].student_answer && r.student_answer))
        seen[k] = r;
    });
    return Object.values(seen);
  }, [rows]);

  return (
    <div className="chapter-section">
      <div className="chapter-header">
        <span className="chapter-label">{chapter}</span>
        <span className="chapter-meta">
          {unique.length} unique question{unique.length !== 1 ? "s" : ""}
          {rows.length > unique.length && ` · ${rows.length} attempts`}
        </span>
      </div>
      <div className="chapter-cards">
        {unique.map((item) => (
          <GapCard key={item.id} data={item} index={item.id} />
        ))}
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────
function FilterBar({ active, onChange, counts }) {
  return (
    <div className="filter-bar">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          className={`filter-btn ${active === f.key ? "filter-btn-active" : ""}`}
          onClick={() => onChange(f.key)}
        >
          <span className="filter-icon">{f.icon}</span>
          <span>{f.label}</span>
          <span className="filter-count">{counts[f.key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const SelfAssessmentTab = () => {
  const { selfAssessmentData } = useDashboard();
  const katexRef = useKatex();
  const [activeFilter, setActiveFilter] = useState("all");

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

  const filterCounts = useMemo(
    () => ({
      all: allRows.length,
      correct: allRows.filter((d) => d.answering_type === "correct").length,
      gaps: allRows.filter(
        (d) =>
          d.student_gaps && d.student_gaps !== "None" && d.student_gaps.trim(),
      ).length,
      perfect: allRows.filter(
        (d) => d.max_marks && d.student_score === d.max_marks,
      ).length,
      not_solved: allRows.filter((d) => d.answering_type === "not solved")
        .length,
    }),
    [allRows],
  );

  const filtered = useMemo(
    () => applyFilter(allRows, activeFilter),
    [allRows, activeFilter],
  );
  const grouped = useMemo(() => groupBySubjectChapter(filtered), [filtered]);

  return (
    <div className="self-assessment-tab" ref={katexRef}>
      <div className="tab-header">
        <h2 className="tab-title">
          Self Assessment &amp;{" "}
          <span className="highlight-orange">Gap Analysis</span>
        </h2>
        <p className="tab-subtitle">
          Your self-submitted answers and AI-evaluated performance gaps
        </p>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="📊"
          value={stats.total}
          label="TOTAL SUBMISSIONS"
          color="orange"
          delay={0}
        />
        <StatCard
          icon="🎯"
          value={stats.avgScore}
          label="AVG SCORE"
          suffix="%"
          color="blue"
          delay={0.1}
        />
        <StatCard
          icon="✅"
          value={stats.fullMarks}
          label="FULL MARKS"
          color="green"
          delay={0.2}
        />
        <StatCard
          icon="📚"
          value={stats.subjectCount}
          label="SUBJECTS COVERED"
          color="purple"
          delay={0.3}
        />
      </div>

      {allRows.length > 0 && <ScoreDistribution allRows={allRows} />}

      <div className="section-header">
        <h3>Detailed Gap Analysis</h3>
      </div>

      <FilterBar
        active={activeFilter}
        onChange={setActiveFilter}
        counts={filterCounts}
      />

      <div className="results-meta">
        <span>
          Showing <strong>{filtered.length}</strong> submission
          {filtered.length !== 1 ? "s" : ""}
        </span>
        {activeFilter !== "all" && (
          <button
            className="clear-filter-btn"
            onClick={() => setActiveFilter("all")}
          >
            Clear filter ×
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No submissions here</h3>
          <p>Try a different filter or complete more questions.</p>
        </div>
      ) : (
        <div className="gap-cards-container">
          {Object.entries(grouped).map(([subject, chapters]) => (
            <SubjectSection
              key={subject}
              subject={subject}
              chapters={chapters}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SelfAssessmentTab;
