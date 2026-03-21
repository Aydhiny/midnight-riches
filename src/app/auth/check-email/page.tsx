"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Suspense } from "react";

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const t = useTranslations("checkEmail");

  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--auth-page-bg, var(--bg-primary))" }}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 right-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-amber-500/[0.08] blur-3xl" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div
          className="relative rounded-2xl p-10"
          style={{
            background: "var(--auth-card-bg)",
            backdropFilter: "blur(24px)",
            boxShadow: "var(--auth-card-shadow)",
          }}
        >
          {/* Top gradient line */}
          <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-violet-600 via-pink-500 to-amber-500" />

          {/* Logo */}
          <Image
            src="/images/midnight-riches-logo.png"
            alt="Midnight Riches"
            width={44}
            height={44}
            className="mx-auto mb-5 object-contain drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]"
          />

          {/* Email icon */}
          <div
            className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.15))",
              border: "1px solid rgba(124,58,237,0.3)",
              boxShadow: "0 0 40px rgba(124,58,237,0.2)",
            }}
          >
            <span className="text-4xl" role="img" aria-label="email">📧</span>
          </div>

          <h1 className="text-2xl font-black text-[var(--text-primary)]">
            {t("title")}
          </h1>

          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {t("subtitle")}
          </p>

          {email && (
            <p className="mt-1 font-semibold text-amber-400 break-all">
              {decodeURIComponent(email)}
            </p>
          )}

          {/* Next steps */}
          <div
            className="mt-6 rounded-xl p-4 text-left space-y-2.5"
            style={{ background: "var(--glass-bg)", border: "1px solid var(--glass-border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              {t("nextSteps")}
            </p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-black"
                  style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-[var(--text-secondary)]">{step}</span>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs text-[var(--text-muted)]">
            {t("didntReceive")}
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/auth/signin"
              className="inline-block w-full rounded-xl py-2.5 text-sm font-bold text-black transition-all hover:opacity-90 active:scale-95"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
            >
              {t("goToSignIn")}
            </Link>
            <Link
              href="/"
              className="inline-block w-full rounded-xl border border-[var(--glass-border)] py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
            >
              {t("backToHome")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-500/30 border-t-violet-500" />
        </main>
      }
    >
      <CheckEmailContent />
    </Suspense>
  );
}
