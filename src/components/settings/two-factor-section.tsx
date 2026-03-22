"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ShieldCheck, ShieldOff, Smartphone, Check, Copy, AlertTriangle } from "lucide-react";
import { begin2FASetupAction, confirm2FASetupAction, disable2FAAction, get2FAStatusAction } from "@/server/actions/two-factor";

type Phase = "idle" | "setup" | "confirm" | "disable";

export function TwoFactorSection() {
  const t = useTranslations("settings.twoFactor");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    get2FAStatusAction().then((r) => {
      if (r.success) setEnabled(r.enabled ?? false);
      setLoading(false);
    });
  }, []);

  function startSetup() {
    setError("");
    setCode("");
    startTransition(async () => {
      const r = await begin2FASetupAction();
      if (r.success && r.qrDataUrl && r.secret) {
        setQrDataUrl(r.qrDataUrl);
        setSecret(r.secret);
        setPhase("setup");
      } else {
        setError(r.error ?? t("error"));
      }
    });
  }

  function confirmSetup() {
    setError("");
    startTransition(async () => {
      const r = await confirm2FASetupAction(code);
      if (r.success) {
        setEnabled(true);
        setPhase("idle");
        setCode("");
        setQrDataUrl("");
        setSecret("");
      } else {
        setError(r.error ?? t("invalidCode"));
        setCode("");
      }
    });
  }

  function startDisable() {
    setError("");
    setCode("");
    setPhase("disable");
  }

  function confirmDisable() {
    setError("");
    startTransition(async () => {
      const r = await disable2FAAction(code);
      if (r.success) {
        setEnabled(false);
        setPhase("idle");
        setCode("");
      } else {
        setError(r.error ?? t("invalidCode"));
        setCode("");
      }
    });
  }

  function copySecret() {
    navigator.clipboard.writeText(secret).then(() => {
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className={`flex items-center justify-between rounded-2xl border p-5 ${
        enabled
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-[var(--glass-border)] bg-[var(--glass-bg)]"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
            enabled
              ? "border-emerald-500/30 bg-emerald-500/15"
              : "border-[var(--glass-border)] bg-[var(--glass-bg)]"
          }`}>
            {enabled
              ? <ShieldCheck className="h-5 w-5 text-emerald-400" />
              : <ShieldOff className="h-5 w-5 text-[var(--text-muted)]" />
            }
          </div>
          <div>
            <p className="font-semibold text-[var(--text-primary)]">
              {enabled ? t("enabled") : t("disabled")}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {enabled ? t("enabledDesc") : t("disabledDesc")}
            </p>
          </div>
        </div>

        {phase === "idle" && (
          <button
            onClick={enabled ? startDisable : startSetup}
            disabled={isPending}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
              enabled
                ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            {isPending ? "…" : enabled ? t("disable") : t("enable")}
          </button>
        )}
      </div>

      {/* Setup phase: scan QR */}
      {phase === "setup" && (
        <div className="space-y-4 rounded-2xl border border-violet-500/25 bg-violet-500/5 p-5">
          <div className="flex items-center gap-2 text-violet-300">
            <Smartphone className="h-5 w-5" />
            <h3 className="font-bold">{t("scanTitle")}</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)]">{t("scanDesc")}</p>

          {/* QR Code */}
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt="2FA QR Code"
              className="rounded-xl border border-[var(--glass-border)] bg-white p-2"
              width={200}
              height={200}
            />
          </div>

          {/* Manual entry secret */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">{t("manualEntry")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 font-mono text-xs tracking-widest text-violet-300 break-all">
                {secret}
              </code>
              <button
                onClick={copySecret}
                className="shrink-0 rounded-lg border border-[var(--glass-border)] p-2 text-[var(--text-muted)] hover:text-violet-400 transition-colors"
              >
                {secretCopied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            onClick={() => setPhase("confirm")}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-black text-white hover:bg-violet-500 transition-colors"
          >
            {t("scannedContinue")}
          </button>
          <button
            onClick={() => { setPhase("idle"); setQrDataUrl(""); setSecret(""); }}
            className="w-full rounded-xl border border-[var(--glass-border)] py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {t("cancel")}
          </button>
        </div>
      )}

      {/* Confirm phase: enter code */}
      {(phase === "confirm" || phase === "disable") && (
        <div className={`space-y-4 rounded-2xl border p-5 ${
          phase === "disable"
            ? "border-red-500/25 bg-red-500/5"
            : "border-violet-500/25 bg-violet-500/5"
        }`}>
          {phase === "disable" && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-400" />
              <p className="text-sm text-red-300">{t("disableWarning")}</p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
              {phase === "disable" ? t("enterCodeToDisable") : t("enterCodeToConfirm")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6)); setError(""); }}
              placeholder="000000"
              className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-center font-mono text-xl font-black tracking-[0.4em] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/30 outline-none focus:border-violet-500/50 transition-colors"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setPhase(phase === "disable" ? "idle" : "setup"); setCode(""); setError(""); }}
              className="flex-1 rounded-xl border border-[var(--glass-border)] py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              {t("back")}
            </button>
            <button
              onClick={phase === "disable" ? confirmDisable : confirmSetup}
              disabled={isPending || code.length !== 6}
              className={`flex-1 rounded-xl py-2 text-sm font-black text-white disabled:opacity-50 transition-colors ${
                phase === "disable" ? "bg-red-600 hover:bg-red-500" : "bg-violet-600 hover:bg-violet-500"
              }`}
            >
              {isPending ? "…" : phase === "disable" ? t("confirmDisable") : t("confirmEnable")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
