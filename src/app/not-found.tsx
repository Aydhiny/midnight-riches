import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Spinning reels */}
        <div className="flex items-center gap-3">
          {["🍒", "💔", "🍒"].map((emoji, i) => (
            <div
              key={i}
              className="flex h-20 w-16 items-center justify-center rounded-xl text-4xl shadow-inner"
              style={{
                background: "linear-gradient(180deg, #1e2942 0%, #0f1628 100%)",
                border: "2px solid rgba(255,255,255,0.06)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(239,68,68,0.1)",
                filter: i === 1 ? "grayscale(0.5)" : "none",
              }}
            >
              {emoji}
            </div>
          ))}
        </div>

        {/* Logo */}
        <Image
          src="/images/midnight-riches-logo.png"
          alt="Midnight Riches"
          width={48}
          height={48}
          className="object-contain opacity-80 drop-shadow-[0_0_10px_rgba(251,191,36,0.4)]"
        />

        {/* 404 number */}
        <div>
          <h1
            className="text-8xl font-black leading-none tracking-tight"
            style={{
              backgroundImage: "linear-gradient(135deg, #fbbf24 0%, #fde68a 40%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              filter: "drop-shadow(0 0 30px rgba(251,191,36,0.35))",
            }}
          >
            404
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-[0.3em] text-amber-500/60">
            No Match Found
          </p>
        </div>

        {/* Message card */}
        <div
          className="max-w-sm rounded-2xl px-7 py-6"
          style={{
            background: "var(--auth-card-bg, rgba(255,255,255,0.04))",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <p className="text-base font-semibold text-[var(--text-primary)]">
            This page hit the jackpot of not existing.
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            The reels didn't line up. Let's get you back to the lobby where
            the action is.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-black text-black transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
                boxShadow: "0 0 24px rgba(245,158,11,0.45), 0 4px 12px rgba(0,0,0,0.4)",
              }}
            >
              🎰 Back to Lobby
            </Link>
            <Link
              href="/game"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-all hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
            >
              Play Now
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
