export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
  useMock: import.meta.env.VITE_USE_MOCK === "true",
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== "false",
  enableKatex: import.meta.env.VITE_ENABLE_KATEX !== "false",
};
