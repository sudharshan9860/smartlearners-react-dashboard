import React, { useState } from "react";
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

// Register Chart.js components
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

const ExamTab = () => {
  const { examData } = useDashboard();
  const [selectedExamIndex, setSelectedExamIndex] = useState(null);

  // ── Today filter ───────────────────────────────────────────────────────────
  // Declare `results` ONCE — already filtered to today's date.
  // Remove the old `const results = examData?.results || []` line entirely.
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  const results = (examData?.results || []).filter((r) => {
    const raw = r.exam_date ?? r.created_at ?? r.date ?? r.result_date ?? null;
    if (!raw) return false;
    return new Date(raw).toISOString().slice(0, 10) === todayStr;
  });

  // Reverse to show oldest first in the trend chart
  const sortedResults = [...results].reverse();

  // ── Chart helpers ──────────────────────────────────────────────────────────
  const getPointColor = (percentage) => {
    if (percentage >= 80) return "#10B981";
    if (percentage >= 60) return "#F97316";
    return "#EF4444";
  };

  const trendChartData = {
    labels: sortedResults.map((r) =>
      r.exam_name.length > 20 ? r.exam_name.slice(0, 20) + "..." : r.exam_name,
    ),
    datasets: [
      {
        label: "Percentage",
        data: sortedResults.map((r) => r.overall_percentage),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderWidth: 3.5,
        tension: 0.4,
        pointRadius: 8,
        pointHoverRadius: 13,
        pointBorderWidth: 3,
        pointHoverBorderWidth: 4,
        pointBackgroundColor: sortedResults.map((r) =>
          getPointColor(r.overall_percentage),
        ),
        pointBorderColor: sortedResults.map((r) =>
          getPointColor(r.overall_percentage),
        ),
        pointHoverBackgroundColor: "#fff",
        fill: true,
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: true },
    onClick: (event, elements) => {
      if (elements.length > 0) {
        setSelectedExamIndex(elements[0].index);
      }
    },
    onHover: (event, elements) => {
      event.native.target.style.cursor =
        elements.length > 0 ? "pointer" : "default";
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleFont: { size: 13, weight: "700" },
        bodyFont: { size: 12 },
        padding: 14,
        cornerRadius: 10,
        displayColors: false,
        callbacks: {
          title: (items) => sortedResults[items[0].dataIndex].exam_name,
          label: (item) => {
            const r = sortedResults[item.dataIndex];
            return [
              `Score: ${r.total_marks_obtained}/${r.total_max_marks}`,
              `Percentage: ${r.overall_percentage}%`,
              `Grade: ${r.grade}`,
              "",
              "Click for full details",
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: { color: "rgba(0, 0, 0, 0.03)" },
        ticks: {
          color: "#94A3B8",
          font: { weight: "600" },
          callback: (v) => v + "%",
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#94A3B8",
          font: { weight: "500", size: 11 },
          maxRotation: 25,
        },
        border: { display: false },
      },
    },
  };

  // Grade distribution — built from today's filtered results
  const gradeCounts = {};
  results.forEach((r) => {
    gradeCounts[r.grade] = (gradeCounts[r.grade] || 0) + 1;
  });

  const gradeChartData = {
    labels: Object.keys(gradeCounts),
    datasets: [
      {
        data: Object.values(gradeCounts),
        backgroundColor: [
          "rgba(16, 185, 129, 0.8)",
          "rgba(37, 99, 235, 0.8)",
          "rgba(249, 115, 22, 0.8)",
          "rgba(239, 68, 68, 0.8)",
        ],
        borderWidth: 0,
        spacing: 4,
      },
    ],
  };

  const gradeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          usePointStyle: true,
          font: { size: 12, weight: "600" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        padding: 12,
        cornerRadius: 8,
      },
    },
  };

  const handleClosePopup = () => setSelectedExamIndex(null);

  return (
    <div className="exam-tab">
      <div className="tab-header">
        <h2 className="tab-title">
          Exam <span className="highlight-orange">Corrections & Results</span>
        </h2>
        <p className="tab-subtitle">
          AI evaluated exam results with detailed question-wise analysis
        </p>
      </div>

      {/* Total Exams Stat */}
      <div className="exam-stat-card anim-fade-up">
        <div className="stat-icon">🎓</div>
        <div className="stat-value">{results.length}</div>
        <div className="stat-label">EXAMS TAKEN</div>
      </div>

      {results.length > 0 ? (
        <>
          {/* Hero Chart - Performance Trend */}
          <div
            className="hero-chart-container anim-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="hero-chart-header">
              <div className="hero-chart-icon">📈</div>
              <div className="hero-chart-info">
                <h3>Exam Performance Trend</h3>
                <p>Click on any point to view detailed exam analysis</p>
              </div>
            </div>
            <div className="hero-chart-wrapper">
              <Line data={trendChartData} options={trendChartOptions} />
            </div>
          </div>

          {/* Grade Distribution */}
          <div
            className="grade-chart-container anim-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h3 className="chart-title">Grade Distribution</h3>
            <div className="grade-chart-wrapper">
              <Doughnut data={gradeChartData} options={gradeChartOptions} />
            </div>
          </div>

          {/* Exam Detail Popup */}
          {selectedExamIndex !== null && (
            <ExamDetailPopup
              examResult={sortedResults[selectedExamIndex]}
              onClose={handleClosePopup}
            />
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎓</div>
          <h3>No exam results for today</h3>
          <p>Exam corrections submitted today will appear here</p>
        </div>
      )}
    </div>
  );
};

export default ExamTab;
