"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInSchema } from "@/lib/validators";
import { ArrowLeft } from "lucide-react";

export default function SignInPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/game");
    }
  }, [status, router]);

  useEffect(() => {
    for (let i = 0; i < 10; i++) {
      document.cookie = `authjs.session-token.${i}=; path=/; max-age=0; SameSite=Lax`;
    }
  }, []);

  function validateFields(): boolean {
    const result = signInSchema.safeParse({ email, password });
    if (result.success) {
      setFieldErrors({});
      return true;
    }
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!errors[field]) errors[field] = issue.message;
    }
    setFieldErrors(errors);
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validateFields()) return;
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });
      if (result?.error || result?.ok === false) {
        setError("Invalid credentials");
      } else {
        router.push("/game");
        return;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setIsLoading(false);
  }

  if (status === "loading" || status === "authenticated") return null;

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
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--text-secondary)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
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
            <h1 className="text-2xl font-black text-[var(--text-primary)]">Welcome back</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{t("signInDescription")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                {t("email")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                required
                className="border-black/10 bg-black/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-violet-500/40 dark:border-white/10 dark:bg-white/[0.05] dark:focus:border-violet-500/50"
              />
              {fieldErrors.email && <p className="text-xs text-red-500">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  {t("password")}
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-amber-500 transition-colors hover:text-amber-400"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password)
                    setFieldErrors((prev) => ({ ...prev, password: "" }));
                }}
                required
                className="border-black/10 bg-black/[0.03] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-violet-500/40 dark:border-white/10 dark:bg-white/[0.05] dark:focus:border-violet-500/50"
              />
              {fieldErrors.password && (
                <p className="text-xs text-red-500">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-amber-500"
              />
              <label
                htmlFor="rememberMe"
                className="cursor-pointer select-none text-sm text-[var(--text-secondary)]"
              >
                Remember me
              </label>
            </div>

            <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in…" : tCommon("signIn")}
            </Button>
          </form>

          <div className="relative my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-black/[0.08] dark:bg-white/[0.08]" />
            <span className="text-xs text-[var(--text-muted)]">{t("orContinueWith")}</span>
            <div className="h-px flex-1 bg-black/[0.08] dark:bg-white/[0.08]" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-black/10 bg-black/[0.03] text-[var(--text-secondary)] hover:bg-black/[0.06] hover:text-[var(--text-primary)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              onClick={() => signIn("google", { callbackUrl: "/game" })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-black/10 bg-black/[0.03] text-[var(--text-secondary)] hover:bg-black/[0.06] hover:text-[var(--text-primary)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              onClick={() => signIn("github", { callbackUrl: "/game" })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub
            </Button>
            <Button
              variant="outline"
              className="flex items-center justify-center gap-2 border-black/10 bg-black/[0.03] text-[var(--text-secondary)] hover:bg-black/[0.06] hover:text-[var(--text-primary)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.08]"
              onClick={() => signIn("discord", { callbackUrl: "/game" })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#5865F2" aria-hidden>
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              Discord
            </Button>
          </div>

          <p className="mt-5 text-center text-sm text-[var(--text-muted)]">
            {t("noAccount")}{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-amber-500 transition-colors hover:text-amber-400"
            >
              {tCommon("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
