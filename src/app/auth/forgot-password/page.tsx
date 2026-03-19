"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestPasswordResetAction } from "@/server/actions/password-reset";

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState("");
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  // dev only — shows the token so you can test without real email
  const [devToken, setDevToken] = useState<string | null>(null);

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
        <div className="absolute -bottom-40 right-1/3 h-96 w-96 rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <Link
          href="/auth/signin"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
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
              Forgot Password
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Enter your email and we&apos;ll send a reset link.
            </p>
          </div>

          {sent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Check your inbox</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  If <span className="text-amber-400">{email}</span> has an account, a reset link
                  is on its way. Check your spam folder too.
                </p>
              </div>

              {/* DEV ONLY: show direct link */}
              {devToken && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/8 p-3 text-left">
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

              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSent(false); setDevToken(null); }}
              >
                Send another link
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
                  Email address
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
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
            Remembered it?{" "}
            <Link
              href="/auth/signin"
              className="font-semibold text-amber-500 transition-colors hover:text-amber-400"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
