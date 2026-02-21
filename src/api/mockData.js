export const mockData = {
  selfAssessment: [
    {
      subject: "MATHEMATICS",
      chapter: "Ch. 3 — Quadratic Equations",
      question: "Solve $x^2 - 5x + 6 = 0$",
      student_score: 5,
      max_marks: 5,
      percentage: 100,
      time_spent: "90s / 120s",
      difficulty: "Easy",
      gap_identified: false,
      time_rating: "Excellent",
      type: "Subjective",
    },
    {
      subject: "MATHEMATICS",
      chapter: "Ch. 3 — Quadratic Equations",
      question: "Find discriminant of $2x^2 + 3x - 5 = 0$",
      student_score: 4,
      max_marks: 5,
      percentage: 80,
      time_spent: "150s / 120s",
      difficulty: "Medium",
      gap_identified: true,
      time_rating: "Excellent",
      type: "Subjective",
    },
    {
      subject: "SCIENCE",
      chapter: "Ch. 1 — Life Processes",
      question: "Explain photosynthesis",
      student_score: 4,
      max_marks: 5,
      percentage: 80,
      time_spent: "100s / 150s",
      difficulty: "Medium",
      gap_identified: true,
      time_rating: "Excellent",
      type: "Subjective",
    },
  ],

  quizzes: {
    total_quizzes: 2,
    quiz_scores: [
      { quiz_name: "Test 1", percentage: 0 },
      { quiz_name: "Test 2", percentage: 0 },
    ],
  },

  examResults: {
    results: [
      {
        id: 1,
        exam_name: "Mid Term - Mathematics",
        total_marks_obtained: 85,
        total_max_marks: 100,
        overall_percentage: 85,
        grade: "A",
        strengths: [
          "**Quadratic Equations**: Excellent grasp of factorization",
          "**Trigonometry**: Strong understanding of identities",
        ],
        areas_for_improvement: [
          "**Calculus**: Need to practice more derivative problems",
          "**Geometry**: Circle theorems require attention",
        ],
        remedial_action: [
          "**Practice**: Solve 10 calculus problems daily",
          "**Revision**: Review circle theorem notes",
        ],
        detailed_analysis:
          "Overall strong performance. Focus on calculus and geometry for improvement.",
        parent_note:
          "Your child is performing well. Encourage daily practice in weak areas.",
      },
      {
        id: 2,
        exam_name: "Quarterly - Science",
        total_marks_obtained: 78,
        total_max_marks: 100,
        overall_percentage: 78,
        grade: "B+",
        strengths: [
          "**Physics**: Strong in mechanics and motion",
          "**Chemistry**: Good understanding of reactions",
        ],
        areas_for_improvement: ["**Biology**: Cell structure needs more study"],
        remedial_action: [
          "**Study**: Focus on biology diagrams",
          "**Practice**: Solve previous year questions",
        ],
        detailed_analysis:
          "Good performance overall. Biology needs more attention.",
        parent_note: "Consistent effort required in biology.",
      },
    ],
  },

  questionEvaluation: {
    question_data: [
      {
        questions_evaluation: {
          question: "Solve the quadratic equation: $x^2 - 5x + 6 = 0$",
          marks_obtained: 4,
          max_marks: 5,
          evaluation: "Good",
          feedback: "Correct approach, minor calculation error",
        },
      },
      {
        questions_evaluation: {
          question: "Find the roots of: $2x^2 + 7x + 3 = 0$",
          marks_obtained: 5,
          max_marks: 5,
          evaluation: "Perfect",
          feedback: "Excellent work!",
        },
      },
      {
        questions_evaluation: {
          question: "Explain photosynthesis process",
          marks_obtained: 3,
          max_marks: 5,
          evaluation: "Satisfactory",
          feedback: "Missing key details about chlorophyll",
        },
      },
    ],
  },
};
