export const config = {
  // IMPORTANT: Empty string for proxy to work!
  apiBaseUrl: "",
  useMock: import.meta.env.VITE_USE_MOCK === "true",
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS !== "false",
  enableKatex: import.meta.env.VITE_ENABLE_KATEX !== "false",
};
