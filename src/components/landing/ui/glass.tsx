"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─── GlassCard ───────────────────────────────────────────────────────────────
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  glowColor,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl backdrop-blur-xl",
        "bg-[var(--glass-bg)] border border-[var(--glass-border)]",
        "shadow-[var(--glass-shadow)]",
        hover &&
          "transition-all duration-300 hover:bg-[var(--bg-card-hover)] hover:border-[var(--bg-card-border)] hover:-translate-y-0.5",
        glow && "hover:shadow-[0_4px_20px_rgba(0,0,0,0.15)]",
        className
      )}
      style={
        glowColor ? { "--glow-primary": glowColor } as React.CSSProperties : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}

// ─── GlassPill ───────────────────────────────────────────────────────────────
interface GlassPillProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassPill({ children, className, ...props }: GlassPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        "backdrop-blur-md bg-[var(--glass-bg)] border border-[var(--glass-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── GlassPanel ──────────────────────────────────────────────────────────────
interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GlassPanel({
  children,
  className,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-2xl",
        "bg-[var(--glass-bg)] border-y border-[var(--glass-border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── GoldGradientText ─────────────────────────────────────────────────────────
interface GoldGradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function GoldGradientText({
  children,
  className,
  as: Tag = "span",
}: GoldGradientTextProps) {
  return (
    <Tag
      className={cn(
        "dark:from-amber-400 dark:via-yellow-300 dark:to-amber-500",
        "from-amber-600 via-yellow-600 to-amber-700",
        "bg-gradient-to-r bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </Tag>
  );
}

// ─── PurpleGradientText ───────────────────────────────────────────────────────
interface PurpleGradientTextProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function PurpleGradientText({
  children,
  className,
  as: Tag = "span",
}: PurpleGradientTextProps) {
  return (
    <Tag
      className={cn(
        "dark:bg-gradient-to-r dark:from-violet-400 dark:via-purple-300 dark:to-pink-400",
        "bg-gradient-to-r from-violet-700 via-purple-600 to-pink-600",
        "bg-clip-text text-transparent",
        className
      )}
    >
      {children}
    </Tag>
  );
}

// ─── SectionHeadline ─────────────────────────────────────────────────────────
interface SectionHeadlineProps {
  children: React.ReactNode;
  className?: string;
  sub?: React.ReactNode;
}

export function SectionHeadline({
  children,
  className,
  sub,
}: SectionHeadlineProps) {
  return (
    <div className={cn("text-center space-y-3", className)}>
      <h2
        className={cn(
          "text-3xl md:text-4xl lg:text-5xl font-black tracking-tight",
          "text-[var(--text-primary)]"
        )}
      >
        {children}
      </h2>
      {sub && (
        <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-2xl mx-auto">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── GlowDivider ─────────────────────────────────────────────────────────────
export function GlowDivider({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-px w-full",
        "bg-gradient-to-r from-transparent via-[var(--bg-card-border)] to-transparent",
        className
      )}
    />
  );
}

// ─── PulsingDot ──────────────────────────────────────────────────────────────
export function PulsingDot({
  color = "bg-emerald-400",
  size = "w-2 h-2",
}: {
  color?: string;
  size?: string;
}) {
  return (
    <span className={cn("relative inline-flex rounded-full animate-pulse-dot", color, size)} />
  );
}
