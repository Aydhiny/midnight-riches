"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import ShinyButton from "@/components/ui/shiny-button";

// ── Tutorial steps ─────────────────────────────────────────────────────────────
interface TutorialStep {
  id: string;
  title: string;
  description: string;
  botMessage: string;
  icon: string;
  highlight: string;
  tip?: string;
  visual: React.ReactNode;
}

function ReelVisual() {
  return (
    <div className="flex items-center justify-center gap-2">
      {[["🍒","🍋","🍊"],["🍇","⭐","🔔"],["💎","🎰","🍒"]].map((col, ci) => (
        <div key={ci} className="flex flex-col gap-1 overflow-hidden rounded-lg border border-amber-500/20 bg-black/30 p-1.5">
          {col.map((sym, si) => (
            <div key={si} className={`flex h-10 w-10 items-center justify-center rounded text-xl ${si === 1 ? "bg-amber-500/20 ring-1 ring-amber-400/50" : ""}`}>
              {sym}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function SpinVisual() {
  const [spinning, setSpinning] = useState(false);
  useEffect(() => {
    const id = setInterval(() => setSpinning(s => !s), 1500);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center gap-3">
      <ReelVisual />
      <button
        onClick={() => setSpinning(true)}
        className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black text-black transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
      >
        <span className={spinning ? "animate-spin" : ""}>🎰</span>
        SPIN
      </button>
    </div>
  );
}

function BetVisual() {
  const bets = [0.10, 0.50, 1.00, 5.00, 10.00];
  const [sel, setSel] = useState(1);
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1.5">
        {bets.map((b, i) => (
          <button
            key={b}
            onClick={() => setSel(i)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${i === sel ? "bg-amber-500 text-black scale-105" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
          >
            {b.toFixed(2)}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 border border-white/10">
        <Image src="/images/coin-token.png" alt="tokens" width={18} height={18} className="object-contain" />
        <span className="font-bold text-amber-400">{bets[sel].toFixed(2)}</span>
        <span className="text-xs text-white/40">per line</span>
      </div>
    </div>
  );
}

function ChatVisual() {
  const msgs = [
    { name: "Casey D.", text: "Just hit 3x Cherry! 🍒", color: "from-violet-500 to-purple-700" },
    { name: "Jordan M.", text: "Anyone on Classic Fruits?", color: "from-pink-500 to-rose-700" },
    { name: "You", text: "Going all in! 🎲", color: "from-amber-500 to-orange-600", isUser: true },
  ];
  return (
    <div className="w-full max-w-[200px] rounded-xl border border-white/10 bg-black/30 p-2 space-y-1.5">
      <div className="flex items-center gap-1.5 border-b border-white/10 pb-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Live Chat</span>
        <span className="ml-auto text-[8px] text-white/30">10 online</span>
      </div>
      {msgs.map((m, i) => (
        <div key={i} className={`flex items-start gap-1.5 ${m.isUser ? "justify-end" : ""}`}>
          {!m.isUser && (
            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${m.color} text-[8px] font-bold text-white`}>
              {m.name[0]}
            </div>
          )}
          <div className={`rounded-lg px-2 py-1 text-[10px] max-w-[130px] ${m.isUser ? "bg-violet-600/40 text-white" : "bg-white/[0.06] text-white/70"}`}>
            {!m.isUser && <div className="font-semibold text-violet-300 mb-0.5" style={{fontSize:"9px"}}>{m.name}</div>}
            {m.text}
          </div>
          {m.isUser && (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-[8px] font-bold text-white">Y</div>
          )}
        </div>
      ))}
    </div>
  );
}

function LeaderboardVisual() {
  const entries = [
    { rank: 1, name: "Alex K.",   amount: "47,500", color: "text-amber-400" },
    { rank: 2, name: "Jordan M.", amount: "31,200", color: "text-zinc-300"  },
    { rank: 3, name: "Riley P.",  amount: "22,800", color: "text-amber-700" },
  ];
  const medals = ["🥇","🥈","🥉"];
  return (
    <div className="w-full max-w-[220px] rounded-xl border border-amber-500/20 bg-black/30 p-2.5 space-y-1.5">
      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">🏆 Top Winners</div>
      {entries.map((e) => (
        <div key={e.rank} className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-2.5 py-1.5">
          <span className="text-base">{medals[e.rank - 1]}</span>
          <span className="flex-1 text-[11px] font-medium text-white/70">{e.name}</span>
          <span className={`text-[11px] font-bold ${e.color}`}>{e.amount}</span>
        </div>
      ))}
    </div>
  );
}

function WinVisual() {
  const paylines = [
    { name: "Top row",    syms: "🍒🍒🍒", mult: "2×",  color: "text-red-400"    },
    { name: "Middle row", syms: "⭐⭐⭐", mult: "5×",  color: "text-amber-400"  },
    { name: "Bottom row", syms: "💎💎💎", mult: "10×", color: "text-sky-400"    },
  ];
  return (
    <div className="space-y-1.5 w-full max-w-[220px]">
      {paylines.map((p) => (
        <div key={p.name} className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/10 px-2.5 py-1.5">
          <span className="text-sm tracking-tight">{p.syms}</span>
          <span className="flex-1 text-[10px] text-white/50">{p.name}</span>
          <span className={`text-[11px] font-bold ${p.color}`}>{p.mult}</span>
        </div>
      ))}
      <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-center text-[10px] text-amber-400">
        🌟 Wild matches any symbol · Scatter = free spins
      </div>
    </div>
  );
}

function ShopVisual() {
  return (
    <div className="grid grid-cols-2 gap-2 max-w-[220px] w-full">
      {[
        { emoji: "👑", name: "Golden Frame",  price: "500", rarity: "Legendary", color: "border-amber-500/40 bg-amber-500/5" },
        { emoji: "⚡", name: "Neon Pulse",    price: "150", rarity: "Rare",      color: "border-violet-500/40 bg-violet-500/5" },
        { emoji: "🎵", name: "Jazz Pack",     price: "75",  rarity: "Common",    color: "border-blue-500/40 bg-blue-500/5" },
        { emoji: "🕹️", name: "Pixel Skins",  price: "200", rarity: "Rare",      color: "border-emerald-500/40 bg-emerald-500/5" },
      ].map((item) => (
        <div key={item.name} className={`rounded-lg border p-2 ${item.color}`}>
          <div className="text-xl text-center mb-1">{item.emoji}</div>
          <div className="text-[9px] font-semibold text-white/70 text-center truncate">{item.name}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <Image src="/images/coin-token.png" alt="tokens" width={10} height={10} className="object-contain" />
            <span className="text-[9px] font-bold text-amber-400">{item.price}</span>
          </div>
        </div>
      ))}
    </div>
  );
}


// ── Bot bubble ─────────────────────────────────────────────────────────────────
function BotBubble({ message, step }: { message: string; step: number }) {
  const t = useTranslations("howToPlay");
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className="flex items-start gap-3"
    >
      {/* Bot avatar */}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
          style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", boxShadow: "0 0 16px rgba(124,58,237,0.5)" }}
        >
          🤖
        </div>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#0d0620]" />
      </div>

      {/* Bubble */}
      <div className="relative max-w-[360px]">
        <div className="text-[10px] font-bold text-violet-300 mb-1">{t("botName")}</div>
        <div
          className="rounded-2xl rounded-tl-none px-4 py-2.5 text-sm leading-relaxed text-white/90"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(236,72,153,0.15))", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          {message}
        </div>
      </div>
    </motion.div>
  );
}

// ── Progress dots ──────────────────────────────────────────────────────────────
function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "w-4 h-2 bg-violet-500"
              : i < current
              ? "w-2 h-2 bg-violet-500/50"
              : "w-2 h-2 bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────
interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const [step, setStep] = useState(0);
  const t = useTranslations("howToPlay");

  const STEPS: TutorialStep[] = [
    {
      id: "welcome",
      title: t("steps.welcome.title"),
      description: t("steps.welcome.description"),
      botMessage: t("steps.welcome.botMessage"),
      icon: "🎰",
      highlight: t("steps.welcome.highlight"),
      visual: (
        <div className="flex flex-col items-center gap-3">
          <Image src="/images/midnight-riches-logo.png" alt="Midnight Riches" width={80} height={80} className="object-contain drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]" />
          <div className="flex gap-3 text-center">
            {["3 Reels", "5 Paylines", "Provably Fair"].map((f) => (
              <div key={f} className="rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 text-[10px] font-bold text-violet-300">{f}</div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "reels",
      title: t("steps.reels.title"),
      description: t("steps.reels.description"),
      botMessage: t("steps.reels.botMessage"),
      icon: "🎲",
      highlight: t("steps.reels.highlight"),
      tip: t("steps.reels.tip"),
      visual: <ReelVisual />,
    },
    {
      id: "bet",
      title: t("steps.bet.title"),
      description: t("steps.bet.description"),
      botMessage: t("steps.bet.botMessage"),
      icon: "💰",
      highlight: t("steps.bet.highlight"),
      tip: t("steps.bet.tip"),
      visual: <BetVisual />,
    },
    {
      id: "spin",
      title: t("steps.spin.title"),
      description: t("steps.spin.description"),
      botMessage: t("steps.spin.botMessage"),
      icon: "⚡",
      highlight: t("steps.spin.highlight"),
      tip: t("steps.spin.tip"),
      visual: <SpinVisual />,
    },
    {
      id: "paylines",
      title: t("steps.paylines.title"),
      description: t("steps.paylines.description"),
      botMessage: t("steps.paylines.botMessage"),
      icon: "⭐",
      highlight: t("steps.paylines.highlight"),
      tip: t("steps.paylines.tip"),
      visual: <WinVisual />,
    },
    {
      id: "chat",
      title: t("steps.chat.title"),
      description: t("steps.chat.description"),
      botMessage: t("steps.chat.botMessage"),
      icon: "💬",
      highlight: t("steps.chat.highlight"),
      tip: t("steps.chat.tip"),
      visual: <ChatVisual />,
    },
    {
      id: "leaderboard",
      title: t("steps.leaderboard.title"),
      description: t("steps.leaderboard.description"),
      botMessage: t("steps.leaderboard.botMessage"),
      icon: "🏆",
      highlight: t("steps.leaderboard.highlight"),
      tip: t("steps.leaderboard.tip"),
      visual: <LeaderboardVisual />,
    },
    {
      id: "shop",
      title: t("steps.shop.title"),
      description: t("steps.shop.description"),
      botMessage: t("steps.shop.botMessage"),
      icon: "🛍️",
      highlight: t("steps.shop.highlight"),
      tip: t("steps.shop.tip"),
      visual: <ShopVisual />,
    },
    {
      id: "bonus",
      title: t("steps.bonus.title"),
      description: t("steps.bonus.description"),
      botMessage: t("steps.bonus.botMessage"),
      icon: "🎁",
      highlight: t("steps.bonus.highlight"),
      tip: t("steps.bonus.tip"),
      visual: (
        <div className="space-y-2 w-full max-w-[220px]">
          {[
            { icon: "🎯", task: "Spin 10 times",      reward: "+20",  done: true  },
            { icon: "💰", task: "Win 3 rounds",        reward: "+50",  done: true  },
            { icon: "🔥", task: "Hit a combo payline", reward: "+100", done: false },
          ].map((c) => (
            <div key={c.task} className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 ${c.done ? "border-emerald-500/30 bg-emerald-500/5" : "border-white/10 bg-white/[0.03]"}`}>
              <span className="text-base">{c.icon}</span>
              <span className={`flex-1 text-[10px] ${c.done ? "line-through text-white/30" : "text-white/60"}`}>{c.task}</span>
              <div className="flex items-center gap-1">
                <Image src="/images/coin-token.png" alt="tokens" width={10} height={10} className="object-contain" />
                <span className="text-[10px] font-bold text-amber-400">{c.reward}</span>
              </div>
              {c.done && <span className="text-emerald-400 text-xs">✓</span>}
            </div>
          ))}
        </div>
      ),
    },
  ];

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  // Reset to first step when modal opens
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  function next() { if (!isLast) setStep((s) => s + 1); }
  function prev() { if (!isFirst) setStep((s) => s - 1); }

  function handleKeyDown(e: KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next();
    if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   prev();
    if (e.key === "Escape") onClose();
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="how-to-play-overlay"
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 cursor-pointer"
            style={{ background: "rgba(4,0,15,0.85)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 200 }}
            className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl"
            style={{
              background: "linear-gradient(145deg, #0d0620 0%, #120828 60%, #070215 100%)",
              border: "1px solid rgba(124,58,237,0.35)",
              boxShadow: "0 0 60px rgba(124,58,237,0.25), 0 0 120px rgba(236,72,153,0.1), 0 25px 50px rgba(0,0,0,0.6)",
            }}
          >
            {/* Top gradient bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                  style={{ background: "rgba(124,58,237,0.25)", border: "1px solid rgba(124,58,237,0.4)" }}
                >
                  {current.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">{t("title")}</p>
                  <p className="text-sm font-bold text-white">{current.title}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:text-white/80 hover:bg-white/[0.06] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content area */}
            <div className="px-5 py-4 space-y-4">
              {/* Bot message */}
              <BotBubble message={current.botMessage} step={step} />

              {/* Visual */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="flex justify-center py-2"
                >
                  {current.visual}
                </motion.div>
              </AnimatePresence>

              {/* Description + highlight */}
              <div className="space-y-2">
                <p className="text-sm text-white/60 leading-relaxed">{current.description}</p>
                <div className="flex items-center gap-2 rounded-lg bg-violet-500/10 border border-violet-500/20 px-3 py-2">
                  <span className="text-xs font-bold text-violet-300">📌</span>
                  <span className="text-xs font-semibold text-violet-200">{current.highlight}</span>
                </div>
                {current.tip && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/8 border border-amber-500/15 px-3 py-2">
                    <span className="text-xs">💡</span>
                    <span className="text-xs text-amber-300/80">{current.tip}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer nav */}
            <div
              className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]"
              style={{ background: "rgba(0,0,0,0.2)" }}
            >
              <ProgressDots total={STEPS.length} current={step} />

              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 mr-1">{step + 1} / {STEPS.length}</span>

                <button
                  onClick={prev}
                  disabled={isFirst}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/25 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {isLast ? (
                  <Link
                    href="/game"
                    onClick={onClose}
                    className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-black text-black transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
                  >
                    {t("letsPlay")} 🎰
                  </Link>
                ) : (
                  <ShinyButton onClick={next} className="h-9 px-4 text-sm flex items-center gap-1.5">
                    {t("next")} <ChevronRight className="h-3.5 w-3.5" />
                  </ShinyButton>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
