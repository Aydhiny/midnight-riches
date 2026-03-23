"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { X, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConversionTracker } from "@/lib/analytics/conversion";

const FRUITS = ["🍒", "🍋", "🍊", "🍇", "🍎", "⭐", "💎", "👑", "🔮", "🍓"];

interface FallingItem {
  id: number;
  symbol: string;
  x: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

function generateFruit(id: number): FallingItem {
  return {
    id,
    symbol: FRUITS[Math.floor(Math.random() * FRUITS.length)],
    x: Math.random() * 95,
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2.5,
    size: 18 + Math.floor(Math.random() * 24),
    rotation: Math.random() * 360,
  };
}

function FruitRain() {
  const [items, setItems] = useState<FallingItem[]>(() => Array.from({ length: 22 }, (_, i) => generateFruit(i)));
  const counterRef = useRef(22);

  useEffect(() => {
    const interval = setInterval(() => {
      counterRef.current++;
      setItems((prev) => [...prev.slice(-30), generateFruit(counterRef.current)]);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {items.map((item) => (
        <span
          key={item.id}
          className="absolute select-none"
          style={{
            left: `${item.x}%`,
            top: "-40px",
            fontSize: `${item.size}px`,
            animation: `fruit-fall ${item.duration}s ease-in forwards`,
            animationDelay: `${item.delay}s`,
            transform: `rotate(${item.rotation}deg)`,
            opacity: 0,
          }}
        >
          {item.symbol}
        </span>
      ))}
    </div>
  );
}

const JACKPOT_BASE = 847293;
const HOOK_COUNT = 5;

export function JackpotInfoModal() {
  const t = useTranslations("landing.jackpotModal");
  const [open, setOpen] = useState(false);
  const [jackpot, setJackpot] = useState(JACKPOT_BASE + Math.floor(Math.random() * 50000));
  const [hookIndex, setHookIndex] = useState(0);
  const { track } = useConversionTracker();

  // Jackpot ticks even when modal is closed
  useEffect(() => {
    const interval = setInterval(
      () => {
        setJackpot((prev) => prev + Math.floor(Math.random() * 120) + 40);
      },
      2500 + Math.random() * 3000,
    );
    return () => clearInterval(interval);
  }, []);

  function handleOpen() {
    setOpen(true);
    setHookIndex((prev) => (prev + 1) % HOOK_COUNT);
    track("signup_modal_open", {});
  }

  const HOOKS = [
    { title: t("hook0Title"), sub: t("hook0Sub") },
    { title: t("hook1Title"), sub: t("hook1Sub") },
    { title: t("hook2Title"), sub: t("hook2Sub") },
    { title: t("hook3Title"), sub: t("hook3Sub") },
    { title: t("hook4Title"), sub: t("hook4Sub") },
  ];
  const { title: hookTitle, sub: hookSub } = HOOKS[hookIndex];

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────── */}
      <button
        onClick={handleOpen}
        aria-label="View current jackpot"
        className="fixed bottom-6 right-6 z-40 rounded-full flex flex-col items-center gap-0.5 group"
        style={{ animation: "jackpot-pulse 2s ease-in-out infinite" }}
      >
        {/* Outer ring pulse */}
        <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />

        {/* Main button */}
        <span
          className="relative flex h-16 w-16 flex-col items-center justify-center rounded-full text-center select-none"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #f97316 100%)",
            boxShadow: "0 0 0 3px rgba(251,191,36,0.4), 0 8px 24px rgba(239,68,68,0.5)",
          }}
        >
          <Trophy className="h-6 w-6 text-white drop-shadow" />
          <span className="text-[9px] font-black text-white leading-none tracking-wider mt-0.5">WIN!</span>
        </span>

        {/* Tooltip */}
        <span
          className="absolute bottom-full mb-2 whitespace-nowrap rounded-lg px-2.5 py-1 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
        >
          {t("tooltip")}
        </span>
      </button>

      {/* ── Modal overlay ───────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          {/* Fruit rain behind modal */}
          <FruitRain />

          {/* Modal card */}
          <div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl text-center"
            style={{
              animation: "modal-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
              background: "linear-gradient(160deg, rgba(20,5,50,0.98) 0%, rgba(10,2,30,0.99) 100%)",
              border: "1px solid rgba(251,191,36,0.3)",
              boxShadow: "0 0 60px rgba(251,191,36,0.2), 0 0 120px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            {/* Dismiss */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/60 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Top grain + radial bloom */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.25) 0%, transparent 70%)",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "128px",
                mixBlendMode: "overlay",
              }}
            />

            <div className="relative px-8 pb-8 pt-7">
              {/* Trophy emoji */}
              <div className="text-5xl mb-2 drop-shadow-lg">🏆</div>

              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-400/70 mb-1">
                {t("progressiveJackpot")}
              </p>

              {/* Jackpot number */}
              <div
                className="text-4xl sm:text-5xl md:text-6xl font-black tabular-nums mb-1 leading-none"
                style={{
                  background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 40%, #ef4444 80%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 20px rgba(251,191,36,0.5))",
                }}
              >
                {jackpot.toLocaleString()}
              </div>
              <p className="text-xs text-amber-400/50 tracking-widest mb-5">{t("credits")}</p>

              {/* Hook text — rotates on each open */}
              <p
                className="text-xl md:text-2xl font-black text-white mb-1 leading-snug"
                style={{ fontFamily: "var(--font-garamond)", fontStyle: "italic" }}
              >
                {hookTitle}
              </p>
              <p className="text-sm text-white/55 mb-6 max-w-xs mx-auto">
                {hookSub}
                {" "}<strong className="text-amber-400">{t("freeCredits", { credits: 500 })}</strong>
              </p>

              {/* CTA */}
              <Link
                href="/auth/signup"
                onClick={() => {
                  track("cta_click", { section: "jackpot_modal", button: "signup" });
                  setOpen(false);
                }}
                className="block w-full rounded-xl py-4 text-base font-black text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  background: "linear-gradient(180deg, #f59e0b 0%, #ef4444 100%)",
                  boxShadow: "0 4px 20px rgba(239,68,68,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                }}
              >
                {t("cta")}
              </Link>

              <button onClick={() => setOpen(false)} className="mt-3 text-xs text-white/30 hover:text-white/50 transition-colors">
                {t("dismiss", { amount: jackpot.toLocaleString() })}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
