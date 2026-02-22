import React, { useState, useMemo } from "react";
import { useDashboard } from "../contexts/DashboardContext";
import { Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import ExamDetailPopup from "./ExamDetailPopup";
import "./ExamTab.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const gradeConfig = {
  "A+": { color: "#16A34A", bg: "rgba(22,163,74,0.08)", label: "Outstanding" },
  A: { color: "#2563EB", bg: "rgba(37,99,235,0.08)", label: "Excellent" },
  B: { color: "#7C3AED", bg: "rgba(124,58,237,0.08)", label: "Good" },
  C: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", label: "Average" },
  D: { color: "#F97316", bg: "rgba(249,115,22,0.08)", label: "Below Avg" },
  F: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", label: "Fail" },
};

function getGrade(g) {
  return (
    gradeConfig[g] || {
      color: "#6B7280",
      bg: "rgba(107,114,128,0.08)",
      label: g,
    }
  );
}
function getPctColor(p) {
  return p >= 80 ? "#16A34A" : p >= 60 ? "#F97316" : "#EF4444";
}

function fmtDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Stat Mini Card ───────────────────────────────────────────────────────────
function MiniStat({ icon, value, label, accent }) {
  return (
    <div className="exam-mini-stat" style={{ "--accent": accent }}>
      <span className="mini-stat-icon">{icon}</span>
      <span className="mini-stat-value">{value}</span>
      <span className="mini-stat-label">{label}</span>
    </div>
  );
}

// ─── Exam Result Card ─────────────────────────────────────────────────────────
function ExamCard({ result, index, onClick }) {
  const gc = getGrade(result.grade);
  const pct = result.overall_percentage;

  return (
    <div
      className="exam-card"
      onClick={() => onClick(index)}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      {/* Left accent bar coloured by grade */}
      <span className="exam-card-accent" style={{ background: gc.color }} />

      <div className="exam-card-body">
        {/* Top row */}
        <div className="exam-card-top">
          <div className="exam-card-name-row">
            <span className="exam-card-name">{result.exam_name}</span>
            <span className="exam-type-badge">{result.exam_type}</span>
          </div>
          <div
            className="exam-grade-pill"
            style={{
              color: gc.color,
              background: gc.bg,
              border: `1px solid ${gc.color}22`,
            }}
          >
            {result.grade}
          </div>
        </div>

        {/* Score + progress */}
        <div className="exam-card-score-row">
          <span className="exam-score" style={{ color: getPctColor(pct) }}>
            {result.total_marks_obtained}
            <span className="exam-score-max">/{result.total_max_marks}</span>
          </span>
          <span className="exam-pct-badge" style={{ color: getPctColor(pct) }}>
            {pct}%
          </span>
        </div>

        <div className="exam-progress-track">
          <div
            className="exam-progress-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${gc.color}aa, ${gc.color})`,
            }}
          />
        </div>

        {/* Strengths preview */}
        {result.strengths?.length > 0 && (
          <div className="exam-strengths-preview">
            <span className="strength-dot">✦</span>
            <span className="strength-text">{result.strengths[0]}</span>
          </div>
        )}

        {/* Footer */}
        <div className="exam-card-footer">
          <span className="exam-date">{fmtDate(result.submission_time)}</span>
          <span className="exam-cta">View Analysis →</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const ExamTab = () => {
  const { examData } = useDashboard();
  const [selectedExamIndex, setSelectedExamIndex] = useState(null);

  // ── BUG FIX: add submission_time to the fallback chain ────────────────────
  // Old code only checked exam_date/created_at/date/result_date → always 0.
  // API actually uses `submission_time` — now it's first in the chain.
  const todayStr = new Date().toISOString().slice(0, 10);

  const results = useMemo(() => {
    return (examData?.results || []).filter((r) => {
      const raw =
        r.submission_time ?? // ← API field (was missing before)
        r.exam_date ??
        r.created_at ??
        r.date ??
        r.result_date ??
        null;
      if (!raw) return false;
      return new Date(raw).toISOString().slice(0, 10) === todayStr;
    });
  }, [examData, todayStr]);

  // Oldest-first for trend chart
  const sortedResults = useMemo(() => [...results].reverse(), [results]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const avgPct = useMemo(() => {
    if (!results.length) return 0;
    return Math.round(
      results.reduce((s, r) => s + r.overall_percentage, 0) / results.length,
    );
  }, [results]);

  const bestGrade = useMemo(() => {
    const order = ["A+", "A", "B", "C", "D", "F"];
    const grades = results.map((r) => r.grade);
    for (const g of order) if (grades.includes(g)) return g;
    return "—";
  }, [results]);

  // ── Trend Chart ───────────────────────────────────────────────────────────
  const trendData = {
    labels: sortedResults.map((r) =>
      r.exam_name.length > 18 ? r.exam_name.slice(0, 18) + "…" : r.exam_name,
    ),
    datasets: [
      {
        label: "Score %",
        data: sortedResults.map((r) => r.overall_percentage),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99,102,241,0.08)",
        borderWidth: 3,
        tension: 0.45,
        pointRadius: 7,
        pointHoverRadius: 11,
        pointBorderWidth: 2.5,
        pointHoverBorderWidth: 3,
        pointBackgroundColor: sortedResults.map((r) =>
          getPctColor(r.overall_percentage),
        ),
        pointBorderColor: sortedResults.map((r) =>
          getPctColor(r.overall_percentage),
        ),
        pointHoverBackgroundColor: "#fff",
        fill: true,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: true },
    onClick: (_, el) => {
      if (el.length) setSelectedExamIndex(el[0].index);
    },
    onHover: (e, el) => {
      e.native.target.style.cursor = el.length ? "pointer" : "default";
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.96)",
        titleFont: { size: 13, weight: "700", family: "Inter" },
        bodyFont: { size: 12, family: "Inter" },
        padding: 14,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (i) => sortedResults[i[0].dataIndex].exam_name,
          label: (i) => {
            const r = sortedResults[i.dataIndex];
            return [
              `Score: ${r.total_marks_obtained}/${r.total_max_marks}`,
              `Percentage: ${r.overall_percentage}%`,
              `Grade: ${r.grade}`,
              "",
              "↗ Click for full analysis",
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(255,255,255,0.05)" },
        ticks: {
          color: "#64748B",
          font: { size: 11, weight: "500", family: "Inter" },
          callback: (v) => v + "%",
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#64748B",
          font: { size: 10, weight: "500", family: "Inter" },
          maxRotation: 20,
        },
        border: { display: false },
      },
    },
  };

  // ── Grade Distribution ────────────────────────────────────────────────────
  const gradeCounts = useMemo(() => {
    const counts = {};
    results.forEach((r) => {
      counts[r.grade] = (counts[r.grade] || 0) + 1;
    });
    return counts;
  }, [results]);

  const gradeChartData = {
    labels: Object.keys(gradeCounts),
    datasets: [
      {
        data: Object.values(gradeCounts),
        backgroundColor: Object.keys(gradeCounts).map(
          (g) => getGrade(g).color + "CC",
        ),
        borderWidth: 0,
        spacing: 3,
      },
    ],
  };

  const gradeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 8,
          font: { size: 12, weight: "600", family: "Inter" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.96)",
        padding: 12,
        cornerRadius: 8,
        bodyFont: { family: "Inter" },
      },
    },
  };

  return (
    <div className="exam-tab">
      {/* ── Header ── */}
      <div className="tab-header">
        <h2 className="tab-title">
          Exam <span className="highlight-orange">Corrections & Results</span>
        </h2>
        <p className="tab-subtitle">
          AI-evaluated results for today ·{" "}
          <span className="today-badge">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}
          </span>
        </p>
      </div>

      {/* ── Stats row ── */}
      <div className="exam-stats-row">
        <MiniStat
          icon="🎓"
          value={results.length}
          label="EXAMS TODAY"
          accent="#6366F1"
        />
        <MiniStat
          icon="🎯"
          value={avgPct + "%"}
          label="AVG SCORE"
          accent="#F97316"
        />
        <MiniStat
          icon="🏆"
          value={bestGrade}
          label="BEST GRADE"
          accent="#16A34A"
        />
        <MiniStat
          icon="📚"
          value={
            [...new Set(results.map((r) => r.exam_type).filter(Boolean))]
              .length || "—"
          }
          label="EXAM TYPES"
          accent="#7C3AED"
        />
      </div>

      {results.length > 0 ? (
        <>
          {/* ── Trend chart (dark glass card) ── */}
          <div className="hero-chart-container">
            <div className="hero-chart-header">
              <div className="hch-left">
                <span className="hero-chart-icon">📈</span>
                <div>
                  <h3 className="hero-chart-title">Performance Trend</h3>
                  <p className="hero-chart-sub">
                    Click any point for full exam analysis
                  </p>
                </div>
              </div>
              <div className="hero-chart-legend">
                <span
                  className="legend-dot"
                  style={{ background: "#16A34A" }}
                />{" "}
                ≥80%
                <span
                  className="legend-dot"
                  style={{ background: "#F97316" }}
                />{" "}
                60–80%
                <span
                  className="legend-dot"
                  style={{ background: "#EF4444" }}
                />{" "}
                &lt;60%
              </div>
            </div>
            <div className="hero-chart-wrapper">
              <Line data={trendData} options={trendOptions} />
            </div>
          </div>

          {/* ── Two-col: Exam cards + Grade chart ── */}
          <div className="exam-lower-grid">
            {/* Exam cards list */}
            <div className="exam-cards-col">
              <p className="col-label-heading">Today's Exams</p>
              <div className="exam-cards-list">
                {sortedResults.map((r, i) => (
                  <ExamCard
                    key={r.result_id}
                    result={r}
                    index={i}
                    onClick={setSelectedExamIndex}
                  />
                ))}
              </div>
            </div>

            {/* Grade distribution */}
            <div className="grade-chart-col">
              <p className="col-label-heading">Grade Distribution</p>
              <div className="grade-chart-card">
                <div className="grade-chart-wrapper">
                  <Doughnut data={gradeChartData} options={gradeChartOptions} />
                </div>
                {/* Grade legend with counts */}
                <div className="grade-legend-list">
                  {Object.entries(gradeCounts).map(([g, c]) => {
                    const gc = getGrade(g);
                    return (
                      <div key={g} className="grade-legend-row">
                        <span
                          className="grade-legend-dot"
                          style={{ background: gc.color }}
                        />
                        <span className="grade-legend-name">
                          {g} — {gc.label}
                        </span>
                        <span
                          className="grade-legend-count"
                          style={{ color: gc.color }}
                        >
                          {c}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Popup */}
          {selectedExamIndex !== null && (
            <ExamDetailPopup
              examResult={sortedResults[selectedExamIndex]}
              onClose={() => setSelectedExamIndex(null)}
            />
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>No exam results for today</h3>
          <p>
            Results submitted on today's date will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExamTab;
