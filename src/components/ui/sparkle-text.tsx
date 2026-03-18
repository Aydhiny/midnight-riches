"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface SparkleTextProps {
  children: React.ReactNode;
  className?: string;
  sparkleColor?: string;
}

export function SparkleText({ children, className, sparkleColor = "#F5C842" }: SparkleTextProps) {
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  useEffect(() => {
    const generated: Sparkle[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.floor(Math.random() * 100),
      y: Math.floor(Math.random() * 100),
      size: Math.floor(Math.random() * 8) + 4,
      delay: Math.random() * 2,
    }));
    setSparkles(generated);
  }, []);

  return (
    <span className={cn("relative inline-block", className)}>
      {sparkles.map((sparkle) => (
        <svg
          key={sparkle.id}
          className="pointer-events-none absolute animate-pulse"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: `${sparkle.delay}s`,
          }}
          viewBox="0 0 24 24"
          fill={sparkleColor}
        >
          <path d="M12 0L14.59 8.41L23 12L14.59 15.59L12 24L9.41 15.59L1 12L9.41 8.41Z" />
        </svg>
      ))}
      <span className="relative z-10">{children}</span>
    </span>
  );
}
