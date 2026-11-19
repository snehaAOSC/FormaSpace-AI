import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bookmark,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Eye,
  Film,
  History,
  Home,
  ImagePlus,
  KeyRound,
  Layers,
  Loader2,
  RefreshCw,
  RotateCcw,
  ScanEye,
  ShoppingBag,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { BeforeAfterSlider } from "../components/BeforeAfterSlider";
import { DemoModeBanner } from "../components/DemoModeBanner";
import { useAuth } from "../context/AuthContext";
import {
  DESIGN_CATEGORIES,
  DESIGN_STYLES,
  KINKEAD_PROPERTY_SHOWCASE,
  MATERIAL_SWATCHES,
  STUDIO_FEATURES,
  WEATHER_PRESETS,
} from "../data/catalog";
import { api } from "../lib/api";
import type { DesignResult, DetectedObject, Project } from "../types";

const INTERVENTION_LEVELS = ["Very Low", "Low", "Medium", "High"] as const;

interface AiRecommendedDesign {
  style: string;
  tag: string;
  description: string;
  imageUrl: string;
  prompt: string;
}

const getAiRecommendedDesigns = (
  originalUrl: string,
  roomType: string,
  currentGeneratedUrl: string
): AiRecommendedDesign[] => {
  if (!originalUrl) return [];
  const b = (originalUrl || "").toLowerCase();
  const r = (roomType || "").toLowerCase();

  let recs: AiRecommendedDesign[] = [];

  // 1. KITCHEN SPACE: Authentic kitchen renovations
  if (b.includes("kitchen") || r.includes("kitchen")) {
    recs = [
      {
        style: "Modern Luxury",
        tag: "Culinary Atelier",
        description: "Honed marble waterfall island, fluted oak millwork & brass cylinder pendant lights.",
        imageUrl: "/images/kitchen-after.jpg",
        prompt: "Modern luxury kitchen renovation with honed marble waterfall island, fluted oak custom cabinets, brass pendant lights, and floor-to-ceiling glass.",
      },
    ];
  } else if (b.includes("bathroom") || b.includes("bath") || r.includes("bath")) {
    // 2. BATHROOM SPACE: Authentic luxury bathroom renovations
    recs = [
      {
        style: "Modern Luxury",
        tag: "Spa Sanctuary",
        description: "Floating dark stone vanity, backlit circular LED mirror & walk-in glass rain shower.",
        imageUrl: "/images/bathroom-after.jpg",
        prompt: "Modern luxury bathroom with floating stone vanity, brushed brass mixer taps, backlit circular LED mirror, and frameless glass rain shower.",
      },
    ];
  } else if (b.includes("bedroom") || r.includes("bed") || b.includes("58a50328")) {
    // 3. BEDROOM SPACE: Strictly unique redesigns of this bedroom (Shown once, not repeated)
    recs = [
      {
        style: "Modern Luxury",
        tag: "Signature Suite",
        description: "Low white oak platform bed, fluted oak millwork & tailored sheer linen drapery.",
        imageUrl: "/images/bedroom-after.jpg",
        prompt: "Warm ivory plaster walls, vertically fluted oak wardrobes, sheer linen window drapery, European oak flooring, and refined daylight.",
      },
      {
        style: "Japandi",
        tag: "Wabi-Sabi Sanctuary",
        description: "Hinoki timber platform bed, Noguchi paper pendant & slatted oak sliding wardrobes.",
        imageUrl: "/images/bedroom-after-japandi.jpg",
        prompt: "Japanese minimalist aesthetics blended with Scandinavian functional timber, Hinoki platform bed, rice paper pendant, and light oak.",
      },
    ];
  } else if (b.includes("exterior") || r.includes("exterior") || r.includes("facade")) {
    // 2. EXTERIOR / FAÇADE: Unique architectural redesign (Shown once, not repeated)
    recs = [
      {
        style: "Contemporary",
        tag: "Architectural Villa",
        description: "Vertical charred timber battens, dark basalt stone cladding & expansive glass walls.",
        imageUrl: "/images/exterior-after.jpg",
        prompt: "Contemporary modern architectural facade with natural timber battens, blackened steel mullions, and integrated exterior lighting.",
      },
    ];
  } else if (b.includes("garden") || r.includes("garden") || r.includes("backyard") || r.includes("patio")) {
    // 3. GARDEN / BACKYARD: Unique landscape redesign (Shown once, not repeated)
    recs = [
      {
        style: "Mediterranean",
        tag: "Sunlit Courtyard",
        description: "Honed Roman travertine, sculpted mature olive trees & limestone plunge pool.",
        imageUrl: "/images/garden-after.jpg",
        prompt: "Mediterranean courtyard with travertine hardscaping, architectural olive planting, patinated brass fixtures, and evening ambient illumination.",
      },
    ];
  } else if (b.includes("kinkead-bed1")) {
    recs = [
      {
        style: "Modern Luxury",
        tag: "Master Staging",
        description: "Low white oak bed, washed linen bedding, oak nightstands & minimalist art.",
        imageUrl: "/images/kinkead-bed1-staged.jpg",
        prompt: "Virtually stage 23 Kinkead St master bedroom with low white oak platform bed, linen bedding, and soft daylight.",
      },
      {
        style: "Japandi",
        tag: "Wabi-Sabi Sanctuary",
        description: "Hinoki timber platform bed, Noguchi paper pendant & slatted oak sliding wardrobes.",
        imageUrl: "/images/bedroom-after-japandi.jpg",
        prompt: "Virtually stage in Japandi style with Hinoki timber bed, rice paper pendant, and light oak.",
      },
    ];
  } else if (b.includes("kinkead-dining")) {
    recs = [
      {
        style: "Modern Luxury",
        tag: "Nordic Dining",
        description: "Scandinavian solid oak 6-seater dining table, sculptural cream chairs & fluted glass pendant.",
        imageUrl: "/images/kinkead-dining-staged.jpg",
        prompt: "Virtually stage 23 Kinkead St dining room with solid oak dining suite, fluted pendant, and linen drapery.",
      },
    ];
  } else if (b.includes("empty-room") || b.includes("staged-room") || b.includes("kinkead-living")) {
    // 4. EMPTY APARTMENT / LIVING: Unique staged redesign (Shown once, not repeated)
    recs = [
      {
        style: "Modern Luxury",
        tag: "Tailored Staging",
        description: "Curated cognac leather seating, textured woven rug & architectural shelving.",
        imageUrl: "/images/kinkead-living-staged.jpg",
        prompt: "Virtually stage this empty living room with contemporary architectural furniture, textured wool rug, layered lighting, and curated decor.",
      },
    ];
  } else {
    const isCustomUpload =
      b.startsWith("/storage/") ||
      b.startsWith("blob:") ||
      b.startsWith("data:") ||
      (!b.includes("bedroom-before") && !b.includes("hero-before") && !b.includes("exterior-before") && !b.includes("garden-before") && !b.includes("empty-room") && !b.includes("kinkead"));

    if (isCustomUpload) {
      // 5. CUSTOM CUSTOMER PHOTO: Unique redesign of customer's active space
      const previewImg = currentGeneratedUrl || originalUrl;
      recs = [
        {
          style: "Modern Luxury",
          tag: "Your Space · Modern Luxury",
          description: `Architectural redesign of your ${roomType} with warm ivory plaster, bespoke timber millwork & soft daylight.`,
          imageUrl: previewImg,
          prompt: `Redesign this ${roomType} in Modern Luxury architectural style with tailored materials and natural daylight.`,
        },
      ];
    } else {
      // 6. LIVING ROOM / SALON: Unique living room redesigns (Shown once, not repeated)
      recs = [
        {
          style: "Modern Luxury",
          tag: "Editorial Salon",
          description: "Curved Belgian bouclé sofa, honed travertine plinth table & architectural cove light.",
          imageUrl: "/images/hero-after.jpg",
          prompt: "Warm ivory plaster walls, curved ivory bouclé sofa, honed travertine coffee table, architectural daylight, and tailored textures.",
        },
        {
          style: "Contemporary",
          tag: "Tailored Living",
          description: "Cognac leather seating, neutral woven rug & balanced architectural proportion.",
          imageUrl: "/images/staged-room.jpg",
          prompt: "Contemporary living room redesign with tailored armchairs, natural timber finishes, and balanced architectural daylight.",
        },
      ];
    }
  }

  // Strict deduplication: Each unique design image is shown ONLY ONCE and never repeated!
  return recs.filter((item, idx, self) => idx === self.findIndex((t) => t.imageUrl === item.imageUrl));
};

export const StudioPage: React.FC = () => {
  const { user, login, updateLocalCredits } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Workspace inputs — empty until user uploads a photo or selects an architectural sample space
  const initialSample = searchParams.get("sample") || searchParams.get("image") || "";
  const [originalUrl, setOriginalUrl] = useState<string>(initialSample);
  const [inspirationUrl, setInspirationUrl] = useState<string>("");
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [featureType, setFeatureType] = useState<string>(
    searchParams.get("feature") || "interior_redesign"
  );
  const [category, setCategory] = useState<string>(
    searchParams.get("category") || "Living Room"
  );
  const [roomType, setRoomType] = useState<string>(
    searchParams.get("category") || "Living Room"
  );
  const [style, setStyle] = useState<string>(
    searchParams.get("style") || "Modern Luxury"
  );
  const [interventionLevel, setInterventionLevel] = useState<string>("Medium");
  const [variationsCount, setVariationsCount] = useState<number>(2);
  const [prompt, setPrompt] = useState<string>(
    "Warm ivory plaster walls, vertically fluted oak wardrobes, sheer linen window drapery, European oak flooring, and refined daylight."
  );

  // Context-aware customization settings
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [wallColor, setWallColor] = useState<string>(MATERIAL_SWATCHES.walls[0].name);
  const [floorMaterial, setFloorMaterial] = useState<string>(MATERIAL_SWATCHES.floors[0]);
  const [countertop, setCountertop] = useState<string>(MATERIAL_SWATCHES.countertops[0]);
  const [roofMaterial, setRoofMaterial] = useState<string>(MATERIAL_SWATCHES.roofs[0]);
  const [weather, setWeather] = useState<string>("Golden Hour");
  const [declutterMode, setDeclutterMode] = useState<string>("Clear unnecessary decorations");
  const [replacementSpec, setReplacementSpec] = useState<string>(
    "Low-profile white oak and oatmeal linen bed"
  );
  const [gardenElements, setGardenElements] = useState<string[]>([
    "Travertine Patio",
    "Garden Lighting",
    "Olive Trees",
  ]);
  const [stagingSet, setStagingSet] = useState<string[]>([
    "Bed",
    "Wardrobes",
    "Nightstands",
    "Curtains",
    "Rugs",
    "Lamps",
  ]);

  // Center & Right Panel State
  const [viewMode, setViewMode] = useState<"slider" | "side" | "after" | "before">("slider");
  const [zoom, setZoom] = useState<number>(100);
  const [showObjectsOverlay, setShowObjectsOverlay] = useState<boolean>(false);
  const [inspectSide, setInspectSide] = useState<"before" | "after">("after");
  const [detectedBeforeObjects, setDetectedBeforeObjects] = useState<DetectedObject[]>([]);
  const [detectedAfterObjects, setDetectedAfterObjects] = useState<DetectedObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  const detectedObjects = inspectSide === "before" ? detectedBeforeObjects : detectedAfterObjects;

  const [currentDesign, setCurrentDesign] = useState<DesignResult | null>(null);
  const [activeVariationIdx, setActiveVariationIdx] = useState<number>(0);
  const [history, setHistory] = useState<DesignResult[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genStage, setGenStage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [studioStatus, setStudioStatus] = useState<{
    live_ai_configured: boolean;
    ai_provider: string;
    ai_model?: string;
    masked_api_key?: string;
  }>({ live_ai_configured: false, ai_provider: "demo" });

  // Live Rendering Key Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [cfgProvider, setCfgProvider] = useState<"openai" | "gemini" | "stability" | "fal" | "demo">("openai");
  const [cfgKey, setCfgKey] = useState("");
  const [cfgModel, setCfgModel] = useState("");
  const [cfgSaving, setCfgSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inspInputRef = useRef<HTMLInputElement>(null);

  // Only preset showroom catalog samples are allowed to use pre-rendered showroom pairs.
  // Custom user uploads NEVER substitute a showroom photo; they are always authentically redesigned!
  const isShowroomPreset = (url: string) => {
    if (!url) return false;
    const u = url.toLowerCase();
    return (
      (u.includes("hero-before") ||
        u.includes("kitchen-before") ||
        u.includes("bedroom-before") ||
        u.includes("bathroom-before") ||
        u.includes("exterior-before") ||
        u.includes("garden-before") ||
        u.includes("empty-room") ||
        u.includes("kinkead")) &&
      !u.includes("/uploads/") &&
      !u.includes("/designs/") &&
      !u.startsWith("data:") &&
      !u.startsWith("blob:")
    );
  };

  const getCuratedAfterUrl = (beforeUrl: string, room: string, styleName: string) => {
    if (!beforeUrl || !isShowroomPreset(beforeUrl)) return "";
    const b = beforeUrl.toLowerCase();
    if (b.includes("kitchen-before")) return "/images/kitchen-renovated-luxury.jpg";
    if (b.includes("bathroom-before")) return "/images/bathroom-after.jpg";
    if (b.includes("bedroom-before")) {
      return styleName === "Japandi" ? "/images/bedroom-after-japandi.jpg" : "/images/bedroom-renovated-luxury.jpg";
    }
    if (b.includes("kinkead-bed1")) return "/images/kinkead-bed1-staged.jpg";
    if (b.includes("kinkead-dining")) return "/images/kinkead-dining-staged.jpg";
    if (b.includes("kinkead-living")) return "/images/kinkead-living-staged.jpg";
    if (b.includes("exterior-before")) return "/images/exterior-after.jpg";
    if (b.includes("garden-before")) return "/images/garden-after.jpg";
    if (b.includes("empty-room")) return "/images/staged-room.jpg";
    return "/images/hero-after.jpg";
  };

  const activeGeneratedUrl =
    currentDesign?.variations?.[activeVariationIdx] ||
    currentDesign?.generated_image_url ||
    (originalUrl && isShowroomPreset(originalUrl) ? getCuratedAfterUrl(originalUrl, roomType, style) : "");


  const loadStatus = () => {
    api
      .get<any>("/api/studio/status")
      .then(setStudioStatus)
      .catch(() => { });
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const loadWorkspaceData = async () => {
    if (!user) return;
    try {
      const [hRes, pRes] = await Promise.all([
        api.get<{ designs: DesignResult[] }>("/api/studio/history"),
        api.get<{ projects: Project[] }>("/api/dashboard/projects"),
      ]);
      setHistory(hRes.designs);
      setProjects(pRes.projects);
      if (pRes.projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(pRes.projects[0].id);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadWorkspaceData();
  }, [user]);

  // Sync workspace if navigation explicitly includes a sample or image query
  useEffect(() => {
    const s = searchParams.get("sample") || searchParams.get("image");
    if (s && s !== originalUrl) {
      setOriginalUrl(s);
      setCurrentDesign(null);
      const cat = searchParams.get("category");
      if (cat) {
        setRoomType(cat);
        setCategory(cat);
      }
      const st = searchParams.get("style");
      if (st) setStyle(st);
      const feat = searchParams.get("feature");
      if (feat) setFeatureType(feat);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!originalUrl) {
      setDetectedBeforeObjects([]);
      setDetectedAfterObjects([]);
      return;
    }

    // Detect objects on the Original (Old) Space
    api
      .post<{ objects: DetectedObject[] }>("/api/studio/detect-objects", {
        image_url: originalUrl,
        room_type: roomType,
      })
      .then((res) => setDetectedBeforeObjects(res.objects))
      .catch(() => { });

    // Detect objects on the Modern Redesign (New) Space
    if (activeGeneratedUrl && activeGeneratedUrl !== originalUrl) {
      api
        .post<{ objects: DetectedObject[] }>("/api/studio/detect-objects", {
          image_url: activeGeneratedUrl,
          room_type: roomType,
        })
        .then((res) => setDetectedAfterObjects(res.objects))
        .catch(() => { });
    } else {
      setDetectedAfterObjects([]);
    }
  }, [originalUrl, activeGeneratedUrl, roomType]);

  const ensureAuthenticated = async (): Promise<boolean> => {
    if (user) return true;
    try {
      await login("studio@formaspace.ai", "FormaSpace2026!");
      return true;
    } catch (err: any) {
      setErrorMsg(err.message || "Please sign in to continue.");
      return false;
    }
  };

  const handleFileUpload = async (file: File, isInspiration = false) => {
    setErrorMsg("");
    if (!file) return;

    // Smart room type recognition from filename, preserving active selection if ambiguous
    const lowerName = file.name.toLowerCase();
    let detected = roomType || "Living Room";
    let hasExplicitKeyword = false;

    if (
      lowerName.includes("bed") ||
      lowerName.includes("bedroom") ||
      lowerName.includes("58a50328")
    ) {
      detected = "Bedroom";
      hasExplicitKeyword = true;
    } else if (lowerName.includes("kitchen") || lowerName.includes("cook") || lowerName.includes("krtchen") || lowerName.includes("kit")) {
      detected = "Kitchen";
      hasExplicitKeyword = true;
    } else if (lowerName.includes("bath") || lowerName.includes("toilet") || lowerName.includes("washroom") || lowerName.includes("shower") || lowerName.includes("powder") || lowerName.includes("ensuite")) {
      detected = "Bathroom";
      hasExplicitKeyword = true;
    } else if (lowerName.includes("dining")) {
      detected = "Dining Room";
      hasExplicitKeyword = true;
    } else if (lowerName.includes("exterior") || lowerName.includes("facade") || lowerName.includes("house")) {
      detected = "House Exterior";
      hasExplicitKeyword = true;
      setFeatureType("exterior_design");
    } else if (lowerName.includes("garden") || lowerName.includes("yard") || lowerName.includes("patio")) {
      detected = "Garden";
      hasExplicitKeyword = true;
      setFeatureType("garden_landscape");
    } else if (lowerName.includes("office") || lowerName.includes("study") || lowerName.includes("desk")) {
      detected = "Office";
      hasExplicitKeyword = true;
    }
    setRoomType(detected);
    setCategory(detected);

    // Read immediately as base64 Data URL so both frontend & backend have direct byte-level access
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (isInspiration) {
        setInspirationUrl(dataUrl);
      } else {
        setOriginalUrl(dataUrl);
        setCurrentDesign(null);
        setMaskDataUrl(null);
      }

      // Visual Content Analysis via HTML5 Canvas Pixel Inspection
      if (!isInspiration) {
        try {
          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
            img.src = dataUrl;
          });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx && img.width > 0 && img.height > 0) {
            canvas.width = 120;
            canvas.height = 80;
            ctx.drawImage(img, 0, 0, 120, 80);
            const data = ctx.getImageData(0, 0, 120, 80).data;
            let whiteTilePixels = 0;
            let greenPixels = 0;
            const total = 120 * 80;
            for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              if (r > 170 && g > 170 && b > 170 && Math.abs(r - g) < 25 && Math.abs(g - b) < 25) {
                whiteTilePixels++;
              }
              if (g > 85 && g > r * 1.15 && g > b * 1.15) {
                greenPixels++;
              }
            }
            const whiteRatio = whiteTilePixels / total;
            const greenRatio = greenPixels / total;
            if (whiteRatio > 0.32 && (!hasExplicitKeyword || detected !== "Kitchen")) {
              detected = "Bathroom";
              setRoomType("Bathroom");
              setCategory("Bathroom");
            } else if (greenRatio > 0.22 && !hasExplicitKeyword) {
              detected = "Garden";
              setRoomType("Garden");
              setCategory("Garden");
              setFeatureType("garden_landscape");
            }
          }
        } catch (visErr) {
          console.warn("Visual space analysis:", visErr);
        }
      }

      // Concurrently upload to server storage
      setUploading(true);
      let serverUrl = "";
      try {
        const res = await api.uploadFile(file);
        if (res && res.url) {
          serverUrl = res.url;
          if (isInspiration) {
            setInspirationUrl(res.url);
          } else {
            setOriginalUrl(res.url);
          }
        }
      } catch (err: any) {
        console.warn("Backend image upload notice:", err?.message || err);
      } finally {
        setUploading(false);
      }

      // Automatically trigger authentic redesign of the user's uploaded room!
      if (!isInspiration) {
        const targetImage = serverUrl || dataUrl;
        setTimeout(() => {
          handleGenerate(style, targetImage, detected);
        }, 300);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await ensureAuthenticated();
    if (!ok) return;
    setCfgSaving(true);
    setErrorMsg("");
    try {
      const res = await api.post<any>("/api/studio/configure-ai", {
        provider: cfgProvider,
        api_key: cfgProvider === "demo" ? "" : cfgKey,
        model: cfgModel,
      });
      setStudioStatus(res);
      setShowAiModal(false);
      setCfgKey("");
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setCfgSaving(false);
    }
  };

  const handleGenerate = async (
    targetStyleOverride?: string,
    sourceUrlOverride?: string,
    roomTypeOverride?: string
  ) => {
    setErrorMsg("");
    const effectiveUrl = sourceUrlOverride || originalUrl;
    const effectiveRoomType = roomTypeOverride || roomType;
    if (!effectiveUrl) {
      setErrorMsg("Please upload a photograph of your space or select an architectural sample space first.");
      return;
    }
    const ok = await ensureAuthenticated();
    if (!ok) return;

    const effectiveStyle = targetStyleOverride || style;

    setGenerating(true);
    setGenStage(
      maskDataUrl
        ? "Applying Precision+ mask & analyzing surrounding architecture..."
        : `Analyzing ${effectiveRoomType.toLowerCase()} spatial geometry & architectural proportions...`
    );

    const timer1 = setTimeout(
      () => setGenStage(`Synthesizing ${effectiveStyle} materials, joinery & lighting preservation...`),
      800
    );
    const timer2 = setTimeout(
      () => setGenStage("Rendering high-definition design variations in exact perspective..."),
      1600
    );

    try {
      const selectedObj = detectedObjects.find((o) => o.id === selectedObjectId);
      const settingsPayload: Record<string, any> = {
        wall_color: wallColor,
        floor_material: floorMaterial,
      };
      if (featureType === "material_replacement") {
        settingsPayload.countertop = countertop;
        settingsPayload.roof = roofMaterial;
      }
      if (featureType === "exterior_design") {
        settingsPayload.roof = roofMaterial;
        settingsPayload.weather = weather;
      }
      if (featureType === "sky_weather") {
        settingsPayload.weather = weather;
      }
      if (featureType === "garden_landscape") {
        settingsPayload.landscape_elements = gardenElements;
      }
      if (featureType === "virtual_staging") {
        settingsPayload.furniture_items = stagingSet;
      }
      if (featureType === "room_declutter") {
        settingsPayload.declutter_mode = declutterMode;
        settingsPayload.target_object = selectedObj?.label;
      }
      if (featureType === "furniture_replacement") {
        settingsPayload.target_object = selectedObj?.label || (effectiveRoomType === "Bedroom" ? "Bed" : "Sofa");
        settingsPayload.replacement_spec = replacementSpec;
      }

      const res = await api.post<{ design: DesignResult; remaining_credits: number }>(
        "/api/studio/generate",
        {
          original_image_url: effectiveUrl,
          inspiration_image_url: inspirationUrl || null,
          mask_data_url: maskDataUrl,
          feature_type: featureType,
          category: effectiveRoomType,
          room_type: effectiveRoomType,
          style: effectiveStyle,
          intervention_level: interventionLevel,
          prompt,
          variations_count: variationsCount,
          project_id: selectedProjectId || null,
          settings: settingsPayload,
        }
      );
      setCurrentDesign(res.design);
      setActiveVariationIdx(0);
      setDetectedAfterObjects(res.design.detected_objects || []);
      setInspectSide("after");
      updateLocalCredits(res.remaining_credits);
      await loadWorkspaceData();
    } catch (err: any) {
      setErrorMsg(err.message || "Generation failed.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setGenerating(false);
      setGenStage("");
    }
  };

  const handleSaveToggle = async () => {
    if (!currentDesign) return;
    try {
      const next = !currentDesign.is_saved;
      await api.patch(`/api/studio/designs/${currentDesign.id}/save`, {
        is_saved: next,
        project_id: selectedProjectId || null,
      });
      setCurrentDesign({ ...currentDesign, is_saved: next, project_id: selectedProjectId || null });
      loadWorkspaceData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    try {
      await api.delete(`/api/studio/designs/${id}`);
      if (currentDesign?.id === id) setCurrentDesign(null);
      setHistory((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };


  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `formaspace-${roomType.toLowerCase()}-${style.toLowerCase().replace(/\s+/g, "-")}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#F7F4ED] pb-12">
      {/* Studio Header Bar */}
      <div className="border-b border-[#DCCBB5] bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-editorial text-xl font-semibold text-[#172B3A]">
                Architectural Design Studio
              </span>
              {maskDataUrl && (
                <span className="rounded-full bg-[#C87960] px-2.5 py-0.5 text-[11px] font-medium text-white">
                  Precision Mask Active
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {!user && (
              <button
                type="button"
                onClick={ensureAuthenticated}
                className="btn-terracotta py-1.5 px-4 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Sign In to Studio
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium transition ${showHistoryDrawer
                ? "border-[#172B3A] bg-[#172B3A] text-white"
                : "border-[#DCCBB5] bg-white text-[#172B3A] hover:border-[#C87960]"
                }`}
            >
              <History className="h-3.5 w-3.5" />
              History ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Layout: Left (Step-by-Step Controls) & Right (Interactive Canvas & Results) */}
      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 pt-5 sm:px-6 lg:grid-cols-12">
        {/* =================================================================
            LEFT CONTROLS (4 Cols): Step 1: Upload → Step 2: Customize → Step 3: Generate
        ================================================================== */}
        <aside className="space-y-4 lg:col-span-4">
          {/* FEATURED REAL ESTATE VIRTUAL STAGING SHOWCASE */}
          <div className="editorial-card p-4 bg-gradient-to-br from-[#172B3A] via-[#1E374B] to-[#252B2E] text-white shadow-editorial space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#C87960] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                  <Sparkles className="h-2.5 w-2.5" />
                  Real Estate Virtual Staging
                </div>
                <h3 className="mt-1 font-editorial text-base font-semibold text-white leading-tight">
                  {KINKEAD_PROPERTY_SHOWCASE.address}
                </h3>
                <p className="mt-0.5 text-[11px] text-white/70">
                  {KINKEAD_PROPERTY_SHOWCASE.specs} · {KINKEAD_PROPERTY_SHOWCASE.photoCount} Photos
                </p>
              </div>
              <a
                href={KINKEAD_PROPERTY_SHOWCASE.listingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[10px] text-[#DCCBB5] hover:text-white transition"
              >
                <span>Listing</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="text-[11px] text-[#DCCBB5]/90 font-medium">
              Select any vacant space to stage instantly:
            </div>

            <div className="grid grid-cols-2 gap-2">
              {KINKEAD_PROPERTY_SHOWCASE.rooms.map((room) => {
                const isActive = originalUrl === room.emptyImage;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => {
                      setOriginalUrl(room.emptyImage);
                      setRoomType(room.roomType);
                      setCategory(room.roomType);
                      setFeatureType("virtual_staging");
                      setStyle("Modern Luxury");
                      setDetectedBeforeObjects(room.emptyObjects as any);
                      setDetectedAfterObjects(room.stagedObjects as any);
                      setCurrentDesign({
                        id: `kinkead-${room.id}`,
                        user_id: user?.id || "demo-user",
                        project_id: selectedProjectId || undefined,
                        feature_type: "virtual_staging",
                        category: room.roomType,
                        room_type: room.roomType,
                        style: "Modern Luxury",
                        intervention_level: "Medium",
                        prompt: room.description,
                        settings: {},
                        original_image_url: room.emptyImage,
                        generated_image_url: room.stagedImage,
                        variations: [room.stagedImage],
                        detected_objects: room.stagedObjects as any,
                        credits_used: 0,
                        is_saved: false,
                        is_demo_mode: true,
                        provider: "virtual_staging_ai",
                        prompt_used: room.description,
                        created_at: new Date().toISOString(),
                      });
                      setActiveVariationIdx(0);
                    }}
                    className={`group relative overflow-hidden rounded-xl border p-2 text-left transition ${
                      isActive
                        ? "border-[#C87960] bg-[#C87960]/20 ring-1 ring-[#C87960]"
                        : "border-white/15 bg-white/5 hover:border-[#C87960] hover:bg-white/10"
                    }`}
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden rounded-lg mb-1.5 bg-black/40">
                      <img
                        src={room.thumb}
                        alt={room.name}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="text-[11px] font-semibold text-white truncate">
                      {room.name}
                    </div>
                    <div className="text-[10px] text-[#9BAE9A] font-medium flex items-center gap-1">
                      <span>Empty → Staged</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* UPLOAD SPACE PHOTO */}
          <div className="editorial-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
                Upload Image
              </h2>
              <span className="text-[10px] text-[#252B2E]/60">JPG, PNG, WebP</span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) handleFileUpload(f);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative cursor-pointer overflow-hidden rounded-xl border-2 border-dashed p-3 text-center transition ${dragOver
                ? "border-[#C87960] bg-[#C87960]/10"
                : "border-[#DCCBB5] bg-[#F7F4ED]/60 hover:border-[#C87960]"
                }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                  e.target.value = "";
                }}
              />
              {originalUrl ? (
                <>
                  <div className="relative">
                    <img
                      src={originalUrl}
                      alt="Source Space Photograph"
                      className="h-36 w-full rounded-lg object-cover shadow-sm transition group-hover:brightness-95"
                    />
                    <span className="absolute bottom-2 left-2 rounded-md bg-[#172B3A]/85 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                      {roomType} · Source
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-[#172B3A]">
                    {uploading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C87960]" />
                        <span>Uploading space photograph...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-3.5 w-3.5 text-[#C87960]" />
                        <span>Drag & drop or click to replace photo</span>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-7 px-3 flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-2xl bg-[#C87960]/10 flex items-center justify-center text-[#C87960] mb-3 group-hover:scale-105 transition">
                    {uploading ? (
                      <Loader2 className="h-6 w-6 animate-spin text-[#C87960]" />
                    ) : (
                      <UploadCloud className="h-6 w-6 text-[#C87960]" />
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[#172B3A]">
                    {uploading ? "Uploading space photograph..." : "Upload Space Photograph"}
                  </div>
                  <p className="mt-1 text-[11px] text-[#252B2E]/60 max-w-[210px] leading-relaxed">
                    Drag & drop or click to upload your room or exterior photo
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-white border border-[#DCCBB5] px-2.5 py-0.5 text-[10px] font-medium text-[#C87960]">
                    JPG, PNG, WebP
                  </span>
                </div>
              )}
            </div>

            {/* Inspiration Reference Photo (if Inspiration tool selected) */}
            {featureType === "inspiration_transfer" && (
              <div className="border-t border-[#DCCBB5] pt-3">
                <div className="text-xs font-semibold text-[#172B3A] mb-1.5">
                  Inspiration Reference Photo
                </div>
                <button
                  type="button"
                  onClick={() => inspInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#C87960] bg-[#C87960]/5 py-2 text-xs font-medium text-[#172B3A]"
                >
                  <ImagePlus className="h-4 w-4 text-[#C87960]" />
                  {inspirationUrl ? "Replace Inspiration Photo" : "Upload Inspiration Photo"}
                </button>
                <input
                  ref={inspInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileUpload(f, true);
                    e.target.value = "";
                  }}
                />
                {inspirationUrl && (
                  <img
                    src={inspirationUrl}
                    alt="Inspiration reference"
                    className="mt-2 h-20 w-full rounded-lg object-cover border border-[#DCCBB5]"
                  />
                )}
              </div>
            )}
          </div>

          {/* CUSTOMIZE SPACE */}
          <div className="editorial-card p-4 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
              Customize Space
            </h2>

            {/* What is it? / Room Type */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#172B3A]">
                  Room Type
                </label>
                <span className="text-[11px] font-semibold text-[#C87960]">{roomType}</span>
              </div>
              <select
                value={roomType}
                onChange={(e) => {
                  setRoomType(e.target.value);
                  setCategory(e.target.value);
                }}
                className="mt-1.5 w-full rounded-xl border border-[#DCCBB5] bg-white px-3.5 py-2.5 text-sm font-medium text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
              >
                <option value="Bedroom">Bedroom</option>
                <option value="Living Room">Living Room</option>
                <option value="Kitchen">Kitchen</option>
                <option value="Dining Room">Dining Room</option>
                <option value="Bathroom">Bathroom</option>
                <option value="Office">Home Office</option>
                <option value="House Exterior">House Exterior</option>
                <option value="Garden">Garden & Backyard</option>
                <option value="Commercial Spaces">Commercial Spaces</option>
              </select>
            </div>

            {/* Tool */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#172B3A]">
                  Tool
                </label>
                <span className="text-[11px] text-[#252B2E]/65">
                  {STUDIO_FEATURES.find((f) => f.id === featureType)?.short}
                </span>
              </div>
              <select
                value={featureType}
                onChange={(e) => {
                  setFeatureType(e.target.value);
                }}
                className="mt-1.5 w-full rounded-xl border border-[#DCCBB5] bg-white px-3.5 py-2.5 text-sm font-medium text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
              >
                <option value="interior_redesign">Interior Redesign</option>
                <option value="virtual_staging">Virtual Staging</option>
                <option value="room_declutter">Room Declutter</option>
                <option value="material_replacement">Material Replacement</option>
                <option value="sky_weather">Sky & Lighting</option>
                <option value="sketch_to_render">Sketch to 3D Render</option>
                <option value="inspiration_transfer">Inspiration Transfer</option>
              </select>
            </div>

            {/* Design Style */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#172B3A]">
                  Design Style
                </label>
                <span className="text-[11px] font-semibold text-[#C87960]">{style}</span>
              </div>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#DCCBB5] bg-white px-3.5 py-2.5 text-sm font-medium text-[#172B3A] shadow-sm focus:border-[#C87960] focus:outline-none"
              >
                {DESIGN_STYLES.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name} — {s.tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Detected Objects Chips */}
            <div className="rounded-xl border border-[#DCCBB5]/60 bg-[#F7F4ED]/50 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-[#172B3A]">
                  Detected Objects ({detectedObjects.length})
                </span>
                {originalUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowObjectsOverlay(!showObjectsOverlay);
                    }}
                    className={`text-[10px] font-semibold transition ${showObjectsOverlay ? "text-[#C87960] underline" : "text-[#172B3A] hover:underline"}`}
                  >
                    {showObjectsOverlay ? "Hide from image" : "Highlight on image"}
                  </button>
                )}
              </div>

              {!originalUrl ? (
                <div className="text-[11px] text-[#252B2E]/50 italic py-1">
                  Upload an image to detect furniture & architectural objects
                </div>
              ) : (
                <>
                  {/* Side Swap Tabs: Old vs Modern */}
                  <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/80 p-1 border border-[#DCCBB5]/60 mb-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectSide("before");
                        setSelectedObjectId(null);
                        setShowObjectsOverlay(true);
                      }}
                      className={`py-1 text-center rounded-md text-[11px] font-semibold transition ${inspectSide === "before"
                        ? "bg-[#172B3A] text-white shadow-sm"
                        : "text-[#252B2E]/70 hover:text-[#172B3A]"
                        }`}
                    >
                      Original Space ({detectedBeforeObjects.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectSide("after");
                        setSelectedObjectId(null);
                        setShowObjectsOverlay(true);
                      }}
                      className={`py-1 text-center rounded-md text-[11px] font-semibold transition ${inspectSide === "after"
                        ? "bg-[#C87960] text-white shadow-sm"
                        : "text-[#252B2E]/70 hover:text-[#172B3A]"
                        }`}
                    >
                      Modern Side ({detectedAfterObjects.length})
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {detectedObjects.map((obj) => (
                      <button
                        key={obj.id}
                        type="button"
                        onClick={() => setSelectedObjectId(selectedObjectId === obj.id ? null : obj.id)}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium border transition ${selectedObjectId === obj.id
                          ? "border-[#C87960] bg-[#C87960] text-white"
                          : "border-[#DCCBB5] bg-white text-[#172B3A]"
                          }`}
                      >
                        {obj.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Advanced Architectural Finishes & Prompt Toggle */}
            <div className="border-t border-[#DCCBB5]/70 pt-2">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex w-full items-center justify-between py-1 text-xs font-semibold text-[#172B3A] hover:text-[#C87960]"
              >
                <span>Advanced Finishes & Custom Prompt</span>
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3 pt-2">
                  {/* Intervention Level */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-[#252B2E]/75">
                      <span>Intervention Level</span>
                      <span className="font-semibold text-[#C87960]">{interventionLevel}</span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-4 gap-1.5">
                      {INTERVENTION_LEVELS.map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setInterventionLevel(lvl)}
                          className={`rounded-lg border py-1.5 text-[11px] font-medium transition ${interventionLevel === lvl
                            ? "border-[#172B3A] bg-[#172B3A] text-white"
                            : "border-[#DCCBB5] bg-white text-[#252B2E]"
                            }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wall Paint Swatches */}
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/75">Wall Finish</label>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {MATERIAL_SWATCHES.walls.map((w) => (
                        <button
                          key={w.name}
                          type="button"
                          onClick={() => setWallColor(w.name)}
                          title={w.name}
                          className={`h-6 w-6 rounded-full border-2 transition ${wallColor === w.name ? "border-[#C87960] scale-110" : "border-[#DCCBB5]"
                            }`}
                          style={{ backgroundColor: w.hex }}
                        />
                      ))}
                    </div>
                    <div className="mt-1 text-[10px] text-[#252B2E]/65">{wallColor}</div>
                  </div>

                  {/* Flooring Material */}
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/75">Flooring Material</label>
                    <select
                      value={floorMaterial}
                      onChange={(e) => setFloorMaterial(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-white px-3 py-1.5 text-xs text-[#172B3A]"
                    >
                      {MATERIAL_SWATCHES.floors.map((fl) => (
                        <option key={fl}>{fl}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Prompt */}
                  <div>
                    <label className="text-xs font-medium text-[#252B2E]/75">
                      Custom Design Instructions
                    </label>
                    <textarea
                      rows={3}
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Specify materials, colors, lighting, or specific layout details..."
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-white p-2.5 text-xs leading-relaxed text-[#172B3A] focus:border-[#C87960] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GENERATE DESIGN */}
          <div className="editorial-card p-4 space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
              Generate Design
            </h2>

            {errorMsg && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-2.5 text-xs text-red-800">
                {errorMsg}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (!originalUrl) {
                  fileInputRef.current?.click();
                } else {
                  handleGenerate();
                }
              }}
              disabled={generating}
              className="btn-primary w-full justify-center py-3.5 text-sm font-semibold shadow-editorial"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Generating {roomType}...</span>
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 text-[#C87960]" />
                  <span>Generate Design</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* =================================================================
            RIGHT MAIN AREA (8 Cols): Viewport Toolbar, Canvas, Variations & Downstream
        ================================================================== */}
        <main className="space-y-4 lg:col-span-8">
          {/* Canvas Toolbar */}
          <div className="editorial-card flex flex-wrap items-center justify-between gap-2 px-4 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "slider", label: "Before / After Slider" },
                { id: "side", label: "Side-by-Side (Before & After)" },
                { id: "after", label: "Generated View" },
                { id: "before", label: "Original Space" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  disabled={!originalUrl}
                  onClick={() => {
                    setViewMode(m.id as any);
                    if (m.id === "before") {
                      setInspectSide("before");
                      setSelectedObjectId(null);
                    } else if (m.id === "after") {
                      setInspectSide("after");
                      setSelectedObjectId(null);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${viewMode === m.id
                    ? "bg-[#172B3A] text-white shadow-sm"
                    : "bg-[#F7F4ED] text-[#252B2E] border border-[#DCCBB5]/70 hover:bg-[#DCCBB5]/40"
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!originalUrl}
                onClick={() => setShowObjectsOverlay(!showObjectsOverlay)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${showObjectsOverlay
                  ? "border-[#C87960] bg-[#C87960] text-white"
                  : "border-[#DCCBB5] bg-white text-[#172B3A]"
                  }`}
              >
                <ScanEye className="h-3.5 w-3.5" />
                Objects ({detectedObjects.length})
              </button>

              <div className="flex items-center rounded-full border border-[#DCCBB5] bg-[#F7F4ED] px-2 py-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(60, z - 20))}
                  className="p-1 text-[#172B3A] hover:text-[#C87960]"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-xs font-medium text-[#172B3A]">{zoom}%</span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(200, z + 20))}
                  className="p-1 text-[#172B3A] hover:text-[#C87960]"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
                {zoom !== 100 && (
                  <button
                    type="button"
                    onClick={() => setZoom(100)}
                    className="ml-1 p-1 text-[#C87960]"
                    title="Reset Zoom"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Architectural Canvas */}
          <div className="editorial-card relative overflow-hidden p-4">
            {generating && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#172B3A]/85 text-[#F7F4ED] backdrop-blur-sm">
                <Loader2 className="h-10 w-10 animate-spin text-[#C87960]" />
                <div className="mt-4 font-editorial text-2xl">
                  Reimagining your {roomType.toLowerCase()}
                </div>
                <p className="mt-1.5 text-sm text-[#DCCBB5]">{genStage}</p>
              </div>
            )}

            {!originalUrl ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-28 px-6 text-center transition ${dragOver ? "border-[#C87960] bg-[#C87960]/10" : "border-[#DCCBB5] bg-[#F7F4ED]/40"
                  }`}
              >
                <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-[#172B3A] text-white shadow-lg">
                  <UploadCloud className="h-9 w-9 text-[#C87960]" />
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#C87960] text-white text-xs">
                    ✦
                  </span>
                </div>
                <h3 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                  Upload Your Space to Begin
                </h3>
                <p className="mt-2 max-w-md text-sm text-[#252B2E]/75 leading-relaxed">
                  Upload a photo of your living room, bedroom, kitchen, exterior, or backyard to generate architectural redesigns, precision object detection, and cost estimation.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-primary py-3 px-6 text-xs font-semibold shadow-md inline-flex items-center gap-2"
                  >
                    <UploadCloud className="h-4 w-4" />
                    <span>Upload Space Photograph</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-auto rounded-2xl bg-[#252B2E]/5">
                <div
                  className="relative mx-auto transition-transform duration-200 origin-center"
                  style={{ transform: `scale(${zoom / 100})` }}
                >
                  {/* SLIDER VIEW: Original on Left, Generated Redesign on Right */}
                  {viewMode === "slider" && (
                    <BeforeAfterSlider
                      beforeSrc={originalUrl}
                      afterSrc={activeGeneratedUrl || originalUrl}
                      beforeLabel="Original Space"
                      afterLabel={currentDesign ? `${currentDesign.style} · Generated` : `${style} · Redesign Preview`}
                      className="aspect-[16/10]"
                      onPositionChange={(pos) => {
                        // When slider is pulled left (< 50), user has swapped to Modern side!
                        // When slider is pulled right (>= 50), user has swapped to Old space side!
                        if (pos < 50 && inspectSide !== "after") {
                          setInspectSide("after");
                          setSelectedObjectId(null);
                        } else if (pos >= 50 && inspectSide !== "before") {
                          setInspectSide("before");
                          setSelectedObjectId(null);
                        }
                      }}
                    />
                  )}

                  {/* SIDE-BY-SIDE VIEW: Exactly matching HomeDesignsAI bottom-left presentation */}
                  {viewMode === "side" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="group relative overflow-hidden rounded-2xl border border-[#DCCBB5] bg-[#252B2E] shadow-sm">
                        <img
                          src={originalUrl}
                          alt="Before / Original Space"
                          className="aspect-[16/11] w-full object-cover"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-[#172B3A]/85 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow">
                          Before
                        </span>
                        <div className="p-3 bg-white border-t border-[#DCCBB5]">
                          <div className="text-xs font-semibold text-[#172B3A]">Original Space</div>
                          <div className="text-[11px] text-[#252B2E]/60">
                            {roomType} · Source Perspective
                          </div>
                        </div>
                      </div>

                      <div className="group relative overflow-hidden rounded-2xl border border-[#C87960]/50 bg-[#252B2E] shadow-sm">
                        <img
                          src={activeGeneratedUrl || originalUrl}
                          alt="After / Redesigned Space"
                          className="aspect-[16/11] w-full object-cover"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-[#C87960] px-3 py-1 text-xs font-semibold text-white shadow">
                          After
                        </span>
                        <div className="p-3 bg-white border-t border-[#DCCBB5] flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold text-[#172B3A]">
                              {currentDesign?.style || style} Redesign
                            </div>
                            <div className="text-[11px] text-[#252B2E]/60">
                              Preserved format & architectural layout
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownload(activeGeneratedUrl)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#DCCBB5] px-2.5 py-1 text-xs font-medium text-[#172B3A] hover:border-[#C87960]"
                          >
                            <Download className="h-3 w-3 text-[#C87960]" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GENERATED ONLY VIEW */}
                  {viewMode === "after" && (
                    <div className="relative overflow-hidden rounded-2xl border border-[#DCCBB5]">
                      <img
                        src={activeGeneratedUrl}
                        alt="Generated Design"
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-[#C87960] px-3 py-1 text-xs font-semibold text-white shadow">
                        {currentDesign?.style || style} · Redesign
                      </span>
                    </div>
                  )}

                  {/* ORIGINAL ONLY VIEW */}
                  {viewMode === "before" && (
                    <div className="relative overflow-hidden rounded-2xl border border-[#DCCBB5]">
                      <img
                        src={originalUrl}
                        alt="Original Space"
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-[#172B3A]/85 px-3 py-1 text-xs font-semibold text-white">
                        Original {roomType}
                      </span>
                    </div>
                  )}

                  {/* Object Detection Overlay */}
                  {showObjectsOverlay && (
                    <div className="pointer-events-none absolute inset-0">
                      {/* Floating pill toggle on top of image */}
                      <div className="pointer-events-auto absolute top-3 right-3 z-30 flex items-center gap-1 rounded-full bg-[#172B3A]/90 p-1 text-[11px] shadow-lg backdrop-blur-md">
                        <button
                          type="button"
                          onClick={() => {
                            setInspectSide("before");
                            setSelectedObjectId(null);
                          }}
                          className={`rounded-full px-2.5 py-0.5 font-medium transition ${inspectSide === "before"
                            ? "bg-white text-[#172B3A] shadow-sm font-semibold"
                            : "text-white/80 hover:text-white"
                            }`}
                        >
                          Old Space Objects
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setInspectSide("after");
                            setSelectedObjectId(null);
                          }}
                          className={`rounded-full px-2.5 py-0.5 font-medium transition ${inspectSide === "after"
                            ? "bg-[#C87960] text-white shadow-sm font-semibold"
                            : "text-white/80 hover:text-white"
                            }`}
                        >
                          Modern Objects
                        </button>
                      </div>

                      {detectedObjects.map((obj) => {
                        const [left, top, w, h] = obj.box;
                        const isSelected = selectedObjectId === obj.id;
                        return (
                          <button
                            key={obj.id}
                            type="button"
                            onClick={() => setSelectedObjectId(isSelected ? null : obj.id)}
                            style={{ left: `${left}%`, top: `${top}%`, width: `${w}%`, height: `${h}%` }}
                            className={`pointer-events-auto absolute rounded-lg border-2 transition ${isSelected
                              ? "border-[#C87960] bg-[#C87960]/20"
                              : "border-white/80 bg-[#172B3A]/15 hover:border-[#C87960]"
                              }`}
                          >
                            <span className="absolute -top-6 left-0 rounded-md bg-[#172B3A] px-2 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap shadow">
                              {obj.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Multiple Generated Variations Strip */}
            {currentDesign && currentDesign.variations && currentDesign.variations.length > 0 && (
              <div className="mt-4 border-t border-[#DCCBB5]/60 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#172B3A]">
                    Generated Variations ({currentDesign.variations.length})
                  </span>
                  <span className="text-[11px] text-[#252B2E]/65">
                    Click variation to inspect in full viewport
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {currentDesign.variations.map((vUrl, idx) => (
                    <button
                      key={vUrl + idx}
                      type="button"
                      onClick={() => setActiveVariationIdx(idx)}
                      className={`group relative overflow-hidden rounded-xl border-2 transition ${activeVariationIdx === idx
                        ? "border-[#C87960] shadow-md"
                        : "border-[#DCCBB5] opacity-80 hover:opacity-100"
                        }`}
                    >
                      <img src={vUrl} alt={`Variation ${idx + 1}`} className="aspect-[4/3] w-full object-cover" />
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-[#172B3A]/85 px-2 py-0.5 text-[10px] text-white">
                        V{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Row: Export, Save, Download */}
          {originalUrl && (
            <div className="editorial-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                {projects.length > 0 && (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="rounded-xl border border-[#DCCBB5] bg-white px-3 py-2 text-xs text-[#172B3A]"
                  >
                    <option value="">Personal Archive (No Project)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        Project: {p.title}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  type="button"
                  disabled={!currentDesign}
                  onClick={handleSaveToggle}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-medium transition disabled:opacity-40 ${currentDesign?.is_saved
                    ? "border-[#9BAE9A] bg-[#9BAE9A]/25 text-[#172B3A]"
                    : "border-[#DCCBB5] bg-white text-[#172B3A] hover:border-[#C87960]"
                    }`}
                >
                  {currentDesign?.is_saved ? <Check className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
                  {currentDesign?.is_saved ? "Saved to Project" : "Save Design"}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(activeGeneratedUrl)}
                  className="btn-primary py-2 px-5 text-xs font-medium"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download High-Res
                </button>
              </div>
            </div>
          )}

          {/* Quick Downstream Links */}
          {originalUrl && (
            <div className="grid gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/furniture-finder?image=${encodeURIComponent(activeGeneratedUrl)}&style=${encodeURIComponent(style)}&room=${encodeURIComponent(roomType)}&sample=${encodeURIComponent(originalUrl)}`
                  )
                }
                className="editorial-card flex items-center gap-3 p-3.5 text-left hover:border-[#C87960] transition"
              >
                <ShoppingBag className="h-5 w-5 text-[#C87960]" />
                <div>
                  <div className="text-xs font-semibold text-[#172B3A]">Shop This Design</div>
                  <div className="text-[11px] text-[#252B2E]/65">Match detected furniture</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/video-walkthrough?image=${encodeURIComponent(activeGeneratedUrl)}&style=${encodeURIComponent(style)}&room=${encodeURIComponent(roomType)}&sample=${encodeURIComponent(originalUrl)}`
                  )
                }
                className="editorial-card flex items-center gap-3 p-3.5 text-left hover:border-[#C87960] transition"
              >
                <Film className="h-5 w-5 text-[#172B3A]" />
                <div>
                  <div className="text-xs font-semibold text-[#172B3A]">Create Walkthrough</div>
                  <div className="text-[11px] text-[#252B2E]/65">Animate camera motion</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/budget-estimator?image=${encodeURIComponent(activeGeneratedUrl)}&style=${encodeURIComponent(style)}&room=${encodeURIComponent(roomType)}&sample=${encodeURIComponent(originalUrl)}&mode=furniture_cost`
                  )
                }
                className="editorial-card flex items-center gap-3 p-3.5 text-left hover:border-[#C87960] transition"
              >
                <Layers className="h-5 w-5 text-[#9BAE9A]" />
                <div>
                  <div className="text-xs font-semibold text-[#172B3A]">Cost Estimation</div>
                  <div className="text-[11px] text-[#252B2E]/65">Smart furniture cost estimator</div>
                </div>
              </button>
            </div>
          )}

          {/* Recommended Design Options for this Space */}
          {originalUrl && (
            <div className="editorial-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#C87960]" />
                  <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#172B3A]">
                    Recommended Design Options
                  </h3>
                </div>
                <span className="text-[11px] text-[#252B2E]/60">
                  Click any style to preview curated spatial variation
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {getAiRecommendedDesigns(originalUrl, roomType, activeGeneratedUrl).map((rec) => {
                  const isSelected = style === rec.style;
                  return (
                    <button
                      key={rec.style}
                      type="button"
                      onClick={() => {
                        setStyle(rec.style);
                        const isCustom =
                          originalUrl.startsWith("/storage/") ||
                          originalUrl.startsWith("blob:") ||
                          originalUrl.startsWith("data:") ||
                          (!originalUrl.includes("bedroom-before") &&
                            !originalUrl.includes("hero-before") &&
                            !originalUrl.includes("exterior-before") &&
                            !originalUrl.includes("garden-before") &&
                            !originalUrl.includes("empty-room"));
                        if (isCustom) {
                          handleGenerate(rec.style);
                        } else {
                          setCurrentDesign({
                            id: `rec-${rec.style.toLowerCase().replace(/\s+/g, "-")}`,
                            user_id: user?.id || "demo-user",
                            project_id: selectedProjectId || undefined,
                            feature_type: featureType || "interior_redesign",
                            category: roomType,
                            room_type: roomType,
                            style: rec.style,
                            intervention_level: interventionLevel,
                            prompt: rec.prompt,
                            settings: {},
                            original_image_url: originalUrl,
                            generated_image_url: rec.imageUrl,
                            variations: [rec.imageUrl],
                            detected_objects: [],
                            credits_used: 0,
                            is_saved: false,
                            is_demo_mode: true,
                            provider: "ai_recommended",
                            prompt_used: rec.prompt,
                            created_at: new Date().toISOString(),
                          });
                          setActiveVariationIdx(0);
                        }
                      }}
                      className={`group relative overflow-hidden rounded-xl border text-left transition p-2.5 ${isSelected
                        ? "border-[#C87960] bg-[#C87960]/5 shadow-sm ring-1 ring-[#C87960]"
                        : "border-[#DCCBB5] bg-white hover:border-[#C87960]"
                        }`}
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden rounded-lg mb-2 bg-[#252B2E]">
                        <img
                          src={rec.imageUrl}
                          alt={rec.style}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">
                          {rec.tag}
                        </span>
                        {isSelected && (
                          <span className="rounded bg-[#C87960] px-1.5 py-0.2 text-[9px] font-bold text-white">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-semibold text-[#172B3A] mt-0.5">
                        {rec.style}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-[#252B2E]/70 leading-relaxed">
                        {rec.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Connect Live Engine Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#172B3A]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#DCCBB5] bg-white p-6 shadow-editorial">
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-2xl font-semibold text-[#172B3A]">
                Connect Live Rendering Engine
              </h3>
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="rounded-full p-1.5 hover:bg-[#F7F4ED]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-[#252B2E]/75">
              Connect a real image-to-image editing provider to generate live photorealistic redesigns on any uploaded space photo.
            </p>

            <form onSubmit={handleSaveAiConfig} className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-[#172B3A]">Rendering Engine</label>
                <select
                  value={cfgProvider}
                  onChange={(e) => setCfgProvider(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                >
                  <option value="openai">OpenAI (dall-e-2 · Image Edits & Inpaint)</option>
                  <option value="gemini">Google Gemini (gemini-2.5-flash-image)</option>
                  <option value="stability">Stability (Structure & Inpaint)</option>
                  <option value="fal">Fal.ai (Flux Pro Kontext)</option>
                  <option value="demo">Demo Simulation Mode (Curated Pairs)</option>
                </select>
              </div>

              {cfgProvider !== "demo" && (
                <>
                  <div>
                    <label className="text-xs font-medium text-[#172B3A]">API Key</label>
                    <input
                      type="password"
                      required
                      value={cfgKey}
                      onChange={(e) => setCfgKey(e.target.value)}
                      placeholder="Paste provider API key..."
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#172B3A]">Model Override (Optional)</label>
                    <input
                      type="text"
                      value={cfgModel}
                      onChange={(e) => setCfgModel(e.target.value)}
                      placeholder="Leave blank for provider default"
                      className="mt-1 w-full rounded-xl border border-[#DCCBB5] bg-[#F7F4ED]/60 px-3 py-2 text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={cfgSaving}
                  className="btn-primary flex-1 justify-center py-2.5 text-xs"
                >
                  {cfgSaving ? "Saving..." : "Save Engine Configuration"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="btn-secondary py-2.5 px-4 text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Design History Slide-Over Drawer */}
      {showHistoryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#172B3A]/60 backdrop-blur-sm transition-opacity">
          <div
            className="fixed inset-0"
            onClick={() => setShowHistoryDrawer(false)}
          />
          <div className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#DCCBB5] bg-white shadow-2xl">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#DCCBB5] px-6 py-4">
              <div className="flex items-center gap-2.5">
                <History className="h-5 w-5 text-[#C87960]" />
                <h3 className="font-editorial text-xl font-semibold text-[#172B3A]">
                  Design History ({history.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryDrawer(false)}
                className="rounded-full p-1.5 text-[#252B2E]/70 hover:bg-[#F7F4ED] hover:text-[#172B3A]"
                title="Close History"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <History className="h-12 w-12 text-[#DCCBB5]" />
                  <p className="mt-3 text-sm font-semibold text-[#172B3A]">No saved designs yet</p>
                  <p className="mt-1 text-xs text-[#252B2E]/60 max-w-xs">
                    Your generated architectural redesigns will be automatically saved here for instant preview and restoration.
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="editorial-card overflow-hidden p-3 transition hover:border-[#C87960]"
                  >
                    <div className="flex gap-3">
                      <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-[#252B2E]">
                        <img
                          src={item.generated_image_url}
                          alt={item.style}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C87960]">
                              {item.style}
                            </span>
                            <span className="text-[10px] text-[#252B2E]/50">
                              {new Date(item.created_at).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                          <h4 className="mt-0.5 text-xs font-semibold text-[#172B3A] line-clamp-1">
                            {item.room_type || item.category || "Architectural Space"}
                          </h4>
                          <p className="mt-0.5 text-[10px] text-[#252B2E]/65 line-clamp-2">
                            {item.prompt || "Architectural redesign"}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[#DCCBB5]/40 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentDesign(item);
                              if (item.original_image_url) setOriginalUrl(item.original_image_url);
                              if (item.room_type) setRoomType(item.room_type);
                              if (item.style) setStyle(item.style);
                              setActiveVariationIdx(0);
                              setShowHistoryDrawer(false);
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-[#172B3A] px-2.5 py-1 text-[10px] font-medium text-white hover:bg-[#C87960] transition"
                          >
                            <Eye className="h-3 w-3" /> View in Studio
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownload(item.generated_image_url)}
                              className="rounded p-1 text-[#252B2E]/60 hover:text-[#172B3A]"
                              title="Download Image"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDesign(item.id)}
                              className="rounded p-1 text-[#252B2E]/60 hover:text-red-600"
                              title="Delete from History"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
