import React, { Component, ErrorInfo, ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { LoginPromptModal } from "./components/LoginPromptModal";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { AboutPage } from "./pages/AboutPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AuthPage } from "./pages/AuthPage";
import { BudgetEstimatorPage } from "./pages/BudgetEstimatorPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ExploreDesignsPage } from "./pages/ExploreDesignsPage";
import { FloorPlanPage } from "./pages/FloorPlanPage";
import { FurnitureFinderPage } from "./pages/FurnitureFinderPage";
import { HomePage } from "./pages/HomePage";
import { StudioPage } from "./pages/StudioPage";
import { VideoWalkthroughPage } from "./pages/VideoWalkthroughPage";

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F7F4ED] p-8 text-[#172B3A] flex items-center justify-center">
          <div className="max-w-xl rounded-2xl border border-red-300 bg-white p-8 shadow-editorial">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              FormaSpace System Guard
            </span>
            <h1 className="mt-2 font-editorial text-2xl font-bold text-[#172B3A]">
              Application View Encountered an Error
            </h1>
            <p className="mt-2 text-sm text-[#252B2E]/80">
              The application recovered safely. Click below to reload the workspace.
            </p>
            <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-[#F7F4ED] p-4 text-xs font-mono text-red-900 border border-[#DCCBB5]">
              {this.state.error?.stack || this.state.error?.message}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="mt-6 btn-primary w-full justify-center"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="flex min-h-screen flex-col bg-[#F7F4ED] text-[#252B2E]">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public showcase & browse routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/explore" element={<ExploreDesignsPage />} />
                <Route path="/pricing" element={<Navigate to="/" replace />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/auth" element={<AuthPage />} />

                {/* Protected workspaces & main content */}
                <Route
                  path="/studio"
                  element={
                    <ProtectedRoute>
                      <StudioPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/floor-plans"
                  element={
                    <ProtectedRoute>
                      <FloorPlanPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/video-walkthrough"
                  element={
                    <ProtectedRoute>
                      <VideoWalkthroughPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/furniture-finder"
                  element={
                    <ProtectedRoute>
                      <FurnitureFinderPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/budget-estimator"
                  element={
                    <ProtectedRoute>
                      <BudgetEstimatorPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
            <Footer />
            {/* Global Login Prompt Modal */}
            <LoginPromptModal />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
