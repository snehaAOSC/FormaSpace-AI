import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KeyRound, Loader2, Lock, Mail, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [googleConfig, setGoogleConfig] = useState<{ configured: boolean; oauth_url: string | null }>({
    configured: false,
    oauth_url: null,
  });

  useEffect(() => {
    api
      .get<{ configured: boolean; oauth_url: string | null }>("/api/auth/google-config")
      .then(setGoogleConfig)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (mode === "login") {
        const u = await login(email, password);
        navigate(u.role === "admin" ? "/admin" : "/dashboard");
      } else if (mode === "register") {
        await register(email, password, fullName);
        navigate("/studio");
      } else if (mode === "forgot") {
        const res = await api.post<{ message: string; dev_reset_token?: string }>(
          "/api/auth/forgot-password",
          { email }
        );
        setInfo(res.message);
        if (res.dev_reset_token) {
          setResetToken(res.dev_reset_token);
          setMode("reset");
          setInfo(`Dev reset token generated: ${res.dev_reset_token}`);
        }
      } else if (mode === "reset") {
        const res = await api.post<{ message: string }>("/api/auth/reset-password", {
          token: resetToken,
          new_password: password,
        });
        setInfo(res.message);
        setMode("login");
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F4ED] py-12 px-4 flex items-center justify-center">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-[#DCCBB5] bg-white shadow-editorial lg:grid-cols-12">
        {/* Left Editorial Visual */}
        <div className="relative hidden lg:block lg:col-span-5 bg-[#172B3A]">
          <img
            src="/images/hero-after.jpg"
            alt="FormaSpace Interior"
            className="h-full w-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#172B3A] via-[#172B3A]/40 to-transparent p-8 flex flex-col justify-end text-[#F7F4ED]">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              FormaSpace AI Studio
            </span>
            <h2 className="mt-2 font-editorial text-2xl font-semibold">
              Private workspace for your architectural concepts.
            </h2>
            <p className="mt-2 text-xs text-[#F7F4ED]/80">
              All uploaded spaces, floor plans, and design history remain isolated per user account.
            </p>
          </div>
        </div>

        {/* Right Form */}
        <div className="p-8 sm:p-10 lg:col-span-7">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`rounded-full px-5 py-2 text-xs font-medium transition ${
                mode === "login" ? "bg-[#172B3A] text-white" : "bg-[#F7F4ED] text-[#252B2E]"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`rounded-full px-5 py-2 text-xs font-medium transition ${
                mode === "register" ? "bg-[#172B3A] text-white" : "bg-[#F7F4ED] text-[#252B2E]"
              }`}
            >
              Create Account
            </button>
          </div>

          <h1 className="font-editorial text-3xl font-semibold text-[#172B3A]">
            {mode === "login"
              ? "Welcome back"
              : mode === "register"
              ? "Create your studio account"
              : mode === "forgot"
              ? "Reset your password"
              : "Set a new password"}
          </h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-xs font-medium text-[#252B2E]/75">Full Name</label>
                <div className="relative mt-1">
                  <UserIcon className="absolute left-3.5 top-3 h-4 w-4 text-[#252B2E]/40" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Elena Vance"
                    className="w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/50 py-2.5 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>
            )}

            {mode !== "reset" && (
              <div>
                <label className="text-xs font-medium text-[#252B2E]/75">Email Address</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#252B2E]/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="architect@studio.com"
                    className="w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/50 py-2.5 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>
            )}

            {mode === "reset" && (
              <div>
                <label className="text-xs font-medium text-[#252B2E]/75">Reset Token</label>
                <div className="relative mt-1">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-[#252B2E]/40" />
                  <input
                    type="text"
                    required
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    className="w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/50 py-2.5 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>
            )}

            {mode !== "forgot" && (
              <div>
                <label className="text-xs font-medium text-[#252B2E]/75">
                  {mode === "reset" ? "New Password" : "Password"}
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-[#252B2E]/40" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/50 py-2.5 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-800">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-xl border border-[#9BAE9A] bg-[#9BAE9A]/20 px-3 py-2 text-xs text-[#172B3A]">
                {info}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login"
                ? "Sign In"
                : mode === "register"
                ? "Create Account"
                : mode === "forgot"
                ? "Send Reset Link"
                : "Update Password"}
            </button>
          </form>

          {/* Google OAuth - only rendered if active/configured */}
          {googleConfig.configured && googleConfig.oauth_url && (
            <div className="mt-5">
              <a href={googleConfig.oauth_url} className="btn-secondary w-full justify-center py-2.5 text-xs">
                Continue with Google
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

