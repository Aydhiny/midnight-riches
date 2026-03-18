"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  shimmerColor?: string;
  background?: string;
}

const ShinyButton = React.forwardRef<HTMLButtonElement, ShinyButtonProps>(
  (
    {
      children,
      className,
      shimmerColor = "rgba(255,255,255,0.22)",
      background = "linear-gradient(180deg, #9333ea 0%, #7c3aed 55%, #6d28d9 100%)",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded-xl px-6 py-3 font-semibold text-white",
          "border border-white/[0.12]",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
          "transition-all duration-200",
          "hover:shadow-[0_4px_14px_rgba(109,40,217,0.3)] hover:-translate-y-px",
          "active:scale-[0.97] active:shadow-none",
          className,
        )}
        style={{ background }}
        {...props}
      >
        {/* Subtle top highlight */}
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)" }}
        />
        {/* Shimmer sweep */}
        <span
          className="pointer-events-none absolute inset-0 skew-x-[-18deg]"
          style={{
            width: "55%",
            background: `linear-gradient(90deg, transparent 0%, ${shimmerColor} 50%, transparent 100%)`,
            animation: "shimmer-sweep 5s ease-in-out infinite",
          }}
        />
        <span className="relative z-10">{children}</span>
      </button>
    );
  },
);
ShinyButton.displayName = "ShinyButton";

export default ShinyButton;
