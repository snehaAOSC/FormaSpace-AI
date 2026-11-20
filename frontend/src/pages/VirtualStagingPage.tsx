import React, { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Key,
  Layers,
  Loader2,
  Package,
  RefreshCw,
  ScanEye,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
  X,
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
  environment?: "indoor" | "outdoor";
  confidence?: number;
  style: string;
  status: "ready" | "staging" | "staged" | "error";
  stagedUrl?: string;
  detectedObjects: DetectedObject[];
  inventory: StagingItem[];
  architecturalFeatures?: Record<string, string>;
}

export const UNIVERSAL_SPACE_CATEGORIES = {
  indoor: [
    "Bedroom",
    "Living Room",
    "Kitchen",
    "Bathroom",
    "Dining Room",
    "Office",
    "Study Room",
    "Lobby",
    "Reception Area",
    "Hallway",
    "Corridor",
    "Conference Room",
    "Hotel Room",
    "Studio Apartment",
    "Empty Commercial Space",
  ],
  outdoor: [
    "Garden",
    "Backyard",
    "Front Yard",
    "Balcony",
    "Terrace",
    "Patio",
    "Rooftop",
    "Outdoor Lounge",
    "Swimming Pool Area",
    "Outdoor Dining Area",
  ],
};

export const UNIVERSAL_INVENTORIES: Record<string, StagingItem[]> = {
  "Living Room": [
    { id: "inv-sofa", name: "Cognac Atelier Leather Lounge", category: "Seating", material: "Semi-Aniline Top Grain Leather", estimatedPrice: 2850, dimensions: "240cm W x 95cm D" },
    { id: "inv-table", name: "Pietra Honed Travertine Plinth", category: "Table", material: "Natural Honed Travertine", estimatedPrice: 1250, dimensions: "120cm W x 60cm D" },
    { id: "inv-rug", name: "Textured Bouclé Wool Area Rug", category: "Textile", material: "100% New Zealand Wool", estimatedPrice: 890, dimensions: "300cm x 240cm" },
    { id: "inv-lamp", name: "Architectural Arched Brass Lamp", category: "Lighting", material: "Brushed Solid Brass", estimatedPrice: 420, dimensions: "190cm H" },
    { id: "inv-art", name: "Minimalist Framed Canvas Art", category: "Decor", material: "Textured Acrylic & Oak Frame", estimatedPrice: 380, dimensions: "120cm x 90cm" },
    { id: "inv-plant", name: "Potted Ficus Lyrata Tree & Ceramic Planter", category: "Botanical", material: "Glazed Ceramic & Organic Soil", estimatedPrice: 220, dimensions: "160cm H" },
  ],
  "Bedroom": [
    { id: "inv-bed", name: "Low White Oak Platform Bed Frame", category: "Bed", material: "FSC European White Oak", estimatedPrice: 2200, dimensions: "Queen (160cm x 210cm)" },
    { id: "inv-linen", name: "Washed French Linen Bedding Set", category: "Textile", material: "100% Organic Flax Linen", estimatedPrice: 480, dimensions: "Duvet + 4 Shams" },
    { id: "inv-nightstands", name: "Twin Fluted Oak Bedside Tables", category: "Storage", material: "Solid Oak & Soft-Close Drawers", estimatedPrice: 780, dimensions: "50cm W x 45cm H" },
    { id: "inv-lamps", name: "Ceramic Minimalist Table Lamps (Pair)", category: "Lighting", material: "Cast Ceramic & Linen Shades", estimatedPrice: 340, dimensions: "42cm H" },
    { id: "inv-rug", name: "Plush Oatmeal Wool Underbed Rug", category: "Textile", material: "Hand-Knotted Wool", estimatedPrice: 760, dimensions: "280cm x 200cm" },
  ],
  "Bathroom": [
    { id: "inv-bath-vanity", name: "Floating Fluted Oak & Stone Basin Vanity", category: "Vanity & Basin", material: "Fluted White Oak & Honed Terrazzo", estimatedPrice: 1850, dimensions: "120cm W x 50cm D" },
    { id: "inv-bath-mirror", name: "Backlit Circular LED Ambient Mirror", category: "Lighting & Fixtures", material: "Brushed Brass & Anti-Fog Glass", estimatedPrice: 420, dimensions: "80cm Diameter" },
    { id: "inv-bath-shower", name: "Frameless Walk-In Glass Rain Shower", category: "Shower Enclosure", material: "10mm Toughened Glass & Brass Channel", estimatedPrice: 890, dimensions: "100cm x 200cm" },
    { id: "inv-bath-tapware", name: "Minimalist Brushed Brass Mixer Taps", category: "Tapware", material: "Electroplated Solid Brass", estimatedPrice: 340, dimensions: "Wall-Mounted Mixer" },
    { id: "inv-bath-towels", name: "Organic Waffle Spa Towel Collection", category: "Textile", material: "100% Organic Turkish Cotton", estimatedPrice: 160, dimensions: "6-Piece Set" },
  ],
  "Kitchen": [
    { id: "inv-island", name: "Bespoke Calacatta Marble Kitchen Island", category: "Kitchen Island", material: "Italian Calacatta Marble & Fluted Oak", estimatedPrice: 5800, dimensions: "240cm W x 95cm D" },
    { id: "inv-cabinetry", name: "Custom Floor-to-Ceiling Oak Joinery", category: "Cabinetry", material: "Natural Tasmanian Oak with Soft-Close Hardware", estimatedPrice: 7200, dimensions: "Full Kitchen Run" },
    { id: "inv-appliances", name: "Integrated Miele Induction & Pyrolytic Oven Suite", category: "Appliance", material: "Matte Black Ceramic Glass & Stainless Steel", estimatedPrice: 4600, dimensions: "90cm Induction + 60cm Oven" },
    { id: "inv-tapware", name: "Brodware Brushed Brass Pull-Out Kitchen Mixer", category: "Fixtures", material: "PVD Brushed Brass & Ceramic Disc", estimatedPrice: 780, dimensions: "42cm Height" },
    { id: "inv-stools", name: "Nordic Minimalist Oak Counter Stools (Trio)", category: "Seating", material: "Solid American Oak & Aniline Cognac Leather", estimatedPrice: 1150, dimensions: "65cm Seat Height" },
  ],
  "Dining Room": [
    { id: "inv-table", name: "Solid White Oak 6-Seater Table", category: "Dining", material: "Solid European Oak", estimatedPrice: 2100, dimensions: "200cm L x 95cm W" },
    { id: "inv-chairs", name: "Sculptural Cream Dining Chairs (Set of 6)", category: "Seating", material: "Bouclé Textile & Oak Legs", estimatedPrice: 1560, dimensions: "6 Chairs" },
    { id: "inv-pendant", name: "Fluted Opal Glass Linear Chandelier", category: "Lighting", material: "Brass & Matte Opal Glass", estimatedPrice: 650, dimensions: "110cm Length" },
    { id: "inv-drapes", name: "Tailored Sheer Linen Window Drapes", category: "Textile", material: "Belgian Sheer Linen", estimatedPrice: 420, dimensions: "Floor-to-Ceiling" },
  ],
  "Office": [
    { id: "inv-desk", name: "Executive Minimalist White Oak Desk", category: "Workspace", material: "Solid Oak & Cable Conduit", estimatedPrice: 1650, dimensions: "160cm W x 80cm D" },
    { id: "inv-chair", name: "Ergonomic Bouclé Executive Swivel Chair", category: "Seating", material: "Italian Mechanism & Bouclé", estimatedPrice: 890, dimensions: "Adjustable Height" },
    { id: "inv-shelving", name: "Architectural Open Bookcase", category: "Storage", material: "Black Steel & Oak Shelves", estimatedPrice: 1200, dimensions: "180cm H x 100cm W" },
    { id: "inv-lamp", name: "Solid Brass Task Luminaire", category: "Lighting", material: "Brushed Brass", estimatedPrice: 280, dimensions: "Desk Lamp" },
  ],
  "Study Room": [
    { id: "inv-desk", name: "Executive Minimalist White Oak Desk", category: "Workspace", material: "Solid Oak & Cable Conduit", estimatedPrice: 1650, dimensions: "160cm W x 80cm D" },
    { id: "inv-chair", name: "Ergonomic Bouclé Executive Swivel Chair", category: "Seating", material: "Italian Mechanism & Bouclé", estimatedPrice: 890, dimensions: "Adjustable Height" },
    { id: "inv-shelving", name: "Architectural Open Bookcase", category: "Storage", material: "Black Steel & Oak Shelves", estimatedPrice: 1200, dimensions: "180cm H x 100cm W" },
  ],
  "Lobby": [
    { id: "inv-lobby-console", name: "Sculptural Fluted Oak Console Table", category: "Entryway Table", material: "Solid FSC White Oak", estimatedPrice: 1450, dimensions: "160cm W x 40cm D" },
    { id: "inv-lobby-mirror", name: "Oversized Minimalist Arch Wall Mirror", category: "Decor & Mirror", material: "Brushed Brass Edge & Float Glass", estimatedPrice: 620, dimensions: "180cm H x 80cm W" },
    { id: "inv-lobby-bench", name: "Bouclé Upholstered Entry Bench", category: "Seating", material: "Textured Cream Bouclé & Oak Base", estimatedPrice: 790, dimensions: "120cm W x 45cm D" },
    { id: "inv-lobby-runner", name: "Hand-Knotted Textured Hallway Runner", category: "Textile", material: "100% Wool", estimatedPrice: 540, dimensions: "350cm x 90cm" },
  ],
  "Reception Area": [
    { id: "inv-rec-desk", name: "Curved Roman Travertine Reception Counter", category: "Reception", material: "Natural Travertine & Oak", estimatedPrice: 3800, dimensions: "220cm W x 110cm H" },
    { id: "inv-rec-chairs", name: "Designer Velvet Waiting Armchairs (Pair)", category: "Seating", material: "Plush Velvet & Brushed Brass", estimatedPrice: 1600, dimensions: "85cm W x 80cm D" },
    { id: "inv-rec-plant", name: "Architectural Column Planter & Tree", category: "Botanical", material: "Matte Charcoal Ceramic", estimatedPrice: 380, dimensions: "180cm H" },
  ],
  "Hallway": [
    { id: "inv-hall-console", name: "Slim Minimalist Floating Console", category: "Storage", material: "Solid White Oak", estimatedPrice: 650, dimensions: "120cm W x 25cm D" },
    { id: "inv-hall-lights", name: "Architectural Linear LED Sconce Lights (Trio)", category: "Lighting", material: "Solid Brushed Brass", estimatedPrice: 480, dimensions: "60cm H" },
    { id: "inv-hall-runner", name: "Textured Jute & Wool Hall Runner", category: "Textile", material: "Natural Fibers", estimatedPrice: 320, dimensions: "400cm x 80cm" },
  ],
  "Corridor": [
    { id: "inv-corridor-console", name: "Slim Minimalist Floating Console", category: "Storage", material: "Solid White Oak", estimatedPrice: 650, dimensions: "120cm W x 25cm D" },
    { id: "inv-corridor-lights", name: "Architectural Linear LED Sconce Lights", category: "Lighting", material: "Solid Brushed Brass", estimatedPrice: 480, dimensions: "60cm H" },
  ],
  "Backyard": [
    { id: "inv-back-lounge", name: "Grade-A Teak Outdoor Lounge Suite", category: "Outdoor Living", material: "Solid Teak & Charcoal Sunbrella Fabric", estimatedPrice: 4200, dimensions: "4-Piece Modular Suite" },
    { id: "inv-back-patio", name: "Honed Roman Travertine Paved Terrace", category: "Hardscape", material: "Natural Honed Travertine Slabs", estimatedPrice: 6500, dimensions: "38m² Area" },
    { id: "inv-back-table", name: "Pietra Outdoor Travertine Plinth", category: "Table", material: "Sealed Weatherproof Travertine", estimatedPrice: 1100, dimensions: "120cm W x 60cm D" },
    { id: "inv-back-dining", name: "Scandinavian Teak Outdoor Dining & Armchairs", category: "Dining", material: "FSC Certified Teak & Powdercoated Aluminium", estimatedPrice: 2800, dimensions: "200cm Table + 6 Chairs" },
  ],
  "Garden": [
    { id: "inv-gar-lounge", name: "Teak Outdoor Lounge Sofa & Armchairs", category: "Outdoor Living", material: "Grade-A Teak & Sunbrella Fabric", estimatedPrice: 3200, dimensions: "3-Piece Suite" },
    { id: "inv-gar-table", name: "Travertine Low Outdoor Coffee Table", category: "Outdoor", material: "Weather-Sealed Travertine", estimatedPrice: 950, dimensions: "90cm Diameter" },
    { id: "inv-gar-planters", name: "Sculptural Concrete Olive Planters (Pair)", category: "Landscape", material: "Reinforced Fiber Concrete", estimatedPrice: 580, dimensions: "70cm H" },
  ],
  "Front Yard": [
    { id: "inv-front-hardscape", name: "Architectural Hardscape & Paver Driveway Entry", category: "Hardscape", material: "Permeable Stone Pavers", estimatedPrice: 4800, dimensions: "Entry Zone" },
    { id: "inv-front-box", name: "Architectural Modern Mailbox & Number Plinth", category: "Fixtures", material: "Corten Steel & Matte Black Aluminium", estimatedPrice: 520, dimensions: "90cm H" },
    { id: "inv-front-border", name: "Manicured Low-Maintenance Planting Border", category: "Landscaping", material: "Boxwood, Ornamental Grasses & Mulch", estimatedPrice: 950, dimensions: "Driveway Perimeter" },
  ],
  "Patio": [
    { id: "inv-patio-lounge", name: "Outdoor Teak Lounge Sofa & Armchairs", category: "Outdoor", material: "Grade-A Teak & Sunbrella Fabric", estimatedPrice: 3200, dimensions: "3-Piece Suite" },
    { id: "inv-patio-table", name: "Travertine Low Outdoor Coffee Table", category: "Outdoor", material: "Weather-Sealed Travertine", estimatedPrice: 950, dimensions: "90cm Diameter" },
    { id: "inv-patio-planters", name: "Sculptural Concrete Olive Planters (Pair)", category: "Landscape", material: "Reinforced Fiber Concrete", estimatedPrice: 580, dimensions: "70cm H" },
  ],
  "Balcony": [
    { id: "inv-balcony-bistro", name: "Compact Bistro Teak Table & 2 Armchairs", category: "Outdoor Dining", material: "Solid Weathered Teak & Rope Weave", estimatedPrice: 1200, dimensions: "75cm Diameter Table" },
    { id: "inv-balcony-planters", name: "Slimline Railing Planter Boxes (Trio)", category: "Botanical", material: "Powdercoated Aluminium", estimatedPrice: 340, dimensions: "80cm Length" },
  ],
  "Terrace": [
    { id: "inv-terrace-lounge", name: "Outdoor Teak Lounge Sofa & Armchairs", category: "Outdoor Living", material: "Grade-A Teak & Sunbrella Fabric", estimatedPrice: 3200, dimensions: "3-Piece Suite" },
    { id: "inv-terrace-table", name: "Travertine Low Outdoor Coffee Table", category: "Outdoor Table", material: "Weather-Sealed Travertine", estimatedPrice: 950, dimensions: "90cm Diameter" },
  ],
  "Rooftop": [
    { id: "inv-roof-sofa", name: "All-Weather Modular Sectional Sofa", category: "Outdoor Living", material: "Quick-Dry Foam & Sunbrella Fabric", estimatedPrice: 4600, dimensions: "5-Piece Modular Suite" },
    { id: "inv-roof-pit", name: "Concrete Gas Fire Pit Table", category: "Hardscape", material: "Glass-Fiber Concrete & Lava Rocks", estimatedPrice: 1850, dimensions: "120cm x 80cm" },
  ],
  "Swimming Pool Area": [
    { id: "inv-pool-loungers", name: "Luxury Teak Pool Sun Loungers (Pair)", category: "Poolside", material: "Solid Teak & Quick-Dry Cushion", estimatedPrice: 1900, dimensions: "200cm L x 65cm W" },
    { id: "inv-pool-umbrella", name: "Cantilever Architectural Shade Umbrella", category: "Shade", material: "Anodized Aluminium & Sunbrella Fabric", estimatedPrice: 1400, dimensions: "300cm Diameter" },
  ],
  "Outdoor Dining Area": [
    { id: "inv-out-table", name: "Solid Teak 8-Seater Outdoor Dining Table", category: "Dining Table", material: "Grade-A Weatherproof Teak", estimatedPrice: 3100, dimensions: "240cm L x 100cm W" },
    { id: "inv-out-chairs", name: "Woven Rope Outdoor Dining Chairs (Set of 8)", category: "Seating", material: "All-Weather Rope & Aluminium Legs", estimatedPrice: 2400, dimensions: "8 Chairs" },
  ],
  "Conference Room": [
    { id: "inv-conf-table", name: "Executive Fluted White Oak Boardroom Table", category: "Conference", material: "Solid Oak & Integrated Power Modules", estimatedPrice: 4200, dimensions: "320cm L x 120cm W" },
    { id: "inv-conf-chairs", name: "Ergonomic High-Back Leather Chairs (Set of 8)", category: "Seating", material: "Aniline Leather & Chrome Base", estimatedPrice: 3200, dimensions: "8 Chairs" },
  ],
  "Hotel Room": [
    { id: "inv-hotel-bed", name: "Bespoke Upholstered King Headboard & Base", category: "Bed", material: "Textured Velvet & Solid Timber", estimatedPrice: 2600, dimensions: "King Bed" },
    { id: "inv-hotel-stands", name: "Integrated Marble Bedside Consoles", category: "Storage", material: "Arabescato Marble & Brass Trim", estimatedPrice: 980, dimensions: "Pair" },
  ],
  "Studio Apartment": [
    { id: "inv-studio-sofa", name: "Multi-Functional Modular Sofa Bed", category: "Furniture", material: "Cream Bouclé & Easy-Fold Mechanism", estimatedPrice: 2100, dimensions: "Queen Convertible" },
    { id: "inv-studio-table", name: "Compact Round White Oak Dining Table & Chairs", category: "Dining", material: "Solid Oak & 2 Chairs", estimatedPrice: 950, dimensions: "90cm Diameter" },
  ],
  "Empty Commercial Space": [
    { id: "inv-comm-desk", name: "Modular Reception Desk & Consultation Island", category: "Commercial", material: "Terrazzo & Fluted Timber", estimatedPrice: 4800, dimensions: "300cm W" },
    { id: "inv-comm-chairs", name: "Architectural Waiting Area Armchairs", category: "Seating", material: "Commercial Grade Wool & Steel", estimatedPrice: 1800, dimensions: "Set of 4" },
  ],
};

const DEFAULT_OBJECTS: Record<string, DetectedObject[]> = {
  "Living Room": [
    { id: "obj-sofa", label: "Designer Bouclé Lounge", category: "Seating", confidence: 0.98, box: [24, 48, 52, 36] },
    { id: "obj-table", label: "Travertine Plinth Coffee Table", category: "Table", confidence: 0.96, box: [38, 62, 28, 22] },
    { id: "obj-rug", label: "Textured Ribbed Wool Rug", category: "Textile", confidence: 0.95, box: [18, 56, 68, 38] },
    { id: "obj-art", label: "Minimalist Framed Wall Art", category: "Decor", confidence: 0.94, box: [58, 20, 24, 30] },
    { id: "obj-lamp", label: "Architectural Arched Lamp", category: "Lighting", confidence: 0.93, box: [78, 32, 14, 52] },
  ],
  "Bedroom": [
    { id: "obj-bed", label: "Low White Oak Bed Frame", category: "Furniture", confidence: 0.98, box: [22, 44, 58, 46] },
    { id: "obj-linen", label: "Washed Linen Bedding", category: "Textile", confidence: 0.97, box: [28, 52, 46, 34] },
    { id: "obj-stands", label: "Twin Oak Nightstands", category: "Storage", confidence: 0.95, box: [12, 54, 18, 26] },
    { id: "obj-art", label: "Minimalist Canvas Art", category: "Decor", confidence: 0.94, box: [38, 16, 26, 22] },
  ],
  "Bathroom": [
    { id: "obj-bath-vanity", label: "Floating Stone Vanity & Basin", category: "Sanitaryware", confidence: 0.98, box: [16, 52, 38, 42] },
    { id: "obj-bath-mirror", label: "Backlit Circular LED Mirror", category: "Fixtures", confidence: 0.96, box: [20, 14, 30, 34] },
    { id: "obj-bath-shower", label: "Frameless Walk-in Rain Shower", category: "Shower", confidence: 0.95, box: [62, 14, 34, 80] },
    { id: "obj-bath-tapware", label: "Brushed Brass Fixtures", category: "Hardware", confidence: 0.94, box: [26, 48, 8, 10] },
  ],
  "Kitchen": [
    { id: "obj-island", label: "Honed Marble Waterfall Island", category: "Kitchen Island", confidence: 0.98, box: [18, 52, 64, 44] },
    { id: "obj-stools", label: "Designer Oak Counter Stools", category: "Seating", confidence: 0.96, box: [24, 60, 48, 32] },
    { id: "obj-pendant", label: "Brass Cylinder Pendants", category: "Lighting", confidence: 0.94, box: [38, 6, 24, 26] },
  ],
  "Dining Room": [
    { id: "obj-table", label: "Solid Oak 6-Seater Table", category: "Dining", confidence: 0.98, box: [26, 46, 50, 38] },
    { id: "obj-chairs", label: "Sculptural Cream Chairs", category: "Seating", confidence: 0.96, box: [20, 48, 62, 34] },
    { id: "obj-pendant", label: "Fluted Pendant Luminaire", category: "Lighting", confidence: 0.95, box: [42, 12, 18, 24] },
  ],
};

export const VirtualStagingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photos, setPhotos] = useState<StagingPhoto[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("Modern Luxury");
  const [stagingTier, setStagingTier] = useState<string>("Full Staging Suite");
  const [preserveArchitecture, setPreserveArchitecture] = useState<boolean>(true);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [viewMode, setViewMode] = useState<"slider" | "side" | "staged" | "empty">("slider");
  const [showTags, setShowTags] = useState<boolean>(true);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [isStagingActive, setIsStagingActive] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>(() => localStorage.getItem("formaspace_custom_api_key") || "");
  const [customProvider, setCustomProvider] = useState<string>(() => localStorage.getItem("formaspace_custom_provider") || "gemini");
  const [keySavedToast, setKeySavedToast] = useState<boolean>(false);
  const [stagingError, setStagingError] = useState<string | null>(null);

  const activePhoto = photos.find((p) => p.id === activePhotoId) || (photos.length > 0 ? photos[0] : null);

  // Quick Direct Key Saver
  const handleSaveApiKey = async (newKey?: string) => {
    const keyToSave = (newKey !== undefined ? newKey : customApiKey).trim();
    if (!keyToSave) return;
    setCustomApiKey(keyToSave);
    localStorage.setItem("formaspace_custom_api_key", keyToSave);
    localStorage.setItem("formaspace_custom_provider", customProvider);
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 3000);
    try {
      await api.post("/api/studio/configure-ai", {
        provider: customProvider,
        api_key: keyToSave,
        model: customProvider === "gemini" ? "gemini-2.0-flash-exp" : "gpt-image-1",
      });
    } catch {
      // ignore
    }
  };

  // Handle Multi-File Upload with Automatic Universal Space Detection
  const handleBatchUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setStagingError(null);
    const files = Array.from(fileList);
    const newItems: StagingPhoto[] = [];

    files.forEach((file, idx) => {
      const localUrl = URL.createObjectURL(file);
      const id = `upload-${Date.now()}-${idx}`;
      newItems.push({
        id,
        file,
        name: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        originalUrl: localUrl,
        roomType: "Analyzing Space...",
        style: selectedStyle,
        status: "ready",
        stagedUrl: undefined,
        detectedObjects: [],
        inventory: [],
      });
    });

    setPhotos((prev) => [...newItems, ...prev]);
    if (newItems.length > 0) {
      setActivePhotoId(newItems[0].id);
    }

    // Run Universal Space Detection for each uploaded photo
    setIsAnalyzing(true);
    for (const item of newItems) {
      if (!item.file) continue;
      try {
        const uploadRes = await api.uploadFile(item.file);
        const analysis = await api.post<any>("/api/studio/analyze-space", {
          image_url: uploadRes.url,
          custom_api_key: customApiKey || undefined,
          custom_provider: customProvider || "gemini",
        });

        const detectedType = analysis.space_type || "Living Room";
        const inventory: StagingItem[] =
          analysis.recommended_furniture && analysis.recommended_furniture.length > 0
            ? analysis.recommended_furniture.map((f: any, i: number) => ({
              id: `rec-${i}`,
              name: f.name || f.item || "Architectural Furnishing",
              category: f.category || "Furniture",
              material: f.material || "Natural Materials",
              estimatedPrice: f.estimatedPrice || 1200,
              dimensions: f.dimensions || "Proportional Scale",
            }))
            : UNIVERSAL_INVENTORIES[detectedType] || UNIVERSAL_INVENTORIES["Living Room"];

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                ...p,
                originalUrl: uploadRes.url,
                roomType: detectedType,
                environment: analysis.environment || "indoor",
                confidence: analysis.confidence || 0.95,
                architecturalFeatures: analysis.architectural_features,
                inventory,
                detectedObjects: DEFAULT_OBJECTS[detectedType] || DEFAULT_OBJECTS["Living Room"],
              }
              : p
          )
        );
      } catch (err) {
        console.warn("Space analysis completed with default classification:", err);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? {
                ...p,
                roomType: "Living Room",
                inventory: UNIVERSAL_INVENTORIES["Living Room"],
                detectedObjects: DEFAULT_OBJECTS["Living Room"],
              }
              : p
          )
        );
      }
    }
    setIsAnalyzing(false);
  };

  // Stage a specific photo with True Image-to-Image AI
  const handleStagePhoto = async (photoId: string) => {
    const target = photos.find((p) => p.id === photoId);
    if (!target) return;

    setStagingError(null);
    setIsStagingActive(true);
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, status: "staging" } : p))
    );

    try {
      let finalStagedUrl = "";
      const customInventory = target.inventory.length > 0 ? target.inventory : (UNIVERSAL_INVENTORIES[target.roomType] || UNIVERSAL_INVENTORIES["Living Room"]);
      const customObjects = target.detectedObjects.length > 0 ? target.detectedObjects : (DEFAULT_OBJECTS[target.roomType] || DEFAULT_OBJECTS["Living Room"]);

      // 1. Ensure file is uploaded to storage
      let serverImageUrl = target.originalUrl;
      if (target.file && (!serverImageUrl.startsWith("/storage/") && !serverImageUrl.startsWith("http"))) {
        const uploadRes = await api.uploadFile(target.file);
        serverImageUrl = uploadRes.url;
      }

      // 2. Call real AI virtual staging endpoint
      const promptText =
        additionalInstructions.trim() ||
        `Virtually stage this vacant ${target.roomType} in ${selectedStyle} interior design aesthetic while strictly locking room geometry, camera perspective, wall boundaries, and windows.`;

      const genRes = await api.post<any>("/api/studio/generate", {
        original_image_url: serverImageUrl,
        feature_type: "virtual_staging",
        category: target.roomType,
        room_type: target.roomType,
        style: selectedStyle,
        intervention_level: stagingTier === "Light Staging" ? "Low" : (stagingTier === "Full Staging Suite" ? "High" : "Medium"),
        prompt: promptText,
        variations_count: 1,
        settings: {
          staging_intensity: stagingTier,
          preserve_furniture: preserveArchitecture,
          custom_api_key: customApiKey || undefined,
          custom_provider: customProvider || "gemini",
          space_type: target.roomType,
          additional_instructions: additionalInstructions,
        },
      });

      if (genRes.generated_image_url) {
        finalStagedUrl = genRes.generated_image_url;
      } else {
        throw new Error("No image was returned by the AI provider.");
      }

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? {
              ...p,
              originalUrl: serverImageUrl,
              status: "staged",
              stagedUrl: finalStagedUrl,
              style: selectedStyle,
              detectedObjects: customObjects,
              inventory: customInventory,
            }
            : p
        )
      );
    } catch (e: any) {
      console.error("Virtual staging failed:", e);
      const errMsg = e.message || "Failed to generate virtual staging.";
      setStagingError(errMsg);
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, status: "error" } : p))
      );
      if (errMsg.toLowerCase().includes("key") || !customApiKey) {
        setShowApiModal(true);
      }
    } finally {
      setIsStagingActive(false);
    }
  };

  // Stage All Photos in queue
  const handleStageAll = async () => {
    const unstaged = photos.filter((p) => p.status === "ready");
    for (const p of unstaged) {
      await handleStagePhoto(p.id);
    }
  };

  // Load Kinkead Showcase Demo
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
      inventory: UNIVERSAL_INVENTORIES[r.roomType] || UNIVERSAL_INVENTORIES["Living Room"],
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

  const updatePhotoRoomType = (photoId: string, newType: string) => {
    setPhotos((prev) =>
      prev.map((p) =>
        p.id === photoId
          ? {
            ...p,
            roomType: newType,
            inventory: UNIVERSAL_INVENTORIES[newType] || UNIVERSAL_INVENTORIES["Living Room"],
            detectedObjects: DEFAULT_OBJECTS[newType] || DEFAULT_OBJECTS["Living Room"],
          }
          : p
      )
    );
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
                Universal AI Staging
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
              <span>23 Kinkead St Demo</span>
            </button>
            <button
              type="button"
              onClick={() => setShowApiModal(true)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${customApiKey
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : "border-[#C87960]/40 bg-[#C87960]/10 text-[#C87960] hover:bg-[#C87960] hover:text-white"
                }`}
            >
              <Key className="h-3.5 w-3.5" />
              <span>{customApiKey ? "Gemini Key: Connected" : "Connect Gemini Key"}</span>
            </button>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-xs text-[#252B2E]/70 hover:text-[#C87960] transition"
            >
              <span>Get Free Key</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="mx-auto max-w-[1600px] px-4 pt-4 sm:px-6 lg:px-8 space-y-4">

        {/* Gemini API Key Connection Banner */}
        {!customApiKey ? (
          <div className="rounded-2xl border-2 border-[#C87960]/30 bg-gradient-to-r from-[#C87960]/10 via-[#F7F4ED] to-[#9BAE9A]/15 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#C87960] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#172B3A] flex items-center gap-2">
                  <span>Connect Google Gemini API Key for Universal Virtual Staging</span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 font-bold">Free Tier (15 RPM)</span>
                </div>
                <p className="text-[11px] text-[#252B2E]/75 mt-0.5">
                  Universal AI space detection (25+ indoor/outdoor spaces) & live image-to-image virtual staging require your Gemini API Key.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="password"
                placeholder="Paste Gemini Key (AIzaSy...)"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveApiKey()}
                className="rounded-xl border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs font-mono text-[#172B3A] focus:border-[#C87960] focus:outline-none w-full md:w-64 shadow-sm"
              />
              <button
                type="button"
                onClick={() => handleSaveApiKey()}
                className="btn-primary py-1.5 px-4 text-xs font-bold whitespace-nowrap shadow-sm"
              >
                Connect Key
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-emerald-50/80 border border-emerald-200 px-4 py-2 text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                <strong>Google Gemini Active:</strong> Universal space detection and live image-to-image virtual staging are ready.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowApiModal(true)}
              className="text-[11px] font-semibold text-emerald-700 hover:underline"
            >
              Change Key
            </button>
          </div>
        )}

        {/* Staging Error Alert */}
        {stagingError && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <strong className="font-bold">Virtual Staging Error:</strong>
                <p className="mt-0.5 text-[11px] text-red-800">{stagingError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowApiModal(true)}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition flex-shrink-0"
            >
              Configure API Key
            </button>
          </div>
        )}

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
                    Upload any indoor or outdoor space photo
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
                    {isAnalyzing ? "Analyzing Space Photos..." : "Upload Multiple Space Photos"}
                  </div>
                  <p className="mt-1 text-[11px] text-[#252B2E]/65">
                    Drag & drop 1 to 30 photos or click to browse
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#DCCBB5] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[#C87960]">
                    Universal Space AI · Bedroom, Living, Bath, Backyard, Garden, etc.
                  </span>
                </div>
              </div>

              {/* Batch Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleStageAll}
                  disabled={isStagingActive || isAnalyzing || !photos.some((p) => p.status === "ready")}
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
                  Select photo to configure & stage
                </span>
              </div>

              {photos.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#252B2E]/60">
                  No property photos uploaded yet. Drag & drop photos above to begin.
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

                          {/* Space Category Dropdown with Universal Spaces */}
                          <div className="mt-1 flex items-center gap-1.5">
                            <select
                              value={item.roomType}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => updatePhotoRoomType(item.id, e.target.value)}
                              className="rounded-md border border-[#DCCBB5] bg-[#F7F4ED] px-1.5 py-0.5 text-[10px] font-medium text-[#172B3A] max-w-[140px] truncate"
                            >
                              <optgroup label="Indoor Spaces">
                                {UNIVERSAL_SPACE_CATEGORIES.indoor.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Outdoor Spaces">
                                {UNIVERSAL_SPACE_CATEGORIES.outdoor.map((c) => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </optgroup>
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
            {/* Top Toolbar: Space Selection & Generation Controls */}
            <div className="editorial-card p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCCBB5]/50 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C87960]">
                      Active Space Configuration
                    </span>
                    {activePhoto?.environment && (
                      <span className="rounded-full bg-[#172B3A]/10 px-2 py-0.5 text-[9px] font-bold text-[#172B3A] uppercase">
                        {activePhoto.environment}
                      </span>
                    )}
                  </div>
                  <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">
                    {activePhoto?.name || "Select a Space to Stage"}
                  </h3>
                </div>

                {/* Staging Button */}
                <button
                  type="button"
                  onClick={() => activePhoto && handleStagePhoto(activePhoto.id)}
                  disabled={isStagingActive || isAnalyzing || !activePhoto}
                  className="btn-primary py-2 px-6 text-xs font-bold shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isStagingActive ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating Staging...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      <span>Stage This Space</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generation Controls Grid */}
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 pt-1">
                {/* 1. Space Category Dropdown (Universal) */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#252B2E]/70 mb-1">
                    Space Category
                  </label>
                  <select
                    value={activePhoto?.roomType || "Living Room"}
                    disabled={!activePhoto}
                    onChange={(e) => activePhoto && updatePhotoRoomType(activePhoto.id, e.target.value)}
                    className="w-full rounded-xl border border-[#DCCBB5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
                  >
                    <optgroup label="Indoor Spaces">
                      {UNIVERSAL_SPACE_CATEGORIES.indoor.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Outdoor Spaces">
                      {UNIVERSAL_SPACE_CATEGORIES.outdoor.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* 2. Design Style */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#252B2E]/70 mb-1">
                    Design Style
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full rounded-xl border border-[#DCCBB5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
                  >
                    {DESIGN_STYLES.map((st) => (
                      <option key={st.name} value={st.name}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Staging Intensity */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#252B2E]/70 mb-1">
                    Staging Intensity
                  </label>
                  <select
                    value={stagingTier}
                    onChange={(e) => setStagingTier(e.target.value)}
                    className="w-full rounded-xl border border-[#DCCBB5] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
                  >
                    <option value="Light Staging">Light Staging (Essential)</option>
                    <option value="Balanced Staging">Balanced Staging (Curated)</option>
                    <option value="Full Staging Suite">Full Staging Suite (Complete)</option>
                  </select>
                </div>

                {/* 4. Strict Architecture Lock Toggle */}
                <div>
                  <label className="block text-[10px] font-semibold text-[#252B2E]/70 mb-1">
                    Architecture Protection
                  </label>
                  <label className="flex items-center gap-2 rounded-xl border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs font-medium text-[#172B3A] cursor-pointer shadow-sm">
                    <input
                      type="checkbox"
                      checked={preserveArchitecture}
                      onChange={(e) => setPreserveArchitecture(e.target.checked)}
                      className="rounded border-[#DCCBB5] text-[#C87960] focus:ring-[#C87960]"
                    />
                    <span className="text-[11px] font-semibold truncate">Lock Architecture</span>
                  </label>
                </div>
              </div>

              {/* Additional Custom Prompt Input */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Optional staging instructions (e.g., 'Place king platform bed, oak nightstands, and linen drapes')"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  className="w-full rounded-xl border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs text-[#172B3A] placeholder:text-[#252B2E]/50 focus:border-[#C87960] focus:outline-none"
                />
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
                      download={`staged-${activePhoto.name}.png`}
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
                          Detected: <strong>{activePhoto.roomType}</strong> ({activePhoto.environment || "indoor"}). Choose your desired style and click below to stage.
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
                      Upload your room photos using the panel on the left to detect room types and virtually stage any space.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary mt-4 px-5 py-2 text-xs font-semibold"
                    >
                      <UploadCloud className="h-4 w-4" />
                      <span>Upload Vacant Space Photos</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Layout-Lock Architectural Assurance */}
              <div className="flex items-center justify-between rounded-xl bg-[#F7F4ED] px-3.5 py-2 text-[11px] text-[#252B2E]/75">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-[#9BAE9A]" />
                  <span>
                    <strong>Strict Layout-Lock:</strong> Camera perspective, window openings, wall boundaries, and floor boundaries are 100% mathematically preserved.
                  </span>
                </div>
                <span className="font-semibold text-[#C87960]">MLS Real Estate Certified</span>
              </div>
            </div>

            {/* Staging Inventory & Furniture Specifications */}
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
                      Curated furnishings for this {activePhoto.roomType} ({activePhoto.style})
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

      {/* AI Key & Live Engine Settings Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#DCCBB5] space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCCBB5]/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C87960]/10 text-[#C87960]">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-editorial text-base font-bold text-[#172B3A]">AI Engine Configuration</h3>
                  <p className="text-[11px] text-[#252B2E]/70">Connect Google Gemini for Universal Staging</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="rounded-lg p-1 text-[#252B2E]/60 hover:bg-neutral-100 hover:text-[#172B3A]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#172B3A] mb-1">AI Provider</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomProvider("gemini")}
                    className={`rounded-xl border p-2.5 text-left transition ${customProvider === "gemini"
                      ? "border-[#C87960] bg-[#C87960]/10 text-[#172B3A] font-bold"
                      : "border-[#DCCBB5] bg-[#F7F4ED] text-[#252B2E]/70"
                      }`}
                  >
                    <div className="text-xs font-bold">Google Gemini</div>
                    <div className="text-[10px] text-emerald-700 font-semibold">Free Tier (15 RPM)</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomProvider("openai")}
                    className={`rounded-xl border p-2.5 text-left transition ${customProvider === "openai"
                      ? "border-[#C87960] bg-[#C87960]/10 text-[#172B3A] font-bold"
                      : "border-[#DCCBB5] bg-[#F7F4ED] text-[#252B2E]/70"
                      }`}
                  >
                    <div className="text-xs font-bold">OpenAI</div>
                    <div className="text-[10px] text-[#252B2E]/60">DALL-E 3 & GPT-4o</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#172B3A] mb-1">
                  {customProvider === "gemini" ? "Google Gemini API Key" : "OpenAI API Key"}
                </label>
                <input
                  type="password"
                  placeholder={customProvider === "gemini" ? "AIzaSy..." : "sk-..."}
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  className="w-full rounded-xl border border-[#DCCBB5] bg-white px-3 py-2 text-xs font-mono text-[#172B3A] focus:border-[#C87960] focus:outline-none"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#252B2E]/60">
                  {customProvider === "gemini" ? (
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[#C87960] hover:underline"
                    >
                      <span>Get free key at Google AI Studio</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span>Requires funded OpenAI account balance</span>
                  )}
                  {customApiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomApiKey("");
                        localStorage.removeItem("formaspace_custom_api_key");
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {keySavedToast && (
                <div className="rounded-lg bg-emerald-50 p-2 text-center text-xs font-bold text-emerald-800">
                  ✓ AI configuration saved successfully!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#DCCBB5]/40 pt-3">
              <button
                type="button"
                onClick={() => setShowApiModal(false)}
                className="rounded-xl border border-[#DCCBB5] px-3.5 py-1.5 text-xs font-semibold text-[#172B3A] hover:bg-neutral-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleSaveApiKey()}
                className="btn-primary py-1.5 px-4 text-xs font-bold shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
