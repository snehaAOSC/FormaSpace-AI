import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Check, ExternalLink, Eye, Info, Search, ShoppingBag, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DESIGN_STYLES } from "../data/catalog";
import { api } from "../lib/api";
import type { DetectedObject, FurnitureProduct } from "../types";
import { ProductQuickViewModal, type ProductDetailData } from "../components/ProductQuickViewModal";
import { getDirectRetailerUrl } from "../lib/retailerUrls";

export const FurnitureFinderPage: React.FC = () => {
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();

  const [imageUrl] = useState(searchParams.get("image") || "/images/hero-after.jpg");
  const [style, setStyle] = useState(searchParams.get("style") || "");
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<FurnitureProduct[]>([]);
  const [detected, setDetected] = useState<DetectedObject[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<ProductDetailData | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (style) qs.set("style", style);
    if (category !== "All") qs.set("category", category);
    qs.set("image_url", imageUrl);
    qs.set("room_type", searchParams.get("room") || "Living Room");

    api
      .get<{ products: FurnitureProduct[]; detected_objects: DetectedObject[]; catalog_notice: string }>(
        `/api/modules/furniture/discover?${qs.toString()}`
      )
      .then((res) => {
        setProducts(res.products);
        setDetected(res.detected_objects);
        setNotice(res.catalog_notice);
      })
      .catch(() => { });
  }, [style, category, imageUrl, searchParams]);

  const handleSaveItem = async (p: FurnitureProduct) => {
    if (!user) {
      alert("Please sign in to save items to your Furniture Collection.");
      return;
    }
    try {
      await api.post("/api/modules/furniture/collection", {
        product_id: p.product_id,
        product_name: p.product_name,
        category: p.category,
        material: p.material,
        approx_price: p.approx_price,
        image_url: p.image_url,
        product_url: p.product_url,
      });
      setSavedIds((prev) => new Set(prev).add(p.product_id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = products.filter(
    (p) =>
      !search.trim() ||
      p.product_name.toLowerCase().includes(search.toLowerCase()) ||
      p.material.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Context Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/studio?sample=${encodeURIComponent(searchParams.get("sample") || "")}&style=${encodeURIComponent(style || "")}&category=${encodeURIComponent(searchParams.get("room") || "")}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#DCCBB5] bg-white px-4 py-2 text-xs font-semibold text-[#172B3A] shadow-sm hover:border-[#C87960] hover:text-[#C87960] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to AI Studio
          </Link>
          <div className="text-xs text-[#252B2E]/60">
            Active Space: <strong className="text-[#172B3A]">{searchParams.get("room") || "Room"}</strong> · Style: <strong className="text-[#C87960]">{style || "Modern Luxury"}</strong>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
              Furniture Finder & Curated Catalog
            </h1>
          </div>
          {!user && (
            <button
              type="button"
              onClick={() => login("studio@formaspace.ai", "FormaSpace2026!")}
              className="btn-terracotta text-xs self-start"
            >
              <Sparkles className="h-3.5 w-3.5" /> Quick Demo Login to Save Collection
            </button>
          )}
        </div>



        {/* Analyzed Design + Detected Elements */}
        <div className="mt-6 editorial-card grid gap-6 p-5 lg:grid-cols-12 items-center">
          <div className="lg:col-span-4">
            <img src={imageUrl} alt="Analyzed Design" className="h-44 w-full rounded-xl object-cover" />
          </div>
          <div className="lg:col-span-8 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#C87960]">
              AI Identified Pieces in This Space
            </div>
            <div className="flex flex-wrap gap-2">
              {detected.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setCategory(d.label)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${category === d.label
                      ? "border-[#172B3A] bg-[#172B3A] text-white"
                      : "border-[#DCCBB5] bg-[#F7F4ED] text-[#172B3A] hover:border-[#C87960]"
                    }`}
                >
                  {d.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCategory("All")}
                className="rounded-full border border-[#DCCBB5] px-3.5 py-1.5 text-xs text-[#252B2E]/70 hover:bg-white"
              >
                Show All Categories
              </button>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#252B2E]/40" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by piece or material (travertine, bouclé, oak)..."
                  className="w-full rounded-full border border-[#DCCBB5] bg-[#F7F4ED]/60 py-2 pl-10 pr-4 text-xs text-[#172B3A]"
                />
              </div>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="rounded-full border border-[#DCCBB5] bg-[#F7F4ED]/60 px-4 py-2 text-xs text-[#172B3A]"
              >
                <option value="">All Styles</option>
                {DESIGN_STYLES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AI Recommended Design Options for this Space */}
        {(() => {
          const room = searchParams.get("room") || "Living Room";
          const rLower = room.toLowerCase();
          const imgLower = (imageUrl || "").toLowerCase();

          let recs = [];
          if (rLower.includes("bed") || imgLower.includes("bed")) {
            recs = [
              {
                title: "Modern Luxury Suite",
                styleName: "Modern Luxury",
                img: "/images/bedroom-after.jpg",
                desc: "Low white oak bed, Belgian bouclé & fluted oak millwork.",
              },
              {
                title: "Japandi Sanctuary",
                styleName: "Japandi",
                img: "/images/bedroom-after-japandi.jpg",
                desc: "Hinoki platform bed, rice paper lighting & raw oat linen.",
              },
            ];
          } else if (rLower.includes("exterior") || imgLower.includes("exterior")) {
            recs = [
              {
                title: "Contemporary Villa",
                styleName: "Contemporary",
                img: "/images/exterior-after.jpg",
                desc: "Vertical charred timber battens & basalt stone facade.",
              },
            ];
          } else if (rLower.includes("garden") || imgLower.includes("garden") || rLower.includes("patio")) {
            recs = [
              {
                title: "Mediterranean Courtyard",
                styleName: "Mediterranean",
                img: "/images/garden-after.jpg",
                desc: "Roman travertine coping, plunge pool & olive trees.",
              },
            ];
          } else if (imgLower.includes("empty-room") || imgLower.includes("staged-room")) {
            recs = [
              {
                title: "Tailored Virtual Staging",
                styleName: "Contemporary",
                img: "/images/staged-room.jpg",
                desc: "Curated cognac leather seating, textured woven rug & architectural shelving.",
              },
            ];
          } else if (imgLower.startsWith("/storage/") || imgLower.startsWith("blob:") || imgLower.startsWith("data:")) {
            recs = [
              {
                title: `${room} · Modern Luxury`,
                styleName: "Modern Luxury",
                img: imageUrl,
                desc: `Modern Luxury architectural redesign of your ${room}.`,
              },
            ];
          } else {
            recs = [
              {
                title: "Modern Luxury Salon",
                styleName: "Modern Luxury",
                img: "/images/hero-after.jpg",
                desc: "Curved bouclé sofa, honed travertine & architectural light.",
              },
              {
                title: "Contemporary Staging",
                styleName: "Contemporary",
                img: "/images/staged-room.jpg",
                desc: "Cognac leather seating, neutral wool rug & balanced proportion.",
              },
            ];
          }

          // Strict deduplication: Each unique design image is shown once, never repeated
          const uniqueRecs = recs.filter((item, idx, self) => idx === self.findIndex((t) => t.img === item.img));

          return (
            <div className="mt-6 editorial-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C87960]" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
                    AI Recommended Design Options for this Space
                  </h3>
                </div>
                <span className="text-xs text-[#252B2E]/65">
                  Click any style to apply and re-open in AI Studio
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {uniqueRecs.map((rec) => (
                  <div
                    key={rec.title}
                    className="group relative overflow-hidden rounded-xl border border-[#DCCBB5] bg-white p-3 hover:border-[#C87960] transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/10] overflow-hidden rounded-lg mb-2 bg-[#252B2E]">
                        <img src={rec.img} alt={rec.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                      </div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">{rec.styleName}</div>
                      <div className="text-xs font-semibold text-[#172B3A] mt-0.5">{rec.title}</div>
                      <p className="mt-1 text-[11px] text-[#252B2E]/70 line-clamp-2">{rec.desc}</p>
                    </div>
                    <Link
                      to={`/studio?sample=${encodeURIComponent(searchParams.get("sample") || "")}&style=${encodeURIComponent(rec.styleName)}&category=${encodeURIComponent(room)}`}
                      className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#DCCBB5] bg-[#F7F4ED] py-1.5 text-xs font-medium text-[#172B3A] hover:bg-[#C87960] hover:text-white transition"
                    >
                      <Sparkles className="h-3 w-3" /> Apply in Studio
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Product Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => {
            const isSaved = savedIds.has(p.product_id);
            const directUrl = getDirectRetailerUrl(p);
            return (
              <div key={p.product_id} className="editorial-card flex flex-col justify-between overflow-hidden">
                <div>
                  <div
                    onClick={() =>
                      setQuickViewProduct({
                        product_id: p.product_id,
                        product_name: p.product_name,
                        brand: p.brand || "Authorized Retailer",
                        image_url: p.image_url,
                        product_url: p.product_url,
                        material: p.material,
                        price: `~$${p.approx_price.toLocaleString()}`,
                        price_num: p.approx_price,
                        category: p.category,
                        style: p.style,
                        availability: "In Stock · Verified Authentic",
                      })
                    }
                    className="relative aspect-[4/3] overflow-hidden block cursor-pointer group/ffimg"
                    title={`View details for ${p.product_name}`}
                  >
                    <img src={p.image_url} alt={p.product_name} className="h-full w-full object-cover transition duration-300 group-hover/ffimg:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-[#172B3A]/90 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                      {p.category}
                    </span>
                    {p.match_score && (
                      <span className="absolute right-3 top-3 rounded-full bg-[#9BAE9A] px-2.5 py-0.5 text-[10px] font-semibold text-[#172B3A]">
                        {p.match_score} Match
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="text-[11px] font-medium text-[#C87960]">{p.style}</div>
                    <button
                      type="button"
                      onClick={() =>
                        setQuickViewProduct({
                          product_id: p.product_id,
                          product_name: p.product_name,
                          brand: p.brand || "Authorized Retailer",
                          image_url: p.image_url,
                          product_url: p.product_url,
                          material: p.material,
                          price: `~$${p.approx_price.toLocaleString()}`,
                          price_num: p.approx_price,
                          category: p.category,
                          style: p.style,
                          availability: "In Stock · Verified Authentic",
                        })
                      }
                      className="mt-0.5 font-editorial text-lg font-semibold text-[#172B3A] hover:text-[#C87960] transition block text-left w-full"
                    >
                      {p.product_name}
                    </button>
                    <p className="mt-1 text-xs text-[#252B2E]/70">{p.material}</p>
                    <div className="mt-3 text-base font-semibold text-[#172B3A]">
                      ~${p.approx_price.toLocaleString()}
                    </div>
                    {p.alternatives && p.alternatives.length > 0 && (
                      <div className="mt-3 border-t border-[#DCCBB5]/60 pt-2.5">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#252B2E]/60">
                          Similar Alternatives
                        </div>
                        <ul className="mt-1 space-y-0.5 text-[11px] text-[#252B2E]/80">
                          {p.alternatives.map((alt) => (
                            <li key={alt}>• {alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleSaveItem(p)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-xs font-medium transition ${isSaved
                        ? "bg-[#9BAE9A]/30 text-[#172B3A]"
                        : "bg-[#172B3A] text-white hover:bg-[#C87960]"
                      }`}
                  >
                    {isSaved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                    {isSaved ? "Saved" : "Save"}
                  </button>
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1 rounded-full border border-[#DCCBB5] px-3 py-2 text-xs font-medium text-[#172B3A] hover:border-[#172B3A] hover:bg-[#F7F4ED] transition"
                    title={`Open exact ${p.product_name} on original store`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* In-Website Product Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

