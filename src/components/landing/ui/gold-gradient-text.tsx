"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface GoldGradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  as?: "span" | "h1" | "h2" | "h3" | "p";
}

export function GoldGradientText({
  as: Tag = "span",
  className,
  children,
  ...props
}: GoldGradientTextProps) {
  return (
    <Tag
      className={cn(
        "animate-gold-shimmer bg-[linear-gradient(110deg,#FFD700_0%,#FFF7CC_25%,#FFD700_50%,#FF8C00_75%,#FFD700_100%)] bg-[length:200%_auto] bg-clip-text font-black text-transparent",
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
