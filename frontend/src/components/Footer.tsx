import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await api.post<{ message: string }>("/api/public/newsletter", { email });
      setStatus("done");
      setMsg(res.message);
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setMsg(err.message || "Could not subscribe.");
    }
  };

  return (
    <footer className="border-t border-[#DCCBB5]/40 bg-[#172B3A] text-[#F7F4ED]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Compact Newsletter Row */}
        <div className="mb-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-[#F7F4ED]/15 bg-[#F7F4ED]/5 p-5 sm:flex-row">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              The FormaSpace Journal
            </span>
            <h3 className="font-editorial text-lg font-medium text-white sm:text-xl">
              Architectural studies & spatial design releases
            </h3>
          </div>
          <form onSubmit={handleSubscribe} className="w-full sm:w-auto">
            <div className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full sm:w-64 rounded-full border border-[#F7F4ED]/20 bg-white/10 px-4 py-2 text-xs text-white placeholder:text-[#F7F4ED]/50 focus:border-[#C87960] focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#C87960] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#DCCBB5] hover:text-[#172B3A]"
              >
                <span>{status === "loading" ? "Joining..." : "Subscribe"}</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {status === "done" && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] text-[#9BAE9A]">
                <CheckCircle2 className="h-3.5 w-3.5" /> {msg}
              </p>
            )}
            {status === "error" && <p className="mt-1.5 text-[11px] text-[#C87960]">{msg}</p>}
          </form>
        </div>

        {/* Compact Footer Columns */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Link to="/" className="inline-block font-editorial text-xl font-semibold text-white hover:text-[#C87960] transition">
              FormaSpace <span className="text-[#C87960]">Studio</span>
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-[#F7F4ED]/70">
              Editorial architectural visualization, room transformation, and intelligent spatial design.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#DCCBB5]">Design Studio</h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-[#F7F4ED]/75">
              <li><Link to="/studio" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Design Studio</Link></li>
              <li><Link to="/studio?feature=virtual_staging" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Virtual Staging</Link></li>
              <li><Link to="/studio?feature=room_declutter" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Room Declutter</Link></li>
              <li><Link to="/studio?feature=sketch_to_render" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Sketch to Render</Link></li>
              <li><Link to="/explore" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Explore Gallery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#DCCBB5]">Architecture</h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-[#F7F4ED]/75">
              <li><Link to="/floor-plans" className="transition hover:text-[#C87960] hover:underline underline-offset-2">3D Floor Plans</Link></li>
              <li><Link to="/video-walkthrough" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Video Walkthrough</Link></li>
              <li><Link to="/furniture-finder" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Furniture Finder</Link></li>
              <li><Link to="/budget-estimator" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Cost Estimator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#DCCBB5]">Platform</h4>
            <ul className="mt-2.5 space-y-1.5 text-xs text-[#F7F4ED]/75">
              <li><Link to="/dashboard" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Dashboard</Link></li>
              <li><Link to="/about" className="transition hover:text-[#C87960] hover:underline underline-offset-2">About Us</Link></li>
              <li><Link to="/auth" className="transition hover:text-[#C87960] hover:underline underline-offset-2">Sign In / Register</Link></li>
            </ul>
          </div>
        </div>

        {/* Clean Bottom Copyright Bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[#F7F4ED]/15 pt-6 text-xs text-[#F7F4ED]/55 sm:flex-row">
          <p>© {new Date().getFullYear()} FormaSpace Architecture Studio. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:text-[#F7F4ED] transition">About</Link>
            <Link to="/studio" className="hover:text-[#F7F4ED] transition">Design Studio</Link>
            <Link to="/dashboard" className="hover:text-[#F7F4ED] transition">Workspace</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
