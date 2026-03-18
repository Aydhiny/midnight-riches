"use client";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🍎", "⭐", "💎", "👑"];
const DOUBLED = [...SYMBOLS, ...SYMBOLS];

interface BackgroundReelProps {
  side: "left" | "right";
  isDark?: boolean;
}

export function BackgroundReel({ side, isDark = true }: BackgroundReelProps) {
  return (
    <div
      className="absolute top-0 bottom-0 flex flex-col items-center overflow-hidden pointer-events-none select-none"
      style={{
        [side === "left" ? "left" : "right"]: "-1.5rem",
        width: "4rem",
        opacity: isDark ? 0.06 : 0.04,
        filter: "blur(1.5px)",
      }}
    >
      <div
        className="flex flex-col gap-8"
        style={{ animation: "reel-scroll 18s linear infinite" }}
      >
        {DOUBLED.map((sym, i) => (
          <span key={i} className="text-6xl md:text-7xl leading-none">
            {sym}
          </span>
        ))}
      </div>
    </div>
  );
}
