import React, { useMemo, useState, useEffect, useRef } from "react";
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

// ── Constants ─────────────────────────────────────────────────────────────────
const SUBJECT_CONFIG = {
  PHYSICS: { label: "Physics", emoji: "⚛️", accent: "#4F46E5" },
  MATHEMATICS: { label: "Mathematics", emoji: "📐", accent: "#7C3AED" },
  CHEMISTRY: { label: "Chemistry", emoji: "🧪", accent: "#0891B2" },
  BIOLOGY: { label: "Biology", emoji: "🌿", accent: "#059669" },
};

// ── Chart gradient plugin ─────────────────────────────────────────────────────
const gradientPlugin = {
  id: "gradientBars",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    chart.data.datasets.forEach((ds) => {
      const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      if (ds.label === "Latest Test") {
        g.addColorStop(0, "#6366F1");
        g.addColorStop(1, "#4338CA");
        ds.backgroundColor = g;
      }
      if (ds.label === "Previous Test") {
        g.addColorStop(0, "#64748B");
        g.addColorStop(1, "#334155");
        ds.backgroundColor = g;
      }
    });
  },
};
ChartJS.register(gradientPlugin);

// ── Helpers ───────────────────────────────────────────────────────────────────
const getDeltaInfo = (delta, totalAttempts) => {
  if (delta === null) return null;

  if (delta > 0)
    return {
      icon: "📈",
      text: `Improved by ${delta}% compared to previous attempt`,
      cls: "up",
    };

  if (delta < 0)
    return {
      icon: "📉",
      text: `Dropped by ${Math.abs(delta)}% compared to previous attempt`,
      cls: "down",
    };

  // delta === 0
  if (totalAttempts >= 2) {
    return {
      icon: "➡️",
      text:
        totalAttempts === 2
          ? "No change from previous attempt"
          : "No change in your last two attempts",
      cls: "same",
    };
  }

  return null;
};

// ── Component ─────────────────────────────────────────────────────────────────
const QuizTab = () => {
  const { quizData } = useDashboard();
  const chartRef = useRef(null);
  const [activeSubject, setActiveSubject] = useState(null);

  const rawQuizArray = useMemo(
    () => (Array.isArray(quizData) ? quizData : []),
    [quizData],
  );

  const availableSubjects = useMemo(() => {
    const s = new Set();
    rawQuizArray.forEach((q) => {
      if (q?.graph_data?.subject) s.add(q.graph_data.subject);
    });
    return Array.from(s).sort();
  }, [rawQuizArray]);

  useEffect(() => {
    if (availableSubjects.length > 0 && activeSubject === null) {
      setActiveSubject(availableSubjects[0]);
    }
  }, [availableSubjects, activeSubject]);

  const filteredArray = useMemo(() => {
    if (!activeSubject) return rawQuizArray;
    return rawQuizArray.filter((q) => q?.graph_data?.subject === activeSubject);
  }, [rawQuizArray, activeSubject]);

  const chapterHistory = useMemo(() => {
    const map = {};
    filteredArray.forEach((quiz) => {
      (quiz?.graph_data?.chapter_breakdown || []).forEach(
        ({ chapter, score_pct }) => {
          if (!chapter) return;
          if (!map[chapter]) map[chapter] = [];
          map[chapter].push({
            score_pct: score_pct ?? 0,
            date: quiz.created_at ?? "",
          });
        },
      );
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => new Date(a.date) - new Date(b.date)),
    );
    return map;
  }, [filteredArray]);

  const chapterStats = useMemo(
    () =>
      Object.entries(chapterHistory).map(([chapter, attempts]) => {
        const latest = attempts[attempts.length - 1];
        const previous =
          attempts.length > 1 ? attempts[attempts.length - 2] : null;
        const delta = previous ? latest.score_pct - previous.score_pct : null;
        return {
          chapter,
          latestScore: latest.score_pct,
          prevScore: previous?.score_pct ?? null,
          delta,
          totalAttempts: attempts.length,
        };
      }),
    [chapterHistory],
  );

  const hasPrevData = chapterStats.some((c) => c.prevScore !== null);
  const totalQuizzes = filteredArray.length;

  const insights = useMemo(() => {
    const withDelta = chapterStats.filter((c) => c.delta !== null);
    const bestChapter = withDelta.length
      ? withDelta.reduce((a, b) => (b.delta > a.delta ? b : a), withDelta[0])
      : null;
    const avgDelta = withDelta.length
      ? Math.round(
          withDelta.reduce((s, c) => s + c.delta, 0) / withDelta.length,
        )
      : null;
    const focusChapter = chapterStats.length
      ? chapterStats.reduce(
          (a, b) => (b.latestScore < a.latestScore ? b : a),
          chapterStats[0],
        )
      : null;
    return { bestChapter, avgDelta, focusChapter };
  }, [chapterStats]);

  // ── Chart config ────────────────────────────────────────────────────────────
  const chartData = {
    labels: chapterStats.map((c) => c.chapter),
    datasets: [
      ...(hasPrevData
        ? [
            {
              label: "Previous Test",
              data: chapterStats.map((c) => c.prevScore),
              backgroundColor: "#64748B",
              borderRadius: 12,
              borderSkipped: false,
              barPercentage: 0.58,
              categoryPercentage: 0.7,
            },
          ]
        : []),
      {
        label: "Latest Test",
        data: chapterStats.map((c) => c.latestScore),
        backgroundColor: "#6366F1",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: {
          topLeft: 12,
          topRight: 12,
          bottomLeft: 3,
          bottomRight: 3,
        },
        borderSkipped: false,
        barPercentage: 0.62,
        categoryPercentage: 0.7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 16, right: 8, bottom: 0, left: 0 } },
    animation: {
      duration: 700,
      easing: "easeOutQuart",
      delay: (ctx) => (hasPrevData && ctx.datasetIndex === 1 ? 220 : 0),
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0F172A",
        padding: { top: 12, bottom: 12, left: 16, right: 16 },
        cornerRadius: 12,
        titleFont: { family: "'Outfit', system-ui", size: 13, weight: "700" },
        bodyFont: { family: "'Outfit', system-ui", size: 12, weight: "400" },
        bodySpacing: 6,
        borderColor: "rgba(255,255,255,0.08)",
        borderWidth: 1,
        callbacks: {
          title: (items) => chapterStats[items[0].dataIndex]?.chapter || "",
          label: () => null,
          afterBody: (items) => {
            const s = chapterStats[items[0].dataIndex];
            if (!s) return [];
            const lines = [];
            if (s.prevScore !== null)
              lines.push(`  Previous    ${s.prevScore}%`);
            lines.push(`  Latest      ${s.latestScore}%`);
            if (s.delta !== null) {
              const arrow = s.delta > 0 ? "▲" : s.delta < 0 ? "▼" : "=";
              lines.push(
                `  Change      ${arrow} ${s.delta > 0 ? "+" : ""}${s.delta}%`,
              );
            }
            lines.push(`  Attempts   ${s.totalAttempts}`);
            return lines;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (v) => `${v}%`,
          color: "#2563EB",
          font: { family: "'Outfit', system-ui", size: 11, weight: "600" },
          stepSize: 25,
        },
        grid: { color: "rgba(15,23,42,0.06)", lineWidth: 1 },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#1E293B",
          font: { family: "'Outfit', system-ui", size: 11, weight: "600" },
          maxRotation: 30,
          minRotation: 0,
          autoSkip: false,
        },
        border: { display: false },
      },
    },
  };

  const activeConfig = activeSubject
    ? SUBJECT_CONFIG[activeSubject] || {
        label: activeSubject,
        emoji: "📖",
        accent: "#4F46E5",
      }
    : null;

  return (
    <div className="qt-root">
      {/* ══ Subject tabs ══════════════════════════════════════════════════════ */}
      {availableSubjects.length > 0 && (
        <div className="qt-tabs">
          {availableSubjects.map((subj) => {
            const cfg = SUBJECT_CONFIG[subj] || {
              label: subj,
              emoji: "📖",
              accent: "#4F46E5",
            };
            const count = rawQuizArray.filter(
              (q) => q?.graph_data?.subject === subj,
            ).length;
            const isActive = activeSubject === subj;
            return (
              <button
                key={subj}
                className={`qt-tab ${isActive ? "qt-tab--active" : ""}`}
                style={isActive ? { "--accent": cfg.accent } : {}}
                onClick={() => setActiveSubject(subj)}
              >
                <span className="qt-tab__emoji">{cfg.emoji}</span>
                <span className="qt-tab__label">{cfg.label}</span>
                <span className="qt-tab__count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ══ Summary strip ════════════════════════════════════════════════════ */}
      <div className="qt-summary">
        <div className="qt-summary-stat">
          <span className="qt-summary-stat__n">{totalQuizzes}</span>
          <span className="qt-summary-stat__l">Total Quizzes</span>
        </div>
        <div className="qt-summary-divider" />
        <div className="qt-summary-stat">
          <span className="qt-summary-stat__n">{chapterStats.length}</span>
          <span className="qt-summary-stat__l">Chapters Covered</span>
        </div>
        {insights.avgDelta !== null && (
          <>
            <div className="qt-summary-divider" />
            <div
              className={`qt-summary-stat ${insights.avgDelta >= 0 ? "qt-summary-stat--pos" : "qt-summary-stat--neg"}`}
            >
              <span className="qt-summary-stat__n">
                {insights.avgDelta >= 0 ? "+" : ""}
                {insights.avgDelta}%
              </span>
              <span className="qt-summary-stat__l">Avg Improvement</span>
            </div>
          </>
        )}
      </div>

      {chapterStats.length > 0 ? (
        <>
          {/* ══ Main card ═════════════════════════════════════════════════════ */}
          <div className="qt-card">
            {/* Card header */}
            <div className="qt-card-header">
              <div className="qt-card-header__left">
                <p className="qt-eyebrow">
                  {activeConfig?.emoji} {activeConfig?.label} · Chapter
                  Performance
                </p>
                <h2 className="qt-card-title">Score Comparison by Chapter</h2>
                <p className="qt-card-sub">
                  {hasPrevData
                    ? "Comparing your last 2 attempts per chapter"
                    : "Your latest attempt score per chapter"}
                </p>
              </div>
              <div className="qt-legend">
                {hasPrevData && (
                  <div className="qt-legend-item">
                    <span className="qt-legend-swatch qt-legend-swatch--prev" />
                    <span>Previous Test</span>
                  </div>
                )}
                <div className="qt-legend-item">
                  <span className="qt-legend-swatch qt-legend-swatch--latest" />
                  <span>Latest Test</span>
                </div>
              </div>
            </div>

            {/* ── Chapter summary cards ─────────────────────────────────────── */}
            <div className="qt-chapter-grid">
              {chapterStats.map((stat) => {
                const delta = getDeltaInfo(stat.delta, stat.totalAttempts);
                const mod =
                  stat.delta === null
                    ? "first"
                    : stat.delta > 0
                      ? "up"
                      : stat.delta < 0
                        ? "down"
                        : "same";
                return (
                  <div
                    key={stat.chapter}
                    className={`qt-chapter-card qt-chapter-card--${mod}`}
                  >
                    <div className="qt-chapter-card__accent-bar" />
                    <div className="qt-chapter-card__body">
                      <p className="qt-chapter-card__name">{stat.chapter}</p>
                      <div className="qt-chapter-card__meta">
                        <span className="qt-chapter-card__score">
                          {stat.latestScore}%
                        </span>
                        <span className="qt-chapter-card__sep">·</span>
                        <span className="qt-chapter-card__attempts">
                          📊 {stat.totalAttempts}{" "}
                          {stat.totalAttempts === 1 ? "attempt" : "attempts"}
                        </span>
                      </div>
                      <p className="qt-chapter-card__delta">
                        {stat.delta !== null ? (
                          <>
                            {delta.icon} {delta.text}
                          </>
                        ) : (
                          <>✨ First attempt</>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bar chart */}
            <div className="qt-chart-wrap">
              <Bar ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* ══ Performance Analysis ══════════════════════════════════════════ */}
          <div className="qt-analysis-card">
            <div className="qt-analysis-header">
              <div className="qt-analysis-badge">✦ AI Insights</div>
              <h2 className="qt-analysis-title">Performance Analysis</h2>
              <p className="qt-analysis-sub">
                Based on your quiz history — keep going! 💪
              </p>
            </div>

            <div className="qt-analysis-grid">
              {/* Strongest Growth */}
              {insights.bestChapter && (
                <div className="qt-analysis-item qt-analysis-item--green">
                  <div className="qt-analysis-item__icon-wrap qt-analysis-item__icon-wrap--green">
                    🔥
                  </div>
                  <div className="qt-analysis-item__content">
                    <p className="qt-analysis-item__label">
                      🏆 Strongest Growth
                    </p>
                    <p className="qt-analysis-item__chapter">
                      {insights.bestChapter.chapter}
                    </p>
                    <p className="qt-analysis-item__desc">
                      You improved by{" "}
                      <mark className="qt-mark qt-mark--green">
                        {insights.bestChapter.delta}%
                      </mark>{" "}
                      in your most recent attempts. Great progress!
                    </p>
                  </div>
                </div>
              )}

              {/* Overall Trend */}
              {insights.avgDelta !== null && (
                <div
                  className={`qt-analysis-item ${insights.avgDelta >= 0 ? "qt-analysis-item--indigo" : "qt-analysis-item--red"}`}
                >
                  <div
                    className={`qt-analysis-item__icon-wrap ${insights.avgDelta >= 0 ? "qt-analysis-item__icon-wrap--indigo" : "qt-analysis-item__icon-wrap--red"}`}
                  >
                    📊
                  </div>
                  <div className="qt-analysis-item__content">
                    <p className="qt-analysis-item__label">
                      📈 Overall Performance Trend
                    </p>
                    <p className="qt-analysis-item__chapter">
                      {insights.avgDelta >= 0
                        ? "Improving Overall"
                        : "Needs More Practice"}
                    </p>
                    <p className="qt-analysis-item__desc">
                      Your overall performance{" "}
                      {insights.avgDelta >= 0 ? "improved" : "dropped"} by{" "}
                      <mark
                        className={`qt-mark ${insights.avgDelta >= 0 ? "qt-mark--indigo" : "qt-mark--red"}`}
                      >
                        {Math.abs(insights.avgDelta)}%
                      </mark>{" "}
                      compared to your previous attempts.
                    </p>
                  </div>
                </div>
              )}

              {/* Recommended Focus */}
              {insights.focusChapter && (
                <div className="qt-analysis-item qt-analysis-item--amber">
                  <div className="qt-analysis-item__icon-wrap qt-analysis-item__icon-wrap--amber">
                    ⚡
                  </div>
                  <div className="qt-analysis-item__content">
                    <p className="qt-analysis-item__label">
                      🎯 Recommended Focus Area
                    </p>
                    <p className="qt-analysis-item__chapter">
                      {insights.focusChapter.chapter}
                    </p>
                    <p className="qt-analysis-item__desc">
                      Current mastery level is{" "}
                      <mark className="qt-mark qt-mark--amber">
                        {insights.focusChapter.latestScore}%
                      </mark>
                      . A bit more practice here will make a big difference!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="qt-empty">
          <p className="qt-empty__icon">📚</p>
          <p className="qt-empty__title">No quiz data yet</p>
          <p className="qt-empty__sub">
            Complete a {activeConfig ? activeConfig.label : "subject"} quiz to
            see your chapter performance here.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizTab;
