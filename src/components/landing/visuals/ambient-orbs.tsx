"use client";

import { useEffect, useState } from "react";

/**
 * AmbientOrbs — subtle grainy radial gradient circles at the edges of the page.
 * Pure CSS, no canvas, no rAF. Just positioned divs with radial gradients + grain overlay.
 * Each orb is a large, soft circle placed at the edges with very low opacity.
 */

interface OrbConfig {
  /** CSS position values */
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  /** Size of the orb */
  width: string;
  height: string;
  /** Gradient colors */
  darkGradient: string;
  lightGradient: string;
}

const ORBS: OrbConfig[] = [
  {
    // Top-left purple orb
    top: "-15%",
    left: "-10%",
    width: "clamp(300px, 40vw, 600px)",
    height: "clamp(300px, 40vw, 600px)",
    darkGradient: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.04) 40%, transparent 70%)",
    lightGradient: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.02) 40%, transparent 70%)",
  },
  {
    // Right-center rose orb
    top: "30%",
    right: "-12%",
    width: "clamp(250px, 35vw, 500px)",
    height: "clamp(250px, 35vw, 500px)",
    darkGradient: "radial-gradient(circle, rgba(219,39,119,0.10) 0%, rgba(219,39,119,0.03) 40%, transparent 70%)",
    lightGradient: "radial-gradient(circle, rgba(244,114,182,0.06) 0%, rgba(244,114,182,0.02) 40%, transparent 70%)",
  },
  {
    // Bottom-left gold orb
    bottom: "10%",
    left: "-8%",
    width: "clamp(200px, 30vw, 450px)",
    height: "clamp(200px, 30vw, 450px)",
    darkGradient: "radial-gradient(circle, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.02) 40%, transparent 70%)",
    lightGradient: "radial-gradient(circle, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.01) 40%, transparent 70%)",
  },
  {
    // Bottom-right purple-pink orb
    bottom: "25%",
    right: "-6%",
    width: "clamp(280px, 32vw, 520px)",
    height: "clamp(280px, 32vw, 520px)",
    darkGradient: "radial-gradient(circle, rgba(168,85,247,0.09) 0%, rgba(190,24,93,0.03) 40%, transparent 70%)",
    lightGradient: "radial-gradient(circle, rgba(168,85,247,0.05) 0%, rgba(190,24,93,0.02) 40%, transparent 70%)",
  },
  {
    // Mid-page left subtle orb
    top: "55%",
    left: "-5%",
    width: "clamp(200px, 25vw, 400px)",
    height: "clamp(200px, 25vw, 400px)",
    darkGradient: "radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 60%)",
    lightGradient: "radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 60%)",
  },
];

const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export function AmbientOrbs({ isDark: isDarkProp }: { isDark: boolean }) {
  // Prevent hydration mismatch: default to dark until client is mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? isDarkProp : true;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: orb.top,
            bottom: orb.bottom,
            left: orb.left,
            right: orb.right,
            width: orb.width,
            height: orb.height,
            background: isDark ? orb.darkGradient : orb.lightGradient,
          }}
        >
          {/* Grain texture overlay on each orb */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              backgroundImage: GRAIN_URL,
              backgroundSize: "128px",
              opacity: isDark ? 0.3 : 0.2,
              mixBlendMode: "overlay",
            }}
          />
        </div>
      ))}
    </div>
  );
}
