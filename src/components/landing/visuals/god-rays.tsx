"use client";

interface GodRaysProps {
  isDark?: boolean;
}

const RAYS = [
  { x1: "50%", x2: "10%",  width: 60,  animDuration: "10s", delay: "0s",   anim: "ray-pulse-1" },
  { x1: "50%", x2: "25%",  width: 80,  animDuration: "12s", delay: "1.5s", anim: "ray-pulse-2" },
  { x1: "50%", x2: "40%",  width: 100, animDuration: "15s", delay: "3s",   anim: "ray-pulse-1" },
  { x1: "50%", x2: "60%",  width: 100, animDuration: "11s", delay: "0.5s", anim: "ray-pulse-3" },
  { x1: "50%", x2: "75%",  width: 80,  animDuration: "13s", delay: "2s",   anim: "ray-pulse-2" },
  { x1: "50%", x2: "90%",  width: 60,  animDuration: "9s",  delay: "4s",   anim: "ray-pulse-1" },
  { x1: "50%", x2: "50%",  width: 120, animDuration: "14s", delay: "1s",   anim: "ray-pulse-3" },
];

export function GodRays({ isDark = true }: GodRaysProps) {
  const goldColor = isDark ? "rgba(255,215,0,0.06)" : "rgba(139,92,246,0.05)";
  const goldColorMid = isDark ? "rgba(255,215,0,0.04)" : "rgba(139,92,246,0.03)";

  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none"
      style={{ height: "100%", zIndex: 0 }}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="rayGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={goldColor} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {RAYS.map((ray, i) => {
        const x1Px = parseFloat(ray.x1) * 14.4;
        const x2Px = parseFloat(ray.x2) * 14.4;
        return (
          <polygon
            key={i}
            points={`${x1Px},${-30} ${x2Px - ray.width / 2},900 ${x2Px + ray.width / 2},900`}
            fill={i % 2 === 0 ? goldColor : goldColorMid}
            style={{
              animation: `${ray.anim} ${ray.animDuration} ease-in-out infinite`,
              animationDelay: ray.delay,
            }}
          />
        );
      })}
    </svg>
  );
}
