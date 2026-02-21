import React from "react";
import { useDashboard } from "../contexts/DashboardContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import "./QuizTab.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const QuizTab = () => {
  const { quizData } = useDashboard();

  const totalQuizzes = quizData?.total_quizzes || 0;
  const quizScores = quizData?.quiz_scores || [];

  const chartData = {
    labels: quizScores.map((q) => q.quiz_name),
    datasets: [
      {
        label: "Quiz Score (%)",
        data: quizScores.map((q) => q.percentage),
        borderColor: "rgba(249, 115, 22, 1)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "rgba(249, 115, 22, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          color: "#6B7280",
          font: { weight: "600" },
          callback: (value) => value + "%",
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: { weight: "500" },
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="quiz-tab">
      <div className="tab-header">
        <h2 className="tab-title">
          Quiz <span className="highlight-orange">Performance</span>
        </h2>
        <p className="tab-subtitle">
          Quizzes generated for your remedial learning
        </p>
      </div>

      <div className="quiz-stat-card anim-fade-up">
        <div className="stat-icon">📊</div>
        <div className="stat-value">{totalQuizzes}</div>
        <div className="stat-label">TOTAL QUIZZES</div>
      </div>

      {quizScores.length > 0 ? (
        <div
          className="chart-container anim-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h3 className="chart-title">Quiz Scores Over Time</h3>
          <div className="chart-wrapper">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No quiz data available</h3>
          <p>Quiz scores will appear here once you complete quizzes</p>
        </div>
      )}
    </div>
  );
};

export default QuizTab;
