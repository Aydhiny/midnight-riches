"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

// ─── SFX hook — exported so other components can read the setting ─────────────
export function useIsSfxEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("mr_sfx_enabled") !== "false";
  });

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "mr_sfx_enabled") {
        setEnabled(e.newValue !== "false");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return enabled;
}

// ─── Volume slider ────────────────────────────────────────────────────────────
function VolumeSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {/* quiet icon */}
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"
        className="shrink-0 text-[var(--text-muted)]">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
      </svg>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer accent-amber-400 disabled:opacity-40"
        aria-label="Music volume"
      />
      {/* loud icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" className="shrink-0 text-[var(--text-muted)]">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </div>
  );
}

// ─── Toggle pill ──────────────────────────────────────────────────────────────
function TogglePill({
  checked,
  onChange,
  label,
  activeColor = "bg-violet-600",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  activeColor?: string;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black
        ${checked ? activeColor : "bg-white/10"}`}
      aria-label={label}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200
          ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
/**
 * Floating sound control panel.
 * Persists:
 *   mr_music_muted   — boolean string
 *   mr_music_volume  — number string (0-1)
 *   mr_sfx_enabled   — boolean string ("true" / "false")
 */
export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingAutoPlay = useRef(false);

  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.25);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);

  // ── Load preferences from localStorage on mount ──────────────────────────
  useEffect(() => {
    const savedMuted  = localStorage.getItem("mr_music_muted");
    const savedVol    = localStorage.getItem("mr_music_volume");
    const savedSfx    = localStorage.getItem("mr_sfx_enabled");
    if (savedMuted !== null) setMuted(savedMuted === "true");
    if (savedVol   !== null) setVolume(Number(savedVol));
    if (savedSfx   !== null) setSfxEnabled(savedSfx !== "false");
  }, []);

  // ── Create audio element once ─────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio("/sounds/casino-music.mp3");
    audio.loop   = true;
    audio.volume = volume;
    audio.muted  = true;
    audioRef.current = audio;

    audio.addEventListener("canplaythrough", () => setIsReady(true), { once: true });
    audio.addEventListener("play",  () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));
    audio.load();

    return () => {
      audio.pause();
      audio.src = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Sync muted / volume → audio element ──────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted  = muted;
    audio.volume = volume;

    if (isReady && !muted) {
      audio.play().catch(() => {});
    }

    // If audio just became ready and autoplay was pending, fire it now
    if (isReady && pendingAutoPlay.current) {
      pendingAutoPlay.current = false;
      setMuted(false);
      audio.muted = false;
      audio.play().catch(() => {});
    }

    localStorage.setItem("mr_music_muted",  String(muted));
    localStorage.setItem("mr_music_volume", String(volume));
  }, [muted, volume, isReady]);

  // ── Sync SFX to localStorage ──────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("mr_sfx_enabled", String(sfxEnabled));
    // Fire storage event so useIsSfxEnabled hook in other tabs/components picks up change
    window.dispatchEvent(new StorageEvent("storage", { key: "mr_sfx_enabled", newValue: String(sfxEnabled) }));
  }, [sfxEnabled]);

  // ── mr:autoplay-music event from game page ────────────────────────────────
  useEffect(() => {
    function handleAutoPlay() {
      if (!audioRef.current) return;
      if (!isReady) {
        // Audio not loaded yet — store intent; sync effect will act when ready
        pendingAutoPlay.current = true;
        return;
      }
      pendingAutoPlay.current = false;
      setMuted(false);
      audioRef.current.muted = false;
      audioRef.current.play().catch(() => {});
    }
    window.addEventListener("mr:autoplay-music", handleAutoPlay);
    return () => window.removeEventListener("mr:autoplay-music", handleAutoPlay);
  }, [isReady]);

  // ── Toggles ───────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !muted;
    setMuted(next);
    if (!next) {
      audio.muted = false;
      audio.play().catch(() => {});
    }
  }, [muted]);

  const volPct = Math.round(volume * 100);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* ── Slide-up panel ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="sound-panel"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-56 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)] backdrop-blur-xl"
            style={{ background: "rgba(6,1,15,0.92)" }}
            role="dialog"
            aria-label="Sound settings"
          >
            {/* ── MUSIC section ────────────────────────────────────────── */}
            <div className="border-b border-[var(--glass-border)] px-3.5 py-3 space-y-2.5">
              <div className="flex items-center gap-1.5">
                {/* Animated note when playing */}
                <span
                  className={`text-sm transition-all ${isPlaying && !muted ? "animate-bounce text-amber-400" : "text-[var(--text-muted)]"}`}
                  aria-hidden
                >
                  🎵
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Music
                </span>
                {isPlaying && !muted && (
                  <span className="ml-auto flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  </span>
                )}
              </div>

              {/* Volume row */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-secondary)]">Volume</span>
                  <span className="text-[11px] font-mono text-amber-400">{volPct}%</span>
                </div>
                <VolumeSlider value={volume} onChange={setVolume} disabled={muted} />
              </div>

              {/* Mute toggle row */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {muted ? "Muted" : "Playing"}
                </span>
                <TogglePill
                  checked={!muted}
                  onChange={(v) => {
                    if (v) {
                      toggleMute();
                    } else {
                      setMuted(true);
                    }
                  }}
                  label={muted ? "Unmute music" : "Mute music"}
                  activeColor="bg-amber-500"
                />
              </div>
            </div>

            {/* ── SFX section ──────────────────────────────────────────── */}
            <div className="px-3.5 py-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[var(--text-muted)]" aria-hidden>🔊</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Sound FX
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {sfxEnabled ? "Enabled" : "Disabled"}
                </span>
                <TogglePill
                  checked={sfxEnabled}
                  onChange={setSfxEnabled}
                  label={sfxEnabled ? "Disable sound effects" : "Enable sound effects"}
                  activeColor="bg-violet-600"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB toggle button ────────────────────────────────────────────── */}
      <button
        onClick={() => setPanelOpen((p) => !p)}
        title={panelOpen ? "Close sound settings" : "Open sound settings"}
        aria-label={panelOpen ? "Close sound settings" : "Open sound settings"}
        aria-expanded={panelOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border)] backdrop-blur-xl transition-all duration-200 hover:scale-110 hover:border-amber-400/50 active:scale-95"
        style={{
          background: isPlaying && !muted
            ? "rgba(124,58,237,0.35)"
            : "rgba(6,1,15,0.88)",
        }}
      >
        {/* Pulsing ring when music is playing */}
        {isPlaying && !muted && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "rgb(124,58,237)" }}
            aria-hidden
          />
        )}

        {/* Icon — note when playing, muted-speaker when not */}
        {isPlaying && !muted ? (
          <span className="relative text-lg leading-none" aria-hidden>🎵</span>
        ) : (
          <svg
            width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`relative ${muted ? "text-[var(--text-muted)]" : "text-amber-400"}`}
            aria-hidden
          >
            {muted ? (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </>
            ) : (
              <>
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              </>
            )}
          </svg>
        )}
      </button>
    </div>
  );
}
