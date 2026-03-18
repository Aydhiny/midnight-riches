"use client";

interface GodRaysProps {
  isDark?: boolean;
}

// 7 rays that sweep in sequentially like casino stage spotlights, then loop
// Total cycle = 7 rays × 2s stagger = 14s period per ray, each holds for ~55% then fades
const RAYS = [
  { x2: "12%", width: 70,  delay: "0s"   },
  { x2: "27%", width: 90,  delay: "2s"   },
  { x2: "42%", width: 110, delay: "4s"   },
  { x2: "58%", width: 110, delay: "6s"   },
  { x2: "73%", width: 90,  delay: "8s"   },
  { x2: "88%", width: 70,  delay: "10s"  },
  { x2: "50%", width: 130, delay: "12s"  },
];
const PERIOD = "14s"; // must be >= stagger × numRays (7×2 = 14)

export function GodRays({ isDark = true }: GodRaysProps) {
  const fill1 = isDark ? "rgba(255,215,0,0.10)" : "rgba(139,92,246,0.09)";
  const fill2 = isDark ? "rgba(255,215,0,0.06)" : "rgba(139,92,246,0.05)";

  return (
    <>
      <style>{`
        @keyframes ray-sweep {
          0%    { opacity: 0; }
          6%    { opacity: 1; }
          55%   { opacity: 1; }
          72%   { opacity: 0; }
          100%  { opacity: 0; }
        }
      `}</style>
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
        style={{ zIndex: 0 }}
      >
        <defs>
          <linearGradient id="rayGradTop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={fill1} />
            <stop offset="70%"  stopColor={fill2} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {RAYS.map((ray, i) => {
          const x1Px = 720; // pivot at center-top
          const x2Px = parseFloat(ray.x2) * 14.4;
          return (
            <polygon
              key={i}
              points={`${x1Px - 4},${-40} ${x1Px + 4},${-40} ${x2Px + ray.width / 2},900 ${x2Px - ray.width / 2},900`}
              fill={`url(#rayGradTop)`}
              style={{
                opacity: 0,
                animation: `ray-sweep ${PERIOD} ease-in-out infinite`,
                animationDelay: ray.delay,
              }}
            />
          );
        })}
      </svg>
    </>
  );
}
