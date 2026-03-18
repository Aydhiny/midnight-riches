"use client";

import type { GameSymbol } from "@/types";
import { SYMBOLS } from "@/lib/game/symbols";

interface SymbolIconProps {
  symbol: GameSymbol;
  size?: number;
  className?: string;
}

function CherrySVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="20" cy="44" r="14" fill={color} />
      <circle cx="44" cy="44" r="14" fill={color} />
      <path d="M20 30 Q32 4 44 30" stroke="#22C55E" strokeWidth="3" fill="none" />
      <ellipse cx="34" cy="10" rx="8" ry="5" fill="#22C55E" />
    </svg>
  );
}

function LemonSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <ellipse cx="32" cy="32" rx="22" ry="18" fill={color} transform="rotate(-15 32 32)" />
      <ellipse cx="28" cy="32" rx="14" ry="10" fill="#FEF08A" transform="rotate(-15 28 32)" opacity="0.4" />
    </svg>
  );
}

function OrangeSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="34" r="20" fill={color} />
      <ellipse cx="32" cy="14" rx="4" ry="3" fill="#22C55E" />
      <circle cx="32" cy="34" r="14" fill="#FDBA74" opacity="0.3" />
    </svg>
  );
}

function GrapeSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <circle cx="24" cy="24" r="8" fill={color} />
      <circle cx="40" cy="24" r="8" fill={color} />
      <circle cx="32" cy="36" r="8" fill={color} />
      <circle cx="20" cy="36" r="8" fill={color} />
      <circle cx="44" cy="36" r="8" fill={color} />
      <circle cx="32" cy="48" r="8" fill={color} />
      <rect x="30" y="8" width="4" height="12" rx="2" fill="#22C55E" />
    </svg>
  );
}

function WatermelonSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <path d="M8 40 A28 28 0 0 1 56 40 Z" fill={color} />
      <path d="M12 40 A24 24 0 0 1 52 40 Z" fill="#DC2626" />
      <circle cx="24" cy="34" r="2" fill="#1a1a1a" />
      <circle cx="32" cy="30" r="2" fill="#1a1a1a" />
      <circle cx="40" cy="34" r="2" fill="#1a1a1a" />
    </svg>
  );
}

function WildSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="16" width="48" height="32" rx="6" fill={color} />
      <text x="32" y="38" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1a1a1a">
        WILD
      </text>
    </svg>
  );
}

function ScatterSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <polygon points="32,4 40,24 60,24 44,38 50,58 32,46 14,58 20,38 4,24 24,24" fill={color} />
      <polygon points="32,14 36,26 48,26 38,34 42,46 32,38 22,46 26,34 16,26 28,26" fill="#FDF2F8" opacity="0.4" />
    </svg>
  );
}

function SevenSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <text x="32" y="46" textAnchor="middle" fontSize="40" fontWeight="bold" fill={color}>
        7
      </text>
    </svg>
  );
}

function BarSVG({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <rect x="8" y="22" width="48" height="20" rx="4" fill={color} stroke="#FBBF24" strokeWidth="2" />
      <text x="32" y="37" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#FBBF24">
        BAR
      </text>
    </svg>
  );
}

const SYMBOL_COMPONENTS: Record<GameSymbol, React.ComponentType<{ color: string; size: number }>> = {
  cherry: CherrySVG,
  lemon: LemonSVG,
  orange: OrangeSVG,
  grape: GrapeSVG,
  watermelon: WatermelonSVG,
  wild: WildSVG,
  scatter: ScatterSVG,
  seven: SevenSVG,
  bar: BarSVG,
};

export function SymbolIcon({ symbol, size = 64, className }: SymbolIconProps) {
  const Component = SYMBOL_COMPONENTS[symbol];
  const config = SYMBOLS[symbol];

  return (
    <div className={className}>
      <Component color={config.color} size={size} />
    </div>
  );
}
