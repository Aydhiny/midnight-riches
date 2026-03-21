"use client";

import { useState, useEffect } from "react";
import { Shield, BarChart2, Megaphone, Cookie, ChevronDown, ChevronUp } from "lucide-react";

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
    JSON.stringify({
      version: CONSENT_VERSION,
      preferences: prefs,
      timestamp: Date.now(),
    }),
  );

  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `mr_consent=${JSON.stringify(prefs)}; path=/; expires=${expires}; SameSite=Lax`;
}

const COOKIE_CATEGORIES = [
  { id: "necessary", icon: Shield, always: true },
  { id: "analytics", icon: BarChart2, always: false },
  { id: "marketing", icon: Megaphone, always: false },
  { id: "preferences", icon: Cookie, always: false },
] as const;

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: false,
    preferences: true,
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (!loadConsent()) setVisible(true);
    }, 1200);
    return () => clearTimeout(t);
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

  if (!visible) return null;

  return (
    <>
      {/* FIXED ROOT — same philosophy as jackpot */}
      <div className="fixed bottom-28 right-6 z-50 flex flex-col items-end">
        <div
          className="w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border overflow-hidden"
          style={{
            background: "rgba(8,2,22,0.97)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(251,191,36,0.25)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.15)",
          }}
        >
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />

          <div className="px-5 py-4">
            {/* Title */}
            <h2 className="text-sm font-black text-amber-400 mb-1">🎰 Cookie Preferences</h2>

            <p className="text-xs text-white/50 mb-3">Choose what we can use. Necessary cookies are always active.</p>

            {/* Expand toggle */}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition mb-3"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide options" : "Customize"}
            </button>

            {/* Options */}
            {expanded && (
              <div className="space-y-2 mb-3">
                {COOKIE_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between text-xs text-white/70">
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-3 w-3" />
                      <span className="capitalize">{cat.id}</span>
                    </div>

                    {cat.always ? (
                      <span className="text-emerald-400 text-[10px]">Always on</span>
                    ) : (
                      <button
                        onClick={() =>
                          setPrefs((p) => ({
                            ...p,
                            [cat.id]: !p[cat.id],
                          }))
                        }
                        className={`w-8 h-4 rounded-full transition ${prefs[cat.id] ? "bg-amber-500" : "bg-white/20"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => accept("necessary")} className="text-xs text-white/50 hover:text-white">
                Necessary
              </button>

              <div className="ml-auto flex gap-2">
                {expanded && (
                  <button onClick={() => accept("custom")} className="text-xs text-amber-400 hover:text-amber-300">
                    Save
                  </button>
                )}

                <button
                  onClick={() => accept("all")}
                  className="px-3 py-1 text-xs font-bold rounded-lg text-black"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  }}
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
