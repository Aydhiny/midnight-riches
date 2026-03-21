"use client";

import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useWalletStore } from "@/store/wallet-store";
import { useIsSfxEnabled } from "@/components/game/music-player";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  getCollectibles,
  getUserCollectibles,
  purchaseCollectible,
  equipCollectible,
  unequipCollectible,
} from "@/server/actions/collectibles";
import { createCollectibleCheckoutAction } from "@/server/actions/stripe";

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

/** Visual config lives client-side keyed by item name. */
const VISUAL_CONFIG: Record<string, { emoji: string; preview: [string, string] }> = {
  "Golden Champion Frame":   { emoji: "👑", preview: ["#fbbf24", "#f59e0b"] },
  "Neon Pulse Frame":        { emoji: "⚡", preview: ["#7c3aed", "#ec4899"] },
  "Diamond VIP Frame":       { emoji: "💎", preview: ["#0c4a6e", "#38bdf8"] },
  "Midnight Chrome Reels":   { emoji: "🌙", preview: ["#1e1b4b", "#312e81"] },
  "Volcano Inferno Reels":   { emoji: "🌋", preview: ["#7f1d1d", "#ef4444"] },
  "Pixel Fruit Skins":       { emoji: "🕹️", preview: ["#065f46", "#10b981"] },
  "Crypto Symbol Pack":      { emoji: "₿",  preview: ["#78350f", "#f59e0b"] },
  "Casino Lounge Music":     { emoji: "🎰", preview: ["#1e3a5f", "#3b82f6"] },
  "Midnight Beats Pack":     { emoji: "🎶", preview: ["#14532d", "#22c55e"] },
  "Funky Groove Music":      { emoji: "🎸", preview: ["#4c1d95", "#7c3aed"] },
  "Smooth Sax Music":        { emoji: "🎷", preview: ["#1e3a5f", "#ec4899"] },
};
const DEFAULT_VISUAL = { emoji: "🎁", preview: ["#1e1b4b", "#312e81"] as [string, string] };

interface DisplayCollectible {
  id: string;            // DB UUID
  name: string;
  type: CollectibleType;
  rarity: Rarity;
  priceCredits: number | null;
  priceUsd: number | null;
  description: string;
  emoji: string;
  preview: [string, string];
}

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
    titleColor: "text-[var(--text-primary)]",
  },
  rare: {
    label: "Rare",    stars: 2,
    badgeStyle: { background: "rgba(37,99,235,0.45)", color: "#93c5fd" },
    cardBorder: "border-blue-500/40",
    cardGlow: "shadow-blue-500/15",
    titleColor: "text-blue-400",
  },
  epic: {
    label: "Epic",    stars: 3,
    badgeStyle: { background: "rgba(124,58,237,0.5)", color: "#c4b5fd" },
    cardBorder: "border-violet-500/50",
    cardGlow: "shadow-violet-500/20",
    titleColor: "text-violet-400",
  },
  legendary: {
    label: "Legendary", stars: 4,
    badgeStyle: { background: "linear-gradient(90deg,#f59e0b,#fbbf24)", color: "#451a03", fontWeight: 700 },
    cardBorder: "border-amber-500/60",
    cardGlow: "shadow-amber-500/30",
    titleColor: "text-amber-400",
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
  item, isOwned, isEquipped, onBuy, onEquip, onStripe, isPending,
}: {
  item: DisplayCollectible; isOwned: boolean; isEquipped: boolean;
  onBuy: (id: string) => void; onEquip: (id: string) => void;
  onStripe: (id: string) => void; isPending: boolean;
}) {
  const t = useTranslations("shop");
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
      style={{ background: "var(--bg-card)" }}
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
            ✓ {t("owned")}
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
              <Image src="/images/coin-token.png" alt="tokens" width={13} height={13} className="object-contain shrink-0" />
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                {item.priceCredits.toLocaleString()}
              </span>
            </div>
          ) : item.priceUsd !== null ? (
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
              <span className="text-xs font-bold text-emerald-300">${item.priceUsd.toFixed(2)}</span>
              <span className="rounded bg-[#6772e5]/25 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider text-[#93a0ff]">Stripe</span>
            </div>
          ) : (
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">{t("free")}</div>
          )}
        </div>

        {isOwned ? (
          isEquipped ? (
            <button
              onClick={() => onEquip(item.id)}
              className="w-full rounded-xl border border-emerald-400/40 bg-emerald-500/15 py-2.5 text-xs font-bold text-emerald-300 transition-all hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
              title="Click to unequip"
            >
              ✓ {t("equipped")}
            </button>
          ) : (
            <button
              onClick={() => onEquip(item.id)}
              disabled={isPending}
              className="w-full rounded-xl border border-emerald-500/40 bg-emerald-600/25 py-2.5 text-xs font-bold text-emerald-200 transition-all hover:bg-emerald-500/30 active:scale-95 disabled:opacity-50"
            >
              {t("equip")}
            </button>
          )
        ) : item.priceUsd !== null ? (
          <button
            onClick={() => onStripe(item.id)}
            disabled={isPending}
            className="w-full rounded-xl bg-[#6772e5] py-2.5 text-xs font-bold text-white transition-all hover:bg-[#5469d4] active:scale-95 disabled:opacity-50 disabled:cursor-wait"
          >
            {isPending ? "Redirecting…" : `${t("buyWithStripe")} — $${item.priceUsd?.toFixed(2)}`}
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
            {isPending ? t("purchasing") : t("purchase")}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function ShopPage() {
  const t = useTranslations("shop");
  const balance = useWalletStore((s) => s.balance);
  const setBalance = useWalletStore((s) => s.setBalance);
  const { playPurchase, playEquip } = useShopSfx();

  const filterTabs: { key: FilterTab; label: string; icon: string }[] = [
    { key: "all",          label: t("allItems"),     icon: "✦" },
    { key: "avatar_frame", label: t("avatarFrames"), icon: "🖼️" },
    { key: "reel_theme",   label: t("reelThemes"),   icon: "🎰" },
    { key: "symbol_skin",  label: t("symbolSkins"),  icon: "🎨" },
    { key: "sound_pack",   label: t("soundPacks"),   icon: "🎵" },
  ];

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [items, setItems] = useState<DisplayCollectible[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [equippedIds, setEquippedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, startTransition] = useTransition();
  const successShownRef = useRef(false);

  // Show success toast if redirected back from Stripe
  useEffect(() => {
    if (successShownRef.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("purchase") === "success") {
      successShownRef.current = true;
      showToast("Payment successful! Your item has been added to your collection.", true);
      // Clean up the URL
      window.history.replaceState({}, "", "/shop");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load collectibles + owned items from DB on mount
  useEffect(() => {
    async function load() {
      const [collectiblesRes, userRes] = await Promise.all([
        getCollectibles(),
        getUserCollectibles(),
      ]);

      if (collectiblesRes.success) {
        setItems(
          collectiblesRes.data.map((c) => {
            const vis = VISUAL_CONFIG[c.name] ?? DEFAULT_VISUAL;
            return {
              id: c.id,
              name: c.name,
              type: c.type,
              rarity: c.rarity,
              priceCredits: c.priceCredits ? parseFloat(c.priceCredits) : null,
              priceUsd: c.priceUsd ? parseFloat(c.priceUsd) : null,
              description: c.description ?? "",
              emoji: vis.emoji,
              preview: vis.preview,
            };
          })
        );
      }

      if (userRes.success) {
        setOwnedIds(new Set(userRes.data.map((c) => c.collectibleId)));
        setEquippedIds(
          new Set(userRes.data.filter((c) => c.equippedSlot !== null).map((c) => c.collectibleId))
        );
      }

      setIsLoading(false);
    }
    load();
  }, []);

  const filteredItems = activeFilter === "all"
    ? items
    : items.filter((c) => c.type === activeFilter);

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  function handleBuy(id: string) {
    const item = items.find((c) => c.id === id);
    if (!item) return;
    if (item.priceCredits !== null && balance < item.priceCredits) {
      showToast(t("insufficient"), false);
      return;
    }
    setPendingId(id);
    startTransition(async () => {
      const result = await purchaseCollectible(id);
      if (!result.success) {
        showToast(result.error ?? "Purchase failed", false);
      } else {
        setOwnedIds((prev) => new Set(prev).add(id));
        // Optimistically sync client wallet store; DB was already updated server-side
        if (item.priceCredits !== null) setBalance(balance - item.priceCredits);
        playPurchase();
        showToast(t("addedToCollection", { name: item.name }), true);
      }
      setPendingId(null);
    });
  }

  function handleStripe(id: string) {
    const item = items.find((c) => c.id === id);
    if (!item || item.priceUsd === null) return;
    setPendingId(id);
    startTransition(async () => {
      const result = await createCollectibleCheckoutAction({
        collectibleId: id,
        name: item.name,
        description: item.description,
        priceUsd: item.priceUsd!,
      });
      if (result.success) {
        window.location.href = result.url;
      } else {
        showToast(result.error ?? "Checkout failed", false);
        setPendingId(null);
      }
    });
  }

  function handleEquip(id: string) {
    const item = items.find((c) => c.id === id);
    if (!item) return;
    const alreadyEquipped = equippedIds.has(id);
    startTransition(async () => {
      if (alreadyEquipped) {
        // Toggle off — unequip
        const result = await unequipCollectible(item.type);
        if (!result.success) {
          showToast(result.error ?? "Could not unequip item", false);
          return;
        }
        setEquippedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        showToast(`Unequipped ${item.name}`, true);
      } else {
        const result = await equipCollectible(id, item.type);
        if (!result.success) {
          showToast(result.error ?? "Could not equip item", false);
          return;
        }
        setEquippedIds((prev) => {
          const next = new Set(prev);
          // Unequip any other item of the same type
          items.filter((c) => c.type === item.type).forEach((c) => next.delete(c.id));
          next.add(id);
          return next;
        });
        playEquip();
        showToast(t("equipSuccess", { name: item.name }), true);
        // Tell the music player to refresh its owned sound packs
        if (item.type === "sound_pack") {
          window.dispatchEvent(new CustomEvent("mr:sound-pack-equipped"));
        }
      }
    });
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
        {t("backToGame")}
      </Link>

      <div
        className="relative mb-8 overflow-hidden rounded-2xl border border-amber-500/20 px-8 py-8"
        style={{
          background: "var(--bg-card)",
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
                {t("storeTag")}
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
              {t("title")}
            </h1>
            <p className="mt-2 max-w-md text-sm text-[var(--text-muted)]">
              Unlock exclusive themes, frames & sound packs. Stand out at the tables with legendary gear.
            </p>
          </div>

          <div
            className="flex shrink-0 items-center gap-3 rounded-2xl border border-amber-500/30 px-5 py-4"
            style={{ background: "rgba(251,191,36,0.08)", backdropFilter: "blur(12px)" }}
          >
            <Image src="/images/coin-token.png" alt="tokens" width={40} height={40} className="object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-400/70">{t("yourBalance")}</div>
              <div
                className="text-2xl font-black tabular-nums"
                style={{ color: "#fbbf24", textShadow: "0 0 20px rgba(251,191,36,0.5)" }}
              >
                {balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[9px] text-amber-500/50 uppercase tracking-widest">{t("tokens")}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
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

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-white/[0.06]"
              style={{ background: "var(--bg-card)" }}
            />
          ))}
        </div>
      ) : (
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
                  onStripe={handleStripe}
                  isPending={pendingId === item.id}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {!isLoading && filteredItems.length === 0 && (
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
