import axiosInstance from "./axiosInstance";
import { mockData } from "./mockData";
import { config } from "../config";

export const dashboardAPI = {
  /**
   * Get student submissions (Self Assessment)
   * @returns {Promise<Object>}
   */
  async getStudentSubmissions() {
    if (config.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockData.selfAssessment), 1000);
      });
    }

    const response = await axiosInstance.get("/api/student-submissions/");
    return response.data;
  },

  /**
   * Get quiz data
   * @returns {Promise<Object>}
   */
  async getQuizzes() {
    if (config.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockData.quizzes), 1000);
      });
    }

    const response = await axiosInstance.get("/api/quizzes/");
    return response.data;
  },

  /**
   * Get exam results
   * @returns {Promise<Object>}
   */
  async getExamResults() {
    if (config.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockData.examResults), 1000);
      });
    }

    const response = await axiosInstance.get("/student-results/");
    return response.data;
  },

  /**
   * Get question evaluation details
   * @param {string|number} resultId
   * @returns {Promise<Object>}
   */
  async getQuestionEvaluation(resultId) {
    if (config.useMock) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(mockData.questionEvaluation), 800);
      });
    }

    const response = await axiosInstance.get(
      `/questions-evaluated/?student_result_id=${resultId}`,
    );
    return response.data;
  },
};
