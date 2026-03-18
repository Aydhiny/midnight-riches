"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function NeonBorderCard({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-neon-border relative overflow-hidden rounded-2xl border-2 border-neon-gold bg-casino-card/80 backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
