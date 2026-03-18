"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { signUpAction } from "@/server/actions/auth";
import { signUpSchema } from "@/lib/validators";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  function validateFields(): boolean {
    const result = signUpSchema.safeParse({ name, email, password });
    if (result.success) {
      setFieldErrors({});
      return true;
    }

    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
    setFieldErrors(errors);
    return false;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!validateFields()) return;

    setIsLoading(true);

    const result = await signUpAction({ name, email, password });
    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    } else {
      await signIn("credentials", { email, password, redirect: false });
      router.push("/game");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <AnimatedGradientBorder>
        <Card className="w-[400px] border-0 bg-transparent">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("signUpTitle")}</CardTitle>
            <CardDescription>{t("signUpDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm text-purple-700 dark:text-purple-300">{t("name")}</label>
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  required
                />
                {fieldErrors.name && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-purple-700 dark:text-purple-300">{t("email")}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  required
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm text-purple-700 dark:text-purple-300">{t("password")}</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  required
                />
                {fieldErrors.password && (
                  <p className="text-xs text-red-600 dark:text-red-400">{fieldErrors.password}</p>
                )}
                <p className="text-xs text-[var(--text-muted)]">
                  Min 8 characters, 1 uppercase, 1 lowercase, 1 number
                </p>
              </div>
              <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                {tCommon("signUp")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-purple-700 dark:text-purple-400">
              {t("hasAccount")}{" "}
              <Link href="/auth/signin" className="text-yellow-600 dark:text-yellow-400 hover:underline">
                {tCommon("signIn")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </AnimatedGradientBorder>
    </main>
  );
}
