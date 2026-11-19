import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  Compass,
  Eye,
  Film,
  Home,
  Layers,
  Paintbrush,
  Play,
  ShoppingBag,
  Sparkles,
  Trees,
  UploadCloud,
  Video,
  Wand2,
} from "lucide-react";
import { ArchitecturalVideoTourPlayer } from "../components/ArchitecturalVideoTourPlayer";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider";
import { useAuth } from "../context/AuthContext";
import {
  BEFORE_AFTER_SHOWCASE,
  DESIGN_CATEGORIES,
  DESIGN_STYLES,
  FAQS,
  STUDIO_FEATURES,
  TESTIMONIALS,
} from "../data/catalog";

interface HeroMode {
  id: string;
  name: string;
  icon: any;
  tagline: string;
  headline: string;
  subhead: string;
  beforeSrc: string;
  afterSrc: string;
  beforeLabel: string;
  afterLabel: string;
  categoryLabel: string;
  materialMatch: string;
  palette: string[];
  videoSource: string;
  studioParam: string;
}

const HERO_MODES: HeroMode[] = [
  {
    id: "exteriors",
    name: "Exteriors",
    icon: Home,
    tagline: "ARCHITECTURAL FAÇADE TRANSFORMATION",
    headline: "Redesign Exteriors, in less than 30 seconds",
    subhead: "Upload a photo of your house. Transform walls, roofs, windows, and finishes into luxury contemporary architecture with structure locked.",
    beforeSrc: "/images/exterior-before.jpg",
    afterSrc: "/images/exterior-after.jpg",
    beforeLabel: "Original Suburban House",
    afterLabel: "Modern Villa · FormaSpace",
    categoryLabel: "Exterior Architecture",
    materialMatch: "Limestone & Cedar Timber",
    palette: ["#F7F4ED", "#C87960", "#252B2E", "#9BAE9A", "#172B3A"],
    videoSource: "/images/exterior-after.jpg",
    studioParam: "feature=exterior_design",
  },
  {
    id: "interiors",
    name: "Interiors",
    icon: Compass,
    tagline: "STRUCTURAL INTERIOR REDESIGN",
    headline: "Redesign Interiors, in less than 30 seconds",
    subhead: "Upload one photo. Get a real redesign in 30 seconds. Your walls, windows and layout stay exactly as they are. Only the design changes.",
    beforeSrc: "/images/hero-before.jpg",
    afterSrc: "/images/hero-after.jpg",
    beforeLabel: "Original 1990s Room",
    afterLabel: "Modern Luxury · FormaSpace",
    categoryLabel: "Pacific Heights Salon",
    materialMatch: "Honed Travertine & Bouclé",
    palette: ["#F7F4ED", "#DCCBB5", "#C87960", "#9BAE9A", "#172B3A"],
    videoSource: "/images/hero-after.jpg",
    studioParam: "feature=interior_redesign",
  },
  {
    id: "gardens",
    name: "Gardens",
    icon: Trees,
    tagline: "LANDSCAPE & PATIO TRANSFORMATION",
    headline: "Transform Gardens & Patios, in less than 30 seconds",
    subhead: "Turn dry or neglected yards into Mediterranean courtyard sanctuaries with plunge pools, sunken firepits, and architectural olive trees.",
    beforeSrc: "/images/garden-before.jpg",
    afterSrc: "/images/garden-after.jpg",
    beforeLabel: "Original Backyard",
    afterLabel: "Travertine Sanctuary · FormaSpace",
    categoryLabel: "Garden & Landscape",
    materialMatch: "Travertine Terrace & Plunge Pool",
    palette: ["#DCCBB5", "#9BAE9A", "#C87960", "#172B3A", "#F7F4ED"],
    videoSource: "/images/garden-after.jpg",
    studioParam: "feature=garden_landscape",
  },
  {
    id: "staging",
    name: "Virtual Staging",
    icon: Sparkles,
    tagline: "VACANT ROOM FURNISHING",
    headline: "Virtually Stage Empty Spaces, in less than 30 seconds",
    subhead: "Upload vacant property photos. Automatically place curated designer sofas, rugs, lighting, and art with perfect perspective.",
    beforeSrc: "/images/empty-room.jpg",
    afterSrc: "/images/staged-room.jpg",
    beforeLabel: "Unfurnished Shell",
    afterLabel: "Mid-Century Staged · FormaSpace",
    categoryLabel: "Virtual Staging Loft",
    materialMatch: "Cognac Leather & Wool Rug",
    palette: ["#FFFFFF", "#DCCBB5", "#C87960", "#252B2E", "#172B3A"],
    videoSource: "/images/staged-room.jpg",
    studioParam: "feature=virtual_staging",
  },
  {
    id: "videos",
    name: "Video Tours",
    icon: Video,
    tagline: "4K CINEMATIC MOTION WALKTHROUGHS",
    headline: "Generate Cinematic Video Tours, in less than 30 seconds",
    subhead: "Convert any redesigned space into smooth 4K architectural camera flythroughs with dolly, orbit, and pan pacing. Ready for clients & presentations.",
    beforeSrc: "/images/hero-before.jpg",
    afterSrc: "/images/hero-after.jpg",
    beforeLabel: "Static Architectural Render",
    afterLabel: "Cinematic Walkthrough Clip",
    categoryLabel: "4K Video Tour · 60fps",
    materialMatch: "24mm Dolly Camera Walkthrough",
    palette: ["#172B3A", "#C87960", "#F7F4ED", "#9BAE9A", "#DCCBB5"],
    videoSource: "/images/hero-after.jpg",
    studioParam: "feature=video_walkthrough",
  },
  {
    id: "floorplans",
    name: "3D Floor Plans",
    icon: Layers,
    tagline: "2D BLUEPRINT TO 3D ISOMETRIC",
    headline: "Convert 2D Floor Plans into 3D, in less than 30 seconds",
    subhead: "Turn 2D blueprint drafts and CAD sketches into fully furnished 3D isometric cutaways and circulation studies with realistic daylighting.",
    beforeSrc: "/images/floorplan-2d.jpg",
    afterSrc: "/images/floorplan-3d.jpg",
    beforeLabel: "2D CAD Blueprint",
    afterLabel: "3D Isometric Cutaway",
    categoryLabel: "3D Floor Plan Study",
    materialMatch: "Furnished Circulation Model",
    palette: ["#172B3A", "#F7F4ED", "#DCCBB5", "#9BAE9A", "#C87960"],
    videoSource: "/images/floorplan-3d.jpg",
    studioParam: "feature=sketch_to_render",
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const [activeHeroTab, setActiveHeroTab] = useState<string>("exteriors");
  const [heroMediaMode, setHeroMediaMode] = useState<"slider" | "video">("slider");

  const [catGroup, setCatGroup] = useState<string>("All");
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState(0);
  const [activeToolIdx, setActiveToolIdx] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const currentHero = HERO_MODES.find((m) => m.id === activeHeroTab) || HERO_MODES[0];

  const handleHeroTabChange = (tabId: string) => {
    setActiveHeroTab(tabId);
    if (tabId === "videos") {
      setHeroMediaMode("video");
    } else {
      setHeroMediaMode("slider");
    }
  };

  const filteredCategories =
    catGroup === "All"
      ? DESIGN_CATEGORIES
      : DESIGN_CATEGORIES.filter((c) => c.group === catGroup);

  const activeShowcase = BEFORE_AFTER_SHOWCASE[activeShowcaseIdx];
  const activeTool = STUDIO_FEATURES[activeToolIdx];

  return (
    <div className="overflow-x-hidden">
      {/* =====================================================================
          1. HERO SECTION — Dynamic Interactive Showcase (Matching HomeDesignsAI)
      ====================================================================== */}
      <section className="relative border-b border-[#DCCBB5]/70 bg-[#F7F4ED] pt-8 pb-16 lg:pt-14 lg:pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            {/* Left Copy Column */}
            <motion.div
              key={currentHero.id + "-copy"}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#DCCBB5] bg-white px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#172B3A]">
                <span className="h-2 w-2 rounded-full bg-[#C87960]" />
                {currentHero.tagline}
              </div>

              <h1 className="mt-5 font-editorial text-4xl font-semibold leading-[1.08] tracking-tight text-[#172B3A] sm:text-5xl lg:text-[3.25rem]">
                {currentHero.headline.split(",")[0]},{" "}
                <span className="italic font-normal text-[#C87960]">
                  {currentHero.headline.split(",")[1] || "in less than 30 seconds"}
                </span>
              </h1>

              <p className="mt-5 text-base leading-relaxed text-[#252B2E]/80 sm:text-lg max-w-xl">
                {currentHero.subhead}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    const target =
                      currentHero.id === "staging"
                        ? "/virtual-staging"
                        : currentHero.id === "videos"
                        ? "/video-walkthrough"
                        : currentHero.id === "floorplans"
                        ? "/floor-plans"
                        : `/studio?${currentHero.studioParam}`;
                    if (!requireAuth(target, `start designing your ${currentHero.name.toLowerCase()}`)) return;
                    navigate(target);
                  }}
                  className="btn-primary px-8 py-3.5 text-sm shadow-editorial"
                >
                  <Sparkles className="h-4 w-4" />
                  Start Designing
                </button>
                {heroMediaMode === "slider" ? (
                  <button
                    type="button"
                    onClick={() => setHeroMediaMode("video")}
                    className="btn-secondary px-6 py-3.5 text-sm"
                  >
                    <Play className="h-4 w-4 text-[#C87960] fill-[#C87960]" />
                    Play Video Tour
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setHeroMediaMode("slider")}
                    className="btn-secondary px-6 py-3.5 text-sm"
                  >
                    <Eye className="h-4 w-4 text-[#172B3A]" />
                    Before / After Slider
                  </button>
                )}
              </div>


            </motion.div>

            {/* Right Large Showcase Card (Slider or Live Video Walkthrough) */}
            <div className="relative lg:col-span-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentHero.id + "-" + heroMediaMode}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.4 }}
                  className="relative rounded-[28px] border border-[#DCCBB5] bg-white p-3 shadow-editorial"
                >
                  {heroMediaMode === "video" ? (
                    <ArchitecturalVideoTourPlayer
                      sourceImage={currentHero.videoSource}
                      title={`FormaSpace · ${currentHero.name} 4K Walkthrough`}
                      category={currentHero.categoryLabel}
                      autoPlay={true}
                      className="aspect-[16/11]"
                      onSwitchToSlider={() => setHeroMediaMode("slider")}
                    />
                  ) : (
                    <div className="relative">
                      {/* Structure Lock ON Pulsing Badge */}
                      <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#172B3A]/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9BAE9A] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#9BAE9A]" />
                          </span>
                          <span>Structure Lock ON</span>
                        </div>
                      </div>

                      {/* Switch to Video Tour button in top right */}
                      <button
                        type="button"
                        onClick={() => setHeroMediaMode("video")}
                        className="absolute right-4 top-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-[#172B3A]/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-[#C87960]"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        <span>Play Video Tour</span>
                      </button>

                      {/* Before / After Slider */}
                      <BeforeAfterSlider
                        beforeSrc={currentHero.beforeSrc}
                        afterSrc={currentHero.afterSrc}
                        beforeLabel={currentHero.beforeLabel}
                        afterLabel={currentHero.afterLabel}
                        className="aspect-[16/11]"
                      />
                    </div>
                  )}


                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* =====================================================================
              HORIZONTAL CATEGORY SWITCHER BAR (Matching HomeDesignsAI Exactly)
          ====================================================================== */}
          <div className="mt-12 border-t border-[#DCCBB5]/80 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2 overflow-x-auto pb-2">
              {HERO_MODES.map((mode) => {
                const isActive = activeHeroTab === mode.id;
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => handleHeroTabChange(mode.id)}
                    className={`group inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-[#172B3A] text-white shadow-editorial ring-2 ring-[#C87960]"
                        : "bg-white border border-[#DCCBB5] text-[#252B2E] hover:border-[#C87960] hover:bg-white"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                        isActive ? "text-[#C87960]" : "text-[#172B3A]/70"
                      }`}
                    />
                    <span>{mode.name}</span>
                    {mode.id === "videos" && (
                      <span className="rounded-full bg-[#C87960] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                        4K
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. EXPLORE DESIGN CATEGORIES (All 13 Categories)
      ====================================================================== */}
      <section className="py-20 bg-white border-b border-[#DCCBB5]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
                01 · Spatial Typologies
              </span>
              <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
                Explore Design Categories
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[#252B2E]/75">
                Select any interior room, architectural facade, outdoor sanctuary, or commercial environment to launch directly inside Design Studio.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Interior", "Exterior", "Outdoor", "Commercial"].map((grp) => (
                <button
                  key={grp}
                  type="button"
                  onClick={() => setCatGroup(grp)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    catGroup === grp
                      ? "bg-[#172B3A] text-[#F7F4ED]"
                      : "border border-[#DCCBB5] bg-[#F7F4ED]/60 text-[#252B2E] hover:border-[#C87960]"
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredCategories.map((cat, idx) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  const target = `/studio?category=${encodeURIComponent(cat.name)}`;
                  if (!requireAuth(target, `launch the ${cat.name} design studio`)) return;
                  navigate(target);
                }}
                className={`group relative overflow-hidden rounded-2xl border border-[#DCCBB5]/70 bg-[#F7F4ED] text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-editorial ${
                  idx === 0 && catGroup === "All" ? "sm:col-span-2 lg:col-span-2" : ""
                }`}
              >
                <div className="aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-white">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C87960]">
                      {cat.group}
                    </span>
                    <h3 className="font-editorial text-lg font-semibold text-[#172B3A]">{cat.name}</h3>
                    <p className="text-xs text-[#252B2E]/65">{cat.subtitle}</p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#DCCBB5] text-[#172B3A] transition group-hover:bg-[#172B3A] group-hover:text-white">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. HOW IT WORKS (3 Architectural Steps)
      ====================================================================== */}
      <section className="py-20 bg-[#F7F4ED]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              02 · Architectural Workflow
            </span>
            <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
              From existing photograph to architectural clarity in three steps.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {[
              {
                step: "01",
                icon: UploadCloud,
                title: "Upload your existing space.",
                desc: "Drop any room photograph, building exterior, backyard, hand-drawn sketch, or 2D floor plan (JPG, PNG, WebP).",
              },
              {
                step: "02",
                icon: Paintbrush,
                title: "Choose your preferred design and customization.",
                desc: "Select from 15 architectural styles, adjust intervention level, swap individual furniture, materials, or sky atmosphere.",
              },
              {
                step: "03",
                icon: Sparkles,
                title: "Generate and explore your redesigned space.",
                desc: "Compare multiple variations with an interactive Before/After slider, discover matching furniture, and estimate renovation budgets.",
              },
            ].map((item) => (
              <div key={item.step} className="editorial-card relative p-8">
                <div className="flex items-center justify-between">
                  <span className="font-editorial text-4xl font-semibold text-[#DCCBB5]">{item.step}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#172B3A] text-[#F7F4ED]">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mt-6 font-editorial text-xl font-semibold text-[#172B3A]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#252B2E]/75">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. DESIGN TOOLS SHOWCASE + DEDICATED MODULES
      ====================================================================== */}
      <section className="py-20 bg-[#172B3A] text-[#F7F4ED]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
                03 · Intelligent Studio Suite
              </span>
              <h2 className="mt-2 font-editorial text-3xl font-semibold text-white sm:text-4xl">
                Ten specialized design instruments.
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!requireAuth("/studio", "open the Design Studio suite")) return;
                navigate("/studio");
              }}
              className="btn-terracotta self-start"
            >
              Open Design Studio
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            {/* Left Tool Selector */}
            <div className="grid gap-2 sm:grid-cols-2 lg:col-span-7">
              {STUDIO_FEATURES.map((tool, i) => (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => setActiveToolIdx(i)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    activeToolIdx === i
                      ? "border-[#C87960] bg-white/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/25"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white">{tool.label}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[#C87960]">{tool.short}</span>
                  </div>
                  <p className="mt-1 text-xs text-[#F7F4ED]/70">{tool.desc}</p>
                </button>
              ))}
            </div>

            {/* Right Active Tool Spotlight */}
            <div className="rounded-3xl border border-white/15 bg-[#F7F4ED] p-6 text-[#252B2E] lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#C87960]">
                  <Wand2 className="h-4 w-4" /> Active Instrument
                </div>
                <h3 className="mt-2 font-editorial text-2xl font-semibold text-[#172B3A]">
                  {activeTool.label}
                </h3>
                <p className="mt-2 text-sm text-[#252B2E]/75">{activeTool.desc}</p>
                <div className="mt-5 overflow-hidden rounded-2xl border border-[#DCCBB5]">
                  <img
                    src={
                      activeTool.id === "exterior_design" || activeTool.id === "sky_weather"
                        ? "/images/exterior-after.jpg"
                        : activeTool.id === "garden_landscape"
                        ? "/images/garden-after.jpg"
                        : activeTool.id === "virtual_staging"
                        ? "/images/staged-room.jpg"
                        : activeTool.id === "sketch_to_render"
                        ? "/images/sketch-sample.jpg"
                        : "/images/hero-after.jpg"
                    }
                    alt={activeTool.label}
                    className="h-56 w-full object-cover"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <span className="text-xs text-[#252B2E]/65">Includes Object Detection & Variations</span>
                <button
                  type="button"
                  onClick={() => {
                    const target = `/studio?feature=${activeTool.id}`;
                    if (!requireAuth(target, `launch the ${activeTool.label} instrument`)) return;
                    navigate(target);
                  }}
                  className="btn-primary py-2.5 text-xs"
                >
                  Launch Tool
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Companion Modules */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { to: "/video-walkthrough", icon: Film, title: "Video Walkthrough", desc: "Animate renders with smooth camera pan & zoom." },
              { to: "/floor-plans", icon: Layers, title: "Floor Plan Generator", desc: "Convert 2D blueprints into furnished 3D cutaways." },
              { to: "/furniture-finder", icon: ShoppingBag, title: "Furniture Finder", desc: "Identify & source matching furnishings." },
              { to: "/budget-estimator", icon: Calculator, title: "Budget Estimator", desc: "Compare materials, labour & finish costs." },
            ].map((mod) => (
              <button
                key={mod.to}
                type="button"
                onClick={() => {
                  if (!requireAuth(mod.to, `access the ${mod.title} module`)) return;
                  navigate(mod.to);
                }}
                className="group text-left rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:border-[#C87960] hover:bg-white/10"
              >
                <mod.icon className="h-6 w-6 text-[#C87960]" />
                <h4 className="mt-3 font-editorial text-lg font-medium text-white group-hover:text-[#DCCBB5]">
                  {mod.title}
                </h4>
                <p className="mt-1 text-xs text-[#F7F4ED]/70">{mod.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          5. BEFORE & AFTER TRANSFORMATIONS
      ====================================================================== */}
      <section className="py-20 bg-white border-b border-[#DCCBB5]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              04 · Spatial Transformations
            </span>
            <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
              Before & After Architectural Studies
            </h2>
            <p className="mt-2 text-sm text-[#252B2E]/75">
              Inspect how FormaSpace preserves structural envelopes across interiors, facades, gardens, and empty apartments.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {BEFORE_AFTER_SHOWCASE.map((item, idx) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActiveShowcaseIdx(idx)}
                className={`rounded-full px-5 py-2 text-xs font-medium transition ${
                  activeShowcaseIdx === idx
                    ? "bg-[#172B3A] text-white"
                    : "border border-[#DCCBB5] bg-[#F7F4ED] text-[#252B2E] hover:border-[#C87960]"
                }`}
              >
                {item.title}
              </button>
            ))}
          </div>

          <div className="mt-8 grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <BeforeAfterSlider
                beforeSrc={activeShowcase.before}
                afterSrc={activeShowcase.after}
                beforeLabel="Before Renovation"
                afterLabel={`${activeShowcase.style} · After`}
                className="aspect-[16/10]"
              />
            </div>
            <div className="editorial-card p-7 lg:col-span-4">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C87960]">
                {activeShowcase.category}
              </span>
              <h3 className="mt-2 font-editorial text-2xl font-semibold text-[#172B3A]">
                {activeShowcase.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[#252B2E]/80">{activeShowcase.note}</p>
              <div className="mt-5 rounded-xl bg-[#F7F4ED] p-3.5 text-xs text-[#172B3A]">
                <strong>Style Applied:</strong> {activeShowcase.style}
              </div>
              <button
                type="button"
                onClick={() => {
                  const target = `/studio?sample=${encodeURIComponent(activeShowcase.before)}&style=${encodeURIComponent(
                    activeShowcase.style
                  )}`;
                  if (!requireAuth(target, `try the ${activeShowcase.title} transformation`)) return;
                  navigate(target);
                }}
                className="btn-primary mt-6 w-full justify-center"
              >
                Try This Transformation
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. DESIGN INSPIRATION GALLERY (All 15 Styles)
      ====================================================================== */}
      <section id="inspirations" className="py-20 bg-[#F7F4ED]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
                05 · Architectural Aesthetic Library
              </span>
              <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
                Design Inspiration Gallery
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[#252B2E]/75">
                Explore 15 curated interior and exterior design movements—each engineered with authentic material palettes and lighting direction.
              </p>
            </div>
            <Link to="/explore" className="btn-secondary self-start text-xs">
              View Full Style Archive
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DESIGN_STYLES.map((st) => (
              <div
                key={st.name}
                className="editorial-card group overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={st.image}
                      alt={st.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-[#172B3A]/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#F7F4ED]">
                      {st.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">{st.name}</h3>
                      <div className="flex -space-x-1">
                        {st.palette.map((hex) => (
                          <span
                            key={hex}
                            className="h-4 w-4 rounded-full border border-white shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#252B2E]/75">{st.summary}</p>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => {
                      const target = `/studio?style=${encodeURIComponent(st.name)}`;
                      if (!requireAuth(target, `apply the ${st.name} architectural style`)) return;
                      navigate(target);
                    }}
                    className="w-full rounded-full border border-[#DCCBB5] bg-[#F7F4ED] py-2 text-xs font-medium text-[#172B3A] transition hover:bg-[#172B3A] hover:text-white"
                  >
                    Apply {st.name} in Studio
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          7. FEATURED ARCHITECTURE PROJECTS (Asymmetrical Spread)
      ====================================================================== */}
      <section className="py-20 bg-white border-y border-[#DCCBB5]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              06 · Featured Commissions
            </span>
            <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
              Featured Architecture Projects
            </h2>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-12">
            <div className="editorial-card overflow-hidden lg:col-span-7">
              <img src="/images/exterior-after.jpg" alt="Villa Solis" className="h-80 w-full object-cover" />
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-[#C87960] font-semibold uppercase tracking-wider">
                  <Building2 className="h-4 w-4" /> Exterior Facade & Landscaping
                </div>
                <h3 className="mt-2 font-editorial text-2xl font-semibold text-[#172B3A]">
                  Villa Solis · Honed Limestone & Cedar Residence
                </h3>
                <p className="mt-2 text-sm text-[#252B2E]/75">
                  Reimagined a dated 1990s stucco residence into a cantilevered architectural pavilion with warm cedar louvers and golden-hour illumination.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5">
              <div className="editorial-card overflow-hidden flex-1">
                <img src="/images/garden-after.jpg" alt="Olive Courtyard" className="h-44 w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-[#9BAE9A] font-semibold uppercase tracking-wider">
                    <Trees className="h-4 w-4" /> Garden & Plunge Pool
                  </div>
                  <h3 className="mt-1 font-editorial text-xl font-semibold text-[#172B3A]">
                    Santa Barbara Travertine Courtyard
                  </h3>
                  <p className="mt-1 text-xs text-[#252B2E]/75">
                    Sunken firepit conversation lounge, plunge pool, and Mediterranean olive canopy.
                  </p>
                </div>
              </div>

              <div className="editorial-card overflow-hidden flex-1">
                <img src="/images/floorplan-3d.jpg" alt="3D Isometric Residence" className="h-44 w-full object-cover" />
                <div className="p-5">
                  <div className="flex items-center gap-2 text-xs text-[#C87960] font-semibold uppercase tracking-wider">
                    <Layers className="h-4 w-4" /> 2D-to-3D Floor Plan
                  </div>
                  <h3 className="mt-1 font-editorial text-xl font-semibold text-[#172B3A]">
                    Tribeca Loft Spatial Cutaway
                  </h3>
                  <p className="mt-1 text-xs text-[#252B2E]/75">
                    Full two-bedroom circulation study generated directly from an architectural CAD blueprint.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. TESTIMONIALS
      ====================================================================== */}
      <section className="py-20 bg-[#F7F4ED]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              07 · Studio Voices
            </span>
            <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A]">
              Trusted by architects, stagers & homeowners
            </h2>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.author} className="editorial-card flex flex-col justify-between p-7">
                <p className="font-editorial text-lg italic leading-relaxed text-[#172B3A]">
                  “{t.quote}”
                </p>
                <footer className="mt-6 border-t border-[#DCCBB5]/60 pt-4">
                  <div className="text-sm font-semibold text-[#172B3A]">{t.author}</div>
                  <div className="text-xs text-[#252B2E]/65">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. FREQUENTLY ASKED QUESTIONS
      ====================================================================== */}
      <section className="py-20 bg-white border-t border-[#DCCBB5]/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              08 · Questions & Answers
            </span>
            <h2 className="mt-2 font-editorial text-3xl font-semibold text-[#172B3A]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="mt-10 space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={faq.q} className="editorial-card overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left"
                  >
                    <span className="font-medium text-sm sm:text-base text-[#172B3A]">{faq.q}</span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-[#C87960] transition-transform ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="border-t border-[#DCCBB5]/50 px-6 py-4 text-sm leading-relaxed text-[#252B2E]/80">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
