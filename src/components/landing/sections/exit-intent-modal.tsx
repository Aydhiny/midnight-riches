"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";
import { GlassCard, GoldGradientText } from "../ui/glass";
import ShinyButton from "@/components/ui/shiny-button";
import { useConversionTracker } from "@/lib/analytics/conversion";

const EXIT_INTENT_KEY = "mr_exit_intent_shown";

export function ExitIntentModal() {
  const t = useTranslations("landing.exitIntent");
  const { track } = useConversionTracker();
  const [show, setShow] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const dismiss = useCallback(() => setShow(false), []);

  useEffect(() => {
    if ("ontouchstart" in window) return;
    if (sessionStorage.getItem(EXIT_INTENT_KEY)) return;

    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 0) {
        sessionStorage.setItem(EXIT_INTENT_KEY, "1");
        setShow(true);
        track("exit_intent_shown");
        document.removeEventListener("mouseleave", handleMouseLeave);
      }
    }

    const timer = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave);
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [track]);

  useEffect(() => {
    if (!show) return;
    if (countdown <= 0) { dismiss(); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [show, countdown, dismiss]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={(e) => e.target === e.currentTarget && dismiss()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <GlassCard className="relative max-w-md w-full p-8 text-center">
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ boxShadow: "0 0 60px rgba(139,92,246,0.2), inset 0 0 40px rgba(255,215,0,0.04)" }}
              />

              <Clock className="h-10 w-10 text-amber-400 mx-auto" />

              <GoldGradientText as="h3" className="mt-4 text-2xl font-black">
                {t("headline")}
              </GoldGradientText>

              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                {t("description")}
              </p>

              <div className="mt-5">
                <div className="text-3xl font-black tabular-nums text-amber-400">
                  0:{String(countdown).padStart(2, "0")}
                </div>
                <p className="text-xs text-[var(--text-muted)]">{t("expiresIn")}</p>
              </div>

              <Link
                href="/auth/signup"
                onClick={() => track("cta_click", { section: "exit_intent", button: "claim" })}
                className="mt-5 block"
              >
                <ShinyButton className="h-12 w-full text-base font-bold">
                  {t("cta")}
                </ShinyButton>
              </Link>

              <button
                onClick={dismiss}
                className="mt-3 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {t("dismiss")}
              </button>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
