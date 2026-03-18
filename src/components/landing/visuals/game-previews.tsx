"use client";

// ─── Rich CSS-based slot machine preview components ───────────────
// Each preview renders a styled mini slot screen with themed symbols,
// a highlighted winning line, ambient glow, and decorative chrome.
// Pure CSS/emoji — no external images required.

// ─── Classic Slot ────────────────────────────────────────────────
// amber/gold theme · 3×3 grid · cherry/lemon/orange/bar symbols

const CLASSIC_GRID = [
  [{ sym: "🍊", win: false }, { sym: "🍋", win: false }, { sym: "BAR", win: false }],
  [{ sym: "🍒", win: true  }, { sym: "🍒", win: true  }, { sym: "🍒", win: true  }],
  [{ sym: "🍋", win: false }, { sym: "🍊", win: false }, { sym: "🍋", win: false }],
];

// ─── Five Reel ───────────────────────────────────────────────────
// violet/purple theme · 3×5 grid · star/gem/crown/wild symbols

const FIVE_REEL_GRID = [
  [{ sym: "⭐", win: false }, { sym: "👑", win: false }, { sym: "🔮", win: false }, { sym: "⭐", win: false }, { sym: "👑", win: false }],
  [{ sym: "💎", win: true  }, { sym: "💎", win: true  }, { sym: "💎", win: true  }, { sym: "💎", win: true  }, { sym: "💎", win: true  }],
  [{ sym: "👑", win: false }, { sym: "🔮", win: false }, { sym: "⭐", win: false }, { sym: "🔮", win: false }, { sym: "⭐", win: false }],
];

// ─── Cascade Reels ───────────────────────────────────────────────
// emerald/teal theme · 4×5 grid · gem cascade with falling visual

const CASCADE_GRID = [
  [{ sym: "💚", win: false }, { sym: "🔷", win: false }, { sym: "💚", win: false }, { sym: "🔷", win: false }, { sym: "💚", win: false }],
  [{ sym: "💎", win: true  }, { sym: "💎", win: true  }, { sym: "💎", win: true  }, { sym: "💎", win: true  }, { sym: "💎", win: true  }],
  [{ sym: "🔷", win: false }, { sym: "💚", win: false }, { sym: "🔷", win: false }, { sym: "💚", win: false }, { sym: "🔷", win: false }],
  [{ sym: "💚", win: false }, { sym: "🔷", win: false }, { sym: "💚", win: false }, { sym: "🔷", win: false }, { sym: "💚", win: false }],
];

// ─── Megaways ────────────────────────────────────────────────────
// pink/rose theme · variable column heights (2–5 symbols per reel)

const MEGAWAYS_COLS: { sym: string; win: boolean }[][] = [
  [{ sym: "⭐", win: false }, { sym: "🍒", win: true  }, { sym: "💜", win: false }],
  [{ sym: "💜", win: false }, { sym: "🍒", win: true  }, { sym: "⭐", win: false }, { sym: "💎", win: false }],
  [{ sym: "🍒", win: true  }, { sym: "🍒", win: true  }],
  [{ sym: "💎", win: false }, { sym: "🍒", win: true  }, { sym: "⭐", win: false }, { sym: "💜", win: false }, { sym: "💎", win: false }],
  [{ sym: "⭐", win: false }, { sym: "🍒", win: true  }, { sym: "💜", win: false }, { sym: "💎", win: false }],
  [{ sym: "💜", win: false }, { sym: "🍒", win: true  }],
];

// ─── Shared cell component ────────────────────────────────────────

interface CellProps {
  sym: string;
  win: boolean;
  accent: string;
  size?: "sm" | "xs";
  isBar?: boolean;
}

function Cell({ sym, win, accent, size = "sm", isBar = false }: CellProps) {
  const fontSize = size === "xs" ? "clamp(8px, 1.8vw, 12px)" : "clamp(10px, 2.5vw, 15px)";
  return (
    <div
      className="flex items-center justify-center rounded select-none font-bold leading-none"
      style={{
        padding: size === "xs" ? "3px 1px" : "5px 3px",
        fontSize: isBar ? "clamp(6px, 1.5vw, 10px)" : fontSize,
        letterSpacing: isBar ? "0.05em" : undefined,
        background: win
          ? `linear-gradient(135deg, ${accent}44, ${accent}22)`
          : "rgba(255,255,255,0.04)",
        border: win
          ? `1px solid ${accent}90`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: win
          ? `0 0 10px ${accent}60, inset 0 1px 0 rgba(255,255,255,0.1)`
          : "inset 0 1px 0 rgba(255,255,255,0.04)",
        color: win ? "#fff" : "rgba(255,255,255,0.75)",
        transition: "all 0.15s",
      }}
    >
      {sym}
    </div>
  );
}

// ─── Preview chrome wrapper ───────────────────────────────────────

interface PreviewWrapperProps {
  borderColor: string;
  glowColor: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

function PreviewWrapper({ borderColor, glowColor, children, footer }: PreviewWrapperProps) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(160deg, rgba(10,8,20,0.95) 0%, rgba(18,14,35,0.95) 100%)",
        border: `1px solid ${borderColor}`,
        boxShadow: `0 0 24px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Top chrome bar */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5"
        style={{
          background: `linear-gradient(90deg, ${glowColor.replace("0.3", "0.12")}, transparent)`,
          borderBottom: `1px solid ${borderColor}`,
        }}
      >
        <span className="h-2 w-2 rounded-full" style={{ background: glowColor.replace("0.3", "0.8") }} />
        <span className="h-2 w-2 rounded-full opacity-50" style={{ background: glowColor.replace("0.3", "0.5") }} />
        <span className="h-2 w-2 rounded-full opacity-30" style={{ background: glowColor.replace("0.3", "0.3") }} />
      </div>

      {/* Slot grid */}
      <div className="p-2.5">{children}</div>

      {/* Footer label */}
      <div
        className="px-3 py-1.5 text-center tracking-widest font-semibold"
        style={{
          fontSize: "8px",
          color: glowColor.replace("0.3", "0.7"),
          borderTop: `1px solid ${borderColor}`,
          background: `linear-gradient(90deg, transparent, ${glowColor.replace("0.3", "0.08")}, transparent)`,
          letterSpacing: "0.15em",
        }}
      >
        {footer}
      </div>
    </div>
  );
}

// ─── Exported preview components ─────────────────────────────────

export function ClassicSlotPreview() {
  const accent = "#fbbf24";
  const borderColor = "rgba(251,191,36,0.25)";
  const glowColor = "rgba(251,191,36,0.3)";

  return (
    <PreviewWrapper borderColor={borderColor} glowColor={glowColor} footer="— CLASSIC PAYLINE —">
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {CLASSIC_GRID.map((row, ri) =>
          row.map((cell, ci) => (
            <Cell key={`${ri}-${ci}`} sym={cell.sym} win={cell.win} accent={accent} isBar={cell.sym === "BAR"} />
          ))
        )}
      </div>
      {/* Winning line indicator */}
      <div className="mt-2 flex items-center gap-1.5">
        <div className="h-px flex-1 rounded" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
        <span style={{ fontSize: "8px", color: `${accent}cc`, fontWeight: 700, letterSpacing: "0.1em" }}>WIN LINE</span>
        <div className="h-px flex-1 rounded" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
      </div>
    </PreviewWrapper>
  );
}

export function FiveReelPreview() {
  const accent = "#a78bfa";
  const borderColor = "rgba(139,92,246,0.25)";
  const glowColor = "rgba(139,92,246,0.3)";

  return (
    <PreviewWrapper borderColor={borderColor} glowColor={glowColor} footer="— 20 PAYLINES ACTIVE —">
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {FIVE_REEL_GRID.map((row, ri) =>
          row.map((cell, ci) => (
            <Cell key={`${ri}-${ci}`} sym={cell.sym} win={cell.win} accent={accent} />
          ))
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <div className="h-px flex-1 rounded" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
        <span style={{ fontSize: "8px", color: `${accent}cc`, fontWeight: 700, letterSpacing: "0.1em" }}>EXPANDING WILD</span>
        <div className="h-px flex-1 rounded" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
      </div>
    </PreviewWrapper>
  );
}

export function CascadeReelPreview() {
  const accent = "#34d399";
  const borderColor = "rgba(52,211,153,0.25)";
  const glowColor = "rgba(52,211,153,0.3)";

  return (
    <PreviewWrapper borderColor={borderColor} glowColor={glowColor} footer="— CASCADE ↓ CHAIN MULTIPLIER —">
      <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {CASCADE_GRID.map((row, ri) =>
          row.map((cell, ci) => (
            <Cell key={`${ri}-${ci}`} sym={cell.sym} win={cell.win} accent={accent} size="xs" />
          ))
        )}
      </div>
      {/* Cascade arrows */}
      <div className="mt-1.5 grid gap-0.5" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-center" style={{ fontSize: "9px", color: `${accent}70` }}>
            ↓
          </div>
        ))}
      </div>
    </PreviewWrapper>
  );
}

export function MegawaysPreview() {
  const accent = "#f472b6";
  const borderColor = "rgba(244,114,182,0.25)";
  const glowColor = "rgba(244,114,182,0.3)";

  return (
    <PreviewWrapper borderColor={borderColor} glowColor={glowColor} footer="— UP TO 117,649 WAYS —">
      <div className="flex gap-0.5 items-end justify-center min-h-[60px]">
        {MEGAWAYS_COLS.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-0.5 flex-1">
            {col.map((cell, ri) => (
              <Cell key={ri} sym={cell.sym} win={cell.win} accent={accent} size="xs" />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex items-center gap-1.5">
        <div className="h-px flex-1 rounded" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
        <span style={{ fontSize: "8px", color: `${accent}cc`, fontWeight: 700, letterSpacing: "0.1em" }}>DYNAMIC REELS</span>
        <div className="h-px flex-1 rounded" style={{ background: `linear-gradient(90deg, transparent, ${accent}80, transparent)` }} />
      </div>
    </PreviewWrapper>
  );
}
