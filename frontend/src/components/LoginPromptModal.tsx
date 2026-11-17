import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, LogIn, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPromptModal: React.FC = () => {
  const { isLoginModalOpen, loginModalTarget, loginModalAction, closeLoginModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If closed or already on the Auth page, do not render
  if (!isLoginModalOpen || location.pathname === "/auth") return null;

  const handleSignInRedirect = () => {
    closeLoginModal();
    navigate(`/auth?redirect=${encodeURIComponent(loginModalTarget || "/studio")}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={closeLoginModal}
        className="fixed inset-0 bg-[#172B3A]/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-[#DCCBB5] bg-white p-6 sm:p-8 shadow-editorial z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute right-4 top-4 rounded-full p-2 text-[#252B2E]/60 transition hover:bg-[#F7F4ED] hover:text-[#172B3A]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Brand Icon Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#172B3A] text-white shadow-md">
            <Lock className="h-6 w-6 text-[#C87960]" />
          </div>
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              Access Guard · FormaSpace Studio
            </span>
            <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">
              Please Log In First
            </h3>
          </div>
        </div>

        {/* Message */}
        <p className="mt-4 text-sm leading-relaxed text-[#252B2E]/80">
          To {loginModalAction || "use the Design Studio and generate architectural transformations"}, please log in to your account.
        </p>

        <div className="mt-2 text-xs text-[#252B2E]/60">
          Unregistered visitors can browse all gallery designs and video previews. An active account is required to generate new designs and save projects.
        </div>

        {/* Action Button - Only Sign In / Login */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleSignInRedirect}
            className="btn-primary w-full justify-center py-3.5 text-sm shadow-md"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign In / Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};
