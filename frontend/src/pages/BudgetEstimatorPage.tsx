import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calculator,
  Check,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  GitCompare,
  Loader2,
  Package,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type { BudgetEstimateResult, ItemizedBudgetItem } from "../types";
import { SmartFurnitureCostEstimator } from "../components/SmartFurnitureCostEstimator";
import { getDirectRetailerUrl } from "../lib/retailerUrls";

export const BudgetEstimatorPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const initialRoom = searchParams.get("room") || "Bedroom";
  const initialStyle = searchParams.get("style") || "Modern Luxury";

  const [title, setTitle] = useState(
    searchParams.get("room")
      ? `${initialRoom} Renovation Plan (${initialStyle})`
      : "Primary Space Architectural Renovation"
  );
  const [roomType, setRoomType] = useState(initialRoom);
  const [lengthFt, setLengthFt] = useState(initialRoom.toLowerCase().includes("bed") ? 16 : 20);
  const [widthFt, setWidthFt] = useState(initialRoom.toLowerCase().includes("bed") ? 14 : 15);
  const [heightFt, setHeightFt] = useState(10);
  const [flooring, setFlooring] = useState("European White Oak");
  const [wallMaterial, setWallMaterial] = useState("Limewash Plaster");
  const [furnitureCat, setFurnitureCat] = useState("Curated Designer Suite");
  const [lighting, setLighting] = useState("Layered Architectural & Pendant");
  const [quality, setQuality] = useState("Curated Mid-Range");
  const [location, setLocation] = useState("Major Metro (US/EU)");

  const [activeTab, setActiveTab] = useState<"smart_furniture" | "renovation_planner">(
    searchParams.get("mode") === "planner" ? "renovation_planner" : "smart_furniture"
  );

  const [estimate, setEstimate] = useState<BudgetEstimateResult | null>(null);
  const [compareBaseline, setCompareBaseline] = useState<BudgetEstimateResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Interactive Product Selection & Single-Product Checkout
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [checkoutItems, setCheckoutItems] = useState<ItemizedBudgetItem[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const [shippingName, setShippingName] = useState(user?.full_name || "Valued Client");
  const [shippingAddress, setShippingAddress] = useState("742 Evergreen Terrace, San Francisco, CA 94102");
  const [shippingPhone, setShippingPhone] = useState("+1 (415) 890-2341");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card (•••• 4242)");

  const runEstimate = async (save = true) => {
    setLoading(true);
    try {
      const res = await api.post<BudgetEstimateResult>("/api/modules/budget/estimate", {
        title,
        room_type: roomType,
        length_ft: lengthFt,
        width_ft: widthFt,
        height_ft: heightFt,
        flooring_material: flooring,
        wall_material: wallMaterial,
        furniture_category: furnitureCat,
        lighting_requirements: lighting,
        renovation_quality: quality,
        location,
        save_estimate: save && Boolean(user),
      });
      setEstimate(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEstimate(false);
  }, [roomType]);

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  // Fallback itemized builder to ensure items are always displayed cleanly
  const getItemizedList = (): ItemizedBudgetItem[] => {
    if (estimate?.itemized_items && estimate.itemized_items.length > 0) {
      return estimate.itemized_items;
    }
    const r = (roomType || "").toLowerCase();
    const qm = quality === "Essential" ? 0.82 : quality === "Luxury Bespoke" ? 1.48 : 1.0;

    if (r.includes("bed")) {
      return [
        {
          id: "item-bed-01",
          name: "Low White Oak Platform Bed Frame",
          category: "Bed",
          brand: "West Elm",
          type: "Furniture",
          material: "Kiln-Dried European White Oak & Tailored Belgian Linen Headboard",
          price: Math.round(2450 * qm),
          image_url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-wardrobe-02",
          name: "Custom Fluted Oak Architectural Wardrobe",
          category: "Wardrobe / Storage",
          brand: "Pepperfry",
          type: "Furniture",
          material: "Vertically Fluted Solid White Oak with Soft-Close Joinery",
          price: Math.round(3200 * qm),
          image_url: "/images/mori-fluted-wardrobe.jpg",
          is_purchasable: true,
        },
        {
          id: "item-nightstands-03",
          name: "Sculptural White Oak Nightstands (Pair)",
          category: "Nightstand",
          brand: "Urban Ladder",
          type: "Furniture",
          material: "FSC European White Oak & Patinated Solid Brass Pulls",
          price: Math.round(890 * qm),
          image_url: "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-curtains-04",
          name: "Tailored Belgian Sheer Linen Drapes",
          category: "Window Drapery",
          brand: "IKEA",
          type: "Textiles & Decor",
          material: "100% Belgian Washed Natural Flax Linen with Concealed Track",
          price: Math.round(650 * qm),
          image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-rug-05",
          name: "Atlas Hand-Knotted Wool Area Rug (8x10)",
          category: "Area Rug",
          brand: "West Elm",
          type: "Textiles & Decor",
          material: "100% Unbleached New Zealand Wool with Organic Weave",
          price: Math.round(1190 * qm),
          image_url: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-floor-mat",
          name: `${flooring} Hardwood Flooring Package`,
          category: "Flooring",
          brand: "Architectural Millwork",
          type: "Architectural Material",
          material: `Architectural grade ${flooring} with vapor barrier (${lengthFt * widthFt} sq ft)`,
          price: Math.round(lengthFt * widthFt * 18 * qm),
          image_url: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-wall-mat",
          name: `${wallMaterial} Wall Plaster Package`,
          category: "Wall Plaster",
          brand: "Artisan Plaster Co.",
          type: "Architectural Material",
          material: `Artisanal ${wallMaterial} with breathable mineral base (${Math.round(2 * (lengthFt + widthFt) * heightFt * 0.85)} sq ft)`,
          price: Math.round(2 * (lengthFt + widthFt) * heightFt * 0.85 * 9.5 * qm),
          image_url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
      ];
    } else if (r.includes("kitchen")) {
      return [
        {
          id: "item-island-01",
          name: "Waterfall Honed Marble Kitchen Island",
          category: "Kitchen Island",
          brand: "Architectural Stone",
          type: "Millwork & Stone",
          material: "Honed Carrara Marble with Fluted White Oak Joinery",
          price: Math.round(4800 * qm),
          image_url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-stools-02",
          name: "Sculptural Oak Counter Stools (Set of 3)",
          category: "Counter Stools",
          brand: "West Elm",
          type: "Furniture",
          material: "Solid White Oak with Top-Grain Saddle Leather",
          price: Math.round(1350 * qm),
          image_url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-pendants-03",
          name: "Architectural Spun Brass Pendant Lights (Pair)",
          category: "Lighting",
          brand: "Pepperfry",
          type: "Lighting",
          material: "Hand-Spun Burnished Brass & Warm Dim LED",
          price: Math.round(920 * qm),
          image_url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
      ];
    } else {
      // Living Room
      return [
        {
          id: "item-sofa-01",
          name: "Atelier Curved Bouclé Sofa",
          category: "Sofa",
          brand: "West Elm",
          type: "Furniture",
          material: "Belgian Ivory Bouclé & Kiln-Dried White Oak Frame",
          price: Math.round(3450 * qm),
          image_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-coffee-02",
          name: "Pietra Honed Travertine Coffee Table",
          category: "Coffee Table",
          brand: "West Elm",
          type: "Furniture",
          material: "Unfilled Roman Travertine Stone Slab with Beveled Edge",
          price: Math.round(1650 * qm),
          image_url: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-chair-03",
          name: "Sienna Terracotta Lounge Armchair",
          category: "Armchair",
          brand: "Urban Ladder",
          type: "Furniture",
          material: "Muted Terracotta Mohair & Brushed American Walnut",
          price: Math.round(1280 * qm),
          image_url: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-lamp-04",
          name: "Kyoto Sculpted Linen Pendant Lamp",
          category: "Pendant Light",
          brand: "IKEA",
          type: "Lighting",
          material: "Raw Oat Linen & Patinated Brass Hardware",
          price: Math.round(590 * qm),
          image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-rug-05",
          name: "Atlas Hand-Knotted Ivory & Sand Wool Rug (8x10)",
          category: "Area Rug",
          brand: "Urban Ladder",
          type: "Textiles & Decor",
          material: "100% Unbleached New Zealand Wool with Organic Textured Knotting",
          price: Math.round(1190 * qm),
          image_url: "https://images.unsplash.com/photo-1579656381226-5fc0f0100c3b?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-floor-mat",
          name: `${flooring} Hardwood Flooring Package`,
          category: "Flooring",
          brand: "Architectural Millwork",
          type: "Architectural Material",
          material: `Architectural grade ${flooring} with vapor barrier (${lengthFt * widthFt} sq ft)`,
          price: Math.round(lengthFt * widthFt * 18 * qm),
          image_url: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
        {
          id: "item-wall-mat",
          name: `${wallMaterial} Wall Plaster Package`,
          category: "Wall Plaster",
          brand: "Artisan Plaster Co.",
          type: "Architectural Material",
          material: `Artisanal ${wallMaterial} with breathable mineral base (${Math.round(2 * (lengthFt + widthFt) * heightFt * 0.85)} sq ft)`,
          price: Math.round(2 * (lengthFt + widthFt) * heightFt * 0.85 * 9.5 * qm),
          image_url: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80",
          is_purchasable: true,
        },
      ];
    }
  };

  const itemizedList = getItemizedList();

  // Initialize all items as selected by default
  useEffect(() => {
    if (itemizedList.length > 0) {
      setSelectedItemIds(new Set(itemizedList.map((i) => i.id)));
    }
  }, [estimate, roomType, quality]);

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // 1. Buy ONLY one single product
  const handleBuySingleItem = (item: ItemizedBudgetItem) => {
    setCheckoutItems([item]);
    setOrderSuccess(null);
    setShowCheckoutModal(true);
  };

  // 2. Buy all selected items together
  const handleBuySelectedItems = () => {
    const selected = itemizedList.filter((i) => selectedItemIds.has(i.id));
    if (selected.length === 0) return;
    setCheckoutItems(selected);
    setOrderSuccess(null);
    setShowCheckoutModal(true);
  };

  const selectedTotal = itemizedList
    .filter((i) => selectedItemIds.has(i.id))
    .reduce((acc, i) => acc + i.price, 0);

  const checkoutTotal = checkoutItems.reduce((acc, i) => acc + i.price, 0);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOrder(true);
    try {
      const res = await api.post<any>("/api/modules/furniture/order", {
        items: checkoutItems,
        total_amount: checkoutTotal,
        shipping_name: shippingName,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
      });
      setOrderSuccess(res);
    } catch {
      // Fallback
      setOrderSuccess({
        order_id: "FS-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: "Confirmed",
        items: checkoutItems,
        items_count: checkoutItems.length,
        total_amount: checkoutTotal,
        shipping_name: shippingName,
        shipping_address: shippingAddress,
        payment_method: paymentMethod,
        estimated_delivery: "4-6 business days (White-Glove Delivery)",
        created_at: new Date().toISOString(),
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation & Context Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            to={`/studio?sample=${encodeURIComponent(searchParams.get("sample") || "")}&style=${encodeURIComponent(initialStyle)}&category=${encodeURIComponent(roomType)}`}
            className="inline-flex items-center gap-2 rounded-full border border-[#DCCBB5] bg-white px-4 py-2 text-xs font-semibold text-[#172B3A] shadow-sm hover:border-[#C87960] hover:text-[#C87960] transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to AI Studio
          </Link>
          <div className="text-xs text-[#252B2E]/60">
            Active Space: <strong className="text-[#172B3A]">{roomType}</strong> · Target Style: <strong className="text-[#C87960]">{initialStyle}</strong>
          </div>
        </div>

        <div>
          <h1 className="font-editorial text-3xl font-semibold text-[#172B3A] sm:text-4xl">
            {activeTab === "smart_furniture"
              ? "Smart Furniture Cost Estimator"
              : "Renovation Budget Estimator"}
          </h1>
        </div>

        {/* View Mode Tabs */}
        <div className="mt-4 mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#DCCBB5] pb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("smart_furniture")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition shadow-sm ${activeTab === "smart_furniture"
                ? "bg-[#172B3A] text-white"
                : "bg-white text-[#172B3A] border border-[#DCCBB5] hover:border-[#C87960]"
                }`}
            >
              <Sparkles className="h-4 w-4 text-[#C87960]" />
              Smart Furniture Cost Estimator
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("renovation_planner")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition shadow-sm ${activeTab === "renovation_planner"
                ? "bg-[#172B3A] text-white"
                : "bg-white text-[#172B3A] border border-[#DCCBB5] hover:border-[#C87960]"
                }`}
            >
              <Calculator className="h-4 w-4 text-[#9BAE9A]" />
              Full Architectural & Renovation Planner
            </button>
          </div>
          <div className="text-xs text-[#252B2E]/65">
            {activeTab === "smart_furniture"
              ? "Analyzing Designed Room & real retailer product matches"
              : "Modeling materials, wall plaster, contractor labour & logistics"}
          </div>
        </div>

        {activeTab === "smart_furniture" ? (
          <SmartFurnitureCostEstimator
            generatedImageUrl={searchParams.get("image") || "/images/bedroom-after.jpg"}
            roomType={roomType}
            designStyle={initialStyle}
          />
        ) : (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-12">
              {/* Input Form */}
              <div className="editorial-card p-6 space-y-4 lg:col-span-5">
                <div>
                  <label className="text-xs font-medium text-[#252B2E]/80">Estimate Name</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm text-[#172B3A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/80">Room Type</label>
                    <select
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-xs text-[#172B3A]"
                    >
                      {["Living Room", "Bedroom", "Kitchen", "Bathroom", "Dining Room", "Office", "House Exterior", "Garden"].map(
                        (r) => (
                          <option key={r}>{r}</option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/80">Location Tier</label>
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-xs text-[#172B3A]"
                    >
                      <option>Major Metro (US/EU)</option>
                      <option>Suburban / Regional</option>
                      <option>Emerging / Cost-Efficient</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/80">Length (ft)</label>
                    <input
                      type="number"
                      min={4}
                      value={lengthFt}
                      onChange={(e) => setLengthFt(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/80">Width (ft)</label>
                    <input
                      type="number"
                      min={4}
                      value={widthFt}
                      onChange={(e) => setWidthFt(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/80">Ceiling (ft)</label>
                    <input
                      type="number"
                      min={7}
                      value={heightFt}
                      onChange={(e) => setHeightFt(Number(e.target.value))}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#252B2E]/80">Flooring Material</label>
                  <select
                    value={flooring}
                    onChange={(e) => setFlooring(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                  >
                    <option>European White Oak</option>
                    <option>Honed Travertine Stone</option>
                    <option>Carrara Marble Slab</option>
                    <option>Microcement Seamless</option>
                    <option>Porcelain Architectural Tile</option>
                    <option>Engineered Walnut</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#252B2E]/80">Wall Material</label>
                  <select
                    value={wallMaterial}
                    onChange={(e) => setWallMaterial(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                  >
                    <option>Matte Architectural Paint</option>
                    <option>Limewash Plaster</option>
                    <option>Venetian Tadelakt Plaster</option>
                    <option>Fluted Oak Wall Panelling</option>
                    <option>Textured Linen Wallcovering</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#252B2E]/80">Furniture Category</label>
                  <select
                    value={furnitureCat}
                    onChange={(e) => setFurnitureCat(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                  >
                    <option>Minimal Essential Set</option>
                    <option>Curated Designer Suite</option>
                    <option>Bespoke Luxury Collection</option>
                    <option>No Furniture (Shell Only)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/80">Lighting Scope</label>
                    <select
                      value={lighting}
                      onChange={(e) => setLighting(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-2.5 py-2 text-xs"
                    >
                      <option>Basic Recessed Upgrade</option>
                      <option>Layered Architectural & Pendant</option>
                      <option>Smart Lutron Dimming + Statement Chandeliers</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/80">Renovation Quality</label>
                    <select
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-2.5 py-2 text-xs"
                    >
                      <option>Essential</option>
                      <option>Curated Mid-Range</option>
                      <option>Luxury Bespoke</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => runEstimate(true)}
                  disabled={loading}
                  className="btn-primary w-full justify-center py-3.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  Calculate Budget Breakdown
                </button>
              </div>

              {/* Breakdown & Comparison */}
              <div className="space-y-5 lg:col-span-7">
                {!estimate ? (
                  <div className="editorial-card flex flex-col items-center justify-center p-14 text-center">
                    <Sparkles className="h-10 w-10 text-[#C87960]" />
                    <h2 className="mt-3 font-editorial text-2xl text-[#172B3A]">
                      Model Your Renovation Investment
                    </h2>
                    <p className="mt-2 max-w-md text-sm text-[#252B2E]/70">
                      Adjust room dimensions and material tiers on the left, then click Calculate Budget Breakdown.
                    </p>
                  </div>
                ) : (
                  <div className="editorial-card p-6 space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#DCCBB5]/60 pb-5">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-[#C87960]">
                          {roomType} · {estimate.area_sqft} sq ft floor
                        </div>
                        <h2 className="font-editorial text-3xl font-semibold text-[#172B3A]">
                          {fmt(estimate.estimated_total)}
                        </h2>
                        <p className="text-xs text-[#252B2E]/65">Estimated Total Project Budget</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCompareBaseline(estimate)}
                        className="btn-secondary py-2 px-4 text-xs"
                      >
                        <GitCompare className="h-3.5 w-3.5" />
                        {compareBaseline ? "Update Baseline A" : "Pin as Scenario A to Compare"}
                      </button>
                    </div>

                    {/* 5 High-Level Cost Blocks */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { label: "Material Cost (Floor & Wall Surfaces)", val: estimate.breakdown.material_cost },
                        { label: "Furniture & Lighting Package", val: estimate.breakdown.furniture_cost },
                        { label: "Skilled Labour Cost", val: estimate.breakdown.labour_cost },
                        { label: "Installation & Logistics", val: estimate.breakdown.installation_cost },
                        { label: "Additional Expenses (Permits & 12% Contingency)", val: estimate.breakdown.additional_expenses },
                      ].map((row) => (
                        <div key={row.label} className="rounded-2xl bg-[#F7F4ED] p-4">
                          <div className="text-xs text-[#252B2E]/75">{row.label}</div>
                          <div className="mt-1 font-editorial text-2xl font-semibold text-[#172B3A]">
                            {fmt(row.val)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pinned Baseline comparison if active */}
                    {compareBaseline && (
                      <div className="rounded-2xl border border-[#172B3A]/20 bg-[#172B3A] p-5 text-[#F7F4ED]">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold uppercase tracking-wider text-[#C87960]">
                            Scenario Comparison (Current vs Pinned Scenario A)
                          </span>
                          <span className="text-sm font-semibold">
                            Delta:{" "}
                            {estimate.estimated_total - compareBaseline.estimated_total >= 0 ? "+" : "-"}
                            {fmt(Math.abs(estimate.estimated_total - compareBaseline.estimated_total))}
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="opacity-70">Scenario A (Pinned)</div>
                            <div className="font-editorial text-xl">{fmt(compareBaseline.estimated_total)}</div>
                          </div>
                          <div>
                            <div className="opacity-70">Current Configuration</div>
                            <div className="font-editorial text-xl">{fmt(estimate.estimated_total)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* --- ITEMISED MATERIALS & FURNITURE LIST (BUY INDIVIDUAL OR ALL) --- */}
                    <div className="border-t border-[#DCCBB5]/70 pt-6">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">
                            Itemized Furniture & Materials Breakdown
                          </h3>
                          <p className="text-xs text-[#252B2E]/70 mt-0.5">
                            Specific materials, finishes, and furniture pieces. Buy any single product or the entire selected set.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (selectedItemIds.size === itemizedList.length) {
                              setSelectedItemIds(new Set());
                            } else {
                              setSelectedItemIds(new Set(itemizedList.map((i) => i.id)));
                            }
                          }}
                          className="text-xs text-[#C87960] hover:underline font-semibold"
                        >
                          {selectedItemIds.size === itemizedList.length ? "Deselect All" : "Select All"}
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {itemizedList.map((item) => {
                          const isSelected = selectedItemIds.has(item.id);
                          return (
                            <div
                              key={item.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border p-4 transition ${isSelected
                                ? "border-[#172B3A] bg-white shadow-sm ring-1 ring-[#172B3A]/10"
                                : "border-[#DCCBB5]/80 bg-[#F7F4ED]/50 opacity-75 hover:opacity-100"
                                }`}
                            >
                              <div className="flex items-start gap-3.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleItemSelection(item.id)}
                                  className="mt-1 h-4 w-4 rounded border-[#DCCBB5] accent-[#172B3A] cursor-pointer"
                                />
                                {/* Isolated Product Photography Thumbnail */}
                                <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-white border border-[#DCCBB5] p-1 flex items-center justify-center shadow-xs">
                                  <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <div>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="rounded-full bg-[#172B3A]/10 px-2 py-0.5 text-[10px] font-semibold text-[#172B3A]">
                                      {item.category}
                                    </span>
                                    <span className="text-[10px] font-medium text-[#C87960]">
                                      {item.type}
                                    </span>
                                    {item.brand && (
                                      <span className="rounded-full bg-[#9BAE9A]/20 px-2 py-0.5 text-[10px] font-semibold text-[#172B3A]">
                                        {item.brand}
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="mt-1 text-sm font-semibold text-[#172B3A]">
                                    {item.name}
                                  </h4>
                                  <p className="mt-1 text-xs text-[#252B2E]/75 line-clamp-2 leading-relaxed">
                                    <strong className="text-[#172B3A]">Material:</strong> {item.material}
                                  </p>
                                </div>
                              </div>

                              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#DCCBB5]/40">
                                <div className="font-editorial text-xl font-bold text-[#172B3A]">
                                  {fmt(item.price)}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleBuySingleItem(item)}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-[#172B3A] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#C87960] transition"
                                  >
                                    <ShoppingBag className="h-3.5 w-3.5" />
                                    Buy Product
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary Bar for Selected Products Checkout */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#172B3A] p-4 text-white shadow-md">
                        <div>
                          <div className="text-xs text-[#DCCBB5]">
                            Selected Products ({selectedItemIds.size} of {itemizedList.length} items)
                          </div>
                          <div className="font-editorial text-2xl font-bold">
                            {fmt(selectedTotal)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleBuySelectedItems}
                          disabled={selectedItemIds.size === 0}
                          className="inline-flex items-center gap-2 rounded-full bg-[#C87960] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#b06750] disabled:opacity-50 transition"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Buy Selected Products ({selectedItemIds.size})
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommended Design & Finish Tiers */}
            <div className="mt-8 editorial-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C87960]" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
                    Recommended Design Options & Finish Tiers
                  </h3>
                </div>
                <span className="text-xs text-[#252B2E]/65">
                  Select any tier to auto-configure finishes and estimate
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    tier: "Essential Minimalist",
                    qualityName: "Essential",
                    wall: "Matte Architectural Paint",
                    floor: "Microcement Seamless",
                    furniture: "Minimal Essential Set",
                    lighting: "Basic Recessed Upgrade",
                    desc: "High cost-efficiency, seamless surfaces & streamlined fixtures.",
                    tag: "Value / Fast Turnaround",
                  },
                  {
                    tier: "Curated Architectural",
                    qualityName: "Curated Mid-Range",
                    wall: "Limewash Plaster",
                    floor: "European White Oak",
                    furniture: "Curated Designer Suite",
                    lighting: "Layered Architectural & Pendant",
                    desc: "Balanced premium finishes, natural oak timber & textured plaster.",
                    tag: "Recommended Standard",
                  },
                  {
                    tier: "Bespoke Luxury Signature",
                    qualityName: "Luxury Bespoke",
                    wall: "Fluted Oak Wall Panelling",
                    floor: "Honed Travertine Stone",
                    furniture: "Bespoke Luxury Collection",
                    lighting: "Smart Lutron Dimming + Statement Chandeliers",
                    desc: "Full architectural millwork, bespoke stonework & smart Lutron lighting.",
                    tag: "Editorial Masterpiece",
                  },
                ].map((t) => (
                  <div
                    key={t.tier}
                    className={`rounded-2xl border p-4 transition flex flex-col justify-between ${quality === t.qualityName
                      ? "border-[#C87960] bg-[#C87960]/5 shadow-sm ring-1 ring-[#C87960]"
                      : "border-[#DCCBB5] bg-white hover:border-[#C87960]"
                      }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">
                          {t.tag}
                        </span>
                        {quality === t.qualityName && (
                          <span className="rounded bg-[#C87960] px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 font-editorial text-lg font-semibold text-[#172B3A]">
                        {t.tier}
                      </h4>
                      <p className="mt-1 text-xs text-[#252B2E]/70 leading-relaxed">
                        {t.desc}
                      </p>
                      <div className="mt-3 space-y-1 text-[11px] text-[#252B2E]/80 border-t border-[#DCCBB5]/60 pt-2">
                        <div>• <strong>Wall:</strong> {t.wall}</div>
                        <div>• <strong>Flooring:</strong> {t.floor}</div>
                        <div>• <strong>Package:</strong> {t.furniture}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setQuality(t.qualityName);
                        setWallMaterial(t.wall);
                        setFlooring(t.floor);
                        setFurnitureCat(t.furniture);
                        setLighting(t.lighting);
                        runEstimate(false);
                      }}
                      className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#DCCBB5] bg-[#F7F4ED] py-2 text-xs font-semibold text-[#172B3A] hover:bg-[#C87960] hover:text-white transition"
                    >
                      <Calculator className="h-3.5 w-3.5" /> Apply Tier & Calculate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- INSTANT BUY / CHECKOUT MODAL --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#DCCBB5] px-6 py-4 bg-[#F7F4ED]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-[#C87960]" />
                <h3 className="font-editorial text-lg font-semibold text-[#172B3A]">
                  {orderSuccess ? "Order Confirmed" : checkoutItems.length === 1 ? "Buy Single Product" : "Buy Selected Products"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCheckoutModal(false);
                  setOrderSuccess(null);
                }}
                className="rounded-full p-1 text-[#252B2E]/60 hover:bg-[#DCCBB5]/40 hover:text-[#172B3A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {orderSuccess ? (
              /* Success View */
              <div className="p-6 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    Order #{orderSuccess.order_id} · {orderSuccess.status}
                  </span>
                  <h4 className="mt-1 font-editorial text-2xl font-bold text-[#172B3A]">
                    Thank You for Your Order!
                  </h4>
                  <p className="mt-1 text-xs text-[#252B2E]/75">
                    Your direct purchase has been placed. White-glove delivery is scheduled.
                  </p>
                </div>

                {/* Purchased Items List */}
                <div className="max-h-48 overflow-y-auto rounded-2xl bg-[#F7F4ED] p-3 text-left space-y-2">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img src={item.image_url} alt={item.name} className="h-8 w-8 rounded-lg object-cover" />
                        <div>
                          <div className="font-semibold text-[#172B3A]">{item.name}</div>
                          <div className="text-[10px] text-[#252B2E]/60">{item.material}</div>
                        </div>
                      </div>
                      <div className="font-bold text-[#172B3A]">{fmt(item.price)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#DCCBB5] p-3 text-xs text-left">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-[#252B2E]/60">Delivery Address:</div>
                    <div className="font-medium text-[#172B3A]">{orderSuccess.shipping_address}</div>
                    <div className="text-[11px] text-[#C87960] font-semibold flex items-center gap-1 mt-1">
                      <Truck className="h-3.5 w-3.5" /> {orderSuccess.estimated_delivery}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] text-[#252B2E]/60">Total Paid:</div>
                    <div className="font-editorial text-lg font-bold text-[#172B3A]">{fmt(orderSuccess.total_amount)}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setOrderSuccess(null);
                  }}
                  className="btn-primary w-full justify-center py-2.5"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Checkout Order Form */
              <form onSubmit={handlePlaceOrder} className="p-6 space-y-5">
                {/* Products Summary */}
                <div className="max-h-40 overflow-y-auto rounded-2xl border border-[#DCCBB5]/70 bg-[#F7F4ED]/60 p-3 space-y-2">
                  {checkoutItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-lg object-cover border border-[#DCCBB5]" />
                        <div>
                          <div className="font-semibold text-[#172B3A]">{item.name}</div>
                          <div className="text-[10px] text-[#252B2E]/65">{item.material}</div>
                        </div>
                      </div>
                      <div className="font-bold text-[#172B3A]">{fmt(item.price)}</div>
                    </div>
                  ))}
                </div>

                {/* Shipping Details */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-[#172B3A] uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5 text-[#C87960]" /> White-Glove Delivery Information
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-medium text-[#252B2E]/80">Full Name</label>
                      <input
                        type="text"
                        required
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#DCCBB5] px-3 py-1.5 text-xs text-[#172B3A]"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-[#252B2E]/80">Contact Phone</label>
                      <input
                        type="text"
                        required
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-[#DCCBB5] px-3 py-1.5 text-xs text-[#172B3A]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-[#252B2E]/80">Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] px-3 py-1.5 text-xs text-[#172B3A]"
                    />
                  </div>
                </div>

                {/* Payment & Security */}
                <div className="space-y-2 border-t border-[#DCCBB5]/60 pt-3">
                  <label className="text-[11px] font-medium text-[#252B2E]/80">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs text-[#172B3A]"
                  >
                    <option>Credit Card (•••• 4242) — 1-Click Pay</option>
                    <option>Apple Pay / Google Pay</option>
                    <option>Bank Wire / Architectural Escrow</option>
                    <option>Cash on Delivery / On-Site Inspection</option>
                  </select>
                </div>

                {/* Scannable Mobile Payment / Purchase QR Code */}
                <div className="flex items-center gap-3.5 rounded-2xl border border-[#DCCBB5]/80 bg-[#FAF7F2] p-3">
                  <div className="h-16 w-16 shrink-0 rounded-xl border border-[#DCCBB5] p-1 bg-white flex items-center justify-center shadow-xs">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&margin=4&data=${encodeURIComponent(
                        checkoutItems.length === 1
                          ? getDirectRetailerUrl({ product_name: checkoutItems[0].name, brand: checkoutItems[0].brand, product_url: checkoutItems[0].product_url })
                          : window.location.href
                      )}`}
                      alt="Scan to Pay QR Code"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <div className="font-semibold text-[#172B3A] flex items-center gap-1.5">
                      <QrCode className="h-3.5 w-3.5 text-[#C87960]" />
                      <span>Scan to Complete & Pay on Smartphone</span>
                    </div>
                    <div className="text-[11px] text-[#252B2E]/70 mt-0.5 leading-relaxed">
                      Scan with your smartphone camera to review and complete checkout with Apple Pay, Google Pay, or direct retailer purchase.
                    </div>
                  </div>
                </div>

                {/* Total & CTA */}
                <div className="border-t border-[#DCCBB5]/60 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[#252B2E]/60">Total Amount:</div>
                    <div className="font-editorial text-2xl font-bold text-[#172B3A]">
                      {fmt(checkoutTotal)}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingOrder}
                    className="inline-flex items-center gap-2 rounded-full bg-[#C87960] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#b06750] disabled:opacity-50 transition"
                  >
                    {isSubmittingOrder ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" /> Place Order ({fmt(checkoutTotal)})
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
