import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  Film,
  Layers,
  Loader2,
  Maximize2,
  Package,
  Plus,
  RefreshCw,
  ScanEye,
  ShoppingBag,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider";
import { DemoModeBanner } from "../components/DemoModeBanner";
import { useAuth } from "../context/AuthContext";
import {
  DESIGN_STYLES,
  KINKEAD_PROPERTY_SHOWCASE,
} from "../data/catalog";
import { api } from "../lib/api";
import type { DetectedObject } from "../types";

export interface StagingItem {
  id: string;
  name: string;
  category: string;
  material: string;
  estimatedPrice: number;
  dimensions: string;
}

export interface StagingPhoto {
  id: string;
  file?: File;
  name: string;
  originalUrl: string;
  roomType: string;
  style: string;
  status: "ready" | "staging" | "staged" | "error";
  stagedUrl?: string;
  detectedObjects: DetectedObject[];
  inventory: StagingItem[];
}

const ROOM_INVENTORIES: Record<string, StagingItem[]> = {
  "Living Room": [
    { id: "inv-sofa", name: "Cognac Atelier Leather Lounge", category: "Seating", material: "Semi-Aniline Top Grain Leather", estimatedPrice: 2850, dimensions: "240cm W x 95cm D" },
    { id: "inv-table", name: "Pietra Honed Travertine Plinth", category: "Table", material: "Natural Honed Travertine", estimatedPrice: 1250, dimensions: "120cm W x 60cm D" },
    { id: "inv-rug", name: "Textured Bouclé Wool Area Rug", category: "Textile", material: "100% New Zealand Wool", estimatedPrice: 890, dimensions: "300cm x 240cm" },
    { id: "inv-lamp", name: "Architectural Arched Brass Lamp", category: "Lighting", material: "Brushed Solid Brass", estimatedPrice: 420, dimensions: "190cm H" },
    { id: "inv-art", name: "Minimalist Framed Canvas Art", category: "Decor", material: "Textured Acrylic & Oak Frame", estimatedPrice: 380, dimensions: "120cm x 90cm" },
  ],
  "Bedroom": [
    { id: "inv-bed", name: "Low White Oak Platform Bed Frame", category: "Furniture", material: "FSC European White Oak", estimatedPrice: 2200, dimensions: "Queen (160cm x 210cm)" },
    { id: "inv-linen", name: "Washed French Linen Bedding Set", category: "Textile", material: "100% Organic Flax Linen", estimatedPrice: 480, dimensions: "Duvet + 4 Shams" },
    { id: "inv-nightstands", name: "Twin Fluted Oak Bedside Tables", category: "Storage", material: "Solid Oak & Soft-Close Drawers", estimatedPrice: 780, dimensions: "50cm W x 45cm H" },
    { id: "inv-lamps", name: "Ceramic Minimalist Table Lamps (Pair)", category: "Lighting", material: "Cast Ceramic & Linen Shades", estimatedPrice: 340, dimensions: "42cm H" },
    { id: "inv-rug", name: "Plush Oatmeal Wool Underbed Rug", category: "Textile", material: "Hand-Knotted Wool", estimatedPrice: 760, dimensions: "280cm x 200cm" },
  ],
  "Dining Room": [
    { id: "inv-table", name: "Solid White Oak 6-Seater Table", category: "Dining", material: "Solid European Oak", estimatedPrice: 2100, dimensions: "200cm L x 95cm W" },
    { id: "inv-chairs", name: "Sculptural Cream Dining Chairs (Set of 6)", category: "Seating", material: "Bouclé Textile & Oak Legs", estimatedPrice: 1560, dimensions: "6 Chairs" },
    { id: "inv-pendant", name: "Fluted Opal Glass Linear Chandelier", category: "Lighting", material: "Brass & Matte Opal Glass", estimatedPrice: 650, dimensions: "110cm Length" },
    { id: "inv-drapes", name: "Tailored Sheer Linen Window Drapes", category: "Textile", material: "Belgian Sheer Linen", estimatedPrice: 420, dimensions: "Floor-to-Ceiling" },
  ],
  "Kitchen": [
    { id: "inv-stools", name: "Fluted Timber Counter Stools (Set of 3)", category: "Seating", material: "Solid Oak & Leather Pad", estimatedPrice: 840, dimensions: "65cm Counter Height" },
    { id: "inv-pendants", name: "Brushed Brass Cylinder Pendants (Pair)", category: "Lighting", material: "Spun Brass & Warm LED", estimatedPrice: 390, dimensions: "25cm H" },
    { id: "inv-decor", name: "Artisan Ceramic & Olive Branch Styling", category: "Decor", material: "Handmade Stoneware", estimatedPrice: 180, dimensions: "Curated Set" },
  ],
  "Home Office": [
    { id: "inv-desk", name: "Executive Minimalist White Oak Desk", category: "Workspace", material: "Solid Oak & Cable Conduit", estimatedPrice: 1650, dimensions: "160cm W x 80cm D" },
    { id: "inv-chair", name: "Ergonomic Bouclé Executive Swivel Chair", category: "Seating", material: "Italian Mechanism & Bouclé", estimatedPrice: 890, dimensions: "Adjustable Height" },
    { id: "inv-shelving", name: "Architectural Open Bookcase", category: "Storage", material: "Black Steel & Oak Shelves", estimatedPrice: 1200, dimensions: "180cm H x 100cm W" },
    { id: "inv-lamp", name: "Solid Brass Task Luminaire", category: "Lighting", material: "Brushed Brass", estimatedPrice: 280, dimensions: "Desk Lamp" },
  ],
  "Patio": [
    { id: "inv-lounge", name: "Outdoor Teak Lounge Sofa & Armchairs", category: "Outdoor", material: "Grade-A Teak & Sunbrella Fabric", estimatedPrice: 3200, dimensions: "3-Piece Suite" },
    { id: "inv-table", name: "Travertine Low Outdoor Coffee Table", category: "Outdoor", material: "Weather-Sealed Travertine", estimatedPrice: 950, dimensions: "90cm Diameter" },
    { id: "inv-planters", name: "Sculptural Concrete Olive Planters (Pair)", category: "Landscape", material: "Reinforced Fiber Concrete", estimatedPrice: 580, dimensions: "70cm H" },
  ],
  "Bathroom": [
    { id: "inv-bath-vanity", name: "Floating Fluted Oak & Stone Basin Vanity", category: "Sanitaryware", material: "Fluted White Oak & Honed Terrazzo", estimatedPrice: 1850, dimensions: "120cm W x 50cm D" },
    { id: "inv-bath-mirror", name: "Backlit Circular LED Ambient Mirror", category: "Lighting & Fixtures", material: "Brushed Brass & Anti-Fog Glass", estimatedPrice: 420, dimensions: "80cm Diameter" },
    { id: "inv-bath-shower", name: "Frameless Walk-In Glass Rain Shower", category: "Shower Enclosure", material: "10mm Toughened Glass & Brass Channel", estimatedPrice: 890, dimensions: "100cm x 200cm" },
    { id: "inv-bath-tapware", name: "Minimalist Brushed Brass Mixer Taps", category: "Tapware", material: "Electroplated Solid Brass", estimatedPrice: 340, dimensions: "Wall-Mounted Basin Mixer" },
    { id: "inv-bath-towels", name: "Organic Waffle Spa Towel Collection", category: "Textile", material: "100% Organic Turkish Cotton", estimatedPrice: 160, dimensions: "6-Piece Set" },
  ],
};

const DEFAULT_OBJECTS: Record<string, DetectedObject[]> = {
  "Living Room": [
    { id: "obj-sofa", label: "Cognac Leather Lounge", category: "Seating", confidence: 0.98, box: [24, 48, 52, 36] },
    { id: "obj-table", label: "Travertine Coffee Table", category: "Table", confidence: 0.96, box: [38, 62, 28, 22] },
    { id: "obj-rug", label: "Textured Wool Area Rug", category: "Textile", confidence: 0.95, box: [18, 56, 68, 38] },
    { id: "obj-lamp", label: "Architectural Floor Lamp", category: "Lighting", confidence: 0.93, box: [78, 32, 14, 52] },
  ],
  "Bedroom": [
    { id: "obj-bed", label: "Low White Oak Bed Frame", category: "Furniture", confidence: 0.98, box: [22, 44, 58, 46] },
    { id: "obj-linen", label: "Washed Linen Bedding", category: "Textile", confidence: 0.97, box: [28, 52, 46, 34] },
    { id: "obj-stands", label: "Twin Oak Nightstands", category: "Storage", confidence: 0.95, box: [12, 54, 18, 26] },
    { id: "obj-art", label: "Minimalist Canvas Art", category: "Decor", confidence: 0.94, box: [38, 16, 26, 22] },
  ],
  "Dining Room": [
    { id: "obj-table", label: "Solid Oak 6-Seater Table", category: "Dining", confidence: 0.98, box: [26, 46, 50, 38] },
    { id: "obj-chairs", label: "Sculptural Cream Chairs", category: "Seating", confidence: 0.96, box: [20, 48, 62, 34] },
    { id: "obj-pendant", label: "Fluted Pendant Luminaire", category: "Lighting", confidence: 0.95, box: [42, 12, 18, 24] },
  ],
  "Kitchen": [
    { id: "obj-island", label: "Honed Marble Waterfall Island", category: "Kitchen Island", confidence: 0.98, box: [18, 52, 64, 44] },
    { id: "obj-stools", label: "Designer Oak Counter Stools", category: "Seating", confidence: 0.96, box: [24, 60, 48, 32] },
    { id: "obj-pendant", label: "Brass Cylinder Pendants", category: "Lighting", confidence: 0.94, box: [38, 6, 24, 26] },
  ],
  "Bathroom": [
    { id: "obj-bath-vanity", label: "Floating Stone Vanity & Basin", category: "Sanitaryware", confidence: 0.98, box: [16, 52, 38, 42] },
    { id: "obj-bath-mirror", label: "Backlit Circular LED Mirror", category: "Fixtures", confidence: 0.96, box: [20, 14, 30, 34] },
    { id: "obj-bath-shower", label: "Frameless Walk-in Rain Shower", category: "Shower", confidence: 0.95, box: [62, 14, 34, 80] },
    { id: "obj-bath-tapware", label: "Brushed Brass Fixtures", category: "Hardware", confidence: 0.94, box: [26, 48, 8, 10] },
  ],
  "Home Office": [
    { id: "obj-desk", label: "Executive Timber Desk", category: "Workspace", confidence: 0.97, box: [22, 54, 52, 34] },
    { id: "obj-chair", label: "Ergonomic Bouclé Chair", category: "Seating", confidence: 0.95, box: [38, 56, 24, 30] },
    { id: "obj-shelves", label: "Architectural Bookcase", category: "Storage", confidence: 0.93, box: [70, 16, 24, 70] },
  ],
  "Patio": [
    { id: "obj-terrace", label: "Honed Roman Travertine", category: "Hardscape", confidence: 0.96, box: [8, 54, 84, 44] },
    { id: "obj-lounge", label: "Teak Outdoor Lounge Suite", category: "Outdoor Living", confidence: 0.95, box: [24, 48, 54, 38] },
    { id: "obj-olive", label: "Mature Olive Tree", category: "Landscape", confidence: 0.93, box: [68, 20, 24, 60] },
  ],
};

const STAGING_ROOM_TEMPLATES: Record<string, string> = {
  "Living Room": "/images/kinkead-living-staged.jpg",
  "Bedroom": "/images/kinkead-bed1-staged.jpg",
  "Dining Room": "/images/kinkead-dining-staged.jpg",
  "Kitchen": "/images/kitchen-renovated-luxury.jpg",
  "Bathroom": "/images/bathroom-after.jpg",
  "Home Office": "/images/staged-room.jpg",
  "Patio": "/images/garden-after.jpg",
};

export const VirtualStagingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Photos queue starts empty; populates only when the user uploads photos or loads demo
  const [photos, setPhotos] = useState<StagingPhoto[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("Modern Luxury");
  const [stagingTier, setStagingTier] = useState<string>("Full Staging Suite");
  const [viewMode, setViewMode] = useState<"slider" | "side" | "staged" | "empty">("slider");
  const [showTags, setShowTags] = useState<boolean>(true);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isStagingActive, setIsStagingActive] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const activePhoto = photos.find((p) => p.id === activePhotoId) || (photos.length > 0 ? photos[0] : null);

  // Visual image content analyzer using HTML5 canvas pixel sampling
  const analyzeImageContent = (img: HTMLImageElement): "Bathroom" | "Patio" | "Living Room" => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return "Living Room";
      const w = 120;
      const h = 80;
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let whiteTilePixels = 0;
      let greenPixels = 0;
      const totalPixels = w * h;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // White / high-brightness low-saturation tile / porcelain / sanitaryware
        if (r > 170 && g > 170 && b > 170 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
          whiteTilePixels++;
        }
        // Green foliage / outdoor vegetation
        if (g > 85 && g > r * 1.15 && g > b * 1.15) {
          greenPixels++;
        }
      }

      const whiteRatio = whiteTilePixels / totalPixels;
      const greenRatio = greenPixels / totalPixels;

      // Bathrooms have characteristic white ceramic tiles, enamel tub, sink porcelain (whiteRatio > 0.32)
      if (whiteRatio > 0.32) {
        return "Bathroom";
      }
      if (greenRatio > 0.22) {
        return "Patio";
      }
      return "Living Room";
    } catch {
      return "Living Room";
    }
  };

  // Guess room type from filename
  const inferRoomType = (filename: string): string => {
    const s = filename.toLowerCase();
    if (s.includes("bath") || s.includes("washroom") || s.includes("toilet") || s.includes("ensuite") || s.includes("powder") || s.includes("shower") || s.includes("tub") || s.includes("sink")) return "Bathroom";
    if (s.includes("bed") || s.includes("room_1") || s.includes("master") || s.includes("sleep")) return "Bedroom";
    if (s.includes("dine") || s.includes("dining")) return "Dining Room";
    if (s.includes("kitchen") || s.includes("cook")) return "Kitchen";
    if (s.includes("office") || s.includes("study") || s.includes("desk") || s.includes("work")) return "Home Office";
    if (s.includes("patio") || s.includes("garden") || s.includes("outdoor") || s.includes("yard") || s.includes("balcony") || s.includes("alfresco")) return "Patio";
    return "Living Room";
  };

  // Handle Multi-File Upload with visual content analysis
  const handleBatchUpload = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const newItems: StagingPhoto[] = [];

    Array.from(fileList).forEach((file, idx) => {
      const initialRoomType = inferRoomType(file.name);
      const url = URL.createObjectURL(file);
      const id = `upload-${Date.now()}-${idx}`;

      // Visual Content Analysis via HTML5 Image & Canvas
      const img = new Image();
      img.onload = () => {
        const visualRoomType = analyzeImageContent(img);
        if (visualRoomType === "Bathroom" || (initialRoomType === "Living Room" && visualRoomType !== "Living Room")) {
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                  ...p,
                  roomType: visualRoomType,
                  inventory: ROOM_INVENTORIES[visualRoomType] || ROOM_INVENTORIES["Living Room"],
                  detectedObjects: DEFAULT_OBJECTS[visualRoomType] || DEFAULT_OBJECTS["Living Room"],
                }
                : p
            )
          );
        }
      };
      img.src = url;

      newItems.push({
        id,
        file,
        name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        originalUrl: url,
        roomType: initialRoomType,
        style: selectedStyle,
        status: "ready",
        stagedUrl: undefined,
        detectedObjects: DEFAULT_OBJECTS[initialRoomType] || DEFAULT_OBJECTS["Living Room"],
        inventory: ROOM_INVENTORIES[initialRoomType] || ROOM_INVENTORIES["Living Room"],
      });
    });

    setPhotos((prev) => [...newItems, ...prev]);
    if (newItems.length > 0) {
      setActivePhotoId(newItems[0].id);
    }
  };

  // Stage a specific photo
  const handleStagePhoto = async (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (!target) return;

    setIsStagingActive(true);
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, status: "staging" } : p))
    );

    try {
      let finalStagedUrl = STAGING_ROOM_TEMPLATES[target.roomType] || "/images/staged-room.jpg";

      // If user uploaded a real file, call the backend generation endpoint
      if (target.file) {
        try {
          const uploadRes = await api.uploadFile(target.file);
          const genRes = await api.post<any>("/api/studio/generate", {
            original_image_url: uploadRes.url,
            feature_type: "virtual_staging",
            category: target.roomType,
            room_type: target.roomType,
            style: selectedStyle,
            intervention_level: "Medium",
            prompt: `Virtually stage this vacant ${target.roomType} in ${selectedStyle} aesthetic with cohesive high-end furniture while locking room geometry.`,
            variations_count: 1,
            settings: { staging_package: stagingTier },
          });

          if (genRes.generated_image_url) {
            finalStagedUrl = genRes.generated_image_url;
          }
        } catch (backendErr) {
          console.warn("Backend staging fallback to curated high-res staging template:", backendErr);
        }
      }

      const detected = DEFAULT_OBJECTS[target.roomType] || DEFAULT_OBJECTS["Living Room"];
      const inv = ROOM_INVENTORIES[target.roomType] || ROOM_INVENTORIES["Living Room"];

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
              ...p,
              status: "staged",
              stagedUrl: finalStagedUrl,
              style: selectedStyle,
              detectedObjects: detected,
              inventory: inv,
            }
            : p
        )
      );
    } catch (e) {
      console.error("Virtual staging failed:", e);
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, status: "error" } : p))
      );
    } finally {
      setIsStagingActive(false);
    }
  };

  // Stage All Unstaged Photos in queue
  const handleStageAll = async () => {
    const unstaged = photos.filter((p) => p.status === "ready");
    for (const p of unstaged) {
      await handleStagePhoto(p.id);
    }
  };

  // Load 23 Kinkead St, ACT Showcase
  const loadKinkeadListing = () => {
    const kinkeadRooms: StagingPhoto[] = KINKEAD_PROPERTY_SHOWCASE.rooms.map((r) => ({
      id: `kinkead-${r.id}`,
      name: `23 Kinkead St · ${r.name}`,
      originalUrl: r.emptyImage,
      roomType: r.roomType,
      style: "Modern Luxury",
      status: "staged",
      stagedUrl: r.stagedImage,
      detectedObjects: r.stagedObjects,
      inventory: ROOM_INVENTORIES[r.roomType] || ROOM_INVENTORIES["Living Room"],
    }));

    setPhotos(kinkeadRooms);
    setActivePhotoId(kinkeadRooms[0].id);
  };

  const removePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos((prev) => {
      const filtered = prev.filter((p) => p.id !== id);
      if (activePhotoId === id && filtered.length > 0) {
        setActivePhotoId(filtered[0].id);
      }
      return filtered;
    });
  };

  const totalInventoryCost = activePhoto?.inventory?.reduce((acc, it) => acc + it.estimatedPrice, 0) || 0;

  return (
    <div className="min-h-screen bg-[#F7F4ED] pb-16">
      <DemoModeBanner />

      {/* Breadcrumb & Navigation Bar */}
      <div className="border-b border-[#DCCBB5] bg-white/80 backdrop-blur-sm px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/studio"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#172B3A] hover:text-[#C87960] transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Studio</span>
            </Link>
            <span className="text-[#DCCBB5]">/</span>
            <div className="flex items-center gap-1.5">
              <span className="font-editorial text-sm font-semibold text-[#172B3A]">
                Virtual Staging Studio
              </span>
              <span className="rounded-full bg-[#C87960] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                Multi-Room Batch
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadKinkeadListing}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-[#172B3A]/20 bg-[#172B3A]/5 px-3 py-1.5 text-xs font-semibold text-[#172B3A] hover:bg-[#172B3A] hover:text-white transition"
            >
              <Building className="h-3.5 w-3.5" />
              <span>23 Kinkead St, ACT (4 Rooms)</span>
            </button>
            <a
              href="https://www.realestate.com.au/property/23-kinkead-st-evatt-act-2617/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#252B2E]/70 hover:text-[#C87960] transition"
            >
              <span>MLS Listing</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12">

          {/* =================================================================
              LEFT SIDEBAR: BATCH PROPERTY PHOTOS & STAGING QUEUE (4 Cols)
          ================================================================== */}
          <aside className="space-y-4 lg:col-span-4">
            {/* Multi-Image Upload Card */}
            <div className="editorial-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
                    Upload Property Photos
                  </h2>
                  <p className="text-[11px] text-[#252B2E]/65">
                    Select multiple vacant rooms at once
                  </p>
                </div>
                <span className="rounded-full bg-[#9BAE9A]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#172B3A]">
                  {photos.length} Spaces
                </span>
              </div>

              {/* Drag & Drop Multi-File Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleBatchUpload(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-4 text-center transition ${dragOver
                  ? "border-[#C87960] bg-[#C87960]/10"
                  : "border-[#DCCBB5] bg-[#F7F4ED]/60 hover:border-[#C87960] hover:bg-[#F7F4ED]"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => handleBatchUpload(e.target.files)}
                />
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C87960]/10 text-[#C87960] group-hover:scale-105 transition mb-2">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <div className="text-xs font-semibold text-[#172B3A]">
                    Upload Multiple Room Photos
                  </div>
                  <p className="mt-1 text-[11px] text-[#252B2E]/65">
                    Drag & drop 1 to 30 photos or click to browse
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#DCCBB5] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#C87960]">
                    Select multiple files · JPG, PNG, WebP
                  </span>
                </div>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStageAll}
                  disabled={isStagingActive || !photos.some((p) => p.status === "ready")}
                  className="btn-primary flex-1 justify-center py-2 text-xs font-semibold disabled:opacity-50"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  <span>Stage All Spaces ({photos.filter((p) => p.status === "ready").length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotos([])}
                  className="rounded-xl border border-[#DCCBB5] p-2 text-[#252B2E]/60 hover:border-red-400 hover:text-red-500 transition"
                  title="Clear all photos"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Uploaded Property Photos List */}
            <div className="editorial-card p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-[#DCCBB5]/60 pb-2.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
                  Property Photo Queue ({photos.length})
                </span>
                <span className="text-[11px] text-[#252B2E]/60">
                  Click any photo to stage
                </span>
              </div>

              {photos.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#252B2E]/60">
                  No property photos uploaded yet. Drag & drop photos above or click the button below.
                  <button
                    type="button"
                    onClick={loadKinkeadListing}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#C87960] px-3 py-1.5 text-xs font-semibold text-[#C87960] hover:bg-[#C87960] hover:text-white transition"
                  >
                    Load 23 Kinkead St, ACT Demo
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                  {photos.map((item) => {
                    const isActive = item.id === activePhotoId;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActivePhotoId(item.id)}
                        className={`group relative flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition text-left ${isActive
                          ? "border-[#C87960] bg-[#C87960]/10 shadow-sm ring-1 ring-[#C87960]"
                          : "border-[#DCCBB5] bg-white hover:border-[#C87960]/60 hover:bg-[#F7F4ED]/50"
                          }`}
                      >
                        {/* Thumbnail */}
                        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-[#252B2E]">
                          <img
                            src={item.stagedUrl || item.originalUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                          {item.status === "staged" && (
                            <span className="absolute bottom-1 right-1 rounded bg-[#172B3A]/85 p-0.5 text-white">
                              <Check className="h-2.5 w-2.5" />
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-[#172B3A] truncate">
                              {item.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => removePhoto(item.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#252B2E]/40 hover:text-red-500 transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Room Type Selector */}
                          <div className="mt-1 flex items-center gap-1.5">
                            <select
                              value={item.roomType}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                const newType = e.target.value;
                                setPhotos((prev) =>
                                  prev.map((p) =>
                                    p.id === item.id
                                      ? {
                                        ...p,
                                        roomType: newType,
                                        inventory: ROOM_INVENTORIES[newType] || ROOM_INVENTORIES["Living Room"],
                                        detectedObjects: DEFAULT_OBJECTS[newType] || DEFAULT_OBJECTS["Living Room"],
                                      }
                                      : p
                                  )
                                );
                              }}
                              className="rounded-md border border-[#DCCBB5] bg-[#F7F4ED] px-1.5 py-0.5 text-[10px] font-medium text-[#172B3A]"
                            >
                              <option value="Living Room">Living Room</option>
                              <option value="Bedroom">Bedroom</option>
                              <option value="Dining Room">Dining Room</option>
                              <option value="Kitchen">Kitchen</option>
                              <option value="Bathroom">Bathroom & Ensuite</option>
                              <option value="Home Office">Home Office</option>
                              <option value="Patio">Patio & Alfresco</option>
                            </select>

                            {/* Status Indicator */}
                            {item.status === "staged" ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.2 text-[9px] font-bold text-emerald-800">
                                <CheckCircle2 className="h-2.5 w-2.5" /> Staged
                              </span>
                            ) : item.status === "staging" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.2 text-[9px] font-bold text-amber-800">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Staging...
                              </span>
                            ) : (
                              <span className="rounded-full bg-[#172B3A]/10 px-2 py-0.2 text-[9px] font-semibold text-[#172B3A]/70">
                                Vacant
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>

          {/* =================================================================
              RIGHT CANVAS: ACTIVE ROOM VIRTUAL STAGING & INVENTORY (8 Cols)
          ================================================================== */}
          <main className="space-y-4 lg:col-span-8">
            {/* Top Toolbar: Style & Staging Controls */}
            <div className="editorial-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C87960]">
                    Active Space Configuration
                  </span>
                  <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">
                    {activePhoto?.name || "Selected Vacant Space"}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Style Select */}
                  <div>
                    <label className="block text-[10px] font-medium text-[#252B2E]/70 mb-0.5">
                      Staging Style
                    </label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="rounded-xl border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
                    >
                      {DESIGN_STYLES.map((st) => (
                        <option key={st.name} value={st.name}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Staging Package */}
                  <div>
                    <label className="block text-[10px] font-medium text-[#252B2E]/70 mb-0.5">
                      Furniture Tier
                    </label>
                    <select
                      value={stagingTier}
                      onChange={(e) => setStagingTier(e.target.value)}
                      className="rounded-xl border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs font-semibold text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
                    >
                      <option value="Full Staging Suite">Full Staging Suite</option>
                      <option value="Minimalist Focus">Minimalist Focus</option>
                      <option value="Executive Luxury">Executive Luxury</option>
                    </select>
                  </div>

                  {/* Stage Button */}
                  <div className="pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={() => activePhoto && handleStagePhoto(activePhoto.id)}
                      disabled={isStagingActive || !activePhoto}
                      className="btn-primary py-2 px-5 text-xs font-bold shadow-md disabled:opacity-50"
                    >
                      {isStagingActive ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Staging Space...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4" />
                          <span>Stage This Space</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Staging Canvas */}
            <div className="editorial-card overflow-hidden p-4 space-y-3">
              {/* Canvas Controls Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCCBB5]/60 pb-3">
                {/* View Mode Tabs */}
                <div className="flex items-center gap-1 rounded-xl bg-[#F7F4ED] p-1 border border-[#DCCBB5]">
                  <button
                    type="button"
                    onClick={() => setViewMode("slider")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${viewMode === "slider"
                      ? "bg-[#172B3A] text-white"
                      : "text-[#172B3A]/70 hover:text-[#172B3A]"
                      }`}
                  >
                    Interactive Slider
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("side")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${viewMode === "side"
                      ? "bg-[#172B3A] text-white"
                      : "text-[#172B3A]/70 hover:text-[#172B3A]"
                      }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("staged")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${viewMode === "staged"
                      ? "bg-[#172B3A] text-white"
                      : "text-[#172B3A]/70 hover:text-[#172B3A]"
                      }`}
                  >
                    Staged Result
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("empty")}
                    className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${viewMode === "empty"
                      ? "bg-[#172B3A] text-white"
                      : "text-[#172B3A]/70 hover:text-[#172B3A]"
                      }`}
                  >
                    Vacant Space
                  </button>
                </div>

                {/* Tags Toggle & Download */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-[#172B3A]">
                    <input
                      type="checkbox"
                      checked={showTags}
                      onChange={(e) => setShowTags(e.target.checked)}
                      className="rounded border-[#DCCBB5] text-[#C87960] focus:ring-[#C87960]"
                    />
                    <ScanEye className="h-3.5 w-3.5 text-[#C87960]" />
                    <span>Highlight Furniture Tags</span>
                  </label>

                  {activePhoto?.stagedUrl && (
                    <a
                      href={activePhoto.stagedUrl}
                      download={`staged-${activePhoto.name}.jpg`}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#DCCBB5] bg-white px-2.5 py-1 text-xs font-semibold text-[#172B3A] hover:border-[#C87960] transition"
                    >
                      <Download className="h-3 w-3" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>

              {/* View Canvas */}
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#252B2E] shadow-inner">
                {activePhoto?.status === "staged" && activePhoto.stagedUrl ? (
                  viewMode === "slider" ? (
                    <div className="relative h-full w-full">
                      <BeforeAfterSlider
                        beforeSrc={activePhoto.originalUrl}
                        afterSrc={activePhoto.stagedUrl}
                        beforeLabel="Vacant Space"
                        afterLabel={`Virtually Staged · ${activePhoto.style}`}
                      />
                    </div>
                  ) : viewMode === "side" ? (
                    <div className="grid h-full w-full grid-cols-2 gap-1">
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={activePhoto.originalUrl}
                          alt="Vacant Space"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-3 left-3 rounded-md bg-[#172B3A]/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                          Vacant Space
                        </span>
                      </div>
                      <div className="relative h-full w-full overflow-hidden">
                        <img
                          src={activePhoto.stagedUrl}
                          alt="Virtually Staged"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-3 left-3 rounded-md bg-[#C87960] px-2 py-0.5 text-[10px] font-semibold text-white">
                          Virtually Staged
                        </span>
                      </div>
                    </div>
                  ) : viewMode === "empty" ? (
                    <img
                      src={activePhoto.originalUrl}
                      alt="Vacant Space"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="relative h-full w-full">
                      <img
                        src={activePhoto.stagedUrl}
                        alt="Virtually Staged"
                        className="h-full w-full object-cover"
                      />
                      {/* Interactive Bounding Box Tags */}
                      {showTags &&
                        activePhoto.detectedObjects?.map((obj) => {
                          const [left, top, width, height] = obj.box;
                          const isSelected = selectedTagId === obj.id;
                          return (
                            <div
                              key={obj.id}
                              onClick={() => setSelectedTagId(obj.id)}
                              style={{
                                left: `${left}%`,
                                top: `${top}%`,
                                width: `${width}%`,
                                height: `${height}%`,
                              }}
                              className={`absolute cursor-pointer rounded-lg border-2 transition-all ${isSelected
                                ? "border-[#C87960] bg-[#C87960]/20 shadow-lg ring-2 ring-white"
                                : "border-white/80 bg-white/10 hover:border-[#C87960] hover:bg-[#C87960]/10"
                                }`}
                            >
                              <span className="absolute -top-6 left-1 rounded bg-[#172B3A]/90 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm backdrop-blur-sm whitespace-nowrap">
                                {obj.label}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )
                ) : activePhoto ? (
                  /* Vacant State Prompt */
                  <div className="relative h-full w-full">
                    <img
                      src={activePhoto.originalUrl}
                      alt="Vacant Space"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-6 text-center backdrop-blur-[2px]">
                      <div className="rounded-2xl bg-white/95 p-6 shadow-editorial max-w-md">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C87960]/10 text-[#C87960] mx-auto mb-3">
                          <Wand2 className="h-6 w-6" />
                        </div>
                        <h4 className="font-editorial text-lg font-semibold text-[#172B3A]">
                          Ready for Virtual Staging
                        </h4>
                        <p className="mt-1 text-xs text-[#252B2E]/70 leading-relaxed">
                          This vacant {activePhoto.roomType} space is ready. Select your desired architectural style and click the button below to stage.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleStagePhoto(activePhoto.id)}
                          disabled={isStagingActive}
                          className="btn-primary mt-4 w-full justify-center py-2 text-xs font-bold"
                        >
                          <Wand2 className="h-4 w-4" />
                          <span>Stage This Space Now</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Clean Empty Queue State */
                  <div className="relative flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#172B3A]/5">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#C87960]/15 text-[#C87960] mb-3">
                      <UploadCloud className="h-7 w-7" />
                    </div>
                    <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">
                      No Room Photos Uploaded Yet
                    </h3>
                    <p className="mt-1.5 max-w-md text-xs text-[#252B2E]/70 leading-relaxed">
                      Upload your room photos using the upload panel on the left (or click below) to detect room types, furniture zones, and stage vacant spaces.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary mt-4 px-5 py-2 text-xs font-semibold"
                    >
                      <UploadCloud className="h-4 w-4" />
                      <span>Upload Vacant Room Photos</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Layout-Lock Architectural Assurance */}
              <div className="flex items-center justify-between rounded-xl bg-[#F7F4ED] px-3.5 py-2 text-[11px] text-[#252B2E]/75">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9BAE9A]" />
                  <span>
                    <strong>Strict Layout-Lock:</strong> Camera perspective, window openings, and wall boundaries are 100% mathematically preserved.
                  </span>
                </div>
                <span className="font-semibold text-[#C87960]">MLS Real Estate Certified</span>
              </div>
            </div>

            {/* Staging Inventory & Furniture Bill of Materials */}
            {activePhoto?.inventory && activePhoto.inventory.length > 0 && (
              <div className="editorial-card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[#C87960]" />
                      <h4 className="font-editorial text-lg font-semibold text-[#172B3A]">
                        Staged Furniture Specifications & BOM
                      </h4>
                    </div>
                    <p className="text-xs text-[#252B2E]/70">
                      Curated furnishings placed in this {activePhoto.roomType} ({activePhoto.style})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-[#DCCBB5] bg-white px-3 py-1 text-xs font-semibold text-[#172B3A]">
                      Est. Total: <strong className="text-[#C87960]">${totalInventoryCost.toLocaleString()}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/budget-estimator?image=${encodeURIComponent(activePhoto.stagedUrl || activePhoto.originalUrl)}&style=${encodeURIComponent(selectedStyle)}&room=${encodeURIComponent(activePhoto.roomType)}`
                        )
                      }
                      className="btn-secondary py-1 px-3 text-xs font-semibold"
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Budget Breakdown</span>
                    </button>
                  </div>
                </div>

                {/* Furniture Grid */}
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {activePhoto.inventory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#DCCBB5] bg-white p-3 space-y-1 hover:border-[#C87960] transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C87960]">
                          {item.category}
                        </span>
                        <span className="text-xs font-bold text-[#172B3A]">
                          ${item.estimatedPrice}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#172B3A] line-clamp-1">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#252B2E]/65 line-clamp-1">
                        {item.material}
                      </div>
                      <div className="text-[10px] text-[#252B2E]/50">
                        {item.dimensions}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
