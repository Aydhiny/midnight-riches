"use client";

import { useEffect, useRef, useState } from "react";

const SUITS_CONFIG = [
  { symbol: "♠", x: 8,  y: 15, color: "rgba(255,255,255,0.12)", pulse: "4s",  depth: 0.02 },
  { symbol: "♣", x: 92, y: 22, color: "rgba(255,255,255,0.08)", pulse: "6s",  depth: 0.03 },
  { symbol: "♥", x: 15, y: 65, color: "rgba(239,68,68,0.20)",   pulse: "8s",  depth: 0.015 },
  { symbol: "♦", x: 88, y: 70, color: "rgba(239,68,68,0.16)",   pulse: "5s",  depth: 0.025 },
  { symbol: "♠", x: 50, y: 10, color: "rgba(255,255,255,0.06)", pulse: "7s",  depth: 0.01 },
  { symbol: "♣", x: 25, y: 40, color: "rgba(255,255,255,0.09)", pulse: "9s",  depth: 0.035 },
  { symbol: "♥", x: 75, y: 45, color: "rgba(239,68,68,0.14)",   pulse: "6s",  depth: 0.02 },
  { symbol: "♦", x: 60, y: 80, color: "rgba(239,68,68,0.10)",   pulse: "4s",  depth: 0.03 },
  { symbol: "♠", x: 5,  y: 85, color: "rgba(255,255,255,0.07)", pulse: "11s", depth: 0.012 },
  { symbol: "♣", x: 95, y: 55, color: "rgba(255,255,255,0.08)", pulse: "8s",  depth: 0.028 },
  { symbol: "♥", x: 40, y: 30, color: "rgba(239,68,68,0.12)",   pulse: "5s",  depth: 0.018 },
  { symbol: "♦", x: 70, y: 90, color: "rgba(239,68,68,0.09)",   pulse: "7s",  depth: 0.022 },
];

export function CardSuitsParallax() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsets, setOffsets] = useState<{ x: number; y: number }[]>(
    SUITS_CONFIG.map(() => ({ x: 0, y: 0 }))
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handleMouse = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      setOffsets(
        SUITS_CONFIG.map((s) => ({
          x: dx * s.depth,
          y: dy * s.depth,
        }))
      );
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      aria-hidden
    >
      {SUITS_CONFIG.map((suit, i) => (
        <span
          key={i}
          className="absolute text-4xl md:text-6xl leading-none transition-transform duration-[1200ms] ease-out"
          style={{
            left: `${suit.x}%`,
            top: `${suit.y}%`,
            color: suit.color,
            animation: `glow-pulse ${suit.pulse} ease-in-out infinite`,
            transform: `translate(${offsets[i]?.x ?? 0}px, ${offsets[i]?.y ?? 0}px)`,
          }}
        >
          {suit.symbol}
        </span>
      ))}
    </div>
  );
}
