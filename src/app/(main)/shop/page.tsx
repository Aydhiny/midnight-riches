"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWalletStore } from "@/store/wallet-store";
import { purchaseCollectible } from "@/server/actions/collectibles";
import { useIsSfxEnabled } from "@/components/game/music-player";

// ─── SFX helper ────────────────────────────────────────────────────────────────
function useShopSfx() {
  const sfxEnabled = useIsSfxEnabled();

  const play = useCallback((src: string, volume = 0.55) => {
    if (!sfxEnabled) return;
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch {
      // ignore
    }
  }, [sfxEnabled]);

  return {
    playPurchase: () => play("/sounds/jackpot.mp3", 0.45),
    playEquip:    () => play("/sounds/slot-spin-2.mp3", 0.5),
  };
}

// ─── Types ─────────────────────────────────────────────────────────────────────

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

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const MOCK_COLLECTIBLES: MockCollectible[] = [
  {
    id: "golden-frame",
    name: "Golden Champion Frame",
    type: "avatar_frame",
    rarity: "legendary",
    priceCredits: 500,
    priceUsd: null,
    description: "Gilded gold border for true high rollers",
    emoji: "👑",
    preview: ["#fbbf24", "#f59e0b"],
  },
  {
    id: "neon-frame",
    name: "Neon Pulse Frame",
    type: "avatar_frame",
    rarity: "rare",
    priceCredits: 150,
    priceUsd: null,
    description: "Pulsing neon border that reacts to wins",
    emoji: "⚡",
    preview: ["#7c3aed", "#ec4899"],
  },
  {
    id: "midnight-theme",
    name: "Midnight Chrome Reels",
    type: "reel_theme",
    rarity: "epic",
    priceCredits: null,
    priceUsd: 4.99,
    description: "Chrome metallic reels with deep space background",
    emoji: "🌙",
    preview: ["#1e1b4b", "#312e81"],
  },
  {
    id: "volcano-theme",
    name: "Volcano Inferno Reels",
    type: "reel_theme",
    rarity: "legendary",
    priceCredits: null,
    priceUsd: 7.99,
    description: "Fire and lava themed reels with particle effects",
    emoji: "🌋",
    preview: ["#7f1d1d", "#ef4444"],
  },
  {
    id: "pixel-skins",
    name: "Pixel Fruit Skins",
    type: "symbol_skin",
    rarity: "rare",
    priceCredits: 200,
    priceUsd: null,
    description: "8-bit pixel art versions of all fruit symbols",
    emoji: "🕹️",
    preview: ["#065f46", "#10b981"],
  },
  {
    id: "crypto-skins",
    name: "Crypto Symbol Pack",
    type: "symbol_skin",
    rarity: "epic",
    priceCredits: 350,
    priceUsd: null,
    description: "BTC, ETH and crypto icons replace classic symbols",
    emoji: "₿",
    preview: ["#78350f", "#f59e0b"],
  },
  {
    id: "jazz-sounds",
    name: "Casino Lounge Music",
    type: "sound_pack",
    rarity: "common",
    priceCredits: 75,
    priceUsd: null,
    description: "The iconic Midnight Riches casino soundtrack",
    emoji: "🎰",
    preview: ["#1e3a5f", "#3b82f6"],
  },
  {
    id: "retro-sounds",
    name: "Midnight Beats Pack",
    type: "sound_pack",
    rarity: "rare",
    priceCredits: 125,
    priceUsd: null,
    description: "Enhanced beats and spin sounds for the ultimate vibe",
    emoji: "🎶",
    preview: ["#14532d", "#22c55e"],
  },
  {
    id: "diamond-frame",
    name: "Diamond VIP Frame",
    type: "avatar_frame",
    rarity: "legendary",
    priceCredits: null,
    priceUsd: 9.99,
    description: "Exclusive diamond-studded avatar frame for VIP players only",
    emoji: "💎",
    preview: ["#0c4a6e", "#38bdf8"],
  },
];

// ─── Constants ─────────────────────────────────────────────────────────────────

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: "all", label: "All", icon: "🛍️" },
  { key: "avatar_frame", label: "Avatar Frames", icon: "🖼️" },
  { key: "reel_theme", label: "Reel Themes", icon: "🎰" },
  { key: "symbol_skin", label: "Symbol Skins", icon: "🎨" },
  { key: "sound_pack", label: "Sound Packs", icon: "🎵" },
];

const RARITY_CONFIG: Record<Rarity, { label: string; badgeClass: string; glowClass: string; borderClass: string }> = {
  common: {
    label: "Common",
    badgeClass: "bg-zinc-600/80 text-zinc-200",
    glowClass: "",
    borderClass: "border-zinc-700/60",
  },
  rare: {
    label: "Rare",
    badgeClass: "bg-blue-600/80 text-blue-100",
    glowClass: "shadow-blue-500/20",
    borderClass: "border-blue-500/40",
  },
  epic: {
    label: "Epic",
    badgeClass: "bg-purple-600/80 text-purple-100",
    glowClass: "shadow-purple-500/25",
    borderClass: "border-purple-500/50",
  },
  legendary: {
    label: "Legendary",
    badgeClass: "bg-amber-500/90 text-amber-950 font-bold",
    glowClass: "shadow-amber-500/30",
    borderClass: "border-amber-500/60",
  },
};

// ─── Legendary shimmer keyframes injected once ─────────────────────────────────

const SHIMMER_CSS = `
@keyframes shimmerBorder {
  0%   { background-position: 0% 50%;   }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%;   }
}
@keyframes legendaryPulse {
  0%, 100% { box-shadow: 0 0 0 1px rgba(251,191,36,0.4), 0 0 20px rgba(251,191,36,0.15); }
  50%       { box-shadow: 0 0 0 1px rgba(251,191,36,0.7), 0 0 30px rgba(251,191,36,0.3); }
}
.legendary-card {
  animation: legendaryPulse 3s ease-in-out infinite;
}
.legendary-shimmer-bg {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 25%, #fde68a 50%, #f59e0b 75%, #fbbf24 100%);
  background-size: 300% 300%;
  animation: shimmerBorder 2.5s ease infinite;
}
`;

// ─── CollectibleCard ───────────────────────────────────────────────────────────

function CollectibleCard({
  item,
  isOwned,
  isEquipped,
  onBuy,
  onEquip,
  isPending,
}: {
  item: MockCollectible;
  isOwned: boolean;
  isEquipped: boolean;
  onBuy: (id: string) => void;
  onEquip: (id: string) => void;
  isPending: boolean;
}) {
  const rarity = RARITY_CONFIG[item.rarity];
  const isLegendary = item.rarity === "legendary";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--glass-bg)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${rarity.borderClass} ${rarity.glowClass} ${isLegendary ? "legendary-card" : ""}`}
    >
      {/* Legendary shimmer top bar */}
      {isLegendary && (
        <div className="legendary-shimmer-bg absolute inset-x-0 top-0 h-[2px]" />
      )}

      {/* Card body */}
      <div className="flex flex-col gap-3 p-4">
        {/* Top row: rarity badge + type pill */}
        <div className="flex items-center justify-between gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${rarity.badgeClass}`}>
            {rarity.label}
          </span>
          <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-[9px] font-medium uppercase tracking-widest text-[var(--text-muted)]">
            {item.type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Emoji icon in gradient circle */}
        <div className="flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-lg ring-2 ring-white/10"
            style={{
              background: `radial-gradient(circle at 35% 35%, ${item.preview[0]}cc, ${item.preview[1]}99)`,
            }}
          >
            {item.emoji}
          </div>
        </div>

        {/* Name & description */}
        <div className="space-y-1 text-center">
          <h3 className="text-sm font-bold leading-tight text-[var(--text-primary)]">{item.name}</h3>
          <p className="text-[11px] leading-snug text-[var(--text-muted)]">{item.description}</p>
        </div>

        {/* Price */}
        <div className="flex items-center justify-center gap-1.5">
          {item.priceCredits !== null ? (
            <>
              <span className="text-base">🪙</span>
              <span className="text-sm font-bold text-amber-400">{item.priceCredits.toLocaleString()} cr</span>
            </>
          ) : item.priceUsd !== null ? (
            <>
              <span className="rounded bg-[#6772e5]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#7b91ff]">
                Stripe
              </span>
              <span className="text-sm font-bold text-emerald-400">${item.priceUsd.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-sm font-bold text-emerald-400">Free</span>
          )}
        </div>

        {/* Action button */}
        {isOwned ? (
          isEquipped ? (
            <button
              onClick={() => onEquip(item.id)}
              className="w-full rounded-xl border border-emerald-400/40 bg-emerald-500/20 py-2 text-xs font-bold text-emerald-300 cursor-default"
            >
              ✓ Equipped
            </button>
          ) : (
            <button
              onClick={() => onEquip(item.id)}
              disabled={isPending}
              className="w-full rounded-xl bg-emerald-600/80 py-2 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              Equip
            </button>
          )
        ) : item.priceUsd !== null ? (
          <button
            disabled
            className="w-full cursor-not-allowed rounded-xl bg-[#6772e5]/40 py-2 text-xs font-bold text-[#a5b4ff] opacity-80"
          >
            Buy with Stripe
          </button>
        ) : (
          <button
            onClick={() => onBuy(item.id)}
            disabled={isPending}
            className="w-full rounded-xl bg-violet-600/80 py-2 text-xs font-bold text-white transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-50 disabled:cursor-wait"
          >
            {isPending ? "Purchasing…" : "Purchase"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

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

  // Load owned collectibles from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("mr_owned_collectibles");
    if (saved) {
      try {
        setOwnedIds(new Set(JSON.parse(saved) as string[]));
      } catch {}
    }
  }, []);

  // Persist owned collectibles to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("mr_owned_collectibles", JSON.stringify([...ownedIds]));
  }, [ownedIds]);

  const filteredItems =
    activeFilter === "all"
      ? MOCK_COLLECTIBLES
      : MOCK_COLLECTIBLES.filter((c) => c.type === activeFilter);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function handleBuy(id: string) {
    const item = MOCK_COLLECTIBLES.find((c) => c.id === id);
    if (!item) return;

    // Optimistic credit deduction for credits-based items
    if (item.priceCredits !== null) {
      if (balance < item.priceCredits) {
        showToast("Insufficient credits.", false);
        return;
      }
      setBalance(balance - item.priceCredits);
    }

    setPendingId(id);
    startTransition(async () => {
      // For mock items (no real DB id), simulate success
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
    // Unequip others of same type, equip this one
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
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <style>{SHIMMER_CSS}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Collectibles Shop
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Customize your game — unlock exclusive themes, frames &amp; sound packs
          </p>
        </div>

        {/* Credits display */}
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 backdrop-blur-md">
          <span className="text-xl">🪙</span>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">
              Your Credits
            </div>
            <div className="text-lg font-extrabold tabular-nums text-amber-400">
              {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              activeFilter === tab.key
                ? "border-violet-500/70 bg-violet-600/30 text-violet-200 shadow-lg shadow-violet-500/20"
                : "border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-muted)] hover:border-violet-500/40 hover:text-[var(--text-secondary)]"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Grid ────────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredItems.map((item) => (
            <CollectibleCard
              key={item.id}
              item={item}
              isOwned={ownedIds.has(item.id)}
              isEquipped={equippedIds.has(item.id)}
              onBuy={handleBuy}
              onEquip={handleEquip}
              isPending={pendingId === item.id}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-[var(--text-muted)]">
          <span className="text-5xl opacity-40">🛒</span>
          <p className="text-sm">No items in this category yet.</p>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold shadow-2xl backdrop-blur-md ${
              toast.ok
                ? "border-emerald-500/40 bg-emerald-950/80 text-emerald-300"
                : "border-red-500/40 bg-red-950/80 text-red-300"
            }`}
          >
            <span>{toast.ok ? "✅" : "❌"}</span>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
