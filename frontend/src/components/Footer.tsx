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
    <footer className="border-t border-[#DCCBB5] bg-[#172B3A] text-[#F7F4ED]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Newsletter Band */}
        <div className="mb-14 grid gap-8 rounded-3xl border border-[#F7F4ED]/15 bg-[#F7F4ED]/5 p-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              The FormaSpace Journal
            </span>
            <h3 className="mt-2 font-editorial text-2xl font-medium text-white sm:text-3xl">
              Architectural material studies & AI spatial releases.
            </h3>
            <p className="mt-2 text-sm text-[#F7F4ED]/70">
              Receive curated before-and-after case studies, new interior style packs, and seasonal studio notes.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="lg:col-span-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 rounded-full border border-[#F7F4ED]/20 bg-white/10 px-5 py-3 text-sm text-white placeholder:text-[#F7F4ED]/50 focus:border-[#C87960] focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#C87960] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#DCCBB5] hover:text-[#172B3A]"
              >
                {status === "loading" ? "Joining..." : "Subscribe"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {status === "done" && (
              <p className="mt-2.5 flex items-center gap-1.5 text-xs text-[#9BAE9A]">
                <CheckCircle2 className="h-4 w-4" /> {msg}
              </p>
            )}
            {status === "error" && <p className="mt-2 text-xs text-[#C87960]">{msg}</p>}
          </form>
        </div>

        {/* Footer Grid */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-editorial text-2xl font-semibold text-white">
              FormaSpace <span className="text-[#C87960]">AI</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#F7F4ED]/70">
              Editorial architectural visualization, structural-preserving interior redesign, and intelligent material planning.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#DCCBB5]">Design Studio</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F7F4ED]/75">
              <li><Link to="/studio" className="transition hover:text-[#C87960]">AI Studio</Link></li>
              <li><Link to="/studio?feature=virtual_staging" className="transition hover:text-[#C87960]">Virtual Staging</Link></li>
              <li><Link to="/studio?feature=room_declutter" className="transition hover:text-[#C87960]">Room Declutter</Link></li>
              <li><Link to="/studio?feature=sketch_to_render" className="transition hover:text-[#C87960]">Sketch to Render</Link></li>
              <li><Link to="/explore" className="transition hover:text-[#C87960]">Explore Gallery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#DCCBB5]">Architecture</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F7F4ED]/75">
              <li><Link to="/floor-plans" className="transition hover:text-[#C87960]">3D Floor Plans</Link></li>
              <li><Link to="/video-walkthrough" className="transition hover:text-[#C87960]">Video Walkthrough</Link></li>
              <li><Link to="/furniture-finder" className="transition hover:text-[#C87960]">Furniture Shop</Link></li>
              <li><Link to="/budget-estimator" className="transition hover:text-[#C87960]">Budget Estimator</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#DCCBB5]">Platform</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F7F4ED]/75">
              <li><Link to="/dashboard" className="transition hover:text-[#C87960]">Dashboard</Link></li>
              <li><Link to="/admin" className="transition hover:text-[#C87960]">Admin</Link></li>
              <li><Link to="/about" className="transition hover:text-[#C87960]">About</Link></li>
              <li><Link to="/auth" className="transition hover:text-[#C87960]">Sign In</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#F7F4ED]/15 pt-8 text-xs text-[#F7F4ED]/55 sm:flex-row">
          <p>© {new Date().getFullYear()} FormaSpace AI Architecture Studio. All rights reserved.</p>
          <p>Built with Supabase-ready architecture · Modular Image-to-Image AI Pipeline</p>
        </div>
      </div>
    </footer>
  );
};

