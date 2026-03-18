"use client";

interface HeroBackgroundProps {
  isDark: boolean;
}

export function HeroBackground({ isDark }: HeroBackgroundProps) {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {/* Base dark/light floor */}
      <div
        className="absolute inset-0"
        style={{ background: isDark ? "#06010f" : "#f5f0ff" }}
      />

      {/* Purple bloom — top left */}
      <div
        className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%]"
        style={{
          background: `radial-gradient(ellipse, ${isDark ? "rgba(109,40,217,0.40)" : "rgba(109,40,217,0.18)"} 0%, transparent 70%)`,
        }}
      />

      {/* Rose bloom — top right */}
      <div
        className="absolute -top-[10%] -right-[5%] w-[55%] h-[60%]"
        style={{
          background: `radial-gradient(ellipse, ${isDark ? "rgba(190,24,93,0.28)" : "rgba(190,24,93,0.12)"} 0%, transparent 70%)`,
        }}
      />

      {/* Gold accent — bottom center */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[40%]"
        style={{
          background: `radial-gradient(ellipse, ${isDark ? "rgba(161,98,7,0.22)" : "rgba(161,98,7,0.10)"} 0%, transparent 70%)`,
        }}
      />

      {/* Grain overlay — visible noise texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
          opacity: isDark ? 0.18 : 0.10,
          mixBlendMode: "overlay",
        }}
      />

      {/* Vignette — edges darkening */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)"
            : "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(245,240,255,0.55) 100%)",
        }}
      />
    </div>
  );
}
