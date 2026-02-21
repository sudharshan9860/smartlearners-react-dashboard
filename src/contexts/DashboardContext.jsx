import React, { createContext, useContext, useState, useRef } from "react";
import { dashboardAPI } from "../api/dashboard";

const DashboardContext = createContext(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
};

export const DashboardProvider = ({ children }) => {
  const [selfAssessmentData, setSelfAssessmentData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [examData, setExamData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Fix #5: Prevent duplicate fetches ────────────────────────────────────
  // DashboardPage calls loadAllData() in a useEffect. Without a guard, every
  // time the user navigates away and back (e.g. via the tab system or the
  // browser back button) the effect fires again and issues three parallel API
  // requests even though we already have fresh data.
  //
  // We use a ref (not state) for the "fetched" flag so that flipping it never
  // triggers a re-render of its own.
  const hasFetchedRef = useRef(false);

  const loadAllData = async ({ force = false } = {}) => {
    // Skip if we already have data, unless the caller explicitly forces a refresh
    if (hasFetchedRef.current && !force) return;

    setLoading(true);
    setError(null);

    try {
      const [submissions, quizResults, examResults] = await Promise.all([
        dashboardAPI.getStudentSubmissions(),
        dashboardAPI.getQuizzes(),
        dashboardAPI.getExamResults(),
      ]);

      // ✅ Debug logs INSIDE the function, where variables are in scope
      console.log("SELF:", submissions);
      console.log("QUIZ:", quizResults);
      console.log("EXAM:", examResults);

      setSelfAssessmentData(submissions);
      setQuizData(quizResults);
      setExamData(examResults);
      hasFetchedRef.current = true;
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to load data");

      // Fall back to mock data on error
      const { mockData } = await import("../api/mockData");
      setSelfAssessmentData(mockData.selfAssessment);
      setQuizData(mockData.quizzes);
      setExamData(mockData.examResults);

      // Mark as fetched even on error so we don't loop on every render
      hasFetchedRef.current = true;
    } finally {
      setLoading(false);
    }
  };

  // Expose a refresh helper so consumers can force a reload when needed
  const refreshData = () => loadAllData({ force: true });

  const value = {
    selfAssessmentData,
    quizData,
    examData,
    loading,
    error,
    loadAllData,
    refreshData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
