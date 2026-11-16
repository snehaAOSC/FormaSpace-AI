import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DESIGN_CATEGORIES, DESIGN_STYLES } from "../data/catalog";

export const ExploreDesignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const filteredStyles = DESIGN_STYLES.filter(
    (s) =>
      !query.trim() ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.summary.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCats =
    catFilter === "All"
      ? DESIGN_CATEGORIES
      : DESIGN_CATEGORIES.filter((c) => c.group === catFilter);

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C87960]">
              Architectural Library
            </span>
            <h1 className="mt-1 font-editorial text-4xl font-semibold text-[#172B3A]">
              Explore Designs & Spatial Movements
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#252B2E]/75">
              Browse all 15 architectural style directions and 13 interior, exterior, and landscape typologies. Launch any aesthetic straight inside AI Studio.
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-3 h-4 w-4 text-[#252B2E]/40" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search styles (Japandi, Art Deco, Oak...)"
              className="w-full rounded-full border border-[#DCCBB5] bg-white py-2.5 pl-11 pr-4 text-sm text-[#172B3A]"
            />
          </div>
        </div>

        {/* 15 Styles */}
        <section>
          <h2 className="font-editorial text-2xl font-semibold text-[#172B3A] mb-6">
            15 Curated Architectural Styles
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStyles.map((st) => (
              <div key={st.name} className="editorial-card overflow-hidden flex flex-col justify-between">
                <div>
                  <img src={st.image} alt={st.name} className="h-52 w-full object-cover" />
                  <div className="p-5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">
                        {st.tag}
                      </span>
                      <div className="flex -space-x-1">
                        {st.palette.map((hex) => (
                          <span key={hex} className="h-3.5 w-3.5 rounded-full border border-white" style={{ backgroundColor: hex }} />
                        ))}
                      </div>
                    </div>
                    <h3 className="mt-1 font-editorial text-xl font-semibold text-[#172B3A]">{st.name}</h3>
                    <p className="mt-2 text-xs text-[#252B2E]/75">{st.summary}</p>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => {
                      const target = `/studio?style=${encodeURIComponent(st.name)}`;
                      if (!requireAuth(target, `apply the ${st.name} style in Studio`)) return;
                      navigate(target);
                    }}
                    className="btn-secondary w-full justify-center py-2 text-xs"
                  >
                    Open in AI Studio <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 13 Categories */}
        <section className="border-t border-[#DCCBB5] pt-12">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="font-editorial text-2xl font-semibold text-[#172B3A]">
              13 Space Categories
            </h2>
            <div className="flex flex-wrap gap-2">
              {["All", "Interior", "Exterior", "Outdoor", "Commercial"].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setCatFilter(g)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium ${
                    catFilter === g ? "bg-[#172B3A] text-white" : "border border-[#DCCBB5] bg-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCats.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  const target = `/studio?category=${encodeURIComponent(c.name)}`;
                  if (!requireAuth(target, `open the ${c.name} design studio`)) return;
                  navigate(target);
                }}
                className="editorial-card overflow-hidden text-left group"
              >
                <img src={c.image} alt={c.name} className="h-36 w-full object-cover group-hover:scale-105 transition duration-500" />
                <div className="p-4">
                  <div className="text-[10px] font-semibold uppercase text-[#C87960]">{c.group}</div>
                  <div className="font-editorial text-lg font-semibold text-[#172B3A]">{c.name}</div>
                  <div className="text-xs text-[#252B2E]/65">{c.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
