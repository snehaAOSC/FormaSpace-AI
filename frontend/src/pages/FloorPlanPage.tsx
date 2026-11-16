import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Layers, Loader2, LogIn, Sparkles, UploadCloud } from "lucide-react";
import { DemoModeBanner } from "../components/DemoModeBanner";
import { useAuth } from "../context/AuthContext";
import { DESIGN_STYLES } from "../data/catalog";
import { api } from "../lib/api";
import type { FloorPlanResult } from "../types";

export const FloorPlanPage: React.FC = () => {
  const { user, login, updateLocalCredits } = useAuth();
  const [title, setTitle] = useState("Two-Bedroom Residence Cutaway");
  const [sourcePlanUrl, setSourcePlanUrl] = useState("/images/floorplan-2d.jpg");
  const [layoutStyle, setLayoutStyle] = useState("Modern Luxury");
  const [arrangement, setArrangement] = useState("Open Concept Entertaining");
  const [lightingMood, setLightingMood] = useState("Natural Morning Daylight");
  const [perspective, setPerspective] = useState("3D Isometric Cutaway");

  const [result, setResult] = useState<FloorPlanResult | null>(null);
  const [history, setHistory] = useState<FloorPlanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<{ floor_plans: FloorPlanResult[] }>("/api/modules/floor-plans")
      .then((res) => setHistory(res.floor_plans))
      .catch(() => { });
  }, [user]);

  const handleUpload = async (file: File) => {
    if (!user) {
      setError("Please sign in first to upload a custom 2D floor plan.");
      return;
    }
    setError("");
    try {
      const res = await api.uploadFile(file);
      setSourcePlanUrl(res.url);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      setError("Sign in required (or click Quick Demo Login below) to generate 3D floor plan studies.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ floor_plan: FloorPlanResult; remaining_credits: number }>(
        "/api/modules/floor-plans/generate",
        {
          title,
          source_plan_url: sourcePlanUrl,
          layout_style: layoutStyle,
          furniture_arrangement: arrangement,
          lighting_mood: lightingMood,
          perspective,
        }
      );
      setResult(res.floor_plan);
      setHistory((prev) => [res.floor_plan, ...prev]);
      updateLocalCredits(res.remaining_credits);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/studio"
            className="inline-flex items-center gap-2 rounded-full border border-[#DCCBB5] bg-white px-4 py-2 text-xs font-semibold text-[#172B3A] shadow-sm hover:border-[#C87960] hover:text-[#C87960] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to AI Studio
          </Link>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              Dedicated Spatial Module
            </span>
            <h1 className="mt-1 font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
              2D-to-3D Floor Plan Generator
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#252B2E]/75">
              Upload architectural 2D blueprints or CAD drawings to generate furnished layouts, 3D isometric previews, and room circulation breakdowns.
            </p>
          </div>
          {!user && (
            <Link
              to="/auth?redirect=/floor-plans"
              className="btn-primary text-xs self-start"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In / Login
            </Link>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Controls */}
          <div className="editorial-card p-6 space-y-4 lg:col-span-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-[#172B3A]">
                1. Upload 2D Floor Plan
              </label>
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-2 cursor-pointer rounded-2xl border-2 border-dashed border-[#DCCBB5] bg-[#F7F4ED]/60 p-3 text-center hover:border-[#C87960]"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                <img src={sourcePlanUrl} alt="2D Blueprint" className="h-40 w-full rounded-xl object-cover" />
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-[#172B3A]">
                  <UploadCloud className="h-4 w-4 text-[#C87960]" /> Upload blueprint or use sample
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#252B2E]/80">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm text-[#172B3A]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#252B2E]/80">Interior Style Direction</label>
              <select
                value={layoutStyle}
                onChange={(e) => setLayoutStyle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm text-[#172B3A]"
              >
                {DESIGN_STYLES.map((s) => (
                  <option key={s.name}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[#252B2E]/80">Furniture Arrangement</label>
              <select
                value={arrangement}
                onChange={(e) => setArrangement(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm text-[#172B3A]"
              >
                <option>Open Concept Entertaining</option>
                <option>Family Quiet Zoning</option>
                <option>Executive Work-From-Home Layout</option>
                <option>Hospitality Suite Configuration</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#252B2E]/80">Perspective</label>
                <select
                  value={perspective}
                  onChange={(e) => setPerspective(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-2.5 py-2 text-xs text-[#172B3A]"
                >
                  <option>3D Isometric Cutaway</option>
                  <option>Top-Down Furnished 2D</option>
                  <option>Elevated Perspective</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#252B2E]/80">Daylighting</label>
                <select
                  value={lightingMood}
                  onChange={(e) => setLightingMood(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-2.5 py-2 text-xs text-[#172B3A]"
                >
                  <option>Natural Morning Daylight</option>
                  <option>Warm Golden Hour</option>
                  <option>Evening Architectural Glow</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">{error}</div>
            )}

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="btn-primary w-full justify-center py-3.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating 3D Visualization...
                </>
              ) : (
                <>
                  <Layers className="h-4 w-4" /> Convert to 3D Furnished Plan
                </>
              )}
            </button>
          </div>

          {/* Preview & Room Analysis */}
          <div className="space-y-6 lg:col-span-8">
            <div className="editorial-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                    {result ? result.title : "Architectural 3D Cutaway Preview"}
                  </h2>
                  <p className="text-xs text-[#252B2E]/65">
                    {result ? `${result.layout_style} · ${result.furniture_arrangement}` : "Sample architectural blueprint conversion"}
                  </p>
                </div>
                <a
                  href={result?.render_3d_url || "/images/floorplan-3d.jpg"}
                  download="formaspace-3d-floorplan.jpg"
                  className="btn-secondary py-2 px-4 text-xs"
                >
                  <Download className="h-3.5 w-3.5" /> Download 3D Render
                </a>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-[#DCCBB5]">
                  <div className="bg-[#172B3A] px-3 py-1.5 text-[11px] font-medium text-[#F7F4ED]">
                    Source 2D Blueprint
                  </div>
                  <img
                    src={result?.source_plan_url || sourcePlanUrl}
                    alt="2D Plan"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl border border-[#DCCBB5]">
                  <div className="bg-[#C87960] px-3 py-1.5 text-[11px] font-medium text-white">
                    3D Furnished Visualization
                  </div>
                  <img
                    src={result?.render_3d_url || "/images/floorplan-3d.jpg"}
                    alt="3D Plan"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
              </div>

              {/* Room Breakdown */}
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A] mb-3">
                  Explored Room Zones & Suggested Furnishings
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    result?.rooms || [
                      { name: "Living & Reception Salon", area_sqft: 340, zone: "Social", suggested_pieces: ["Curved Bouclé Sofa", "Travertine Coffee Table", "Wool Rug"] },
                      { name: "Open Architectural Kitchen", area_sqft: 210, zone: "Culinary", suggested_pieces: ["Waterfall Marble Island", "Oak Barstools", "Brass Pendant"] },
                      { name: "Primary Suite", area_sqft: 265, zone: "Private", suggested_pieces: ["Platform Bed", "Fluted Nightstands", "Linen Drapery"] },
                      { name: "Secondary Studio", area_sqft: 165, zone: "Flexible", suggested_pieces: ["Architectural Desk", "Daybed", "Built-in Shelving"] },
                    ]
                  ).map((rm) => (
                    <div key={rm.name} className="rounded-2xl border border-[#DCCBB5]/70 bg-[#F7F4ED]/60 p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#172B3A]">{rm.name}</span>
                        <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#C87960]">
                          {rm.area_sqft} sq ft
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {rm.suggested_pieces.map((p) => (
                          <span key={p} className="rounded-lg bg-white px-2 py-0.5 text-[11px] text-[#252B2E]/80">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {history.length > 0 && (
              <div className="editorial-card p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#172B3A] mb-3">
                  Saved Floor Plan Studies
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {history.map((fp) => (
                    <button
                      key={fp.id}
                      type="button"
                      onClick={() => setResult(fp)}
                      className="rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/50 p-2.5 text-left hover:border-[#C87960]"
                    >
                      <img src={fp.render_3d_url} alt={fp.title} className="h-24 w-full rounded-lg object-cover" />
                      <div className="mt-2 truncate text-xs font-semibold text-[#172B3A]">{fp.title}</div>
                      <div className="text-[11px] text-[#252B2E]/65">{fp.layout_style}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

