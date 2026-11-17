import React, { useEffect, useRef, useState } from "react";
import { Eraser, Paintbrush, RotateCcw, Sparkles } from "lucide-react";
import type { DetectedObject } from "../types";

interface PrecisionMaskCanvasProps {
  imageUrl: string;
  onMaskChange: (dataUrl: string | null) => void;
  selectedObject?: DetectedObject | null;
}

export const PrecisionMaskCanvas: React.FC<PrecisionMaskCanvasProps> = ({
  imageUrl,
  onMaskChange,
  selectedObject,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(34);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [drawing, setDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);

  useEffect(() => {
    clearMask();
  }, [imageUrl]);

  const exportMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let nonZero = false;
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] > 10) {
        nonZero = true;
        break;
      }
    }
    setHasStrokes(nonZero);
    onMaskChange(nonZero ? canvas.toDataURL("image/png") : null);
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
    onMaskChange(null);
  };

  const autoMaskSelectedObject = () => {
    if (!selectedObject || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const [leftPct, topPct, wPct, hPct] = selectedObject.box;
    const x = (leftPct / 100) * canvas.width;
    const y = (topPct / 100) * canvas.height;
    const w = (wPct / 100) * canvas.width;
    const h = (hPct / 100) * canvas.height;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(200, 121, 96, 0.72)";
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.restore();
    exportMask();
  };

  const paintAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.fillStyle = "rgba(200, 121, 96, 0.72)";
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  return (
    <div className="space-y-3">
      {/* Mask Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#DCCBB5] bg-[#F7F4ED] px-3 py-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTool("brush")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium ${
              tool === "brush" ? "bg-[#C87960] text-white" : "bg-white text-[#172B3A]"
            }`}
          >
            <Paintbrush className="h-3.5 w-3.5" /> Paint Mask
          </button>
          <button
            type="button"
            onClick={() => setTool("eraser")}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium ${
              tool === "eraser" ? "bg-[#172B3A] text-white" : "bg-white text-[#172B3A]"
            }`}
          >
            <Eraser className="h-3.5 w-3.5" /> Erase
          </button>
          <div className="ml-2 flex items-center gap-1.5">
            <span className="text-[11px] text-[#252B2E]/70">Brush: {brushSize}px</span>
            <input
              type="range"
              min={12}
              max={90}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-20 accent-[#C87960]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {selectedObject && (
            <button
              type="button"
              onClick={autoMaskSelectedObject}
              className="inline-flex items-center gap-1 rounded-lg bg-[#9BAE9A]/30 px-2.5 py-1 text-[11px] font-semibold text-[#172B3A] hover:bg-[#9BAE9A]/50"
            >
              <Sparkles className="h-3 w-3" /> Auto-Mask {selectedObject.label}
            </button>
          )}
          <button
            type="button"
            onClick={clearMask}
            disabled={!hasStrokes}
            className="inline-flex items-center gap-1 rounded-lg border border-[#DCCBB5] bg-white px-2.5 py-1 text-[11px] text-[#172B3A] disabled:opacity-40"
          >
            <RotateCcw className="h-3 w-3" /> Clear
          </button>
        </div>
      </div>

      {/* Paintable Canvas */}
      <div className="relative overflow-hidden rounded-xl border border-[#DCCBB5] bg-[#252B2E]">
        <img
          src={imageUrl}
          alt="Mask Target"
          className="block aspect-[16/10] w-full object-cover select-none pointer-events-none"
        />
        <canvas
          ref={canvasRef}
          width={960}
          height={600}
          onPointerDown={(e) => {
            setDrawing(true);
            paintAt(e);
          }}
          onPointerMove={(e) => {
            if (drawing) paintAt(e);
          }}
          onPointerUp={() => {
            if (drawing) {
              setDrawing(false);
              exportMask();
            }
          }}
          onPointerLeave={() => {
            if (drawing) {
              setDrawing(false);
              exportMask();
            }
          }}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        />
        <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#172B3A]/85 px-3 py-1 text-[11px] text-[#F7F4ED]">
          {hasStrokes
            ? "Precision Mask Active — engine will edit painted area"
            : "Paint over any sofa, wall, floor, or clutter to mask"}
        </span>
      </div>
    </div>
  );
};

