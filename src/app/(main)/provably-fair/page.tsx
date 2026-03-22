"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Shield,
  Hash,
  CheckCircle2,
  Eye,
  Lock,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";

// ─── CSS for animations ────────────────────────────────────────────────────────
const PF_CSS = `
@keyframes shieldPulse {
  0%,100% { box-shadow: 0 0 0 1px rgba(34,197,94,0.25), 0 4px 40px rgba(34,197,94,0.08); }
  50%     { box-shadow: 0 0 0 1.5px rgba(34,197,94,0.55), 0 4px 55px rgba(34,197,94,0.2); }
}
.shield-pulse { animation: shieldPulse 3s ease-in-out infinite; }
@keyframes scanLine {
  0%   { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
.scan-line {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.scan-line::after {
  content: '';
  position: absolute;
  inset-x: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(34,197,94,0.4), transparent);
  animation: scanLine 4s linear infinite;
}
`;

// ─── Step card ─────────────────────────────────────────────────────────────────
function StepCard({
  icon: Icon,
  number,
  title,
  description,
  color,
  delay,
}: {
  icon: React.ElementType;
  number: number;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="relative flex gap-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 backdrop-blur-md"
      style={{ boxShadow: `0 0 30px ${color}10` }}
    >
      {/* Step number + icon */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}35`,
            boxShadow: `0 0 20px ${color}20`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div
          className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black"
          style={{ background: `${color}25`, color, border: `1px solid ${color}40` }}
        >
          {number}
        </div>
      </div>

      {/* Content */}
      <div>
        <h3 className="mb-1 text-base font-bold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
      </div>
    </motion.div>
  );
}

// ─── Accordion item ────────────────────────────────────────────────────────────
function AccordionItem({
  question,
  answer,
  delay,
}: {
  question: string;
  answer: string;
  delay: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="overflow-hidden rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)]"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
      >
        <span className="text-sm font-semibold text-[var(--text-primary)]">{question}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="border-t border-[var(--glass-border)] px-5 py-4">
              <p className="text-sm leading-relaxed text-[var(--text-muted)]">{answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--glass-border)] bg-white/5 text-[var(--text-muted)] transition-all hover:bg-white/10 hover:text-[var(--text-primary)]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ProvablyFairPage() {
  const t = useTranslations("provablyFair");

  // Verification tool state
  const [serverSeed, setServerSeed] = useState("");
  const [clientSeed, setClientSeed] = useState("");
  const [nonce, setNonce]           = useState("");
  const [hashResult, setHashResult] = useState<string | null>(null);
  const [computing, setComputing]   = useState(false);

  async function computeHash() {
    if (!serverSeed.trim()) return;
    setComputing(true);
    try {
      const data    = `${serverSeed}:${clientSeed}:${nonce}`;
      const encoded = new TextEncoder().encode(data);
      const hashBuf = await crypto.subtle.digest("SHA-256", encoded);
      const hashArr = Array.from(new Uint8Array(hashBuf));
      const hex     = hashArr.map((b) => b.toString(16).padStart(2, "0")).join("");
      setHashResult(hex);
    } catch {
      setHashResult(null);
    }
    setComputing(false);
  }

  // Accordion data
  const faqItems = [
    {
      q: t("faq1Q"),
      a: t("faq1A"),
    },
    {
      q: t("faq2Q"),
      a: t("faq2A"),
    },
    {
      q: t("faq3Q"),
      a: t("faq3A"),
    },
    {
      q: t("faq4Q"),
      a: t("faq4A"),
    },
  ];

  return (
    <div
      className="relative mx-auto max-w-4xl px-4 py-8"
      style={{ minHeight: "calc(100vh - 120px)" }}
    >
      <style>{PF_CSS}</style>

      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-emerald-600/5 blur-3xl" />
        <div className="absolute top-1/2 right-1/4 h-64 w-64 rounded-full bg-violet-600/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-600/5 blur-3xl" />
      </div>

      {/* Back link */}
      <Link
        href="/game"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToGame")}
      </Link>

      {/* ── Hero header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <div className="mb-1.5 flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/70">
            {t("badge")}
          </span>
        </div>
        <h1
          className="text-4xl font-black tracking-tight"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #34d399 0%, #6ee7b7 40%, #10b981 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {t("title")}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-[var(--text-muted)]">
          {t("subtitle")}
        </p>
      </motion.div>

      {/* ── Shield hero card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="shield-pulse relative mb-10 overflow-hidden rounded-2xl border border-emerald-500/25 p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(6,78,59,0.08) 100%)",
        }}
      >
        {/* Scan line effect */}
        <div className="scan-line" />

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #10b981 0px, #10b981 1px, transparent 1px, transparent 32px), repeating-linear-gradient(90deg, #10b981 0px, #10b981 1px, transparent 1px, transparent 32px)",
          }}
        />

        <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.35)",
              boxShadow: "0 0 30px rgba(16,185,129,0.2)",
            }}
          >
            <Shield className="h-8 w-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-black text-emerald-300">{t("certifiedTitle")}</h2>
            <p className="mt-1 text-sm text-emerald-400/70">
              {t("certifiedDesc")}
            </p>
          </div>
          <div className="sm:ml-auto">
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
              style={{
                background: "rgba(16,185,129,0.15)",
                border: "1px solid rgba(16,185,129,0.4)",
                color: "#34d399",
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {t("verifiedBadge")}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── How It Works — 3 steps ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="mb-4 flex items-center gap-2"
      >
        <Hash className="h-4 w-4 text-violet-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {t("howItWorks")}
        </span>
      </motion.div>

      <div className="mb-10 flex flex-col gap-3">
        <StepCard
          icon={Lock}
          number={1}
          title={t("step1Title")}
          description={t("step1Desc")}
          color="#818cf8"
          delay={0.2}
        />
        <StepCard
          icon={Eye}
          number={2}
          title={t("step2Title")}
          description={t("step2Desc")}
          color="#34d399"
          delay={0.28}
        />
        <StepCard
          icon={CheckCircle2}
          number={3}
          title={t("step3Title")}
          description={t("step3Desc")}
          color="#fbbf24"
          delay={0.36}
        />
      </div>

      {/* ── Verification tool ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="mb-10 overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md"
      >
        {/* Tool header */}
        <div className="border-b border-[var(--glass-border)] px-6 py-5">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-violet-400" />
            <span className="font-bold text-[var(--text-primary)]">{t("verifyTool")}</span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{t("verifyToolDesc")}</p>
        </div>

        <div className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Server seed input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {t("serverSeed")}
              </label>
              <input
                type="text"
                value={serverSeed}
                onChange={(e) => setServerSeed(e.target.value)}
                placeholder="e.g. a3f9c2d1..."
                className="w-full rounded-xl border border-[var(--glass-border)] bg-white/[0.04] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-violet-500/60 focus:bg-white/[0.06]"
              />
            </div>

            {/* Client seed input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {t("clientSeed")}
              </label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => setClientSeed(e.target.value)}
                placeholder="e.g. myCustomSeed"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-white/[0.04] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-emerald-500/60 focus:bg-white/[0.06]"
              />
            </div>

            {/* Nonce input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                {t("nonce")}
              </label>
              <input
                type="text"
                value={nonce}
                onChange={(e) => setNonce(e.target.value)}
                placeholder="e.g. 1"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-white/[0.04] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-colors focus:border-amber-500/60 focus:bg-white/[0.06]"
              />
            </div>
          </div>

          {/* Compute button */}
          <button
            onClick={computeHash}
            disabled={computing || !serverSeed.trim()}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, rgba(124,58,237,0.9), rgba(16,185,129,0.9))",
              boxShadow: "0 0 24px rgba(124,58,237,0.3)",
            }}
          >
            <Hash className="h-4 w-4" />
            {computing ? t("computing") : t("computeHash")}
          </button>

          {/* Hash result */}
          <AnimatePresence>
            {hashResult && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mt-5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-4"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-400">
                      {t("hashResult")}
                    </span>
                  </div>
                  <CopyButton text={hashResult} />
                </div>
                <div className="break-all rounded-lg border border-emerald-500/15 bg-black/20 px-3 py-2.5 font-mono text-xs text-emerald-300">
                  {hashResult}
                </div>
                <p className="mt-2 text-[10px] text-emerald-400/60">
                  {t("hashResultNote")}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── How It Works — Accordion FAQ ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.35 }}
        className="mb-3 flex items-center gap-2"
      >
        <Shield className="h-4 w-4 text-emerald-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {t("faqSection")}
        </span>
      </motion.div>

      <div className="flex flex-col gap-2">
        {faqItems.map((item, i) => (
          <AccordionItem
            key={i}
            question={item.q}
            answer={item.a}
            delay={0.6 + i * 0.05}
          />
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        className="mt-12 flex flex-col items-center gap-3 text-center"
      >
        <p className="text-sm text-[var(--text-muted)]">{t("bottomCtaDesc")}</p>
        <Link
          href="/game"
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-black transition-all hover:opacity-90 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #10b981, #34d399)",
            boxShadow: "0 0 24px rgba(16,185,129,0.35)",
          }}
        >
          <Shield className="h-4 w-4" />
          {t("backToGame")}
        </Link>
      </motion.div>
    </div>
  );
}
