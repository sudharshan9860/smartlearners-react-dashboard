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

const SUBJECT_CONFIG = {
  PHYSICS: { label: "Physics", emoji: "⚛️", accent: "#6366F1" },
  MATHEMATICS: { label: "Mathematics", emoji: "📐", accent: "#8B5CF6" },
};

// ── Gradient bar plugin — creates indigo gradient on latest bars ───────────────
const gradientBarPlugin = {
  id: "gradientBars",
  beforeDatasetsDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    chart.data.datasets.forEach((dataset) => {
      const gradient = ctx.createLinearGradient(
        0,
        chartArea.top,
        0,
        chartArea.bottom,
      );

      if (dataset.label === "Latest Test") {
        gradient.addColorStop(0, "#6366F1");
        gradient.addColorStop(1, "#4338CA");
        dataset.backgroundColor = gradient;
      }

      if (dataset.label === "Previous Test") {
        gradient.addColorStop(0, "#64748B"); // darker slate
        gradient.addColorStop(1, "#334155"); // deep slate
        dataset.backgroundColor = gradient;
      }
    });
  },
};

ChartJS.register(gradientBarPlugin);

// ─────────────────────────────────────────────────────────────────────────────

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
            name: quiz.name ?? chapter,
          });
        },
      );
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) => new Date(a.date) - new Date(b.date)),
    );
    return map;
  }, [filteredArray]);

  const chapterStats = useMemo(() => {
    return Object.entries(chapterHistory).map(([chapter, attempts]) => {
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
        latestName: latest.name,
      };
    });
  }, [chapterHistory]);

  const labels = chapterStats.map((c) => c.chapter);
  const latestValues = chapterStats.map((c) => c.latestScore);
  const prevValues = chapterStats.map((c) => c.prevScore);
  const deltas = chapterStats.map((c) => c.delta);
  const hasPrevData = prevValues.some((v) => v !== null);
  const totalQuizzes = filteredArray.length;

  // ── AI Insights ────────────────────────────────────────────────────────────
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

  // ── Chart data ─────────────────────────────────────────────────────────────
  const chartData = {
    labels,
    datasets: [
      ...(hasPrevData
        ? [
            {
              label: "Previous Test",
              data: prevValues,
              backgroundColor: (context) => {
                const { chart } = context;
                const { ctx, chartArea } = chart;
                if (!chartArea) return "#64748B";

                const gradient = ctx.createLinearGradient(
                  0,
                  chartArea.top,
                  0,
                  chartArea.bottom,
                );

                gradient.addColorStop(0, "#64748B"); // slate 500
                gradient.addColorStop(1, "#334155"); // slate 700

                return gradient;
              },
              borderRadius: 16,
              borderSkipped: false,
              barPercentage: 0.6,
              categoryPercentage: 0.72,
            },
          ]
        : []),
      {
        label: "Latest Test",
        data: latestValues,
        // gradient applied by plugin
        backgroundColor: "#6366F1",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: {
          topLeft: 16,
          topRight: 16,
          bottomLeft: 4,
          bottomRight: 4,
        },
        borderSkipped: false,
        barPercentage: 0.65,
        categoryPercentage: 0.72,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 16, top: 20, left: 4, bottom: 4 } },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
      delay: (ctx) => {
        // Latest bars animate 250ms after previous bars
        if (hasPrevData && ctx.datasetIndex === 1) return 250;
        return 0;
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(15,23,42,0.97)",
        padding: { top: 14, bottom: 14, left: 16, right: 16 },
        cornerRadius: 14,
        titleFont: {
          family: "'Plus Jakarta Sans', system-ui",
          size: 13,
          weight: "800",
        },
        bodyFont: {
          family: "'Plus Jakarta Sans', system-ui",
          size: 12,
          weight: "500",
        },
        bodySpacing: 5,
        borderColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        callbacks: {
          title: (items) => chapterStats[items[0].dataIndex]?.chapter || "",
          label: () => null,
          afterBody: (items) => {
            const stat = chapterStats[items[0].dataIndex];
            if (!stat) return [];
            const lines = [];
            if (stat.prevScore !== null)
              lines.push(`  Previous    ${stat.prevScore}%`);
            lines.push(`  Latest      ${stat.latestScore}%`);
            if (stat.delta !== null) {
              const sign = stat.delta > 0 ? "+" : "";
              const arrow = stat.delta > 0 ? "▲" : stat.delta < 0 ? "▼" : "=";
              lines.push(`  Change      ${arrow} ${sign}${stat.delta}%`);
            }
            lines.push(`  Attempts   ${stat.totalAttempts}`);
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
          callback: (v) => v + "%",
          color: "#0563e8",
          font: {
            family: "'Plus Jakarta Sans', system-ui",
            size: 12,
            weight: "700",
          },
          stepSize: 25,
        },
        grid: {
          color: "rgba(15,23,42,0.08)",
          lineWidth: 1,
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#171c24",
          font: {
            family: "'Plus Jakarta Sans', system-ui",
            size: 11,
            weight: "600",
          },
          maxRotation: 20,
          callback(val) {
            const lbl = this.getLabelForValue(val);
            return lbl.length > 12 ? lbl.slice(0, 11) + "…" : lbl;
          },
        },
        border: { display: false },
      },
    },
  };

  const activeConfig = activeSubject
    ? SUBJECT_CONFIG[activeSubject] || {
        label: activeSubject,
        emoji: "📖",
        accent: "#6366F1",
      }
    : null;

  return (
    <div className="qt-root">
      {/* ── Subject Filter Tabs ── */}
      {availableSubjects.length > 0 && (
        <div className="qt-subject-row">
          {availableSubjects.map((subj) => {
            const cfg = SUBJECT_CONFIG[subj] || {
              label: subj,
              emoji: "📖",
              accent: "#6366F1",
            };
            const count = rawQuizArray.filter(
              (q) => q?.graph_data?.subject === subj,
            ).length;
            const isActive = activeSubject === subj;
            return (
              <button
                key={subj}
                className={`qt-subject-btn ${isActive ? "qt-subject-btn--on" : ""}`}
                style={isActive ? { "--sa": cfg.accent } : {}}
                onClick={() => setActiveSubject(subj)}
              >
                <span className="qt-subj-emoji">{cfg.emoji}</span>
                <span className="qt-subj-label">{cfg.label}</span>
                <span className="qt-subj-badge">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Stats strip ── */}
      <div className="qt-stats-strip">
        <div className="qt-stat-chip">
          <span className="qt-stat-chip__num">{totalQuizzes}</span>
          <span className="qt-stat-chip__lbl">Quizzes</span>
        </div>
        <div className="qt-stat-chip">
          <span className="qt-stat-chip__num">{chapterStats.length}</span>
          <span className="qt-stat-chip__lbl">Chapters</span>
        </div>
        {/* {insights.avgDelta !== null && (
          <div
            className={`qt-stat-chip ${insights.avgDelta >= 0 ? "qt-stat-chip--pos" : "qt-stat-chip--neg"}`}
          >
            <span className="qt-stat-chip__num">
              {insights.avgDelta >= 0 ? "+" : ""}
              {insights.avgDelta}%
            </span>
            <span className="qt-stat-chip__lbl">Avg Change</span>
          </div>
        )} */}
      </div>

      {/* ── Main chart card ── */}
      {chapterStats.length > 0 ? (
        <>
          <div className="qt-card">
            {/* Card header */}
            <div className="qt-card-head">
              <div>
                <p className="qt-card-eyebrow">
                  {activeConfig?.emoji} {activeConfig?.label}
                </p>
                <h3 className="qt-card-title">Chapter Performance</h3>
                <p className="qt-card-sub">
                  {hasPrevData
                    ? "Last 2 attempts per chapter — hover for details"
                    : "Latest attempt per chapter — hover for details"}
                </p>
              </div>

              {/* Legend */}
              <div className="qt-legend">
                {hasPrevData && (
                  <div className="qt-legend-item">
                    <span className="qt-legend-dot qt-legend-dot--prev" />
                    <span>Previous</span>
                  </div>
                )}
                <div className="qt-legend-item">
                  <span className="qt-legend-dot qt-legend-dot--latest" />
                  <span>Latest</span>
                </div>
              </div>
            </div>

            {/* Chapter summary pills — delta inline */}
            <div className="qt-pills-row">
              {chapterStats.map((stat) => {
                const trendCls =
                  stat.delta === null
                    ? "qt-pill--first"
                    : stat.delta > 0
                      ? "qt-pill--up"
                      : stat.delta < 0
                        ? "qt-pill--down"
                        : "qt-pill--same";
                return (
                  <div key={stat.chapter} className={`qt-pill ${trendCls}`}>
                    <span className="qt-pill__name" title={stat.chapter}>
                      {stat.chapter.length > 16
                        ? stat.chapter.slice(0, 15) + "…"
                        : stat.chapter}
                    </span>
                    {stat.delta !== null && (
                      <span className="qt-pill__delta">
                        {stat.delta > 0
                          ? `▲ +${stat.delta}%`
                          : stat.delta < 0
                            ? `▼ ${stat.delta}%`
                            : "="}
                      </span>
                    )}
                    <span className="qt-pill__cnt">{stat.totalAttempts}×</span>
                  </div>
                );
              })}
            </div>

            {/* Bar chart — NO plugins that draw floating badges */}
            <div className="qt-chart-wrap">
              <Bar ref={chartRef} data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* ── AI Insight card ── */}
          <div className="qt-insight-card">
            <div className="qt-insight-header">
              <span className="qt-insight-pill">✦ AI Insights</span>
              <p className="qt-insight-heading">Performance Analysis</p>
            </div>

            <div className="qt-insight-grid">
              {insights.bestChapter && (
                <div className="qt-insight-item qt-insight-item--green">
                  <span className="qt-insight-icon">🚀</span>
                  <div>
                    <p className="qt-insight-label">Strongest Growth</p>
                    <p className="qt-insight-val">
                      {insights.bestChapter.chapter.length > 20
                        ? insights.bestChapter.chapter.slice(0, 19) + "…"
                        : insights.bestChapter.chapter}
                      <span className="qt-insight-badge qt-insight-badge--green">
                        +{insights.bestChapter.delta}%
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {insights.avgDelta !== null && (
                <div
                  className={`qt-insight-item ${insights.avgDelta >= 0 ? "qt-insight-item--indigo" : "qt-insight-item--red"}`}
                >
                  <span className="qt-insight-icon">📈</span>
                  <div>
                    <p className="qt-insight-label">Overall Trend</p>
                    <p className="qt-insight-val">
                      {insights.avgDelta >= 0
                        ? "Improving overall"
                        : "Needs attention"}
                      <span
                        className={`qt-insight-badge ${insights.avgDelta >= 0 ? "qt-insight-badge--indigo" : "qt-insight-badge--red"}`}
                      >
                        {insights.avgDelta >= 0 ? "+" : ""}
                        {insights.avgDelta}% avg
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {insights.focusChapter && (
                <div className="qt-insight-item qt-insight-item--amber">
                  <span className="qt-insight-icon">⚡</span>
                  <div>
                    <p className="qt-insight-label">Focus Next</p>
                    <p className="qt-insight-val">
                      {insights.focusChapter.chapter.length > 20
                        ? insights.focusChapter.chapter.slice(0, 19) + "…"
                        : insights.focusChapter.chapter}
                      <span className="qt-insight-badge qt-insight-badge--amber">
                        {insights.focusChapter.latestScore}%
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="qt-empty">
          <div className="qt-empty-orb" />
          <p className="qt-empty-title">No data yet</p>
          <p className="qt-empty-sub">
            {activeSubject
              ? `Complete a ${activeConfig?.label || activeSubject} quiz to see your results`
              : "Select a subject to get started"}
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizTab;
