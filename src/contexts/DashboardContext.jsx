import React, { createContext, useContext, useState } from "react";
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

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [selfData, quizResults, examResults] = await Promise.all([
        dashboardAPI.getStudentSubmissions(),
        dashboardAPI.getQuizzes(),
        dashboardAPI.getExamResults(),
      ]);

      setSelfAssessmentData(selfData);
      setQuizData(quizResults);
      setExamData(examResults);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(err.message || "Failed to load data");

      // Fall back to mock data on error
      const { mockData } = await import("../api/mockData");
      setSelfAssessmentData(mockData.selfAssessment);
      setQuizData(mockData.quizzes);
      setExamData(mockData.examResults);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    selfAssessmentData,
    quizData,
    examData,
    loading,
    error,
    loadAllData,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
