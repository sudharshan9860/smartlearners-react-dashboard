import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ─── Fix #7: Proxy coverage for non-/api routes ────────────────────────────────
// dashboard.js calls two endpoints that are NOT under /api:
//   • /student-results/          (getExamResults)
//   • /questions-evaluated/      (getQuestionEvaluation)
//
// The original config only proxied /api/*, so these requests were sent directly
// to the Vite dev server (port 3000) and received a 404.
//
// Options:
//  A) List each path explicitly (done below — safest, least surprising).
//  B) Move the backend endpoints under /api/* and update dashboard.js to match.
//
// Option A is implemented here so no backend changes are required.

const BACKEND = "https://autogen.aieducator.com";

const proxyTarget = {
  target: BACKEND,
  changeOrigin: true,
  secure: false,
  configure: (proxy) => {
    proxy.on("error", (err, _req, _res) => {
      console.error("[proxy] error", err.message);
    });
    proxy.on("proxyReq", (_proxyReq, req) => {
      console.log(`[proxy] → ${req.method} ${req.url}`);
    });
    proxy.on("proxyRes", (proxyRes, req) => {
      console.log(`[proxy] ← ${proxyRes.statusCode} ${req.url}`);
    });
  },
};

export default defineConfig({
  plugins: [react()],

  server: {
    port: 3000,
    proxy: {
      // JWT / auth endpoints
      "/api": proxyTarget,

      // Exam results  — was missing, caused 404 in dev
      "/student-results": proxyTarget,

      // Question evaluation — was missing, caused 404 in dev
      "/questions-evaluated": proxyTarget,
    },
  },

  build: {
    outDir: "dist",
    sourcemap: true,
  },

  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
