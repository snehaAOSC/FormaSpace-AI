import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const Navbar: React.FC = () => {
  const { user, logout, requireAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const featureLinks = [
    { to: "/studio", label: "AI Design Studio", desc: "10 interior, exterior, staging & material tools" },
    { to: "/floor-plans", label: "Floor Plan Generator", desc: "2D architectural plans to 3D furnished layouts" },
    { to: "/video-walkthrough", label: "AI Video Walkthrough", desc: "Cinematic camera motion & orbit exports" },
    { to: "/furniture-finder", label: "Furniture Finder", desc: "Discover curated furnishings from renders" },
    { to: "/budget-estimator", label: "Renovation Budget Estimator", desc: "Compare material, labour & finish costs" },
  ];

  const handleProtectedNavigation = (to: string, actionDesc: string) => {
    if (!requireAuth(to, actionDesc)) return;
    navigate(to);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#DCCBB5]/70 bg-[#F7F4ED]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172B3A] text-[#F7F4ED] transition-colors group-hover:bg-[#C87960]">
            <svg viewBox="0 0 28 28" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 23V10L14 4L24 10V23" />
              <path d="M9.5 23V14.5H18.5V23" />
              <path d="M14 4V14.5" strokeOpacity="0.6" />
            </svg>
          </div>
          <div className="leading-tight">
            <span className="font-editorial text-xl font-semibold tracking-tight text-[#172B3A]">
              FormaSpace <span className="text-[#C87960]">AI</span>
            </span>
            <span className="block text-[10px] uppercase tracking-[0.2em] text-[#252B2E]/60">
              Architectural Studio
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors hover:text-[#C87960] ${isActive("/") ? "text-[#172B3A] underline decoration-[#C87960] underline-offset-8" : "text-[#252B2E]/80"
              }`}
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => handleProtectedNavigation("/studio", "access the AI Design Studio")}
            className={`text-sm font-medium transition-colors hover:text-[#C87960] ${isActive("/studio") ? "text-[#172B3A] underline decoration-[#C87960] underline-offset-8" : "text-[#252B2E]/80"
              }`}
          >
            AI Studio
          </button>
          <Link
            to="/explore"
            className={`text-sm font-medium transition-colors hover:text-[#C87960] ${isActive("/explore") ? "text-[#172B3A] underline decoration-[#C87960] underline-offset-8" : "text-[#252B2E]/80"
              }`}
          >
            Explore Designs
          </Link>

          {/* Features Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setFeaturesOpen(true)}
            onMouseLeave={() => setFeaturesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setFeaturesOpen(!featuresOpen)}
              className="flex items-center gap-1 text-sm font-medium text-[#252B2E]/80 transition-colors hover:text-[#C87960]"
            >
              Features <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {featuresOpen && (
              <div className="absolute left-0 top-full w-80 pt-3">
                <div className="rounded-2xl border border-[#DCCBB5] bg-white p-2 shadow-editorial">
                  {featureLinks.map((item) => (
                    <button
                      key={item.to}
                      type="button"
                      onClick={() => {
                        setFeaturesOpen(false);
                        handleProtectedNavigation(item.to, `access the ${item.label}`);
                      }}
                      className="block w-full text-left rounded-xl px-3.5 py-2.5 transition-colors hover:bg-[#F7F4ED]"
                    >
                      <div className="text-sm font-semibold text-[#172B3A]">{item.label}</div>
                      <div className="text-xs text-[#252B2E]/65">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/about"
            className={`text-sm font-medium transition-colors hover:text-[#C87960] ${isActive("/about") ? "text-[#172B3A] underline decoration-[#C87960] underline-offset-8" : "text-[#252B2E]/80"
              }`}
          >
            About Us
          </Link>
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-[#172B3A] hover:bg-[#DCCBB5]/30"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              {user.role === "admin" && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1 rounded-full bg-[#9BAE9A]/25 px-3 py-1.5 text-xs font-semibold text-[#172B3A] hover:bg-[#9BAE9A]/40"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="rounded-full p-2 text-[#252B2E]/70 transition hover:bg-[#DCCBB5]/40 hover:text-[#172B3A]"
                title="Log Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="px-4 py-2 text-sm font-medium text-[#172B3A] transition hover:text-[#C87960]"
            >
              Login / Sign Up
            </Link>
          )}
          <button
            type="button"
            onClick={() => handleProtectedNavigation("/studio", "start creating architectural designs")}
            className="btn-primary py-2.5 text-xs sm:text-sm"
          >
            <Sparkles className="h-4 w-4" />
            Start Designing
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-xl border border-[#DCCBB5] bg-white p-2 text-[#172B3A] lg:hidden"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-[#DCCBB5] bg-white px-4 py-5 lg:hidden">
          <div className="flex flex-col space-y-3">
            <Link to="/" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#172B3A]">
              Home
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleProtectedNavigation("/studio", "access the AI Design Studio");
              }}
              className="text-left text-sm font-medium text-[#172B3A]"
            >
              AI Design Studio
            </button>
            <Link to="/explore" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#172B3A]">
              Explore Designs
            </Link>
            <div className="border-y border-[#DCCBB5]/50 py-2">
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#252B2E]/50">
                Architectural Modules
              </div>
              {featureLinks.map((f) => (
                <button
                  key={f.to}
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleProtectedNavigation(f.to, `access the ${f.label}`);
                  }}
                  className="flex w-full items-center gap-2 py-1.5 text-sm text-[#252B2E]/85 text-left"
                >
                  <Compass className="h-3.5 w-3.5 text-[#C87960]" />
                  {f.label}
                </button>
              ))}
            </div>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#172B3A]">
              About Us
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-[#172B3A]">
                  Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-[#C87960]">
                    Admin Console
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="text-left text-sm text-red-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className="text-sm font-semibold text-[#C87960]">
                Login / Sign Up
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                handleProtectedNavigation("/studio", "start creating architectural designs");
              }}
              className="btn-primary w-full justify-center"
            >
              Start Designing
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
