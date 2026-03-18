"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("common");
  // Prevent hydration mismatch: next-themes doesn't know the theme during SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Render a placeholder with same dimensions so layout doesn't shift
    return <Button variant="ghost" size="sm" className="text-xs opacity-0" aria-hidden>--</Button>;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="text-xs"
    >
      {resolvedTheme === "dark" ? t("light") : t("dark")}
    </Button>
  );
}
