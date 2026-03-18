"use client";

import { cn } from "@/lib/utils";

export function PulsingDot({
  className,
  color = "bg-neon-green",
}: {
  className?: string;
  color?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-2.5 w-2.5", className)}>
      <span
        className={cn(
          "animate-pulse-dot absolute inline-flex h-full w-full rounded-full opacity-75",
          color
        )}
      />
      <span
        className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", color)}
      />
    </span>
  );
}
