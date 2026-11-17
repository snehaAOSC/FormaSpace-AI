import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Lock, LogIn, ShieldAlert } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F7F4ED]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#172B3A] border-t-[#C87960]" />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#252B2E]/60">
            Verifying FormaSpace Credentials...
          </span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, display the clean Login Guard view
  if (!user) {
    return (
      <div className="min-h-[80vh] bg-[#F7F4ED] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-[#DCCBB5] bg-white p-8 sm:p-10 shadow-editorial text-center">
          {/* Lock Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#172B3A] text-white shadow-lg">
            <Lock className="h-8 w-8 text-[#C87960]" />
          </div>

          <span className="mt-6 inline-block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#C87960]">
            Access Protected · FormaSpace Studio
          </span>

          <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A]">
            Please Log In First
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#252B2E]/80">
            The studio tools and generation workspaces require an authenticated account.
            Unregistered visitors can freely browse public galleries, showcases, and video demos.
          </p>

          <div className="mt-8">
            <Link
              to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`}
              className="btn-primary w-full justify-center py-3.5 text-sm shadow-md"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In / Login</span>
            </Link>
          </div>

          <div className="mt-8 border-t border-[#DCCBB5]/70 pt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-[#252B2E]/70 transition hover:text-[#C87960]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Return to public website showcase</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Admin access check
  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="min-h-[70vh] bg-[#F7F4ED] py-16 px-4 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-red-200 bg-white p-8 text-center shadow-editorial">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-700">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="mt-4 font-editorial text-2xl font-semibold text-[#172B3A]">
            Administrative Privileges Required
          </h2>
          <p className="mt-2 text-xs text-[#252B2E]/75">
            Your current account does not have administrator clearance to access this control surface.
          </p>
          <Link to="/studio" className="btn-primary mt-6 w-full justify-center text-xs">
            Return to Studio
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

