import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { DashboardProvider } from "./contexts/DashboardContext";
import DashboardPage from "./pages/DashboardPage";
import PrivateRoute from "./components/PrivateRoute";

// LoginPage import removed — no login page needed

function App() {
  return (
    <Router>
      <AuthProvider>
        <DashboardProvider>
          <Routes>
            {/* Dashboard is now the only real route */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <DashboardPage />
                </PrivateRoute>
              }
            />

            {/* Everything redirects to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

            {/* /login route removed — if anyone hits it, goes to dashboard */}
          </Routes>
        </DashboardProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
