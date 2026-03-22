"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { verifyLogin2FAAction } from "@/server/actions/two-factor";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

function Verify2FAForm() {
  const t = useTranslations("auth.twoFactor");
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId") ?? "";
  const callbackUrl = searchParams.get("cb") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) router.replace("/auth/signin");
    inputRef.current?.focus();
  }, [userId, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.replace(/\s/g, "").length !== 6) return;
    setError("");
    setIsLoading(true);

    try {
      // Verify the code server-side first
      const verification = await verifyLogin2FAAction(userId, code);
      if (!verification.success) {
        setError(verification.error ?? t("invalidCode"));
        setIsLoading(false);
        setCode("");
        inputRef.current?.focus();
        return;
      }

      // Code is valid — complete the sign-in with a 2FA bypass token
      // We use a dedicated credentials provider that trusts a pre-verified userId
      const result = await signIn("2fa-bypass", {
        userId,
        redirect: false,
      });

      if (result?.ok) {
        router.replace(callbackUrl || "/game");
      } else {
        setError(t("sessionError"));
      }
    } catch {
      setError(t("error"));
    }
    setIsLoading(false);
  }

  function handleCodeChange(val: string) {
    // Allow only digits and spaces, max 6 digits
    const clean = val.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(clean);
    setError("");
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--auth-page-bg, var(--bg-primary))" }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Back link */}
        <Link
          href="/auth/signin"
          className="mb-6 flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToSignIn")}
        </Link>

        <div
          className="rounded-2xl border border-[var(--glass-border)] p-8 shadow-2xl"
          style={{ background: "var(--bg-card)" }}
        >
          {/* Icon + title */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10">
              <ShieldCheck className="h-7 w-7 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)]">{t("title")}</h1>
            <p className="mt-1.5 text-sm text-[var(--text-muted)]">{t("description")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {t("codeLabel")}
              </label>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                className="w-full rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.4em] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/30 outline-none focus:border-violet-500/50 transition-colors"
                maxLength={6}
              />
            </div>

            {error && (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full rounded-xl bg-violet-600 py-3 text-sm font-black text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
            >
              {isLoading ? t("verifying") : t("verify")}
            </button>
          </form>

          <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
            {t("hint")}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense>
      <Verify2FAForm />
    </Suspense>
  );
}
