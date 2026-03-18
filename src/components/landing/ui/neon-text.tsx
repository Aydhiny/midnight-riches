"use client";

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface NeonTextProps extends HTMLAttributes<HTMLSpanElement> {
  color?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}

export function NeonText({
  color = "#FFD700",
  as: Tag = "span",
  className,
  children,
  ...props
}: NeonTextProps) {
  return (
    <Tag
      className={cn("animate-neon-flicker font-black", className)}
      style={{ "--neon-color": color, color } as React.CSSProperties}
      {...props}
    >
      {children}
    </Tag>
  );
}
