"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  spotlightColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  spotlightColor = "rgba(139, 92, 246, 0.2)",
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [autonomousOpacity, setAutonomousOpacity] = useState(0);

  // Autonomous flicker — runs when not hovered
  const startFlicker = useCallback(() => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();

    let tick = 0;
    intervalRef.current = setInterval(() => {
      if (!divRef.current) return;

      // Every ~3 seconds, drift to a new random position
      if (tick % 3 === 0) {
        setPosition({
          x: rect.width * (0.2 + Math.random() * 0.6),
          y: rect.height * (0.1 + Math.random() * 0.8),
        });
      }

      // Flicker opacity in a wave pattern
      const baseOpacity = 0.15 + Math.random() * 0.12;
      setAutonomousOpacity(baseOpacity);

      // Occasionally dim almost completely (realistic flicker)
      if (Math.random() < 0.15) {
        setTimeout(() => setAutonomousOpacity(0.03 + Math.random() * 0.06), 80);
        setTimeout(() => setAutonomousOpacity(baseOpacity), 200);
      }

      tick++;
    }, 1200 + Math.random() * 800);
  }, []);

  const stopFlicker = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setAutonomousOpacity(0);
  }, []);

  useEffect(() => {
    // Start autonomous flicker on mount
    const timeout = setTimeout(startFlicker, 500 + Math.random() * 1000);
    return () => {
      clearTimeout(timeout);
      stopFlicker();
    };
  }, [startFlicker, stopFlicker]);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    stopFlicker();
    setOpacity(0.7);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOpacity(0);
    startFlicker();
  };

  const activeOpacity = isHovered ? opacity : autonomousOpacity;

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn("relative overflow-hidden", className)}
    >
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: activeOpacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 70%)`,
          zIndex: 0,
        }}
      />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
};

export default SpotlightCard;
