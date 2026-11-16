import React, { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  Filter,
  Info,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import { api } from "../lib/api";
import { ProductQuickViewModal, type ProductDetailData } from "./ProductQuickViewModal";
import { getDirectRetailerUrl } from "../lib/retailerUrls";

export interface DetectedFurnitureItem {
  id: string;
  label: string;
  category: string;
  color: string;
  furniture_style: string;
  material: string;
  shape_design: string;
  approx_dimensions: string;
  visual_description: string;
  confidence: number;
  bounding_box?: number[];
}

export interface MatchingProduct {
  product_id: string;
  product_name: string;
  category: string;
  brand: string;
  price: string;
  price_num: number;
  currency: string;
  image_url: string;
  product_url: string;
  description: string;
  dimensions?: string;
  availability?: string;
  last_verified?: string;
  is_similar: boolean;
  match_score: number;
  style?: string;
  color?: string;
  material?: string;
  matched_to_detection_id?: string;
}

interface SmartFurnitureCostEstimatorProps {
  generatedImageUrl: string;
  roomType: string;
  designStyle: string;
}

export const SmartFurnitureCostEstimator: React.FC<SmartFurnitureCostEstimatorProps> = ({
  generatedImageUrl,
  roomType,
  designStyle,
}) => {
  const [currency, setCurrency] = useState<"INR" | "USD">("INR");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [detectedItems, setDetectedItems] = useState<DetectedFurnitureItem[]>([]);
  const [matchingByCategory, setMatchingByCategory] = useState<Record<string, MatchingProduct[]>>({});
  const [selectedProductByCat, setSelectedProductByCat] = useState<Record<string, MatchingProduct>>({});
  const [activeDetectedItem, setActiveDetectedItem] = useState<DetectedFurnitureItem | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [selectedItemId, setSelectedItemId] = useState<string | "all">("all");

  // In-Website Product Quick View Modal State
  const [quickViewProduct, setQuickViewProduct] = useState<ProductDetailData | null>(null);

  const analyzeRoom = async (curr: "INR" | "USD" = currency) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post<any>("/api/modules/smart-estimator/analyze", {
        image_url: generatedImageUrl || "/images/bedroom-after.jpg",
        room_type: roomType || "Bedroom",
        style: designStyle || "Modern Luxury",
        currency: curr,
      });

      if (res && res.detected_furniture) {
        setDetectedItems(res.detected_furniture);
        setMatchingByCategory(res.matching_products_by_category || {});

        // Build selected products mapping, preserving user selections if already chosen
        setSelectedProductByCat((prev) => {
          const updated: Record<string, MatchingProduct> = {};
          const isInitial = Object.keys(prev).length === 0;
          res.detected_furniture.forEach((item: DetectedFurnitureItem) => {
            const matches: MatchingProduct[] = res.matching_products_by_category?.[item.id] || [];
            if (matches.length > 0) {
              if (!isInitial && prev[item.id] === undefined) {
                // Item was explicitly removed by customer, keep it excluded
                return;
              }
              const prevSelectedId = prev[item.id]?.product_id;
              const matchedPrev = matches.find((m: MatchingProduct) => m.product_id === prevSelectedId);
              updated[item.id] = matchedPrev || matches[0];
            }
          });
          return updated;
        });
        if (res.detected_furniture.length > 0) {
          setActiveDetectedItem(res.detected_furniture[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze AI-generated room. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeRoom(currency);
  }, [generatedImageUrl, roomType, designStyle, currency]);

  // Format currency helper
  const fmtPrice = (num: number) => {
    if (currency === "INR") {
      return `₹${Math.round(num).toLocaleString("en-IN")}`;
    }
    return `$${Math.round(num).toLocaleString()}`;
  };

  // Calculate total room cost based strictly on sum of selected products
  const selectedProductsList = Object.values(selectedProductByCat);
  const totalEstimatedCost = selectedProductsList.reduce((acc, p) => acc + (p?.price_num || 0), 0);

  // Select alternative product for a specific detected item
  const handleSelectProduct = (detectedId: string, product: MatchingProduct) => {
    setSelectedProductByCat((prev) => ({
      ...prev,
      [detectedId]: product,
    }));
  };

  // Remove an item from the estimate
  const handleRemoveItem = (detectedId: string) => {
    setSelectedProductByCat((prev) => {
      const copy = { ...prev };
      delete copy[detectedId];
      return copy;
    });
  };

  // Unique categories for filtering
  const allCategories = ["All", ...Array.from(new Set(detectedItems.map((d) => d.category)))];
  const allBrands = [
    "All",
    ...Array.from(
      new Set(
        Object.values(matchingByCategory)
          .flat()
          .map((p) => p.brand)
      )
    ),
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner & Currency Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DCCBB5] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C87960]/10 text-[#C87960]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#172B3A]">
              Smart Furniture Cost Estimator
            </h2>
            <p className="text-xs text-[#252B2E]/65">
              Analyzes the active AI-generated room, identifies furniture, and finds real matching retailer products.
            </p>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex items-center gap-1.5 rounded-full border border-[#DCCBB5] bg-[#F7F4ED] p-1">
          <button
            type="button"
            onClick={() => setCurrency("INR")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${currency === "INR"
              ? "bg-[#172B3A] text-white shadow-sm"
              : "text-[#252B2E]/70 hover:text-[#172B3A]"
              }`}
          >
            INR (₹)
          </button>
          <button
            type="button"
            onClick={() => setCurrency("USD")}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${currency === "USD"
              ? "bg-[#172B3A] text-white shadow-sm"
              : "text-[#252B2E]/70 hover:text-[#172B3A]"
              }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {loading && (
        <div className="editorial-card flex flex-col items-center justify-center p-14 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C87960]" />
          <h3 className="mt-4 font-editorial text-xl font-semibold text-[#172B3A]">
            Analyzing AI Designed Room...
          </h3>
          <p className="mt-1 text-xs text-[#252B2E]/65 max-w-md">
            Scanning visual geometry, segmenting furniture silhouettes, and querying authorized retailer product catalogs for real matches.
          </p>
        </div>
      )}

      {error && !loading && (
        <div className="editorial-card border-red-300 bg-red-50/50 p-6 text-center">
          <p className="text-sm text-red-800">{error}</p>
          <button
            type="button"
            onClick={() => analyzeRoom(currency)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#172B3A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#C87960] transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Analysis
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* SECTION A: GENERATED ROOM PREVIEW & SECTION B: DETECTED FURNITURE (2 Columns on large screens) */}
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Section A: Generated Room Preview */}
            <div className="editorial-card p-5 lg:col-span-6 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#172B3A] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      AI Designed Room
                    </span>
                    <span className="text-xs text-[#252B2E]/65">
                      {roomType} · {designStyle}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#C87960] font-medium">
                    Actual Generated Image
                  </span>
                </div>

                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#252B2E] border border-[#DCCBB5] group">
                  <img
                    src={generatedImageUrl || "/images/bedroom-after.jpg"}
                    alt="AI Designed Room"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-102"
                  />
                  {/* Bounding box overlay for selected detected item */}
                  {activeDetectedItem?.bounding_box && (
                    <div
                      className="absolute rounded border-2 border-[#C87960] bg-[#C87960]/20 pointer-events-none transition-all duration-300"
                      style={{
                        left: `${activeDetectedItem.bounding_box[0]}%`,
                        top: `${activeDetectedItem.bounding_box[1]}%`,
                        width: `${activeDetectedItem.bounding_box[2]}%`,
                        height: `${activeDetectedItem.bounding_box[3]}%`,
                      }}
                    >
                      <span className="absolute -top-6 left-0 rounded bg-[#C87960] px-2 py-0.5 text-[10px] font-bold text-white shadow">
                        {activeDetectedItem.label}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-[#F7F4ED] p-3 text-xs text-[#252B2E]/75 flex items-center justify-between">
                <div>
                  <strong className="text-[#172B3A]">AI Visual Analysis Complete:</strong>{" "}
                  {detectedItems.length} individual interior pieces identified in this perspective.
                </div>
              </div>
            </div>

            {/* Section B: Detected Furniture */}
            <div className="editorial-card p-5 lg:col-span-6 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-[#DCCBB5]/60 pb-3">
                  <div>
                    <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">
                      Detected Furniture
                    </h3>
                    <p className="text-xs text-[#252B2E]/65">
                      {detectedItems.length} items detected. Click any item to inspect its AI extracted specs.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#C87960]/15 px-3 py-1 text-xs font-bold text-[#C87960]">
                    {detectedItems.length} Items
                  </span>
                </div>

                {/* Detected Item Pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {detectedItems.map((item) => {
                    const isActive = (selectedItemId === "all" ? activeDetectedItem?.id === item.id : selectedItemId === item.id);
                    const hasSelected = Boolean(selectedProductByCat[item.id]);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveDetectedItem(item);
                          setSelectedItemId(item.id);
                          document.getElementById("matching-products-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition ${isActive
                          ? "border-[#172B3A] bg-[#172B3A] text-white shadow-sm ring-2 ring-[#C87960]"
                          : hasSelected
                            ? "border-[#DCCBB5] bg-white text-[#172B3A] hover:border-[#C87960]"
                            : "border-dashed border-[#DCCBB5] bg-white/60 text-[#252B2E]/50 line-through"
                          }`}
                      >
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Detected Item Specification Card */}
                {activeDetectedItem && (
                  <div className="mt-4 rounded-2xl border border-[#DCCBB5] bg-[#F7F4ED]/80 p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#C87960]">
                        {activeDetectedItem.category} · Detected Spec
                      </span>
                      <span className="text-xs font-medium text-[#252B2E]/60">
                        AI Verified Match
                      </span>
                    </div>

                    <h4 className="font-editorial text-lg font-bold text-[#172B3A]">
                      {activeDetectedItem.label}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[#252B2E]/60">Color:</span>{" "}
                        <strong className="text-[#172B3A]">{activeDetectedItem.color}</strong>
                      </div>
                      <div>
                        <span className="text-[#252B2E]/60">Style:</span>{" "}
                        <strong className="text-[#172B3A]">{activeDetectedItem.furniture_style}</strong>
                      </div>
                      <div>
                        <span className="text-[#252B2E]/60">Material:</span>{" "}
                        <strong className="text-[#172B3A]">{activeDetectedItem.material}</strong>
                      </div>
                      <div>
                        <span className="text-[#252B2E]/60">Dimensions:</span>{" "}
                        <strong className="text-[#172B3A]">{activeDetectedItem.approx_dimensions}</strong>
                      </div>
                    </div>

                    <p className="text-xs text-[#252B2E]/75 italic border-t border-[#DCCBB5]/40 pt-2">
                      "{activeDetectedItem.visual_description}"
                    </p>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-[#252B2E]/60">
                * AI detects silhouettes and aesthetic finishes from the rendered room image. Matching products from real furniture retailers are queried below.
              </div>
            </div>
          </div>

          {/* SECTION C: MATCHING PRODUCTS */}
          <div id="matching-products-section" className="editorial-card p-6 space-y-6 scroll-mt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCCBB5]/60 pb-5">
              <div>
                <h3 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                  Matching Real Furniture Products
                </h3>
                <p className="text-xs text-[#252B2E]/65">
                  Real, purchasable furniture matching each detected item. Click <strong>View Product / Buy Now</strong> to visit the retailer's official website.
                </p>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs text-[#252B2E]">
                  <Filter className="h-3.5 w-3.5 text-[#C87960]" />
                  <span>Category:</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-transparent font-medium text-[#172B3A] outline-none cursor-pointer"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 rounded-full border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs text-[#252B2E]">
                  <span>Retailer:</span>
                  <select
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="bg-transparent font-medium text-[#172B3A] outline-none cursor-pointer"
                  >
                    {allBrands.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Item Filter Navigation Strip */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#F7F4ED] p-3 border border-[#DCCBB5]/60">
              <span className="text-xs font-semibold text-[#172B3A] mr-1">Filter by Detected Piece:</span>
              <button
                type="button"
                onClick={() => setSelectedItemId("all")}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  selectedItemId === "all"
                    ? "bg-[#172B3A] text-white shadow-sm"
                    : "bg-white text-[#172B3A] border border-[#DCCBB5] hover:border-[#C87960]"
                }`}
              >
                All Detected Items ({detectedItems.length})
              </button>
              {detectedItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedItemId(item.id);
                      setActiveDetectedItem(item);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition border ${
                      isSelected
                        ? "border-[#C87960] bg-[#C87960] text-white shadow-sm ring-2 ring-[#C87960]/30"
                        : "border-[#DCCBB5] bg-white text-[#172B3A] hover:border-[#C87960]"
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {selectedItemId !== "all" && (
                <button
                  type="button"
                  onClick={() => setSelectedItemId("all")}
                  className="ml-auto text-xs font-medium text-[#C87960] hover:underline"
                >
                  Show All Items
                </button>
              )}
            </div>

            {/* Product Groups by Detected Furniture */}
            <div className="space-y-8">
              {detectedItems
                .filter((d) => (selectedItemId === "all" ? true : d.id === selectedItemId))
                .filter((d) => filterCategory === "All" || d.category === filterCategory)
                .map((detected) => {
                  const matches = (matchingByCategory[detected.id] || []).filter(
                    (p) => selectedBrand === "All" || p.brand === selectedBrand
                  );
                  const selectedProd = selectedProductByCat[detected.id];

                  if (matches.length === 0) return null;

                  return (
                    <div key={detected.id} className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-[#172B3A] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                            {detected.category}
                          </span>
                          <h4 className="font-editorial text-lg font-bold text-[#172B3A]">
                            Matches for {detected.label}
                          </h4>
                          <span className="text-xs text-[#252B2E]/60">
                            ({matches.length} similar products)
                          </span>
                        </div>

                        {selectedProd ? (
                          <div className="text-xs text-[#172B3A]">
                            Selected: <strong className="text-[#C87960]">{selectedProd.product_name}</strong> ({selectedProd.price})
                          </div>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">
                            Excluded from room total
                          </span>
                        )}
                      </div>

                      {/* Matching Product Cards Grid */}
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {matches.map((product) => {
                          const isSelected = selectedProd?.product_id === product.product_id;
                          return (
                            <div
                              key={product.product_id}
                              className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border p-4 transition ${isSelected
                                ? "border-[#172B3A] bg-white shadow-md ring-2 ring-[#172B3A]"
                                : "border-[#DCCBB5] bg-white hover:border-[#C87960]"
                                }`}
                            >
                              <div>
                                {/* Clickable Product Image Opening In-Website Quick View Modal */}
                                <div
                                  onClick={() => setQuickViewProduct(product)}
                                  className="group/img relative aspect-[4/3] overflow-hidden rounded-xl bg-[#252B2E]/5 border border-[#DCCBB5]/40 mb-3 block cursor-pointer"
                                  title={`View complete specifications for ${product.product_name}`}
                                >
                                  <img
                                    src={product.image_url}
                                    alt={product.product_name}
                                    className="h-full w-full object-cover transition duration-300 group-hover/img:scale-105"
                                  />
                                  {/* Hover Overlay with Quick View Indicator */}
                                  <div className="absolute inset-0 bg-black/0 transition duration-200 group-hover/img:bg-black/35 flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#172B3A] shadow-md backdrop-blur-sm">
                                      <Eye className="h-3.5 w-3.5 text-[#C87960]" />
                                      <span>Quick View Product</span>
                                    </span>
                                  </div>

                                  {/* Retailer & Similar Badges */}
                                  <span className="absolute top-2.5 left-2.5 rounded-full bg-[#172B3A]/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                                    {product.brand}
                                  </span>
                                  {product.is_similar && (
                                    <span className="absolute top-2.5 right-2.5 rounded-full bg-[#C87960] px-2 py-0.5 text-[9px] font-semibold text-white shadow">
                                      Similar Product
                                    </span>
                                  )}
                                  {isSelected && (
                                    <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow">
                                      <Check className="h-3 w-3" /> Selected in Cost
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">
                                      {product.category}
                                    </span>
                                    <span className="text-[10px] text-[#252B2E]/60">
                                      {product.last_verified}
                                    </span>
                                  </div>

                                  {/* Clickable Product Name Opening In-Website Quick View */}
                                  <button
                                    type="button"
                                    onClick={() => setQuickViewProduct(product)}
                                    className="font-editorial text-base font-semibold text-[#172B3A] line-clamp-1 hover:text-[#C87960] transition block text-left w-full"
                                    title={`Click to view details for ${product.product_name}`}
                                  >
                                    {product.product_name}
                                  </button>

                                  <p className="text-xs text-[#252B2E]/70 line-clamp-2 leading-relaxed">
                                    {product.description}
                                  </p>

                                  {product.dimensions && (
                                    <div className="text-[11px] text-[#252B2E]/70 pt-1">
                                      <span className="text-[#252B2E]/50">Dimensions:</span> {product.dimensions}
                                    </div>
                                  )}

                                  {product.availability && (
                                    <div className="text-[11px] font-medium text-emerald-700">
                                      • {product.availability}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 pt-3 border-t border-[#DCCBB5]/50 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-editorial text-xl font-bold text-[#172B3A]">
                                    {product.price}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectProduct(detected.id, product)}
                                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${isSelected
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-300"
                                      : "bg-[#F7F4ED] text-[#172B3A] border border-[#DCCBB5] hover:bg-[#172B3A] hover:text-white"
                                      }`}
                                  >
                                    {isSelected ? "Selected" : "Select for Cost"}
                                  </button>
                                </div>

                                {/* Dual Actions: Quick View on Website + Direct Retailer Store Deep-Link */}
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setQuickViewProduct(product)}
                                    className="inline-flex items-center justify-center gap-1 rounded-full border border-[#DCCBB5] bg-[#F7F4ED] py-2 text-xs font-medium text-[#172B3A] hover:border-[#C87960] hover:text-[#C87960] transition"
                                    title="View full specs"
                                  >
                                    <Eye className="h-3.5 w-3.5 text-[#C87960]" />
                                    <span>Details</span>
                                  </button>
                                  <a
                                    href={getDirectRetailerUrl(product)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1 rounded-full bg-[#172B3A] py-2 text-xs font-semibold text-white hover:bg-[#C87960] transition shadow-sm"
                                    title={`Open exact ${product.product_name} on ${product.brand} official website`}
                                  >
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                    <span>{product.brand.split(" ")[0]}</span>
                                    <ExternalLink className="h-3 w-3 opacity-75" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* SECTION D: ROOM COST SUMMARY */}
          <div className="editorial-card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCCBB5]/60 pb-4">
              <div>
                <h3 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                  Room Furniture Cost Summary
                </h3>
                <p className="text-xs text-[#252B2E]/65">
                  Itemized pricing of all selected products matching your AI designed room.
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs text-[#252B2E]/60 uppercase tracking-wider font-semibold">
                  Total Estimated Furniture Cost
                </div>
                <div className="font-editorial text-3xl font-bold text-[#172B3A]">
                  {fmtPrice(totalEstimatedCost)}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#DCCBB5]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#172B3A] text-white">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Product Category</th>
                    <th className="py-3 px-4 font-semibold">Selected Retailer Product</th>
                    <th className="py-3 px-4 font-semibold">Brand / Retailer</th>
                    <th className="py-3 px-4 font-semibold text-right">Selected Price</th>
                    <th className="py-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCCBB5]/60 bg-white">
                  {detectedItems.map((detected) => {
                    const selected = selectedProductByCat[detected.id];
                    return (
                      <tr key={detected.id} className="hover:bg-[#F7F4ED]/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#172B3A]">{detected.label}</div>
                          <div className="text-[10px] text-[#252B2E]/60">{detected.category}</div>
                        </td>
                        <td className="py-3 px-4">
                          {selected ? (
                            <button
                              type="button"
                              onClick={() => setQuickViewProduct(selected)}
                              className="group/tbl flex items-center gap-2.5 cursor-pointer text-left w-full"
                              title={`View full details for ${selected.product_name}`}
                            >
                              <img
                                src={selected.image_url}
                                alt={selected.product_name}
                                className="h-9 w-9 rounded-lg object-cover border border-[#DCCBB5] transition group-hover/tbl:scale-105"
                              />
                              <div>
                                <div className="font-medium text-[#172B3A] transition group-hover/tbl:text-[#C87960] flex items-center gap-1">
                                  <span>{selected.product_name}</span>
                                  <Eye className="h-3 w-3 text-[#C87960] opacity-0 group-hover/tbl:opacity-100 transition" />
                                </div>
                                <div className="text-[10px] text-[#252B2E]/60 line-clamp-1">{selected.material}</div>
                              </div>
                            </button>
                          ) : (
                            <span className="text-red-600 font-medium italic">Item excluded from estimate</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {selected ? (
                            <span className="rounded-full bg-[#172B3A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#172B3A]">
                              {selected.brand}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-editorial text-base font-bold text-[#172B3A]">
                          {selected ? selected.price : "—"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {selected ? (
                              <>
                                {/* View button: opens full product specifications modal inside website */}
                                <button
                                  type="button"
                                  onClick={() => setQuickViewProduct(selected)}
                                  className="inline-flex items-center gap-1 rounded-full border border-[#DCCBB5] bg-white px-2.5 py-1 text-[11px] font-medium text-[#172B3A] hover:border-[#C87960] hover:text-[#C87960] transition"
                                  title="View product details inside website"
                                >
                                  <Eye className="h-3 w-3 text-[#C87960]" />
                                  <span>View</span>
                                </button>
                                {/* Store button: opens EXACT product on retailer's official website */}
                                <a
                                  href={getDirectRetailerUrl(selected)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-full bg-[#172B3A] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#C87960] transition shadow-sm"
                                  title={`Open exact ${selected.product_name} on ${selected.brand} official website`}
                                >
                                  <span>Store</span>
                                  <ExternalLink className="h-2.5 w-2.5 opacity-80" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(detected.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                  title="Remove from cost estimate"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const matches = matchingByCategory[detected.id] || [];
                                  if (matches.length > 0) {
                                    handleSelectProduct(detected.id, matches[0]);
                                  }
                                }}
                                className="rounded-full border border-[#172B3A] px-2.5 py-1 text-[11px] font-semibold text-[#172B3A] hover:bg-[#172B3A] hover:text-white transition"
                              >
                                Re-Include
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-[#F7F4ED] font-semibold text-[#172B3A]">
                  <tr>
                    <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider text-xs">
                      Total Estimated Furniture Cost:
                    </td>
                    <td className="py-3.5 px-4 text-right font-editorial text-xl font-bold text-[#172B3A]">
                      {fmtPrice(totalEstimatedCost)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Clear Disclaimer as strictly required */}
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#DCCBB5] bg-[#F7F4ED] p-4 text-xs text-[#252B2E]">
              <Info className="h-4 w-4 shrink-0 text-[#C87960] mt-0.5" />
              <div>
                <strong>Planning Estimate Notice:</strong> This is an estimated furniture cost calculated from verified matching retailer products for spatial budgeting. It is not a final renovation or contractor quotation. No unverified labour, installation, or construction costs are included in this furniture total.
              </div>
            </div>
          </div>
        </>
      )}

      {/* In-Website Product Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
};

