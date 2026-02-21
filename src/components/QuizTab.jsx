import React, { useMemo } from "react";
import { useDashboard } from "../contexts/DashboardContext";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./QuizTab.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

// ── Threshold reference lines plugin (same style as Self Assessment graph) ───
const PASS = 75;
const WARN = 35;

const thresholdLinesPlugin = {
  id: "thresholdLines",
  beforeDraw(chart) {
    const {
      ctx,
      chartArea: { top, bottom, left, right },
      scales: { y },
    } = chart;
    const passY = y.getPixelForValue(PASS);
    const warnY = y.getPixelForValue(WARN);

    ctx.save();
    ctx.fillStyle = "rgba(16,185,129,0.08)";
    ctx.fillRect(left, top, right - left, passY - top);
    ctx.fillStyle = "rgba(239,68,68,0.08)";
    ctx.fillRect(left, warnY, right - left, bottom - warnY);
    ctx.restore();

    ctx.save();
    ctx.setLineDash([6, 4]);

    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(left, passY);
    ctx.lineTo(right, passY);
    ctx.stroke();
    ctx.fillStyle = "#10B981";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.fillText(`${PASS}%`, right + 6, passY + 4);

    ctx.strokeStyle = "#EF4444";
    ctx.beginPath();
    ctx.moveTo(left, warnY);
    ctx.lineTo(right, warnY);
    ctx.stroke();
    ctx.fillStyle = "#EF4444";
    ctx.fillText(`${WARN}%`, right + 6, warnY + 4);
    ctx.restore();
  },
};

const QuizTab = () => {
  const { quizData } = useDashboard();

  const totalQuizzes = quizData?.total_quizzes || 0;
  const allQuizzes = quizData?.quiz_scores || [];

  // ── Take only the last 2 exams ─────────────────────────────────────────────
  const lastTwo = useMemo(() => {
    // Sort by date descending, take first 2, then reverse to keep chronological
    const sorted = [...allQuizzes].sort(
      (a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0),
    );
    return sorted.slice(0, 2).reverse();
  }, [allQuizzes]);

  // ── Aggregate scores per subject across those 2 exams ────────────────────
  // We average the percentage across the (up to 2) exams per subject
  const { labels, values } = useMemo(() => {
    const subjectMap = {}; // { subjectName: { total: number, count: number } }

    lastTwo.forEach((quiz) => {
      const subjects = quiz.subjects || [];
      subjects.forEach(({ subject, score, max }) => {
        if (!subject) return;
        const pct = max > 0 ? Math.round((score / max) * 100) : 0;
        if (!subjectMap[subject]) subjectMap[subject] = { total: 0, count: 0 };
        subjectMap[subject].total += pct;
        subjectMap[subject].count += 1;
      });
    });

    const lbs = Object.keys(subjectMap);
    const vals = lbs.map((s) =>
      Math.round(subjectMap[s].total / subjectMap[s].count),
    );
    return { labels: lbs, values: vals };
  }, [lastTwo]);

  // ── Chart config ──────────────────────────────────────────────────────────
  const chartData = {
    labels,
    datasets: [
      {
        label: "Score (%)",
        data: values,
        backgroundColor: values.map((v) =>
          v >= PASS ? "rgba(16,185,129,0.85)" : "rgba(249,115,22,0.85)",
        ),
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 40 } }, // room for the % labels on the right
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.95)",
        padding: 12,
        cornerRadius: 8,
        callbacks: { label: (item) => ` ${item.raw}%` },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (v) => v + "%",
          color: "#6B7280",
          font: { weight: "600" },
        },
        grid: { color: "rgba(0,0,0,0.05)" },
        border: { display: false },
        title: {
          display: true,
          text: "Score (%)",
          color: "#6B7280",
          font: { size: 12, weight: "600" },
        },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#6B7280",
          font: { weight: "500" },
          maxRotation: 25,
          // Truncate long subject names
          callback(val) {
            const label = this.getLabelForValue(val);
            return label.length > 14 ? label.slice(0, 13) + "…" : label;
          },
        },
        border: { display: false },
      },
    },
  };

  // ── Exam label for the subtitle ────────────────────────────────────────────
  const examLabels = lastTwo.map((q) => q.quiz_name).join(" & ");

  return (
    <div className="quiz-tab">
      <div className="tab-header">
        <h2 className="tab-title">
          Quiz <span className="highlight-orange">Performance</span>
        </h2>
        <p className="tab-subtitle">
          Subject scores from last 2 exams
          {examLabels ? ` (${examLabels})` : ""}
        </p>
      </div>

      <div className="quiz-stat-card anim-fade-up">
        <div className="stat-icon">📊</div>
        <div className="stat-value">{totalQuizzes}</div>
        <div className="stat-label">TOTAL QUIZZES</div>
      </div>

      {labels.length > 0 ? (
        <div
          className="chart-container anim-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h3 className="chart-title">Subject Score Distribution</h3>
          <div className="chart-wrapper">
            <Bar
              data={chartData}
              options={chartOptions}
              plugins={[thresholdLinesPlugin]}
            />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No quiz data available</h3>
          <p>Subject scores will appear once quizzes are completed</p>
        </div>
      )}
    </div>
  );
};

export default QuizTab;
