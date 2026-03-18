"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface AnimatedGradientBorderProps extends HTMLAttributes<HTMLDivElement> {
  gradientColors?: string[];
  borderWidth?: number;
  duration?: number;
}

export function AnimatedGradientBorder({
  className,
  gradientColors = ["#8B5CF6", "#F5C842", "#10B981", "#8B5CF6"],
  borderWidth = 2,
  duration = 3,
  children,
  ...props
}: AnimatedGradientBorderProps) {
  return (
    <div className={cn("relative rounded-xl p-[2px]", className)} {...props}>
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          padding: borderWidth,
          background: `linear-gradient(var(--angle, 0deg), ${gradientColors.join(", ")})`,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
          WebkitMaskComposite: "xor",
          animation: `gradient-rotate ${duration}s linear infinite`,
        }}
      />
      <div className="relative rounded-xl bg-black/80">{children}</div>
    </div>
  );
}
