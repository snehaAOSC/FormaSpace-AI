import React, { useRef, useState } from "react";
import { MoveHorizontal } from "lucide-react";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
  onPositionChange?: (position: number) => void;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeSrc,
  afterSrc,
  beforeLabel = "Original",
  afterLabel = "FormaSpace AI",
  className = "aspect-[16/10]",
  onPositionChange,
}) => {
  const [position, setPosition] = useState(54);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const nextPos = Math.max(2, Math.min(98, pct));
    setPosition(nextPos);
    onPositionChange?.(nextPos);
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={(e) => {
        if (e.buttons === 1) updateFromClientX(e.clientX);
      }}
      onPointerDown={(e) => updateFromClientX(e.clientX)}
      className={`relative w-full select-none overflow-hidden rounded-2xl border border-[#DCCBB5] bg-[#252B2E] cursor-ew-resize ${className}`}
    >
      {/* After Image (Base) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        className="h-full w-full object-cover pointer-events-none"
      />

      {/* Before Image (Clipped Overlay) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={beforeSrc}
          alt={beforeLabel}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-[#252B2E]/75 px-3 py-1 text-xs font-medium text-[#F7F4ED] backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-[#172B3A]/85 px-3 py-1 text-xs font-medium text-[#F7F4ED] backdrop-blur-sm">
        {afterLabel}
      </span>

      {/* Divider Line & Handle */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.4)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-[#172B3A] text-white shadow-lg">
          <MoveHorizontal className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
};

