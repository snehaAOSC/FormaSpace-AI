import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Film,
  FolderOpen,
  Image as ImageIcon,
  Info,
  Layers,
  Loader2,
  LogIn,
  RotateCcw,
  Sparkles,
  Upload,
  Video,
} from "lucide-react";
import {
  ArchitecturalVideoTourPlayer,
  CAMERA_ANGLES,
} from "../components/ArchitecturalVideoTourPlayer";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { DesignResult, VideoProject } from "../types";

const CAMERA_FLIGHT_PATHS = [
  { id: "multi_side_cut", label: "Multi-Side 4-Angle Montage (Left, Right, Ceiling & Wide)" },
  { id: "pan_left_right", label: "Left-to-Right Side Pan" },
  { id: "pan_right_left", label: "Right-to-Left Side Pan" },
  { id: "crane_vertical", label: "Ceiling-to-Floor Crane" },
  { id: "orbit_360", label: "360° Circular Spatial Orbit" },
  { id: "diagonal_side_glide", label: "Diagonal Corner Glide" },
  { id: "dolly_depth", label: "Wide Establishing Dolly" },
];

const CURATED_SHOWROOMS = [
  { label: "Modern Luxury Kitchen", category: "Kitchen", url: "/images/kitchen-after.jpg" },
  { label: "Spa Sanctuary Bathroom", category: "Bathroom", url: "/images/bathroom-after.jpg" },
  { label: "Modern Luxury Bedroom", category: "Bedroom", url: "/images/bedroom-after.jpg" },
  { label: "Modern Luxury Salon", category: "Living Room", url: "/images/hero-after.jpg" },
  { label: "Timber Villa Exterior", category: "Exterior", url: "/images/exterior-after.jpg" },
  { label: "Courtyard Plunge Pool", category: "Garden", url: "/images/garden-after.jpg" },
  { label: "Japandi Dining Room", category: "Dining Room", url: "/images/style-japandi.jpg" },
  { label: "3D Isometric Cutaway", category: "Floor Plan", url: "/images/floorplan-3d.jpg" },
];

interface UserRedesignItem {
  id: string;
  label: string;
  roomType: string;
  style: string;
  url: string;
  date?: string;
}

export const VideoWalkthroughPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialUrl = searchParams.get("image") || "/images/hero-after.jpg";
  const initialRoom = searchParams.get("room") || searchParams.get("category") || "Salon";
  const initialStyle = searchParams.get("style") || "Modern Luxury";

  const [title, setTitle] = useState(
    initialRoom ? `${initialRoom} Architectural Spatial Walkthrough` : "Architectural Spatial Walkthrough"
  );
  const [sourceImage, setSourceImage] = useState<string>(initialUrl);
  const [selectedSpaceTab, setSelectedSpaceTab] = useState<"redesigns" | "showrooms" | "upload">(
    searchParams.get("image") ? "redesigns" : "showrooms"
  );

  const [userRedesigns, setUserRedesigns] = useState<UserRedesignItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [cameraMovement, setCameraMovement] = useState<string>(CAMERA_FLIGHT_PATHS[0].label);
  const [duration, setDuration] = useState<number>(7);
  const [angles, setAngles] = useState<string[]>([
    "Left-to-Right Side Pan",
    "Right-to-Left Side Pan",
    "Ceiling & Lighting Tilt",
    "Wide Establishing View",
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  // Load User's Redesigns from Studio History
  useEffect(() => {
    const fetchUserRedesigns = async () => {
      setLoadingHistory(true);
      try {
        const res = await api.get<{ designs: DesignResult[] }>("/api/studio/history");
        if (res.designs && res.designs.length > 0) {
          const mapped: UserRedesignItem[] = res.designs.map((d) => ({
            id: d.id,
            label: `${d.room_type || "Room"} · ${d.style || "Redesign"}`,
            roomType: d.room_type || "Room",
            style: d.style || "Modern Luxury",
            url: d.generated_image_url || d.variations?.[0] || d.original_image_url,
            date: d.created_at ? new Date(d.created_at).toLocaleDateString() : undefined,
          }));
          setUserRedesigns(mapped);
          // If user came with a specific image from studio or wants their redesigns
          if (searchParams.get("image") || mapped.length > 0) {
            setSelectedSpaceTab("redesigns");
          }
        }
      } catch {
        // Fallback: If user arrived with a query parameter image, register it as active redesign
        if (searchParams.get("image")) {
          setUserRedesigns([
            {
              id: "active-redesign",
              label: `${initialRoom} · ${initialStyle}`,
              roomType: initialRoom,
              style: initialStyle,
              url: searchParams.get("image")!,
            },
          ]);
          setSelectedSpaceTab("redesigns");
        }
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchUserRedesigns();
  }, [user, searchParams]);

  // Handle direct custom room photo upload
  const handleUploadRoomImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultUrl = event.target?.result as string;
      if (resultUrl) {
        setSourceImage(resultUrl);
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(`${cleanName} Spatial Walkthrough`);
        // Add to active redesigns list
        setUserRedesigns((prev) => [
          {
            id: `upload-${Date.now()}`,
            label: `${cleanName} (Uploaded)`,
            roomType: "Custom Room",
            style: "Uploaded Space",
            url: resultUrl,
          },
          ...prev,
        ]);
        setSelectedSpaceTab("redesigns");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveWalkthrough = async () => {
    if (!user) {
      setError("Please sign in to save video walkthrough projects.");
      return;
    }
    setError("");
    setSavedSuccess(false);
    setSubmitting(true);
    try {
      await api.post<{ video_project: VideoProject }>("/api/modules/videos/generate", {
        title,
        source_image_url: sourceImage,
        camera_movement: cameraMovement,
        duration_seconds: duration,
        angles,
        transition_style: "Smooth Architectural Ease",
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 8000);
    } catch (err: any) {
      setError(err.message || "Could not save video project.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Context Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/studio?sample=${encodeURIComponent(searchParams.get("sample") || "")}&style=${encodeURIComponent(searchParams.get("style") || "")}&category=${encodeURIComponent(searchParams.get("room") || "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#DCCBB5] bg-white px-4 py-2 text-xs font-semibold text-[#172B3A] shadow-sm hover:border-[#C87960] hover:text-[#C87960] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to AI Studio
          </Link>
          <div className="text-xs text-[#252B2E]/60">
            Active Space: <strong className="text-[#172B3A]">{initialRoom}</strong> · Style:{" "}
            <strong className="text-[#C87960]">{initialStyle}</strong>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
              AI Video Walkthrough
            </h1>
            <p className="mt-1 text-xs text-[#252B2E]/70 max-w-xl">
              Select any redesigned space, switch camera perspectives (left side, right side, ceiling crane, or 360° orbit), and export a smooth 60FPS architectural walkthrough.
            </p>
          </div>
          {!user && (
            <Link
              to="/auth?redirect=/video-walkthrough"
              className="btn-primary text-xs self-start"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In / Login
            </Link>
          )}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-12">
          {/* Controls Panel */}
          <div className="editorial-card p-6 space-y-5 lg:col-span-4">
            <div>
              <label className="text-xs font-medium text-[#252B2E]/80">Walkthrough Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm text-[#172B3A]"
              />
            </div>

            {/* Architectural Space Selection Tabs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[#252B2E]/80">
                  Select Architectural Space
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C87960] hover:underline"
                >
                  <Upload className="h-3 w-3" /> Upload Photo
                </button>
              </div>

              {/* Space Selector Tabs */}
              <div className="grid grid-cols-2 rounded-xl bg-[#EFE9DD] p-1 text-xs font-medium text-[#172B3A]">
                <button
                  type="button"
                  onClick={() => setSelectedSpaceTab("redesigns")}
                  className={`rounded-lg py-1.5 transition text-center ${
                    selectedSpaceTab === "redesigns"
                      ? "bg-white font-semibold text-[#172B3A] shadow-sm"
                      : "text-[#252B2E]/70 hover:text-[#172B3A]"
                  }`}
                >
                  My AI Redesigns {userRedesigns.length > 0 ? `(${userRedesigns.length})` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSpaceTab("showrooms")}
                  className={`rounded-lg py-1.5 transition text-center ${
                    selectedSpaceTab === "showrooms"
                      ? "bg-white font-semibold text-[#172B3A] shadow-sm"
                      : "text-[#252B2E]/70 hover:text-[#172B3A]"
                  }`}
                >
                  Curated Showrooms
                </button>
              </div>

              {/* Tab 1: User's AI Redesigns */}
              {selectedSpaceTab === "redesigns" && (
                <div className="mt-3">
                  {userRedesigns.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {userRedesigns.map((ur) => {
                        const isSelected = sourceImage === ur.url;
                        return (
                          <button
                            key={ur.id}
                            type="button"
                            onClick={() => {
                              setSourceImage(ur.url);
                              setTitle(`${ur.roomType} Spatial Walkthrough`);
                            }}
                            className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${
                              isSelected
                                ? "border-[#C87960] ring-2 ring-[#C87960]/30 shadow"
                                : "border-[#DCCBB5] hover:border-[#C87960]"
                            }`}
                          >
                            <img
                              src={ur.url}
                              alt={ur.label}
                              className="h-16 w-full object-cover transition duration-200 group-hover:scale-105"
                            />
                            <div className="bg-white p-1.5">
                              <div className="truncate text-[10px] font-semibold text-[#172B3A]">
                                {ur.roomType}
                              </div>
                              <div className="truncate text-[9px] text-[#C87960]">
                                {ur.style}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="absolute top-1 right-1 rounded-full bg-[#C87960] p-0.5 text-white">
                                <Check className="h-2.5 w-2.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#DCCBB5] bg-white p-4 text-center">
                      <ImageIcon className="mx-auto h-6 w-6 text-[#252B2E]/40" />
                      <p className="mt-1 text-xs font-semibold text-[#172B3A]">
                        No Redesigned Rooms Yet
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#252B2E]/65">
                        Generate a redesign in Studio or select one of our curated showrooms.
                      </p>
                      <div className="mt-2.5 flex items-center justify-center gap-2">
                        <Link
                          to="/studio"
                          className="rounded-lg bg-[#172B3A] px-3 py-1 text-[11px] font-semibold text-white hover:bg-[#C87960] transition"
                        >
                          Go to AI Studio
                        </Link>
                        <button
                          type="button"
                          onClick={() => setSelectedSpaceTab("showrooms")}
                          className="rounded-lg border border-[#DCCBB5] bg-white px-2.5 py-1 text-[11px] font-medium text-[#172B3A]"
                        >
                          Showrooms
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Curated Showrooms */}
              {selectedSpaceTab === "showrooms" && (
                <div className="mt-3 grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {CURATED_SHOWROOMS.map((sr) => {
                    const isSelected = sourceImage === sr.url;
                    return (
                      <button
                        key={sr.label}
                        type="button"
                        onClick={() => {
                          setSourceImage(sr.url);
                          setTitle(`${sr.label} Spatial Walkthrough`);
                        }}
                        className={`group relative overflow-hidden rounded-xl border-2 text-left transition ${
                          isSelected
                            ? "border-[#C87960] ring-2 ring-[#C87960]/30 shadow"
                            : "border-[#DCCBB5] hover:border-[#C87960]"
                        }`}
                      >
                        <img
                          src={sr.url}
                          alt={sr.label}
                          className="h-16 w-full object-cover transition duration-200 group-hover:scale-105"
                        />
                        <div className="truncate bg-white px-2 py-1 text-[10px] font-medium text-[#172B3A]">
                          {sr.label}
                        </div>
                        {isSelected && (
                          <span className="absolute top-1 right-1 rounded-full bg-[#C87960] p-0.5 text-white">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Hidden file input for uploading custom room */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadRoomImage}
                className="hidden"
              />
            </div>

            {/* Camera Flight Path / Perspective Movement */}
            <div>
              <label className="text-xs font-medium text-[#252B2E]/80">
                Camera Perspective & Movement
              </label>
              <select
                value={cameraMovement}
                onChange={(e) => setCameraMovement(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-xs text-[#172B3A] font-medium"
              >
                {CAMERA_FLIGHT_PATHS.map((cm) => (
                  <option key={cm.id} value={cm.label}>
                    {cm.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[#252B2E]/60">
                Sweeps across left and right sides, vertical ceiling crane, or multi-angle cuts.
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-[#252B2E]/80">
                Clip Duration: {duration} seconds
              </label>
              <input
                type="range"
                min={4}
                max={12}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="mt-2 w-full accent-[#C87960]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#252B2E]/80">
                Camera Perspectives Included
              </label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {[
                  "Left Side Pan",
                  "Right Side Pan",
                  "Ceiling & Lighting",
                  "Wide Overview",
                  "Material Focus",
                ].map((ang) => {
                  const active = angles.includes(ang);
                  return (
                    <button
                      key={ang}
                      type="button"
                      onClick={() =>
                        setAngles((prev) =>
                          active ? prev.filter((x) => x !== ang) : [...prev, ang]
                        )
                      }
                      className={`rounded-full px-2.5 py-1 text-[11px] border transition ${
                        active
                          ? "border-[#172B3A] bg-[#172B3A] text-white"
                          : "border-[#DCCBB5] bg-white text-[#252B2E] hover:border-[#C87960]"
                      }`}
                    >
                      {ang}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                {error}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSaveWalkthrough}
                disabled={submitting}
                className="btn-primary w-full justify-center py-2.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Saving Walkthrough...
                  </>
                ) : (
                  <>
                    <Film className="h-4 w-4" /> Save Walkthrough to Project
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Motion Viewport with ArchitecturalVideoTourPlayer */}
          <div className="editorial-card p-6 lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">{title}</h2>
                <p className="text-xs text-[#252B2E]/65">
                  Interactive 60FPS walkthrough player with live camera angles, sound, and instant clip export
                </p>
              </div>
            </div>

            <ArchitecturalVideoTourPlayer
              sourceImage={sourceImage}
              title={title}
              category="Walkthrough Studio"
              autoPlay={true}
              selectedMovement={cameraMovement}
              onMovementChange={(movementName) => setCameraMovement(movementName)}
              className="aspect-[16/10]"
            />

            {/* Clean Success Notification (No cloud disclaimer lines) */}
            {savedSuccess && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#9BAE9A]/80 bg-[#9BAE9A]/20 p-4 text-xs text-[#172B3A] shadow-sm animate-fade-in">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#9BAE9A] text-white shrink-0">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <div>
                  <div className="font-semibold text-sm">Walkthrough Project Saved Successfully!</div>
                  <div className="mt-0.5 text-[#252B2E]/75 text-[11px]">
                    Saved to your project gallery. You can switch camera angles, preview live 60FPS motion, or click "Export Clip" to download the WebM video.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Curated Spatial Design Tours (Categorized room variations) */}
        {(() => {
          const room = (searchParams.get("room") || initialRoom || "").toLowerCase();
          const sample = (searchParams.get("sample") || sourceImage || "").toLowerCase();

          let uniqueSpaceDesigns: Array<{
            style: string;
            tag: string;
            desc: string;
            imageUrl: string;
          }> = [];

          if (room.includes("kitchen") || sample.includes("kitchen")) {
            uniqueSpaceDesigns = [
              {
                style: "Modern Luxury Kitchen",
                tag: "Culinary Atelier",
                desc: "Honed marble waterfall island, fluted oak millwork & brass cylinder pendants.",
                imageUrl: "/images/kitchen-after.jpg",
              },
            ];
          } else if (room.includes("bath") || sample.includes("bath")) {
            uniqueSpaceDesigns = [
              {
                style: "Modern Luxury Bathroom",
                tag: "Spa Sanctuary",
                desc: "Floating dark stone vanity, backlit circular LED mirror & walk-in rain shower.",
                imageUrl: "/images/bathroom-after.jpg",
              },
            ];
          } else if (room.includes("bed") || sample.includes("bed") || sample.includes("58a50328")) {
            uniqueSpaceDesigns = [
              {
                style: "Modern Luxury Bedroom",
                tag: "Signature Suite",
                desc: "Low white oak bed, fluted oak millwork & tailored sheer linen drapery.",
                imageUrl: "/images/bedroom-after.jpg",
              },
              {
                style: "Japandi Bedroom",
                tag: "Wabi-Sabi Sanctuary",
                desc: "Hinoki timber bed, Noguchi paper pendant & slatted sliding wardrobes.",
                imageUrl: "/images/bedroom-after-japandi.jpg",
              },
            ];
          } else if (
            room.includes("exterior") ||
            sample.includes("exterior") ||
            sample.includes("facade")
          ) {
            uniqueSpaceDesigns = [
              {
                style: "Contemporary Villa Facade",
                tag: "Architectural Villa",
                desc: "Vertical charred timber battens, dark basalt stone cladding & glass walls.",
                imageUrl: "/images/exterior-after.jpg",
              },
            ];
          } else if (
            room.includes("garden") ||
            sample.includes("garden") ||
            sample.includes("yard") ||
            sample.includes("patio")
          ) {
            uniqueSpaceDesigns = [
              {
                style: "Mediterranean Courtyard",
                tag: "Sunlit Courtyard",
                desc: "Honed Roman travertine, sculpted mature olive trees & plunge pool.",
                imageUrl: "/images/garden-after.jpg",
              },
            ];
          } else if (sample.includes("empty-room") || sample.includes("staged-room")) {
            uniqueSpaceDesigns = [
              {
                style: "Contemporary Staging",
                tag: "Tailored Staging",
                desc: "Curated cognac leather seating, textured woven rug & architectural shelving.",
                imageUrl: "/images/staged-room.jpg",
              },
            ];
          } else {
            uniqueSpaceDesigns = [
              {
                style: "Modern Luxury Salon",
                tag: "Editorial Salon",
                desc: "Curved Belgian bouclé sofa, honed travertine plinth table & architectural daylight.",
                imageUrl: "/images/hero-after.jpg",
              },
              {
                style: "Contemporary Staged Living",
                tag: "Tailored Living",
                desc: "Cognac leather seating, neutral woven rug & balanced architectural proportion.",
                imageUrl: "/images/staged-room.jpg",
              },
            ];
          }

          // Deduplicate
          const deduplicated = uniqueSpaceDesigns.filter(
            (d, idx, self) => idx === self.findIndex((t) => t.imageUrl === d.imageUrl)
          );

          return (
            <div className="mt-8 editorial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C87960]" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
                    Curated Design Variations for this Space
                  </h3>
                </div>
                <span className="text-xs text-[#252B2E]/65">
                  Click any design to switch active walkthrough view
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {deduplicated.map((d) => {
                  const isActive = sourceImage === d.imageUrl;
                  return (
                    <button
                      key={d.imageUrl}
                      type="button"
                      onClick={() => {
                        setSourceImage(d.imageUrl);
                        setTitle(`${d.style} Spatial Walkthrough`);
                      }}
                      className={`group relative overflow-hidden rounded-xl border text-left p-3 transition ${
                        isActive
                          ? "border-[#C87960] bg-[#C87960]/5 shadow-sm ring-1 ring-[#C87960]"
                          : "border-[#DCCBB5] bg-white hover:border-[#C87960]"
                      }`}
                    >
                      <div className="aspect-[16/10] overflow-hidden rounded-lg mb-2.5 bg-[#252B2E] relative">
                        <img
                          src={d.imageUrl}
                          alt={d.style}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        {isActive && (
                          <span className="absolute top-2 left-2 rounded bg-[#C87960] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
                            Active Walkthrough
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">
                          {d.tag}
                        </span>
                        {isActive && (
                          <span className="rounded bg-[#C87960]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#C87960]">
                            Playing
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-[#172B3A] mt-0.5">
                        {d.style}
                      </div>
                      <p className="mt-1 text-xs text-[#252B2E]/70 line-clamp-2 leading-relaxed">
                        {d.desc}
                      </p>
                      <div className="mt-3 text-xs text-[#C87960] font-medium flex items-center gap-1.5">
                        <Film className="h-3.5 w-3.5" /> Switch to This Walkthrough
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
