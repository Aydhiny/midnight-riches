"use client";

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  className?: string;
}

export default function Aurora({
  colorStops = ["#4f1b8a", "#9d174d", "#92400e"],
  speed = 1.0,
  className = "",
}: AuroraProps) {
  const duration = Math.max(12, 30 / speed);

  return (
    <div
      className={`aurora-root ${className}`}
      style={
        {
          "--aurora-c1": colorStops[0] ?? "#4f1b8a",
          "--aurora-c2": colorStops[1] ?? "#9d174d",
          "--aurora-c3": colorStops[2] ?? "#92400e",
          "--aurora-dur": `${duration}s`,
        } as React.CSSProperties
      }
    >
      <div className="aurora-layer aurora-layer-1" />
      <div className="aurora-layer aurora-layer-2" />
      <div className="aurora-layer aurora-layer-3" />

      <style jsx>{`
        .aurora-root {
          position: relative;
          overflow: hidden;
        }
        .aurora-layer {
          position: absolute;
          inset: 0;
        }
        /* Primary blob — left-center, covers most of screen */
        .aurora-layer-1 {
          background: radial-gradient(
            ellipse 130% 90% at 20% 50%,
            var(--aurora-c1) 0%,
            var(--aurora-c2) 45%,
            transparent 75%
          );
          opacity: 0.38;
          animation: aurora-drift-1 var(--aurora-dur) ease-in-out infinite alternate;
        }
        /* Secondary blob — right-center */
        .aurora-layer-2 {
          background: radial-gradient(
            ellipse 120% 80% at 80% 45%,
            var(--aurora-c3) 0%,
            var(--aurora-c2) 40%,
            transparent 72%
          );
          opacity: 0.28;
          animation: aurora-drift-2 var(--aurora-dur) ease-in-out infinite alternate-reverse;
        }
        /* Top fade — unifies the top edge */
        .aurora-layer-3 {
          background: radial-gradient(
            ellipse 100% 60% at 50% -10%,
            var(--aurora-c1) 0%,
            transparent 70%
          );
          opacity: 0.18;
        }
        @keyframes aurora-drift-1 {
          0%   { transform: translate(-4%, -2%) scale(1); }
          100% { transform: translate(4%, 2%) scale(1.04); }
        }
        @keyframes aurora-drift-2 {
          0%   { transform: translate(4%, 2%) scale(1.04); }
          100% { transform: translate(-4%, -2%) scale(1); }
        }
      `}</style>
    </div>
  );
}
