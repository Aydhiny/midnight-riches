"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";
import { signUpAction } from "@/server/actions/auth";

export default function SignUpPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signUpAction({ name, email, password });
    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/auth/signin");
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
                <label className="text-sm text-purple-300">{t("name")}</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-purple-300">{t("email")}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-purple-300">{t("password")}</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" variant="gold" className="w-full" disabled={isLoading}>
                {tCommon("signUp")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-purple-400">
              {t("hasAccount")}{" "}
              <Link href="/auth/signin" className="text-yellow-400 hover:underline">
                {tCommon("signIn")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </AnimatedGradientBorder>
    </main>
  );
}
