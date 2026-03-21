"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/server/actions/password-reset";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [devToken, setDevToken]         = useState<string | null>(null);
  const [devEmailError, setDevEmailError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await requestPasswordResetAction(email.trim());
      if (!res.success) {
        setError(res.error ?? "Something went wrong.");
      } else {
        setSent(true);
        if (res.devToken) setDevToken(res.devToken);
        if (res.devEmailError) setDevEmailError(res.devEmailError);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--auth-page-bg, var(--bg-primary))" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-amber-500/[0.08] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          href="/auth/signin"
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all border-violet-300/60 bg-white/80 text-violet-700 hover:bg-violet-50 hover:text-violet-800 dark:border-white/10 dark:bg-white/[0.04] dark:text-[var(--text-secondary)] dark:hover:bg-white/[0.08] dark:hover:text-[var(--text-primary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToSignIn")}
        </Link>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "var(--auth-card-bg)",
            backdropFilter: "blur(24px)",
            boxShadow: "var(--auth-card-shadow)",
          }}
        >
          <div className="mb-7 text-center">
            <Image
              src="/images/midnight-riches-logo.png"
              alt="Midnight Riches"
              width={56}
              height={56}
              className="mx-auto mb-3 object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
            />
            <h1 className="text-2xl font-black text-[var(--text-primary)]">
              {t("forgotPasswordTitle")}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t("forgotPasswordDesc")}
            </p>
          </div>

          {sent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{t("checkInbox")}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {t("resetLinkSentPrefix")}{" "}
                  <span className="text-amber-400">{email}</span>{" "}
                  {t("resetLinkSentSuffix")}
                </p>
              </div>

              {/* DEV ONLY: show direct link */}
              {devToken && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-3 text-left">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
                    Dev Mode — Direct Reset Link
                  </p>
                  <Link
                    href={`/auth/reset-password?token=${devToken}&email=${encodeURIComponent(email)}`}
                    className="break-all text-xs text-amber-400 underline underline-offset-2 hover:text-amber-300"
                  >
                    /auth/reset-password?token={devToken.slice(0, 16)}…
                  </Link>
                </div>
              )}

              {/* DEV ONLY: show EmailJS error if email sending failed */}
              {devEmailError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-left">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400/70">
                    Dev Mode — Email Send Failed
                  </p>
                  <p className="break-all text-xs text-red-400">{devEmailError}</p>
                  <p className="mt-1.5 text-[10px] text-red-400/60">
                    Check: EMAILJS env vars, &quot;Allow non-browser applications&quot; setting in EmailJS dashboard.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSent(false); setDevToken(null); setDevEmailError(null); }}
              >
                {t("sendAnotherLink")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  {t("emailAddress")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="pl-9 border-black/10 bg-black/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-violet-500/40 dark:border-white/10 dark:bg-white/[0.05] dark:focus:border-violet-500/50"
                  />
                </div>
              </div>

              <Button type="submit" variant="gold" className="w-full" disabled={loading}>
                {loading ? t("sending") : t("sendResetLink")}
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
            {t("rememberedPassword")}{" "}
            <Link
              href="/auth/signin"
              className="font-semibold text-amber-500 transition-colors hover:text-amber-400"
            >
              {t("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
