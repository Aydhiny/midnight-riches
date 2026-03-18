"use client";

// ─── Inline slot machine preview components ───────────────
// Renders a stylized slot screen for each game variant.
// Pure CSS/emoji — no external images required.

const CLASSIC_GRID = [
  ["🍒", "🍋", "🍊"],
  ["🍒", "🍒", "🍒"], // winning line
  ["🍋", "🍊", "🍒"],
];

const FIVE_REEL_GRID = [
  ["⭐", "💎", "👑", "⭐", "💎"],
  ["💎", "⭐", "💎", "💎", "⭐"], // winning
  ["👑", "💎", "⭐", "💎", "👑"],
];

const CASCADE_GRID = [
  ["💎", "🔷", "💎", "🔷", "💎"],
  ["🔷", "💎", "🔷", "💎", "🔷"], // winning
  ["💎", "🔷", "🔷", "💎", "🔷"],
  ["🔷", "💎", "💎", "🔷", "💎"],
];

// Megaways — variable column heights (2-5 symbols per reel)
const MEGAWAYS_COLS = [
  ["⭐", "💎", "🍒"],
  ["🔮", "⭐", "💎", "👑"],
  ["💎", "⭐"],
  ["🍒", "💎", "⭐", "🔮", "👑"],
  ["⭐", "💎", "🍒", "🔮"],
  ["💎", "⭐"],
];

interface PreviewCellProps {
  symbol: string;
  highlight?: boolean;
  accent: string;
}

function Cell({ symbol, highlight, accent }: PreviewCellProps) {
  return (
    <div
      className="flex items-center justify-center rounded text-sm leading-none select-none"
      style={{
        padding: "4px 2px",
        background: highlight
          ? `${accent}33`
          : "rgba(255,255,255,0.04)",
        border: highlight
          ? `1px solid ${accent}80`
          : "1px solid rgba(255,255,255,0.06)",
        boxShadow: highlight ? `0 0 8px ${accent}50` : undefined,
        fontSize: "clamp(10px, 2.5vw, 16px)",
      }}
    >
      {symbol}
    </div>
  );
}

export function ClassicSlotPreview() {
  return (
    <div
      className="w-full rounded-xl overflow-hidden p-2"
      style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(251,191,36,0.15)" }}
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {CLASSIC_GRID.map((row, ri) =>
          row.map((sym, ci) => (
            <Cell key={`${ri}-${ci}`} symbol={sym} highlight={ri === 1} accent="#fbbf24" />
          ))
        )}
      </div>
      <div className="mt-1.5 text-center text-[9px] text-amber-400/60 tracking-widest font-medium">
        — PAYLINE —
      </div>
    </div>
  );
}

export function FiveReelPreview() {
  return (
    <div
      className="w-full rounded-xl overflow-hidden p-2"
      style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(139,92,246,0.15)" }}
    >
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {FIVE_REEL_GRID.map((row, ri) =>
          row.map((sym, ci) => (
            <Cell key={`${ri}-${ci}`} symbol={sym} highlight={ri === 1} accent="#a78bfa" />
          ))
        )}
      </div>
      <div className="mt-1.5 text-center text-[9px] text-violet-400/60 tracking-widest font-medium">
        20 PAYLINES
      </div>
    </div>
  );
}

export function CascadeReelPreview() {
  return (
    <div
      className="w-full rounded-xl overflow-hidden p-2"
      style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(52,211,153,0.15)" }}
    >
      <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {CASCADE_GRID.map((row, ri) =>
          row.map((sym, ci) => (
            <Cell key={`${ri}-${ci}`} symbol={sym} highlight={ri === 1} accent="#34d399" />
          ))
        )}
      </div>
      <div className="mt-1.5 text-center text-[9px] text-emerald-400/60 tracking-widest font-medium">
        CASCADE ↓ CHAIN
      </div>
    </div>
  );
}

export function MegawaysPreview() {
  return (
    <div
      className="w-full rounded-xl overflow-hidden p-2"
      style={{ background: "rgba(0,0,0,0.55)", border: "1px solid rgba(244,114,182,0.15)" }}
    >
      <div className="flex gap-0.5 items-end justify-center">
        {MEGAWAYS_COLS.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-0.5 flex-1">
            {col.map((sym, ri) => (
              <div
                key={ri}
                className="flex items-center justify-center rounded text-xs leading-none select-none"
                style={{
                  padding: "3px 1px",
                  background: ri === Math.floor(col.length / 2) ? "rgba(244,114,182,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${ri === Math.floor(col.length / 2) ? "rgba(244,114,182,0.4)" : "rgba(255,255,255,0.06)"}`,
                  fontSize: "clamp(8px, 2vw, 13px)",
                }}
              >
                {sym}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1.5 text-center text-[9px] text-pink-400/60 tracking-widest font-medium">
        UP TO 117,649 WAYS
      </div>
    </div>
  );
}
