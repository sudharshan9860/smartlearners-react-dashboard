import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useDashboard } from "../contexts/DashboardContext";
import TopNav from "../components/TopNav";
import TabNavigation from "../components/TabNavigation";
import SelfAssessmentTab from "../components/SelfAssessmentTab";
import QuizTab from "../components/QuizTab";
import ExamTab from "../components/ExamTab";
import LoadingOverlay from "../components/LoadingOverlay";
import "./DashboardPage.css";

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState("quiz");
  const { user } = useAuth();
  const { loadAllData, loading } = useDashboard();

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="dashboard">
      <TopNav username={user?.username} />

      <div className="dashboard-container">
        {/* Glass pill wrapper around tab navigation */}
        <div className="tab-nav-wrapper">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="tab-content">
          {activeTab === "self" && <SelfAssessmentTab />}
          {activeTab === "quiz" && <QuizTab />}
          {activeTab === "exam" && <ExamTab />}
        </div>
      </div>

      <LoadingOverlay show={loading} />
    </div>
  );
};

export default DashboardPage;
