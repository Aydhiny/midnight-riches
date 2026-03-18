"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
}

export function ShimmerButton({
  className,
  shimmerColor = "#F5C842",
  shimmerSize = "0.1em",
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={cn(
        "group relative inline-flex h-12 animate-shimmer items-center justify-center overflow-hidden rounded-xl border border-yellow-500/30 bg-[linear-gradient(110deg,#1a0a2e,45%,#F5C842,55%,#1a0a2e)] bg-[length:200%_100%] px-8 font-bold text-yellow-400 transition-colors",
        className
      )}
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
