"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { DailyChallengesWidget } from "@/components/game/daily-challenges-widget";
import { HowToPlayModal } from "@/components/game/how-to-play-modal";
import { seedCommunityWinsAction } from "@/server/actions/seed-notifications";

const SlotMachine = dynamic(
  () => import("@/components/game/slot-machine").then((mod) => mod.SlotMachine),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
      </div>
    ),
  }
);

// ── Iconic scrolling reel columns — same visual as hero section ───────────────
const REEL_IMAGES_LEFT  = [
  "/images/Cherry.png", "/images/Lemon.png", "/images/Bell.png",
  "/images/Watermelon.png", "/images/Orange.png", "/images/Grape.png",
  "/images/Star.png", "/images/Wild.png",
];
const REEL_IMAGES_RIGHT = [
  "/images/Diamond.png", "/images/Seven.png", "/images/Bar.png",
  "/images/Star.png", "/images/Cherry.png", "/images/Bell.png",
  "/images/Watermelon.png", "/images/Lemon.png",
];

function AmbientFruits() {
  const leftDoubled  = [...REEL_IMAGES_LEFT,  ...REEL_IMAGES_LEFT];
  const rightDoubled = [...REEL_IMAGES_RIGHT, ...REEL_IMAGES_RIGHT];

  return (
    <>
      {/* Left reel — scrolls down slowly */}
      <div
        className="pointer-events-none fixed z-[5] select-none overflow-hidden"
        aria-hidden
        style={{ top: 56, bottom: 0, left: 0, width: "5rem", opacity: 0.07, filter: "blur(1.5px)", transform: "translateX(-30%)" }}
      >
        <div className="flex flex-col gap-5" style={{ animation: "reel-scroll 22s linear infinite" }}>
          {leftDoubled.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" width={72} height={72} className="object-contain shrink-0" />
          ))}
        </div>
      </div>

      {/* Right reel — scrolls at slightly different speed */}
      <div
        className="pointer-events-none fixed z-[5] select-none overflow-hidden"
        aria-hidden
        style={{ top: 56, bottom: 0, right: 0, width: "5rem", opacity: 0.07, filter: "blur(1.5px)", transform: "translateX(30%)" }}
      >
        <div className="flex flex-col gap-5" style={{ animation: "reel-scroll 17s linear infinite" }}>
          {rightDoubled.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt="" width={72} height={72} className="object-contain shrink-0" />
          ))}
        </div>
      </div>
    </>
  );
}

// ── Desktop-only mouse spotlight ──────────────────────────────────────────────
function GameSpotlight() {
  const [pos, setPos] = useState({ x: -9999, y: -9999 });

  useEffect(() => {
    function onMove(e: MouseEvent) { setPos({ x: e.clientX, y: e.clientY }); }
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[4] hidden lg:block"
      aria-hidden
      style={{
        background: `radial-gradient(450px circle at ${pos.x}px ${pos.y}px, rgba(124,58,237,0.055) 0%, transparent 65%)`,
      }}
    />
  );
}

function GameMusicAutoStart() {
  useEffect(() => {
    const muted = localStorage.getItem("mr_music_muted");
    if (muted === "true") return;

    window.dispatchEvent(new CustomEvent("mr:autoplay-music"));

    function onFirstInteraction() {
      window.dispatchEvent(new CustomEvent("mr:autoplay-music"));
      cleanup();
    }
    function cleanup() {
      window.removeEventListener("click",   onFirstInteraction);
      window.removeEventListener("keydown", onFirstInteraction);
    }
    window.addEventListener("click",   onFirstInteraction, { once: true });
    window.addEventListener("keydown", onFirstInteraction, { once: true });
    return cleanup;
  }, []);
  return null;
}

const BOT_MESSAGES = [
  "Casey just hit 3x Cherry! Lucky! 🍒",
  "@MidnightRiches is rigged I swear 😂",
  "Anyone else on Classic Fruits rn?",
  "Just lost 50cr... going all in 💀",
  "5 spins in a row without a win rip",
  "MEGA WIN on Megaways!! 🎰🎰🎰",
  "what's the max bet on five reel?",
  "daily bonus available now guys",
  "bro watermelons never hit for me",
  "Jordan just won 810cr on Mega Ways 🤑",
  "lemon lemon lemon... always lemons 🍋",
  "wild feature is actually insane",
  "just got 3x Seven for 300cr!! let's go",
  "how do I activate the bonus round?",
  "$0.10 bet gang rise up 🙌",
  "I need ONE more cherry...",
  "Ayden is on a heater rn",
  "RNG is hitting different tonight 🎲",
  "anyone know what scatter does?",
  "cluster pays > paylines fight me",
  "lost my whole balance in 2 spins lmao",
];

const BOT_NAMES = [
  "Casey D.", "Jordan M.", "Alex K.", "Phoenix E.",
  "Rowan Z.", "Chris B.", "Sam T.", "Dana L.", "Morgan P.",
];

const AVATAR_GRADIENTS = [
  "from-violet-500 to-purple-700",
  "from-pink-500 to-rose-700",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-blue-700",
  "from-fuchsia-500 to-violet-700",
  "from-rose-500 to-pink-700",
  "from-indigo-500 to-violet-800",
  "from-cyan-500 to-sky-700",
];

const GAMES = ["Classic Fruits", "Five Reel Deluxe", "Cascade Crush", "Mega Ways"];
const WIN_NAMES = [
  "Alex K.", "Jordan M.", "Sam L.", "Riley P.", "Morgan T.",
  "Casey D.", "Avery B.", "Quinn R.", "Blake S.", "Taylor W.",
];
const WIN_COLORS = [
  "bg-red-500", "bg-blue-500", "bg-emerald-500", "bg-violet-500",
  "bg-amber-500", "bg-pink-500", "bg-cyan-500", "bg-orange-500",
];

interface WinEntry {
  id: string;
  initials: string;
  color: string;
  name: string;
  game: string;
  amount: number;
}

function randomWinEntry(): WinEntry {
  const name    = WIN_NAMES[Math.floor(Math.random() * WIN_NAMES.length)];
  const initials = name.split(" ").map((w) => w[0]).join("");
  const color   = WIN_COLORS[Math.floor(Math.random() * WIN_COLORS.length)];
  const game    = GAMES[Math.floor(Math.random() * GAMES.length)];
  const roll    = Math.random();
  const amount  = roll < 0.5
    ? Math.floor(Math.random() * 50  + 5)
    : roll < 0.85
    ? Math.floor(Math.random() * 200 + 50)
    : Math.floor(Math.random() * 1000 + 200);
  return { id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, initials, color, name, game, amount };
}

function generateInitialWins(): WinEntry[] {
  return Array.from({ length: 3 }, randomWinEntry);
}

interface ChatMessage {
  id: string;
  isBot: boolean;
  name: string;
  initials: string;
  gradient: string;   // only used for bots
  text: string;
  ts: number; // epoch ms
}

function formatTs(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5)  return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

function randomBotMessage(): ChatMessage {
  const name     = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
  const initials = name.split(" ").map((w) => w[0]).join("");
  const gradient = AVATAR_GRADIENTS[Math.floor(Math.random() * AVATAR_GRADIENTS.length)];
  const text     = BOT_MESSAGES[Math.floor(Math.random() * BOT_MESSAGES.length)];
  return {
    id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    isBot: true,
    name,
    initials,
    gradient,
    text,
    ts: Date.now(),
  };
}

function generateInitialMessages(): ChatMessage[] {
  return Array.from({ length: 7 }, (_, i) => ({
    ...randomBotMessage(),
    ts: Date.now() - (7 - i) * 18000,
  }));
}

function LiveChat() {
  const tc = useTranslations("common");
  const tg = useTranslations("game");
  const [messages,       setMessages]       = useState<ChatMessage[]>(() => generateInitialMessages());
  const [inputVal,       setInputVal]       = useState("");
  const [winsExpanded,   setWinsExpanded]   = useState(true);
  const [recentWins,     setRecentWins]     = useState<WinEntry[]>(() => generateInitialWins());
  const [tsVersion,      setTsVersion]      = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const botTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winsTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Bump timestamps every 30 s so "just now" / "Xs ago" stays fresh
  useEffect(() => {
    const id = setInterval(() => setTsVersion((v) => v + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Bot message scheduler
  const scheduleBotMessage = useCallback(() => {
    const delay = 2000 + Math.random() * 3000; // 2-5 s
    botTimerRef.current = setTimeout(() => {
      setMessages((prev) => [...prev, randomBotMessage()].slice(-60));
      scheduleBotMessage();
    }, delay);
  }, []);

  useEffect(() => {
    scheduleBotMessage();
    return () => { if (botTimerRef.current) clearTimeout(botTimerRef.current); };
  }, [scheduleBotMessage]);

  // Recent wins cycle
  const scheduleWinUpdate = useCallback(() => {
    const delay = 4000 + Math.random() * 4000;
    winsTimerRef.current = setTimeout(() => {
      setRecentWins((prev) => [randomWinEntry(), ...prev].slice(0, 3));
      scheduleWinUpdate();
    }, delay);
  }, []);

  useEffect(() => {
    scheduleWinUpdate();
    return () => { if (winsTimerRef.current) clearTimeout(winsTimerRef.current); };
  }, [scheduleWinUpdate]);

  const sendUserMessage = useCallback(() => {
    const text = inputVal.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id:       `user-${Date.now()}`,
      isBot:    false,
      name:     "You",
      initials: "Y",
      gradient: "from-violet-500 to-fuchsia-600",
      text,
      ts:       Date.now(),
    };
    setMessages((prev) => [...prev, msg].slice(-60));
    setInputVal("");
    inputRef.current?.focus();
  }, [inputVal]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendUserMessage();
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md">
      <div className="flex items-center gap-2 border-b border-[var(--glass-border)] px-3 py-2.5 shrink-0">
        <div className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {tc("liveChat")}
        </span>
        <span className="ml-auto text-[9px] text-[var(--text-muted)]">
          {BOT_NAMES.length + 1} online
        </span>
      </div>

      <div className="shrink-0 border-b border-[var(--glass-border)]">
        <button
          onClick={() => setWinsExpanded((v) => !v)}
          className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left hover:bg-white/[0.03] transition-colors"
          aria-expanded={winsExpanded}
        >
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {tg("recentWins")}
          </span>
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className={`ml-auto text-[var(--text-muted)] transition-transform ${winsExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {winsExpanded && (
          <div className="space-y-0.5 px-2 pb-1.5">
            {recentWins.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-1.5 rounded-lg bg-white/[0.03] px-2 py-1"
              >
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${w.color}`}>
                  {w.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-[10px] font-semibold text-[var(--text-primary)]">{w.name}</span>
                    <span className={`shrink-0 text-[10px] font-bold ${
                      w.amount >= 200 ? "text-amber-400" : "text-emerald-400"
                    }`}>
                      +{w.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="truncate text-[8px] text-[var(--text-muted)]">{w.game}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        data-ts={tsVersion}
        className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1.5"
        style={{ scrollbarWidth: "none" }}
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((msg) =>
          msg.isBot ? (
            /* Bot message — left aligned */
            <div key={msg.id} className="flex items-start gap-1.5">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${msg.gradient} text-[9px] font-bold text-white`}>
                {msg.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] font-semibold text-violet-300">{msg.name}</span>
                  <span className="text-[8px] text-[var(--text-muted)]">{formatTs(msg.ts)}</span>
                </div>
                <div className="mt-0.5 rounded-lg rounded-tl-none bg-white/[0.06] px-2 py-1 text-[11px] leading-snug text-[var(--text-secondary)]">
                  {msg.text}
                </div>
              </div>
            </div>
          ) : (
            /* User message — right aligned */
            <div key={msg.id} className="flex items-start justify-end gap-1.5">
              <div className="min-w-0 max-w-[80%]">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-[8px] text-[var(--text-muted)]">{formatTs(msg.ts)}</span>
                  <span className="text-[10px] font-semibold text-amber-400">You</span>
                </div>
                <div className="mt-0.5 rounded-lg rounded-tr-none bg-violet-600/30 px-2 py-1 text-[11px] leading-snug text-[var(--text-primary)]">
                  {msg.text}
                </div>
              </div>
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-[9px] font-bold text-white`}>
                Y
              </div>
            </div>
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-[var(--glass-border)] px-2 py-2">
        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Say something..."
            maxLength={120}
            aria-label="Chat message"
            className="min-w-0 flex-1 rounded-lg border border-[var(--glass-border)] bg-white/[0.05] px-2.5 py-1.5 text-[11px] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-violet-500/50 focus:bg-white/[0.08]"
          />
          <button
            onClick={sendUserMessage}
            disabled={!inputVal.trim()}
            aria-label="Send message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition-all hover:bg-violet-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarButton({ icon, label, sub, color, href }: { icon: string; label: string; sub: string; color: string; href?: string }) {
  const cls = "flex w-full items-center gap-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-left backdrop-blur-md transition-all duration-200 hover:bg-white/[0.06] hover:-translate-y-px active:translate-y-0";
  const inner = (
    <>
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color} text-base`}>
        {icon}
      </span>
      <div>
        <div className="text-xs font-bold text-[var(--text-primary)]">{label}</div>
        <div className="text-[10px] text-[var(--text-muted)]">{sub}</div>
      </div>
    </>
  );
  return href
    ? <Link href={href} className={cls}>{inner}</Link>
    : <button className={cls}>{inner}</button>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function GamePage() {
  const t  = useTranslations("game");
  const tc = useTranslations("common");
  const seededRef = useRef(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

  useEffect(() => {
    if (seededRef.current) return;
    seededRef.current = true;
    seedCommunityWinsAction();
  }, []);

  return (
    <div className="-mx-4 -mb-8 -mt-6 relative flex h-[calc(100vh-56px)] overflow-hidden bg-[var(--bg-primary)]">
      <div className="hidden lg:block"><AmbientFruits /></div>
      <GameSpotlight />

      <aside className="relative hidden w-56 shrink-0 border-r border-[var(--glass-border)] bg-[var(--glass-bg)]/40 lg:flex lg:flex-col overflow-hidden p-2">
        <LiveChat />
      </aside>

      <div className="relative z-[10] flex flex-1 flex-col items-center overflow-y-auto px-4 pt-4 pb-4"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.3) transparent" }}
      >
        {/* Back button — always visible at top, never hidden by justify-center */}
        <div className="w-full max-w-4xl mb-3 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all active:scale-95 border-violet-400/60 bg-violet-100 text-violet-700 hover:bg-violet-200 hover:text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-300 dark:hover:bg-violet-500/25 dark:hover:text-violet-200"
          >
            <ArrowLeft className="h-3 w-3" />
            {tc("home")}
          </Link>
        </div>
        {/* Slot machine — centred in remaining vertical space */}
        <div className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center gap-3">
          <SlotMachine />
        </div>
      </div>

      <aside
        className="relative hidden w-[268px] shrink-0 flex-col gap-2.5 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--glass-bg)]/40 p-3 lg:flex"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(139,92,246,0.25) transparent" }}
      >
        <style>{`
          aside::-webkit-scrollbar { width: 3px; }
          aside::-webkit-scrollbar-track { background: transparent; }
          aside::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 99px; }
          aside::-webkit-scrollbar-thumb:hover { background: rgba(139,92,246,0.5); }
        `}</style>

        <DailyChallengesWidget />

        <SidebarButton icon="🛍️" label={t("collectiblesShop")} sub={t("collectiblesDesc")} color="bg-fuchsia-500/20" href="/shop" />
        <button
          onClick={() => setHowToPlayOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2.5 text-left backdrop-blur-md transition-all duration-200 hover:bg-white/[0.06] hover:-translate-y-px active:translate-y-0"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-base">❓</span>
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">{t("howToPlay")}</div>
            <div className="text-[10px] text-[var(--text-muted)]">{t("howToPlayDesc")}</div>
          </div>
        </button>
        <HowToPlayModal open={howToPlayOpen} onClose={() => setHowToPlayOpen(false)} />
        <SidebarButton icon="🏆" label={t("leaderboard")}    sub={t("leaderboardDesc")}  color="bg-amber-500/20"  />
        <SidebarButton icon="✅" label={t("provablyFair")}   sub={t("provablyFairDesc")} color="bg-emerald-500/20"/>
        <SidebarButton icon="🎁" label={t("claimBonus")}     sub={t("claimBonusDesc")}   color="bg-pink-500/20"   />
        <SidebarButton icon="💬" label={t("liveSupport")}    sub={t("liveSupportDesc")}  color="bg-sky-500/20"    />

        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-3 backdrop-blur-md">
          <div className="mb-2.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{t("liveStats")}</div>
          </div>
          <div className="space-y-2">
            {[
              { label: t("playersOnline"), value: "1,284",     accent: "text-emerald-400" },
              { label: t("biggestWin"),    value: "47,500 cr", accent: "text-amber-400"   },
              { label: t("totalSpins"),    value: "93,104",    accent: "text-violet-400"  },
              { label: t("jackpotPool"),   value: "$12,482",   accent: "text-yellow-300"  },
            ].map(({ label, value, accent }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-secondary)]">{label}</span>
                <span className={`text-[11px] font-bold ${accent}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <GameMusicAutoStart />

    </div>
  );
}
