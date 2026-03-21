"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { gambleAction } from "@/server/actions/gamble";
import { useWalletStore } from "@/store/wallet-store";

type CardColor = "red" | "black";
type GamblePhase = "choose" | "flipping" | "result";

const MAX_GAMBLE_ROUNDS = 5;

interface GambleModalProps {
  winAmount: number;
  isVisible: boolean;
  onClose: () => void;
}

function PlayingCard({
  color,
  revealed,
  onClick,
  disabled,
  glow,
}: {
  color: CardColor;
  revealed: boolean;
  onClick?: () => void;
  disabled?: boolean;
  glow?: "win" | "lose" | null;
}) {
  const suit   = color === "red"   ? "♥" : "♠";
  const suitSmall = color === "red" ? "♦" : "♣";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-28 h-40 sm:w-32 sm:h-44 rounded-xl border-2 transition-all duration-300
        ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:-translate-y-2 hover:shadow-2xl active:translate-y-0"}
        ${revealed
          ? color === "red"
            ? "bg-white border-red-400 text-red-600"
            : "bg-white border-slate-700 text-slate-800"
          : "bg-gradient-to-br from-violet-800 to-indigo-900 border-violet-600 text-white"
        }
        ${glow === "win"  ? "ring-4 ring-emerald-400 ring-offset-2 ring-offset-transparent shadow-[0_0_30px_rgba(52,211,153,0.6)]" : ""}
        ${glow === "lose" ? "ring-4 ring-red-500 ring-offset-2 ring-offset-transparent shadow-[0_0_30px_rgba(239,68,68,0.6)]"     : ""}
      `}
      style={{
        transform: revealed ? "rotateY(0deg)" : undefined,
        perspective: "600px",
      }}
      aria-label={revealed ? `${color} card` : "Hidden card"}
    >
      {revealed ? (
        <>
          {/* Top-left rank */}
          <div className="absolute top-2 left-2.5 text-xs font-black leading-none">
            <div>A</div>
            <div className="text-sm">{suitSmall}</div>
          </div>
          {/* Center suit */}
          <div className="flex items-center justify-center h-full text-5xl leading-none">
            {suit}
          </div>
          {/* Bottom-right rank (flipped) */}
          <div className="absolute bottom-2 right-2.5 text-xs font-black leading-none rotate-180">
            <div>A</div>
            <div className="text-sm">{suitSmall}</div>
          </div>
        </>
      ) : (
        /* Card back pattern */
        <div className="flex items-center justify-center h-full flex-col gap-1">
          <div className="text-3xl">🎴</div>
          <div className="text-[10px] font-bold tracking-widest text-violet-300 uppercase">Pick</div>
        </div>
      )}
    </button>
  );
}

export function GambleModal({ winAmount, isVisible, onClose }: GambleModalProps) {
  const t  = useTranslations("gamble");
  const { syncFromServer } = useWalletStore();

  const [phase,         setPhase]         = useState<GamblePhase>("choose");
  const [pickedColor,   setPickedColor]   = useState<CardColor | null>(null);
  const [resultColor,   setResultColor]   = useState<CardColor | null>(null);
  const [won,           setWon]           = useState<boolean | null>(null);
  const [currentAmount, setCurrentAmount] = useState(winAmount);
  const [rounds,        setRounds]        = useState(0);
  const [loading,       setLoading]       = useState(false);

  // Reset state when modal re-opens with a new win
  useEffect(() => {
    if (isVisible) {
      setPhase("choose");
      setPickedColor(null);
      setResultColor(null);
      setWon(null);
      setCurrentAmount(winAmount);
      setRounds(0);
      setLoading(false);
    }
  }, [isVisible, winAmount]);

  async function handlePick(color: CardColor) {
    if (loading || phase !== "choose") return;
    setPickedColor(color);
    setLoading(true);
    setPhase("flipping");

    const result = await gambleAction({ amount: currentAmount });

    if (!result.success) {
      // On error just close gracefully
      onClose();
      return;
    }

    // Determine what card was revealed: player wins if they picked correctly
    // The server decides win/lose randomly; we just map it to a "drawn" card color
    // that agrees or disagrees with the pick to make the reveal feel fair.
    const drawnColor: CardColor = result.won
      ? color                                    // drawn card matches pick → win
      : (color === "red" ? "black" : "red");     // drawn card differs → lose

    setResultColor(drawnColor);
    setWon(result.won);
    syncFromServer(result.newBalance);

    if (result.won) {
      setCurrentAmount(result.amount * 2); // doubled
    }

    setPhase("result");
    setLoading(false);
    setRounds((r) => r + 1);
  }

  function handleGambleAgain() {
    setPhase("choose");
    setPickedColor(null);
    setResultColor(null);
    setWon(null);
  }

  const canGambleAgain = won === true && rounds < MAX_GAMBLE_ROUNDS;

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: "linear-gradient(160deg, #0d0520 0%, #140830 60%, #0d0520 100%)",
          border: "1px solid rgba(167,139,250,0.35)",
          boxShadow: "0 0 60px rgba(124,58,237,0.3), 0 0 120px rgba(124,58,237,0.1)",
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-violet-600" />

        <div className="px-6 py-5">

          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-2xl mb-1">🃏</div>
            <h2 className="text-lg font-black text-white">{t("title")}</h2>
            <p className="text-xs text-violet-300/70 mt-0.5">
              {phase === "choose" ? t("chooseCard") : phase === "flipping" ? t("revealing") : ""}
            </p>
          </div>

          {/* Win amount display */}
          <div className="text-center mb-5">
            <div className="inline-flex flex-col items-center gap-0.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5">
              <span className="text-[10px] uppercase tracking-widest text-amber-400/70 font-semibold">
                {phase === "result" && won
                  ? t("newWin")
                  : phase === "result" && !won
                  ? t("lost")
                  : t("currentWin")}
              </span>
              <span className={`text-2xl font-black ${
                phase === "result" && !won ? "line-through text-red-400" : "text-amber-400"
              }`}>
                {currentAmount.toFixed(2)} cr
              </span>
              {phase === "result" && won && (
                <span className="text-xs text-emerald-400 font-bold">{t("doubled")} → {(currentAmount).toFixed(2)} cr</span>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="flex justify-center gap-5 mb-6">
            {phase === "choose" && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <PlayingCard
                    color="red"
                    revealed={false}
                    onClick={() => handlePick("red")}
                    disabled={loading}
                  />
                  <span className="text-xs font-bold text-red-400">♥ {t("red")}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <PlayingCard
                    color="black"
                    revealed={false}
                    onClick={() => handlePick("black")}
                    disabled={loading}
                  />
                  <span className="text-xs font-bold text-slate-300">♠ {t("black")}</span>
                </div>
              </>
            )}

            {phase === "flipping" && (
              <div className="flex gap-5">
                {/* Player's pick (face-down flipping) */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-28 h-40 sm:w-32 sm:h-44 rounded-xl border-2 border-violet-500 bg-gradient-to-br from-violet-800 to-indigo-900 flex items-center justify-center">
                    <div className="text-3xl animate-spin" style={{ animationDuration: "0.6s" }}>🎴</div>
                  </div>
                  <span className="text-xs text-violet-300">{t("yourPick")}: {t(pickedColor ?? "red")}</span>
                </div>
                {/* Unknown drawn card */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-28 h-40 sm:w-32 sm:h-44 rounded-xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-900/40 to-orange-950/40 flex items-center justify-center animate-pulse">
                    <span className="text-4xl">❓</span>
                  </div>
                  <span className="text-xs text-amber-400/70">{t("drawing")}</span>
                </div>
              </div>
            )}

            {phase === "result" && (
              <div className="flex gap-5">
                {/* Player's pick */}
                <div className="flex flex-col items-center gap-2">
                  <PlayingCard
                    color={pickedColor!}
                    revealed
                    disabled
                    glow={won ? "win" : "lose"}
                  />
                  <span className="text-xs text-violet-300">{t("yourPick")}</span>
                </div>
                {/* Drawn card */}
                <div className="flex flex-col items-center gap-2">
                  <PlayingCard
                    color={resultColor!}
                    revealed
                    disabled
                    glow={won ? "win" : "lose"}
                  />
                  <span className="text-xs text-violet-300">{t("drawn")}</span>
                </div>
              </div>
            )}
          </div>

          {/* Result message */}
          {phase === "result" && (
            <div className={`text-center mb-4 rounded-xl py-2.5 px-4 ${
              won
                ? "bg-emerald-500/15 border border-emerald-500/30"
                : "bg-red-500/15 border border-red-500/30"
            }`}>
              <div className="text-xl mb-0.5">{won ? "🎉" : "💀"}</div>
              <p className={`text-sm font-black ${won ? "text-emerald-400" : "text-red-400"}`}>
                {won ? t("youWon") : t("youLost")}
              </p>
              {!won && (
                <p className="text-[11px] text-white/50 mt-0.5">{t("lostDesc")}</p>
              )}
              {won && canGambleAgain && (
                <p className="text-[11px] text-emerald-300/70 mt-0.5">
                  {t("gambleAgainHint", { rounds: MAX_GAMBLE_ROUNDS - rounds })}
                </p>
              )}
              {won && !canGambleAgain && rounds >= MAX_GAMBLE_ROUNDS && (
                <p className="text-[11px] text-amber-300/70 mt-0.5">{t("maxRoundsReached")}</p>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {phase === "choose" && (
              <button
                onClick={onClose}
                className="w-full py-2.5 text-sm font-bold text-white/60 hover:text-white transition-colors"
              >
                {t("collectAndLeave", { amount: currentAmount.toFixed(2) })}
              </button>
            )}

            {phase === "result" && (
              <>
                {canGambleAgain && (
                  <button
                    onClick={handleGambleAgain}
                    className="w-full py-3 rounded-xl text-sm font-black text-black transition-all active:scale-95"
                    style={{ background: "linear-gradient(135deg, #f59e0b, #fbbf24)" }}
                  >
                    {t("doubleAgain", { amount: currentAmount.toFixed(2) })}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                    won
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-white/10 hover:bg-white/15 text-white"
                  }`}
                >
                  {won ? t("collectWin", { amount: currentAmount.toFixed(2) }) : t("close")}
                </button>
              </>
            )}
          </div>

          {/* Round indicator */}
          {rounds > 0 && phase !== "flipping" && (
            <div className="flex justify-center gap-1.5 mt-3">
              {Array.from({ length: MAX_GAMBLE_ROUNDS }).map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-4 rounded-full transition-colors ${
                    i < rounds
                      ? won || i < rounds - 1 ? "bg-emerald-500" : "bg-red-500"
                      : "bg-white/15"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
