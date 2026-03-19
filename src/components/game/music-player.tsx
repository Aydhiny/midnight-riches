"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

// ── Track catalogue ────────────────────────────────────────────────────────────
const MUSIC_TRACKS = [
  { id: "casino",    src: "/sounds/casino-music.mp3",    label: "Casino Classic", emoji: "🎰", premium: false },
  { id: "funky",     src: "/sounds/funky-music.mp3",     label: "Funky Groove",   emoji: "🎸", premium: true  },
  { id: "saxophone", src: "/sounds/saxophone-music.mp3", label: "Smooth Sax",     emoji: "🎷", premium: true  },
] as const;

type TrackId = (typeof MUSIC_TRACKS)[number]["id"];

// ── Exported hook so SlotMachine can read SFX setting ─────────────────────────
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

// ── Sub-components ─────────────────────────────────────────────────────────────
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
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" className="shrink-0 text-[var(--text-muted)]">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </div>
  );
}

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
        ${checked ? activeColor : "bg-[var(--glass-border)]"}`}
      aria-label={label}
    >
      <span
        className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200
          ${checked ? "translate-x-4" : "translate-x-0.5"}`}
      />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function MusicPlayer() {
  const t = useTranslations("game");
  const audioRef          = useRef<HTMLAudioElement | null>(null);
  const pendingAutoPlay   = useRef(false);
  const isFirstSwitch     = useRef(true);

  const [muted,           setMuted]           = useState(false);
  const [volume,          setVolume]          = useState(0.18);
  const [isReady,         setIsReady]         = useState(false);
  const [isPlaying,       setIsPlaying]       = useState(false);
  const [sfxEnabled,      setSfxEnabled]      = useState(true);
  const [panelOpen,       setPanelOpen]       = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<TrackId>("casino");

  // ── Load persisted preferences ────────────────────────────────────────────
  useEffect(() => {
    const savedMuted  = localStorage.getItem("mr_music_muted");
    const savedVol    = localStorage.getItem("mr_music_volume");
    const savedSfx    = localStorage.getItem("mr_sfx_enabled");
    const savedTrack  = localStorage.getItem("mr_music_track") as TrackId | null;
    if (savedMuted !== null) setMuted(savedMuted === "true");
    if (savedVol   !== null) setVolume(Number(savedVol));
    if (savedSfx   !== null) setSfxEnabled(savedSfx !== "false");
    if (savedTrack  && MUSIC_TRACKS.some((tr) => tr.id === savedTrack)) {
      setSelectedTrackId(savedTrack);
    }
  }, []);

  // ── Init audio once (using saved track from localStorage directly) ─────────
  useEffect(() => {
    const savedTrack = localStorage.getItem("mr_music_track") as TrackId | null;
    const trackId    = (savedTrack && MUSIC_TRACKS.some((tr) => tr.id === savedTrack)) ? savedTrack : "casino";
    const track      = MUSIC_TRACKS.find((tr) => tr.id === trackId) ?? MUSIC_TRACKS[0];

    const audio      = new Audio(track.src);
    audio.loop       = true;
    audio.volume     = volume;
    audio.muted      = false;
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

  // ── Switch track ──────────────────────────────────────────────────────────
  const switchTrack = useCallback((trackId: TrackId) => {
    if (trackId === selectedTrackId) return;
    const audio      = audioRef.current;
    const wasPlaying = audio ? !audio.paused : false;

    setSelectedTrackId(trackId);
    localStorage.setItem("mr_music_track", trackId);

    if (!audio) return;
    audio.pause();

    const track  = MUSIC_TRACKS.find((tr) => tr.id === trackId) ?? MUSIC_TRACKS[0];
    audio.src    = track.src;
    setIsReady(false);
    audio.load();

    audio.addEventListener("canplaythrough", () => {
      setIsReady(true);
      if (wasPlaying && !muted) audio.play().catch(() => {});
    }, { once: true });
  }, [selectedTrackId, muted]);

  // ── Sync volume / mute / autoplay ─────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted  = muted;
    audio.volume = volume;

    if (isReady && !muted) {
      audio.play().catch(() => {});
    }

    if (isReady && pendingAutoPlay.current) {
      pendingAutoPlay.current = false;
      setMuted(false);
      audio.muted = false;
      audio.play().catch(() => {});
    }

    localStorage.setItem("mr_music_muted",  String(muted));
    localStorage.setItem("mr_music_volume", String(volume));
  }, [muted, volume, isReady]);

  // ── Sync SFX setting ──────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("mr_sfx_enabled", String(sfxEnabled));
    window.dispatchEvent(new StorageEvent("storage", { key: "mr_sfx_enabled", newValue: String(sfxEnabled) }));
  }, [sfxEnabled]);

  // ── Handle autoplay event ─────────────────────────────────────────────────
  useEffect(() => {
    function handleAutoPlay() {
      if (!audioRef.current) return;
      if (!isReady) {
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

  const volPct        = Math.round(volume * 100);
  const currentTrack  = MUSIC_TRACKS.find((tr) => tr.id === selectedTrackId) ?? MUSIC_TRACKS[0];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            key="sound-panel"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[var(--glass-border)] backdrop-blur-xl"
            style={{ background: "var(--dropdown-bg)" }}
            role="dialog"
            aria-label="Sound settings"
          >
            {/* ── Music section ── */}
            <div className="border-b border-[var(--glass-border)] px-3.5 py-3 space-y-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm transition-all ${isPlaying && !muted ? "animate-bounce text-amber-400" : "text-[var(--text-muted)]"}`}
                  aria-hidden
                >
                  🎵
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {t("music")}
                </span>
                {isPlaying && !muted && (
                  <span className="ml-auto flex h-2 w-2">
                    <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-secondary)]">{t("volume")}</span>
                  <span className="text-[11px] font-mono text-amber-400">{volPct}%</span>
                </div>
                <VolumeSlider value={volume} onChange={setVolume} disabled={muted} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {muted ? t("muted") : t("playing")}
                </span>
                <TogglePill
                  checked={!muted}
                  onChange={(v) => {
                    if (v) { toggleMute(); } else { setMuted(true); }
                  }}
                  label={muted ? "Unmute music" : "Mute music"}
                  activeColor="bg-amber-500"
                />
              </div>
            </div>

            {/* ── Track selector ── */}
            <div className="border-b border-[var(--glass-border)] px-3.5 py-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[var(--text-muted)]" aria-hidden>💿</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Track
                </span>
              </div>
              <div className="space-y-1">
                {MUSIC_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => switchTrack(track.id as TrackId)}
                    className={[
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all duration-150 border",
                      selectedTrackId === track.id
                        ? "bg-amber-500/15 border-amber-500/40"
                        : "border-transparent hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <span className="text-sm leading-none">{track.emoji}</span>
                    <span
                      className={`flex-1 text-[11px] font-medium ${
                        selectedTrackId === track.id ? "text-amber-400" : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {track.label}
                    </span>
                    {track.premium && (
                      <span className="rounded-full border border-amber-500/40 bg-amber-500/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">
                        PRO
                      </span>
                    )}
                    {selectedTrackId === track.id && (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-amber-400 opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ── SFX section ── */}
            <div className="px-3.5 py-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm text-[var(--text-muted)]" aria-hidden>🔊</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  {t("soundFx")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[var(--text-secondary)]">
                  {sfxEnabled ? t("enabled") : t("disabled")}
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

      {/* ── Floating button ── */}
      <button
        onClick={() => setPanelOpen((p) => !p)}
        title={panelOpen ? "Close sound settings" : "Open sound settings"}
        aria-label={panelOpen ? "Close sound settings" : "Open sound settings"}
        aria-expanded={panelOpen}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border)] backdrop-blur-xl transition-all duration-200 hover:scale-110 hover:border-amber-400/50 active:scale-95"
        style={{
          background: isPlaying && !muted
            ? "rgba(124,58,237,0.35)"
            : "var(--glass-bg)",
        }}
      >
        {isPlaying && !muted && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ background: "rgb(124,58,237)" }}
            aria-hidden
          />
        )}

        {isPlaying && !muted ? (
          <span className="relative text-lg leading-none" aria-hidden>{currentTrack.emoji}</span>
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
