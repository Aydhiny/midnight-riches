"use client";

import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { verifyEmailAction } from "@/server/actions/email-verification";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token  = searchParams.get("token") ?? "";
  const email  = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!token || !email) {
      setStatus("error");
      setError("Invalid verification link.");
      return;
    }
    verifyEmailAction(token, email).then((res) => {
      if (res.success) setStatus("success");
      else { setStatus("error"); setError(res.error ?? "Verification failed."); }
    });
  }, [token, email]);

  return (
    <main
      className="relative flex min-h-screen items-center justify-center px-4 py-12"
      style={{ background: "var(--auth-page-bg, var(--bg-primary))" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div
          className="rounded-2xl p-10 text-center"
          style={{
            background: "var(--auth-card-bg)",
            backdropFilter: "blur(24px)",
            boxShadow: "var(--auth-card-shadow)",
          }}
        >
          <Image
            src="/images/midnight-riches-logo.png"
            alt="Midnight Riches"
            width={52}
            height={52}
            className="mx-auto mb-5 object-contain drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
          />

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-violet-400" />
              <p className="text-sm text-[var(--text-muted)]">Verifying your email…</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-black text-[var(--text-primary)]">Email verified!</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Your account is confirmed. Head to the lobby and spin your way to the jackpot.
              </p>
              <div className="pt-2">
                <Link
                  href="/game"
                  className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-black text-black transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                    boxShadow: "0 0 24px rgba(245,158,11,0.45)",
                  }}
                >
                  🎰 Start Playing
                </Link>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-black text-[var(--text-primary)]">Verification failed</h1>
              <p className="text-sm text-red-400">{error}</p>
              <p className="text-sm text-[var(--text-muted)]">
                The link may have expired. Sign in and request a new one.
              </p>
              <Link
                href="/auth/signin"
                className="inline-block rounded-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-6 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}
