"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, BarChart2, Megaphone, Cookie, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";

type ConsentLevel = "all" | "necessary" | "custom";

interface CookiePreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const CONSENT_KEY = "mr_cookie_consent";
const CONSENT_VERSION = "1.0";

function loadConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { version: string; preferences: CookiePreferences };
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed.preferences;
  } catch {
    return null;
  }
}

function saveConsent(prefs: CookiePreferences) {
  localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ version: CONSENT_VERSION, preferences: prefs, timestamp: Date.now() })
  );
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `mr_consent=${JSON.stringify(prefs)}; path=/; expires=${expires}; SameSite=Lax`;
}

const COOKIE_CATEGORIES = [
  { id: "necessary" as const, icon: Shield, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", always: true },
  { id: "analytics" as const, icon: BarChart2, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", always: false },
  { id: "marketing" as const, icon: Megaphone, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", always: false },
  { id: "preferences" as const, icon: Cookie, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", always: false },
] as const;

export function CookieConsent() {
  const t = useTranslations("cookies");
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: false,
    preferences: true,
  });

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      if (!loadConsent()) setVisible(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  function accept(level: ConsentLevel) {
    const resolved: CookiePreferences =
      level === "all"
        ? { necessary: true, analytics: true, marketing: true, preferences: true }
        : level === "necessary"
        ? { necessary: true, analytics: false, marketing: false, preferences: false }
        : prefs;
    saveConsent(resolved);
    setVisible(false);
  }

  if (!mounted) return null;

  return (
    <>
      <style>{`
        @keyframes spin-slow { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin-slow     { animation: spin-slow 8s linear infinite; }
        .spin-slow-rev { animation: spin-slow 10s linear infinite reverse; }
        .spin-slow-med { animation: spin-slow 6s linear infinite; }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.div
            key="cookie-consent-overlay"
            className="fixed bottom-4 right-4 z-[9999] w-[360px] max-w-[calc(100vw-2rem)]"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
          >
              <div
                className="overflow-hidden rounded-2xl border border-amber-500/30 shadow-2xl"
                style={{
                  background: "var(--cookie-bg)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "var(--cookie-shadow)",
                }}
              >
                <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

                <div
                  className="flex items-center justify-center gap-5 border-b py-3"
                  style={{ borderColor: "var(--cookie-separator)" }}
                >
                  <Image src="/images/Cherry.png" alt="" width={32} height={32} className="spin-slow opacity-80 drop-shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
                  <Image src="/images/Seven.png" alt="" width={32} height={32} className="spin-slow-med opacity-80 drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                  <Image src="/images/Diamond.png" alt="" width={32} height={32} className="spin-slow-rev opacity-80 drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]" />
                </div>

                <div className="px-5 pb-5 pt-4">
                  <div className="mb-1 text-center">
                    <h2 className="text-base font-black tracking-tight text-amber-400">
                      🎰 {t("title")}
                    </h2>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--cookie-text-dim)" }}>
                      {t("description")}{" "}
                      <a
                        href="/legal/privacy"
                        className="text-amber-500 underline underline-offset-2 hover:text-amber-400 transition-colors"
                      >
                        {t("privacyPolicy")}
                      </a>
                    </p>
                  </div>

                  <AnimatePresence>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {COOKIE_CATEGORIES.map((cat) => (
                            <div key={cat.id} className={`flex items-start gap-2.5 rounded-xl border p-2.5 ${cat.bg}`}>
                              <cat.icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cat.color}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[11px] font-semibold capitalize" style={{ color: "var(--cookie-text)" }}>
                                    {t(`categories.${cat.id}`)}
                                  </span>
                                  {cat.always ? (
                                    <span className="text-[9px] font-medium text-emerald-500">
                                      {t("alwaysOn")}
                                    </span>
                                  ) : (
                                    <button
                                      role="switch"
                                      aria-checked={prefs[cat.id]}
                                      onClick={() => setPrefs((p) => ({ ...p, [cat.id]: !p[cat.id] }))}
                                      className={`relative inline-flex h-4 w-7 shrink-0 rounded-full border-2 border-transparent transition-colors ${prefs[cat.id] ? "bg-amber-500" : "bg-black/20 dark:bg-white/20"}`}
                                    >
                                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition duration-200 ${prefs[cat.id] ? "translate-x-3" : "translate-x-0"}`} />
                                    </button>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[9px] leading-snug" style={{ color: "var(--cookie-text-dim)" }}>
                                  {t(`categories.${cat.id}Desc`)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => setExpanded((e) => !e)}
                      className="flex items-center gap-1 text-[11px] transition-colors hover:text-amber-500"
                      style={{ color: "var(--cookie-text-dim)" }}
                    >
                      {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                      {expanded ? t("hide") : t("options")}
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                      {expanded && (
                        <button
                          onClick={() => accept("custom")}
                          className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[11px] font-medium text-amber-500 transition-all hover:bg-amber-500/20"
                        >
                          {t("saveChoices")}
                        </button>
                      )}
                      <button
                        onClick={() => accept("necessary")}
                        className="rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-1.5 text-[11px] font-medium transition-all hover:bg-[var(--bg-card-hover)]"
                        style={{ color: "var(--cookie-text-dim)" }}
                      >
                        {t("fold")}
                      </button>
                      <button
                        onClick={() => accept("all")}
                        className="rounded-lg px-4 py-1.5 text-[11px] font-black text-black transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%)",
                          boxShadow: "0 0 18px rgba(245,158,11,0.45), 0 2px 8px rgba(0,0,0,0.4)",
                        }}
                      >
                        {t("allIn")} 🎲
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-center text-[9px]" style={{ color: "var(--cookie-text-dim)" }}>
                    {t("agreeText")}{" "}
                    <a href="/legal/terms" className="underline hover:text-amber-500 transition-colors">
                      {t("terms")}
                    </a>{" "}
                    {t("and")}{" "}
                    <a href="/legal/privacy" className="underline hover:text-amber-500 transition-colors">
                      {t("privacyPolicy")}
                    </a>
                    . {t("ageWarning")}
                  </p>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
