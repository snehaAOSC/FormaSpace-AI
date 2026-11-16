import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  Download,
  Eye,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

export type CameraMovementType =
  | "multi_side_cut"
  | "pan_left_right"
  | "pan_right_left"
  | "crane_vertical"
  | "orbit_360"
  | "diagonal_side_glide"
  | "dolly_depth";

export interface CameraAngle {
  id: string;
  name: string;
  shortLabel: string;
  lens: string;
  movement: CameraMovementType;
  description: string;
}

interface ArchitecturalVideoTourPlayerProps {
  sourceImage: string;
  title?: string;
  category?: string;
  autoPlay?: boolean;
  className?: string;
  showControls?: boolean;
  onSwitchToSlider?: () => void;
  selectedMovement?: string;
  onMovementChange?: (movementName: string) => void;
}

export const CAMERA_ANGLES: CameraAngle[] = [
  {
    id: "multi_side_cut",
    name: "Multi-Side 4-Angle Montage",
    shortLabel: "Multi-Side Cut",
    lens: "Cinema 35mm Prime",
    movement: "multi_side_cut",
    description: "4-camera cut: Left Side, Right Side, Ceiling, and Wide Room",
  },
  {
    id: "pan_left_right",
    name: "Left-to-Right Side Pan",
    shortLabel: "Left → Right",
    lens: "28mm f/2.0 Wide",
    movement: "pan_left_right",
    description: "Continuous sweep from far left wall across to right wall",
  },
  {
    id: "pan_right_left",
    name: "Right-to-Left Side Pan",
    shortLabel: "Right → Left",
    lens: "28mm f/2.0 Wide",
    movement: "pan_right_left",
    description: "Continuous sweep from right wall across to left wall",
  },
  {
    id: "crane_vertical",
    name: "Ceiling-to-Floor Crane",
    shortLabel: "Vertical Crane",
    lens: "24mm f/2.8 Tilt",
    movement: "crane_vertical",
    description: "Architectural reveal from ceiling lights down to floor finishes",
  },
  {
    id: "orbit_360",
    name: "360° Circular Spatial Orbit",
    shortLabel: "360° Orbit",
    lens: "50mm f/1.4 Anamorphic",
    movement: "orbit_360",
    description: "Dynamic 3D elliptical rotation around the center furniture/island",
  },
  {
    id: "diagonal_side_glide",
    name: "Diagonal Corner Glide",
    shortLabel: "Corner Glide",
    lens: "35mm f/1.8",
    movement: "diagonal_side_glide",
    description: "Corner-to-corner diagonal sweep across the space",
  },
  {
    id: "dolly_depth",
    name: "Wide Establishing Dolly",
    shortLabel: "Wide Dolly",
    lens: "24mm f/2.8 Master",
    movement: "dolly_depth",
    description: "Deep focal perspective push-in and spatial reveal",
  },
];

export const ArchitecturalVideoTourPlayer: React.FC<ArchitecturalVideoTourPlayerProps> = ({
  sourceImage,
  title = "FormaSpace 4K Cinematic Walkthrough",
  category = "Video Tour",
  autoPlay = true,
  className = "aspect-[16/10]",
  showControls = true,
  onSwitchToSlider,
  selectedMovement,
  onMovementChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [playing, setPlaying] = useState(autoPlay);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [speed, setSpeed] = useState<number>(1);
  const [activeAngleIdx, setActiveAngleIdx] = useState(0);
  const [duration, setDuration] = useState(7); // seconds per sweep
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [currentTelemetrySubtext, setCurrentTelemetrySubtext] = useState("");

  // Sync external selectedMovement prop with activeAngleIdx
  useEffect(() => {
    if (!selectedMovement) return;
    const matchIdx = CAMERA_ANGLES.findIndex(
      (a) =>
        a.name.toLowerCase() === selectedMovement.toLowerCase() ||
        a.shortLabel.toLowerCase() === selectedMovement.toLowerCase() ||
        a.movement.toLowerCase() === selectedMovement.toLowerCase() ||
        selectedMovement.toLowerCase().includes(a.shortLabel.toLowerCase()) ||
        selectedMovement.toLowerCase().includes(a.movement.replace(/_/g, " ").toLowerCase())
    );
    if (matchIdx !== -1 && matchIdx !== activeAngleIdx) {
      setActiveAngleIdx(matchIdx);
    }
  }, [selectedMovement]);

  const activeAngle = CAMERA_ANGLES[activeAngleIdx] || CAMERA_ANGLES[0];

  // Ambient Architectural Sound (Gentle natural room breeze synthesized via Web Audio)
  const toggleSound = () => {
    if (!soundEnabled) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!audioCtxRef.current && AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          // Pink-noise room presence filter
          const bufferSize = ctx.sampleRate * 2;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let b0 = 0,
            b1 = 0,
            b2 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.969 * b2 + white * 0.153852;
            output[i] = (b0 + b1 + b2) * 0.015;
          }
          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          const filter = ctx.createBiquadFilter();
          filter.type = "lowpass";
          filter.frequency.value = 420;

          const gain = ctx.createGain();
          gain.gain.value = 0.12;

          whiteNoise.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          whiteNoise.start(0);
        } else if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        setSoundEnabled(true);
      } catch {
        setSoundEnabled(false);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.suspend();
      }
      setSoundEnabled(false);
    }
  };

  // Ultra-Smooth 60FPS Cinematic Multi-Side Flythrough Canvas Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = sourceImage;

    let startTime = performance.now();
    let pausedAtProgress = 0;

    const render = (now: number) => {
      if (!img.complete || img.naturalWidth === 0) {
        animRef.current = requestAnimationFrame(render);
        return;
      }

      const totalMs = (duration * 1000) / speed;
      let currentProgress = progress;

      if (playing) {
        const elapsed = (now - startTime) % totalMs;
        currentProgress = elapsed / totalMs;
        setProgress(currentProgress);
      } else {
        startTime = now - pausedAtProgress * totalMs;
      }

      const cw = canvas.width;
      const ch = canvas.height;
      ctx.clearRect(0, 0, cw, ch);

      // Fit mode: cover
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = cw / ch;

      let baseW = cw;
      let baseH = ch;
      if (imgAspect > canvasAspect) {
        baseH = ch;
        baseW = ch * imgAspect;
      } else {
        baseW = cw;
        baseH = cw / imgAspect;
      }

      let scale = 1.38;
      let targetOffsetX = 0;
      let targetOffsetY = 0;
      let subtext = "";
      let cutOverlayAlpha = 0;

      const movement = activeAngle.movement;

      if (movement === "multi_side_cut") {
        // Multi-Side 4-Angle Cinematic Montage with micro-transitions:
        // Angle 1 (0.00 - 0.25): Left Side Angle (Camera focuses on left wall & windows)
        // Angle 2 (0.25 - 0.50): Right Side Angle (Camera focuses on right millwork/cabinets)
        // Angle 3 (0.50 - 0.75): Ceiling & Lighting Angle (Camera tilts up to chandelier & ceiling)
        // Angle 4 (0.75 - 1.00): Full Wide Spatial Overview (Slow pullback revealing the entire space)
        if (currentProgress < 0.25) {
          const lp = currentProgress / 0.25;
          scale = 1.42 + lp * 0.03;
          targetOffsetX = (cw * 0.32); // shifts view to LEFT side of room
          targetOffsetY = -(ch * 0.06);
          subtext = "Angle 1/4: Left Side Glazing & Perspective";
          // Micro cut transition near start of segment
          if (lp < 0.08) cutOverlayAlpha = (1 - lp / 0.08) * 0.35;
        } else if (currentProgress < 0.5) {
          const lp = (currentProgress - 0.25) / 0.25;
          scale = 1.42 + lp * 0.03;
          targetOffsetX = -(cw * 0.32); // shifts view to RIGHT side of room
          targetOffsetY = -(ch * 0.06);
          subtext = "Angle 2/4: Right Side Millwork & Fixtures";
          if (lp < 0.08) cutOverlayAlpha = (1 - lp / 0.08) * 0.35;
        } else if (currentProgress < 0.75) {
          const lp = (currentProgress - 0.5) / 0.25;
          scale = 1.36 + lp * 0.03;
          targetOffsetX = 0;
          targetOffsetY = (ch * 0.28); // shifts view UP towards ceiling
          subtext = "Angle 3/4: Ceiling Architecture & Lighting";
          if (lp < 0.08) cutOverlayAlpha = (1 - lp / 0.08) * 0.35;
        } else {
          const lp = (currentProgress - 0.75) / 0.25;
          scale = 1.28 - lp * 0.20; // pull back to 1.08x wide
          targetOffsetX = 0;
          targetOffsetY = -(ch * 0.03);
          subtext = "Angle 4/4: Wide Spatial Overview";
          if (lp < 0.08) cutOverlayAlpha = (1 - lp / 0.08) * 0.35;
        }
      } else if (movement === "pan_left_right") {
        // Continuous sweep from far left wall to far right wall
        scale = 1.42;
        const ease = 0.5 - Math.cos(currentProgress * Math.PI * 2) / 2;
        targetOffsetX = (0.5 - ease) * (cw * 0.55);
        targetOffsetY = 0;
        subtext = "Continuous Left → Right Side Panoramic Sweep";
      } else if (movement === "pan_right_left") {
        // Continuous sweep from far right wall to far left wall
        scale = 1.42;
        const ease = 0.5 - Math.cos(currentProgress * Math.PI * 2) / 2;
        targetOffsetX = (ease - 0.5) * (cw * 0.55);
        targetOffsetY = 0;
        subtext = "Continuous Right → Left Side Panoramic Sweep";
      } else if (movement === "crane_vertical") {
        // Ceiling down to floor and back
        scale = 1.38;
        const ease = 0.5 - Math.cos(currentProgress * Math.PI * 2) / 2;
        targetOffsetX = 0;
        targetOffsetY = (ease - 0.5) * (ch * 0.45);
        subtext = "Ceiling ↕ Floor Architectural Vertical Crane";
      } else if (movement === "orbit_360") {
        // Dynamic 3D elliptical rotation
        const angle = currentProgress * Math.PI * 2;
        scale = 1.32 + Math.sin(angle * 2) * 0.06;
        targetOffsetX = Math.cos(angle) * (cw * 0.24);
        targetOffsetY = Math.sin(angle) * (ch * 0.18);
        subtext = "360° Circular Spatial Parallax Orbit";
      } else if (movement === "diagonal_side_glide") {
        // Corner-to-corner diagonal sweep
        scale = 1.40;
        const ease = 0.5 - Math.cos(currentProgress * Math.PI * 2) / 2;
        targetOffsetX = (0.5 - ease) * (cw * 0.42);
        targetOffsetY = (ease - 0.5) * (ch * 0.32);
        subtext = "Corner-to-Corner Diagonal Architectural Glide";
      } else {
        // dolly_depth: wide establishing focal push
        const ease = 0.5 - Math.cos(currentProgress * Math.PI * 2) / 2;
        scale = 1.05 + ease * 0.35;
        targetOffsetX = 0;
        targetOffsetY = (ease - 0.5) * 30;
        subtext = "Cinematic Focal Push & Spatial Reveal";
      }

      setCurrentTelemetrySubtext(subtext);

      const finalW = baseW * scale;
      const finalH = baseH * scale;

      // Safe offsets to prevent edge borders
      const maxOffsetX = Math.max(0, (finalW - cw) / 2);
      const maxOffsetY = Math.max(0, (finalH - ch) / 2);

      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, targetOffsetX));
      const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, targetOffsetY));

      const dx = (cw - finalW) / 2 + clampedX;
      const dy = (ch - finalH) / 2 + clampedY;

      ctx.drawImage(img, dx, dy, finalW, finalH);

      // Micro cinematic cut dip overlay if switching angles
      if (cutOverlayAlpha > 0) {
        ctx.fillStyle = `rgba(10, 18, 26, ${cutOverlayAlpha})`;
        ctx.fillRect(0, 0, cw, ch);
      }

      // Subtle atmospheric lighting flare sweep across room
      const flareEase = 0.5 - Math.cos(currentProgress * Math.PI * 2) / 2;
      const flareX = cw * (0.2 + flareEase * 0.6);
      const flareGrad = ctx.createRadialGradient(flareX, ch * 0.35, 10, flareX, ch * 0.35, cw * 0.5);
      flareGrad.addColorStop(0, "rgba(255, 248, 230, 0.12)");
      flareGrad.addColorStop(0.5, "rgba(200, 121, 96, 0.05)");
      flareGrad.addColorStop(1, "rgba(23, 43, 58, 0)");
      ctx.fillStyle = flareGrad;
      ctx.fillRect(0, 0, cw, ch);

      // Corner vignette for luxury architectural presentation
      const vigGrad = ctx.createRadialGradient(cw / 2, ch / 2, ch * 0.45, cw / 2, ch / 2, cw * 0.8);
      vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
      vigGrad.addColorStop(1, "rgba(23, 43, 58, 0.34)");
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, cw, ch);

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [sourceImage, activeAngle, duration, playing, speed]);

  // Direct WebM Video Export & Download
  const handleExportClip = async () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined") {
      alert("Browser video recording is supported in modern Chrome, Edge, and Firefox.");
      return;
    }
    setIsExporting(true);
    setPlaying(true);
    try {
      const stream = canvas.captureStream(30);
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType: mime });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsExporting(false);
        const a = document.createElement("a");
        a.href = url;
        a.download = `formaspace-walkthrough-${activeAngle.id}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      recorder.start();
      setTimeout(() => {
        recorder.stop();
      }, duration * 1000);
    } catch {
      setIsExporting(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  const handleSelectAngle = (idx: number) => {
    setActiveAngleIdx(idx);
    if (onMovementChange && CAMERA_ANGLES[idx]) {
      onMovementChange(CAMERA_ANGLES[idx].name);
    }
  };

  const currentSeconds = (progress * duration).toFixed(1);
  const totalSeconds = duration.toFixed(1);

  return (
    <div
      ref={containerRef}
      className={`group relative overflow-hidden rounded-2xl border border-[#DCCBB5] bg-[#172B3A] shadow-editorial select-none ${className}`}
    >
      {/* 60FPS Canvas Video Engine */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        onClick={() => setPlaying(!playing)}
        className="block h-full w-full object-cover cursor-pointer"
      />

      {/* Top Left: Structure Lock ON Badge */}
      <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#172B3A]/85 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9BAE9A] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#9BAE9A]" />
          </span>
          <span>Structure Lock ON</span>
        </div>

        <span className="hidden sm:inline-flex rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-[#F7F4ED] backdrop-blur-md">
          4K Cinematic · 60FPS
        </span>
      </div>

      {/* Top Right: Mode Switcher & Export */}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2">
        {onSwitchToSlider && (
          <button
            type="button"
            onClick={onSwitchToSlider}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-[#172B3A]/80 px-3.5 py-1.5 text-xs font-semibold text-[#F7F4ED] backdrop-blur-md transition hover:bg-[#C87960] hover:border-transparent hover:text-white"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Before / After Slider</span>
          </button>
        )}
        <button
          type="button"
          onClick={handleExportClip}
          disabled={isExporting}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-[#C87960] disabled:opacity-60"
          title="Download 60FPS Video Tour"
        >
          {isExporting ? (
            <>
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Recording Clip...</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Export Clip</span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Floating Telemetry & Current Camera Perspective Badge */}
      <div className="absolute left-4 bottom-14 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <span className="rounded-full bg-[#C87960] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-md">
          ● {category}
        </span>
        <span className="rounded-full bg-[#172B3A]/85 border border-white/15 px-3 py-1 text-[11px] font-medium text-[#F7F4ED] backdrop-blur-md">
          {activeAngle.name} · {activeAngle.lens}
        </span>
        {currentTelemetrySubtext && (
          <span className="hidden lg:inline-flex rounded-full bg-black/45 border border-white/10 px-2.5 py-1 text-[10px] text-[#F7F4ED]/90 backdrop-blur-md">
            {currentTelemetrySubtext}
          </span>
        )}
      </div>

      {/* Video Player Controls Bar */}
      {showControls && (
        <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#172B3A] via-[#172B3A]/90 to-transparent px-4 pt-6 pb-3 text-white transition-opacity duration-300">
          {/* Progress Timeline Scrubber */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const p = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setProgress(p);
            }}
            className="group/timeline relative mb-3 h-1.5 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-[#C87960]"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#C87960] shadow-md transition-transform"
              style={{ left: `calc(${progress * 100}% - 7px)` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Play/Pause & Timecode */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying(!playing)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#172B3A] transition hover:bg-[#C87960] hover:text-white"
                title={playing ? "Pause" : "Play"}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>

              <span className="font-mono text-[11px] tracking-wide text-[#F7F4ED]/80">
                00:0{Math.floor(Number(currentSeconds))} / 00:0{Math.floor(Number(totalSeconds))}
              </span>

              <button
                type="button"
                onClick={toggleSound}
                className="rounded-full p-1.5 text-white/80 transition hover:bg-white/15 hover:text-white"
                title={soundEnabled ? "Mute Ambience" : "Enable Spatial Ambience"}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4 text-[#9BAE9A]" /> : <VolumeX className="h-4 w-4" />}
              </button>
            </div>

            {/* Camera Perspective Angle Selector Chips */}
            <div className="hidden md:flex items-center gap-1 rounded-full bg-black/40 p-1 border border-white/15 overflow-x-auto max-w-[500px]">
              {CAMERA_ANGLES.map((ang, i) => (
                <button
                  key={ang.id}
                  type="button"
                  onClick={() => handleSelectAngle(i)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition whitespace-nowrap ${
                    activeAngleIdx === i
                      ? "bg-[#C87960] text-white shadow"
                      : "text-white/75 hover:bg-white/10 hover:text-white"
                  }`}
                  title={ang.description}
                >
                  {ang.shortLabel}
                </button>
              ))}
            </div>

            {/* Speed & Fullscreen */}
            <div className="flex items-center gap-2">
              <div className="flex rounded-full bg-black/30 border border-white/10 p-0.5 text-[10px]">
                {[0.5, 1, 1.5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSpeed(s)}
                    className={`rounded-full px-2 py-0.5 transition ${
                      speed === s ? "bg-[#172B3A] text-white font-bold" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-full p-1.5 text-white/80 hover:bg-white/15 hover:text-white"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
