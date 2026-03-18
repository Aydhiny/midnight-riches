"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { setUserLocale, type Locale } from "@/i18n/locale";

const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "bs", label: "BS" },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleChange(newLocale: Locale) {
    startTransition(async () => {
      await setUserLocale(newLocale);
    });
  }

  return (
    <div className="flex items-center gap-1">
      {LOCALES.map((l) => (
        <Button
          key={l.value}
          variant={locale === l.value ? "default" : "ghost"}
          size="sm"
          onClick={() => handleChange(l.value)}
          disabled={isPending}
          className="text-xs"
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
