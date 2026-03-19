"use client";

import { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateResetTokenAction,
  resetPasswordAction,
} from "@/server/actions/password-reset";

function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";
  const email        = searchParams.get("email") ?? "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [validating,setValidating]= useState(true);
  const [tokenValid,setTokenValid]= useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  useEffect(() => {
    if (!token || !email) {
      setValidating(false);
      setTokenValid(false);
      return;
    }
    validateResetTokenAction(token, email).then(({ valid }) => {
      setTokenValid(valid);
      setValidating(false);
    });
  }, [token, email]);

  const requirements = [
    { label: "At least 8 characters",            met: password.length >= 8 },
    { label: "One uppercase letter",             met: /[A-Z]/.test(password) },
    { label: "One lowercase letter",             met: /[a-z]/.test(password) },
    { label: "One number",                       met: /[0-9]/.test(password) },
    { label: "Passwords match",                  met: password === confirm && confirm.length > 0 },
  ];
  const allMet = requirements.every((r) => r.met);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allMet) return;
    setError("");
    setLoading(true);
    try {
      const res = await resetPasswordAction(token, email, password);
      if (res.success) {
        setDone(true);
        setTimeout(() => router.push("/auth/signin"), 3000);
      } else {
        setError(res.error ?? "Something went wrong.");
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
        <div className="absolute -top-40 right-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-amber-500/8 blur-3xl" />
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
              Reset Password
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Create a new password for your account.
            </p>
          </div>

          {/* Loading state */}
          {validating && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500/30 border-t-amber-500" />
              <p className="text-sm text-[var(--text-muted)]">Validating reset link…</p>
            </div>
          )}

          {/* Invalid token */}
          {!validating && !tokenValid && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
                <XCircle className="h-7 w-7 text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Link expired or invalid</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  This reset link is no longer valid. Request a new one.
                </p>
              </div>
              <Link href="/auth/forgot-password">
                <Button variant="gold" className="w-full">
                  Request New Link
                </Button>
              </Link>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)]">Password updated!</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Redirecting you to sign in…
                </p>
              </div>
            </div>
          )}

          {/* Reset form */}
          {!validating && tokenValid && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="New password"
                    className="pr-10 border-black/10 bg-black/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-violet-500/40 dark:border-white/10 dark:bg-white/[0.05] dark:focus:border-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  Confirm Password
                </label>
                <Input
                  type={showPw ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  className="border-black/10 bg-black/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-violet-500/40 dark:border-white/10 dark:bg-white/[0.05] dark:focus:border-violet-500/50"
                />
              </div>

              {/* Requirements */}
              {password.length > 0 && (
                <ul className="space-y-1">
                  {requirements.map((req) => (
                    <li
                      key={req.label}
                      className={`flex items-center gap-1.5 text-xs transition-colors ${
                        req.met ? "text-emerald-500" : "text-[var(--text-muted)]"
                      }`}
                    >
                      <span className="text-[10px]">{req.met ? "✓" : "○"}</span>
                      {req.label}
                    </li>
                  ))}
                </ul>
              )}

              <Button
                type="submit"
                variant="gold"
                className="w-full"
                disabled={loading || !allMet}
              >
                {loading ? "Updating…" : "Update Password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
