"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useWalletStore } from "@/store/wallet-store";
import { useIsSfxEnabled } from "@/components/game/music-player";
import { ArrowLeft, Zap } from "lucide-react";

function useShopSfx() {
  const sfxEnabled = useIsSfxEnabled();
  const play = useCallback((src: string, _volume = 0.55) => {
    if (!sfxEnabled) return;
    try { new Audio(src).play().catch(() => {}); } catch {}
  }, [sfxEnabled]);
  return {
    playPurchase: () => play("/sounds/jackpot.mp3", 0.45),
    playEquip:    () => play("/sounds/slot-spin-2.mp3", 0.5),
  };
}

type CollectibleType = "avatar_frame" | "reel_theme" | "symbol_skin" | "sound_pack";
type Rarity = "common" | "rare" | "epic" | "legendary";
type FilterTab = "all" | CollectibleType;

interface MockCollectible {
  id: string;
  name: string;
  type: CollectibleType;
  rarity: Rarity;
  priceCredits: number | null;
  priceUsd: number | null;
  description: string;
  emoji: string;
  preview: [string, string];
}

const MOCK_COLLECTIBLES: MockCollectible[] = [
  { id: "golden-frame",   name: "Golden Champion Frame",   type: "avatar_frame", rarity: "legendary", priceCredits: 500,  priceUsd: null, description: "Gilded gold border for true high rollers",                 emoji: "👑", preview: ["#fbbf24","#f59e0b"] },
  { id: "neon-frame",     name: "Neon Pulse Frame",        type: "avatar_frame", rarity: "rare",      priceCredits: 150,  priceUsd: null, description: "Pulsing neon border that reacts to wins",                  emoji: "⚡", preview: ["#7c3aed","#ec4899"] },
  { id: "midnight-theme", name: "Midnight Chrome Reels",   type: "reel_theme",   rarity: "epic",      priceCredits: null, priceUsd: 4.99, description: "Chrome metallic reels with deep space background",          emoji: "🌙", preview: ["#1e1b4b","#312e81"] },
  { id: "volcano-theme",  name: "Volcano Inferno Reels",   type: "reel_theme",   rarity: "legendary", priceCredits: null, priceUsd: 7.99, description: "Fire and lava themed reels with particle effects",           emoji: "🌋", preview: ["#7f1d1d","#ef4444"] },
  { id: "pixel-skins",    name: "Pixel Fruit Skins",       type: "symbol_skin",  rarity: "rare",      priceCredits: 200,  priceUsd: null, description: "8-bit pixel art versions of all fruit symbols",              emoji: "🕹️", preview: ["#065f46","#10b981"] },
  { id: "crypto-skins",   name: "Crypto Symbol Pack",      type: "symbol_skin",  rarity: "epic",      priceCredits: 350,  priceUsd: null, description: "BTC, ETH and crypto icons replace classic symbols",          emoji: "₿",  preview: ["#78350f","#f59e0b"] },
  { id: "jazz-sounds",    name: "Casino Lounge Music",     type: "sound_pack",   rarity: "common",    priceCredits: 75,   priceUsd: null, description: "The iconic Midnight Riches casino soundtrack",               emoji: "🎰", preview: ["#1e3a5f","#3b82f6"] },
  { id: "retro-sounds",   name: "Midnight Beats Pack",     type: "sound_pack",   rarity: "rare",      priceCredits: 125,  priceUsd: null, description: "Enhanced beats and spin sounds for the ultimate vibe",       emoji: "🎶", preview: ["#14532d","#22c55e"] },
  { id: "diamond-frame",  name: "Diamond VIP Frame",       type: "avatar_frame", rarity: "legendary", priceCredits: null, priceUsd: 9.99, description: "Exclusive diamond-studded avatar frame for VIP players only", emoji: "💎", preview: ["#0c4a6e","#38bdf8"] },
];

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: "all",          label: "All Items",     icon: "✦" },
  { key: "avatar_frame", label: "Avatar Frames", icon: "🖼️" },
  { key: "reel_theme",   label: "Reel Themes",   icon: "🎰" },
  { key: "symbol_skin",  label: "Symbol Skins",  icon: "🎨" },
  { key: "sound_pack",   label: "Sound Packs",   icon: "🎵" },
];

const RARITY_CONFIG: Record<Rarity, {
  label: string;
  stars: number;
  badgeStyle: React.CSSProperties;
  cardBorder: string;
  cardGlow: string;
  titleColor: string;
}> = {
  common: {
    label: "Common",  stars: 1,
    badgeStyle: { background: "rgba(113,113,122,0.5)", color: "#d4d4d8" },
    cardBorder: "border-zinc-700/50",
    cardGlow: "",
    titleColor: "text-zinc-100",
  },
  rare: {
    label: "Rare",    stars: 2,
    badgeStyle: { background: "rgba(37,99,235,0.45)", color: "#93c5fd" },
    cardBorder: "border-blue-500/40",
    cardGlow: "shadow-blue-500/15",
    titleColor: "text-blue-100",
  },
  epic: {
    label: "Epic",    stars: 3,
    badgeStyle: { background: "rgba(124,58,237,0.5)", color: "#c4b5fd" },
    cardBorder: "border-violet-500/50",
    cardGlow: "shadow-violet-500/20",
    titleColor: "text-violet-100",
  },
  legendary: {
    label: "Legendary", stars: 4,
    badgeStyle: { background: "linear-gradient(90deg,#f59e0b,#fbbf24)", color: "#451a03", fontWeight: 700 },
    cardBorder: "border-amber-500/60",
    cardGlow: "shadow-amber-500/30",
    titleColor: "text-amber-300",
  },
};

const SHOP_CSS = `
@keyframes legendaryPulse {
  0%,100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.35), 0 4px 40px rgba(251,191,36,0.12); }
  50%     { box-shadow: 0 0 0 1.5px rgba(251,191,36,0.7), 0 4px 55px rgba(251,191,36,0.28); }
}
@keyframes goldShimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.legendary-pulse { animation: legendaryPulse 2.8s ease-in-out infinite; }
.gold-shimmer-bar {
  background: linear-gradient(90deg, transparent 0%, rgba(251,191,36,0.9) 40%, rgba(255,255,255,0.9) 50%, rgba(251,191,36,0.9) 60%, transparent 100%);
  background-size: 200% 100%;
  animation: goldShimmer 2.2s linear infinite;
}
`;

function CollectibleCard({
  item, isOwned, isEquipped, onBuy, onEquip, isPending,
}: {
  item: MockCollectible; isOwned: boolean; isEquipped: boolean;
  onBuy: (id: string) => void; onEquip: (id: string) => void; isPending: boolean;
}) {
  const rc = RARITY_CONFIG[item.rarity];
  const isLegendary = item.rarity === "legendary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.22 }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className={`relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-md transition-shadow duration-300 ${rc.cardBorder} ${rc.cardGlow ? `shadow-lg ${rc.cardGlow}` : ""} ${isLegendary ? "legendary-pulse" : ""}`}
      style={{ background: "rgba(8,2,22,0.82)" }}
    >
      {isLegendary && <div className="gold-shimmer-bar absolute inset-x-0 top-0 h-[3px]" />}

      <div
        className="relative h-28 w-full overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${item.preview[0]}cc 0%, ${item.preview[1]}88 100%)` }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.12) 0%, transparent 65%)" }} />
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 1px, transparent 8px)" }} />
        <div className="absolute inset-0 flex items-center justify-center text-5xl drop-shadow-2xl">
          {item.emoji}
        </div>
        <div className="absolute right-2.5 top-2.5">
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
            style={rc.badgeStyle}
          >
            {"★".repeat(rc.stars)} {rc.label}
          </span>
        </div>
        {isOwned && (
          <div className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
            ✓ Owned
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-8" style={{ background: "linear-gradient(0deg, rgba(8,2,22,0.82) 0%, transparent 100%)" }} />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
            {item.type.replace(/_/g, " ")}
          </span>
        </div>

        <div className="space-y-1">
          <h3 className={`text-sm font-bold leading-tight ${rc.titleColor}`}>{item.name}</h3>
          <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">{item.description}</p>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          {item.priceCredits !== null ? (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1">
              <Zap className="h-3 w-3 text-amber-400" />
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {item.priceCredits.toLocaleString()} cr
              </span>
            </div>
          ) : item.priceUsd !== null ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <span className="text-xs font-bold text-emerald-300">${item.priceUsd.toFixed(2)}</span>
              <span className="rounded bg-[#6772e5]/25 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#93a0ff]">Stripe</span>
            </div>
          ) : (
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">Free</div>
          )}
        </div>

        {isOwned ? (
          isEquipped ? (
            <button
              onClick={() => onEquip(item.id)}
              className="w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300"
            >
              ✓ Equipped
            </button>
          ) : (
            <button
              onClick={() => onEquip(item.id)}
              disabled={isPending}
              className="w-full rounded-xl border border-emerald-500/40 bg-emerald-600/25 py-2.5 text-xs font-bold text-emerald-200 transition-all hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50"
            >
              Equip
            </button>
          )
        ) : item.priceUsd !== null ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-[#6772e5]/30 py-2.5 text-xs font-bold text-[#a5b4ff] opacity-70"
          >
            Buy with Stripe
          </button>
        ) : (
          <button
            onClick={() => onBuy(item.id)}
            disabled={isPending}
            className={`w-full rounded-xl py-2.5 text-xs font-bold text-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait ${
              isLegendary
                ? "bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 shadow-lg shadow-amber-500/30"
                : "bg-gradient-to-r from-amber-500/90 to-yellow-400/90 hover:from-amber-400 hover:to-yellow-300"
            }`}
            style={{
              boxShadow: isLegendary
                ? "0 0 20px rgba(251,191,36,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {isPending ? "Purchasing…" : "Purchase"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  const balance = useWalletStore((s) => s.balance);
  const setBalance = useWalletStore((s) => s.setBalance);
  const { playPurchase, playEquip } = useShopSfx();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [equippedIds, setEquippedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("mr_owned_collectibles");
    if (saved) {
      try { setOwnedIds(new Set(JSON.parse(saved) as string[])); } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("mr_owned_collectibles", JSON.stringify([...ownedIds]));
  }, [ownedIds]);

  const filteredItems = activeFilter === "all"
    ? MOCK_COLLECTIBLES
    : MOCK_COLLECTIBLES.filter((c) => c.type === activeFilter);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function handleBuy(id: string) {
    const item = MOCK_COLLECTIBLES.find((c) => c.id === id);
    if (!item) return;
    if (item.priceCredits !== null) {
      if (balance < item.priceCredits) { showToast("Insufficient credits.", false); return; }
      setBalance(balance - item.priceCredits);
    }
    setPendingId(id);
    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 600));
      setOwnedIds((prev) => new Set(prev).add(id));
      setPendingId(null);
      playPurchase();
      showToast(`${item.name} added to your collection!`, true);
    });
  }

  function handleEquip(id: string) {
    const item = MOCK_COLLECTIBLES.find((c) => c.id === id);
    if (!item) return;
    const sameType = MOCK_COLLECTIBLES.filter((c) => c.type === item.type).map((c) => c.id);
    setEquippedIds((prev) => {
      const next = new Set(prev);
      sameType.forEach((sid) => next.delete(sid));
      next.add(id);
      return next;
    });
    playEquip();
    showToast(`${item.name} equipped!`, true);
  }

  return (
    <div
      className="relative mx-auto max-w-6xl px-4 py-8"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      <style>{SHOP_CSS}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-amber-500/6 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-72 w-72 rounded-full bg-violet-600/8 blur-3xl" />
      </div>

      <Link
        href="/game"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Game
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl border border-amber-500/20 px-8 py-8"
        style={{
          background: "linear-gradient(135deg, rgba(8,2,22,0.95) 0%, rgba(30,10,60,0.90) 50%, rgba(8,2,22,0.95) 100%)",
          boxShadow: "0 0 60px rgba(251,191,36,0.08), inset 0 0 60px rgba(124,58,237,0.06)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(45deg, #fbbf24 0px, #fbbf24 1px, transparent 1px, transparent 12px)" }}
        />
        <div className="gold-shimmer-bar absolute inset-x-0 top-0 h-[2px]" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl">🎰</span>
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Exclusive Store
              </span>
            </div>
            <h1
              className="text-4xl font-black tracking-tight"
              style={{
                backgroundImage: "linear-gradient(90deg, #fbbf24 0%, #fde68a 40%, #f59e0b 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Collectibles Shop
            </h1>
            <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
              Unlock exclusive themes, frames & sound packs. Stand out at the tables with legendary gear.
            </p>
          </div>

          <div
            className="flex shrink-0 items-center gap-3 rounded-2xl border border-amber-500/30 px-5 py-4"
            style={{ background: "rgba(251,191,36,0.08)", backdropFilter: "blur(12px)" }}
          >
            <span className="text-3xl">🪙</span>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">Your Balance</div>
              <div
                className="text-2xl font-black tabular-nums"
                style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.5)" }}
              >
                {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[9px] text-amber-500/50 uppercase tracking-widest">credits</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-all duration-200 ${
              activeFilter === tab.key
                ? "border-amber-500/60 text-amber-300 shadow-lg shadow-amber-500/15"
                : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-amber-500/30 hover:text-amber-300/70"
            }`}
            style={activeFilter === tab.key
              ? { background: "rgba(251,191,36,0.12)" }
              : undefined}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <CollectibleCard
                item={item}
                isOwned={ownedIds.has(item.id)}
                isEquipped={equippedIds.has(item.id)}
                onBuy={handleBuy}
                onEquip={handleEquip}
                isPending={pendingId === item.id}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <span className="text-6xl opacity-30">🛒</span>
          <p className="text-sm text-[var(--text-muted)]">No items in this category yet.</p>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md ${
              toast.ok
                ? "border-amber-500/40 bg-[rgba(8,2,22,0.9)] text-amber-300"
                : "border-red-500/40 bg-red-950/90 text-red-300"
            }`}
            style={toast.ok ? { boxShadow: "0 0 30px rgba(251,191,36,0.2)" } : undefined}
          >
            <span>{toast.ok ? "🎉" : "❌"}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
