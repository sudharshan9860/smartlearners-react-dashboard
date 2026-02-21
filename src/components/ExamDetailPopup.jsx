import React, { useState, useEffect, useRef, useCallback } from "react";
import DOMPurify from "dompurify";
import { dashboardAPI } from "../api/dashboard";
import { renderKaTeX } from "../hooks/useKatex";
import "./ExamDetailPopup.css";

// ─── Sanitize helper (Fix #3) ──────────────────────────────────────────────────
// dangerouslySetInnerHTML renders raw HTML from the server. If any of that data
// is user-influenced (feedback, analysis text) it is an XSS vector.
// DOMPurify strips all executable content while keeping safe formatting tags.
const sanitize = (html) =>
  DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "b",
      "strong",
      "i",
      "em",
      "ul",
      "ol",
      "li",
      "br",
      "span",
      "p",
    ],
    ALLOWED_ATTR: [],
  });

const ExamDetailPopup = ({ examResult, onClose }) => {
  const [questionData, setQuestionData] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  // ─── Fix #6: ref instead of document.querySelector ─────────────────────────
  // document.querySelector(".exam-detail-popup") is fragile — if multiple popups
  // ever exist, or CSS class names change, it silently breaks. A ref is the
  // idiomatic React way to reference a specific DOM node.
  const popupRef = useRef(null);

  const {
    exam_name,
    total_marks_obtained,
    total_max_marks,
    overall_percentage,
    grade,
    strengths,
    areas_for_improvement,
    remedial_action,
    detailed_analysis,
    parent_note,
    id,
  } = examResult;

  // Render KaTeX whenever the popup content or question data changes
  useEffect(() => {
    if (!popupRef.current) return;
    const timer = setTimeout(() => renderKaTeX(popupRef.current), 100);
    return () => clearTimeout(timer);
  }, [examResult, questionData]);

  const loadQuestions = useCallback(async () => {
    if (showQuestions) {
      setShowQuestions(false);
      return;
    }

    setLoadingQuestions(true);
    setShowQuestions(true);

    try {
      const data = await dashboardAPI.getQuestionEvaluation(id);
      setQuestionData(data);
    } catch (error) {
      console.error("Failed to load question data:", error);
    } finally {
      setLoadingQuestions(false);
    }
  }, [showQuestions, id]);

  const formatFeedbackText = (input) => {
    if (!input) return "";
    if (Array.isArray(input)) {
      return (
        "<ul>" +
        input.map((item) => `<li>${String(item)}</li>`).join("") +
        "</ul>"
      );
    }
    return String(input).replace(/\n/g, "<br>");
  };

  const feedbackSections = [
    { key: "strengths", label: "Strengths", color: "green", data: strengths },
    {
      key: "improvements",
      label: "Areas for Improvement",
      color: "orange",
      data: areas_for_improvement,
    },
    {
      key: "remedial",
      label: "Remedial Action",
      color: "blue",
      data: remedial_action,
    },
    {
      key: "analysis",
      label: "Detailed Analysis",
      color: "purple",
      data: detailed_analysis,
    },
    {
      key: "parent-note",
      label: "Parent Note",
      color: "indigo",
      data: parent_note,
    },
  ].filter((s) => s.data && (!Array.isArray(s.data) || s.data.length > 0));

  const questions = questionData?.question_data || [];

  return (
    <>
      <div className="exam-popup-overlay" onClick={onClose} />

      {/* Fix #6: ref attached here — no more document.querySelector */}
      <div className="exam-detail-popup" ref={popupRef}>
        <button className="popup-close-btn" onClick={onClose}>
          ✕
        </button>

        <div className="popup-header">
          <h2>{exam_name}</h2>
          <div className="popup-score-info">
            <div className="popup-score">
              {total_marks_obtained}/{total_max_marks}
            </div>
            <div className="popup-percentage">{overall_percentage}%</div>
            <div className={`popup-grade grade-${grade}`}>{grade}</div>
          </div>
        </div>

        <div className="popup-feedback">
          {feedbackSections.map((section) => (
            <div
              key={section.key}
              className={`feedback-box border-${section.color}`}
            >
              <div className="fb-header">
                <span className={`fb-dot ${section.color}`} />
                <div className={`fb-label ${section.key}`}>{section.label}</div>
              </div>
              {/* Fix #3: sanitize HTML before injecting */}
              <div
                className="fb-text"
                dangerouslySetInnerHTML={{
                  __html: sanitize(formatFeedbackText(section.data)),
                }}
              />
            </div>
          ))}
        </div>

        <div className="popup-actions">
          <button className="load-questions-btn" onClick={loadQuestions}>
            {showQuestions
              ? "▲ Hide Questions"
              : "▼ View Question-wise Evaluation"}
          </button>
        </div>

        {showQuestions && (
          <div className="question-section">
            <h3>Question-wise Evaluation</h3>

            {loadingQuestions ? (
              <div className="questions-loading">
                <div className="loader" />
                <p>Loading questions...</p>
              </div>
            ) : questions.length > 0 ? (
              <div className="questions-container">
                {questions.map((q, i) => {
                  const ev = q.questions_evaluation || {};
                  const pct = ev.max_marks
                    ? Math.round((ev.marks_obtained / ev.max_marks) * 100)
                    : 0;

                  return (
                    <div
                      key={i}
                      className="question-card"
                      style={{ animationDelay: `${0.05 * i}s` }}
                    >
                      <div className="q-header">
                        <span className="q-number">{i + 1}</span>
                        <span className="q-text">
                          {ev.question || `Question ${i + 1}`}
                        </span>
                      </div>

                      <div className="q-stats">
                        <div className="q-stat">
                          <div className="q-stat-label">Marks</div>
                          <div
                            className={`q-stat-value ${
                              pct >= 80
                                ? "text-green"
                                : pct >= 60
                                  ? "text-orange"
                                  : "text-red"
                            }`}
                          >
                            {ev.marks_obtained}/{ev.max_marks}
                          </div>
                        </div>
                        <div className="q-stat">
                          <div className="q-stat-label">Score</div>
                          <div className="q-stat-value">{pct}%</div>
                        </div>
                        <div className="q-stat">
                          <div className="q-stat-label">Evaluation</div>
                          <div className="q-stat-value">
                            <span
                              className={`badge ${
                                ev.evaluation === "Perfect"
                                  ? "badge-green"
                                  : ev.evaluation === "Good"
                                    ? "badge-blue"
                                    : "badge-orange"
                              }`}
                            >
                              {ev.evaluation}
                            </span>
                          </div>
                        </div>
                        <div className="q-stat">
                          <div className="q-stat-label">Feedback</div>
                          <div className="q-stat-value">
                            {ev.feedback || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar ${
                            pct >= 80
                              ? "progress-green"
                              : pct >= 60
                                ? "progress-orange"
                                : "progress-blue"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-questions">
                <p>No question data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default ExamDetailPopup;
