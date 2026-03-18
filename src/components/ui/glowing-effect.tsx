"use client";

import { useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface GlowingEffectProps {
  blur?: number;
  inactiveZone?: number;
  proximity?: number;
  spread?: number;
  variant?: "default" | "white";
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  borderWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export function GlowingEffect({
  blur = 0,
  inactiveZone = 0.7,
  proximity = 64,
  spread = 20,
  variant = "default",
  glow = false,
  className,
  disabled = false,
  borderWidth = 2,
  color,
  children,
}: GlowingEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const updateGlow = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current;
      const glowEl = glowRef.current;
      if (!container || !glowEl || disabled) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const distFromCenter = Math.sqrt(
        Math.pow((x - centerX) / rect.width, 2) +
          Math.pow((y - centerY) / rect.height, 2)
      );

      if (distFromCenter < inactiveZone) {
        glowEl.style.opacity = "0";
        return;
      }

      const distFromEdge = Math.min(
        x,
        y,
        rect.width - x,
        rect.height - y,
        proximity
      );
      const opacity = Math.max(0, distFromEdge / proximity);

      glowEl.style.opacity = String(opacity);
      glowEl.style.background = `radial-gradient(${spread}% ${spread}% at ${x}px ${y}px, ${
        color ??
        (variant === "white"
          ? "rgba(255,255,255,0.3)"
          : "rgba(139,92,246,0.5)")
      }, transparent)`;
    },
    [disabled, inactiveZone, proximity, spread, variant, color]
  );

  const handleMouseLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("mousemove", updateGlow);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", updateGlow);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [updateGlow, handleMouseLeave]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
        style={{
          filter: blur ? `blur(${blur}px)` : undefined,
          zIndex: 0,
        }}
      />
      {glow && (
        <div
          className="pointer-events-none absolute rounded-[inherit]"
          style={{
            inset: -borderWidth,
            background: `linear-gradient(135deg, rgba(139,92,246,0.4), rgba(236,72,153,0.4), rgba(245,158,11,0.4))`,
            zIndex: -1,
            opacity: 0.6,
          }}
        />
      )}
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
