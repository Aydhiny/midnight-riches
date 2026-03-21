"use client";

import { useState, useEffect } from "react";
import { trackConversion } from "./conversion";

const AB_STORAGE_KEY = "mr_ab_variant";

export type HeroVariant = "A" | "B";

export const HERO_VARIANTS: Record<HeroVariant, { headline: string; subKey: string }> = {
  A: {
    headline: "heroHeadlineA",
    subKey: "heroSubA",
  },
  B: {
    headline: "heroHeadlineB",
    subKey: "heroSubB",
  },
};

function getOrAssignVariant(): HeroVariant {
  if (typeof window === "undefined") return "A";
  try {
    const stored = sessionStorage.getItem(AB_STORAGE_KEY);
    if (stored === "A" || stored === "B") return stored;

    const variant: HeroVariant = Math.random() < 0.5 ? "A" : "B";
    sessionStorage.setItem(AB_STORAGE_KEY, variant);
    trackConversion("page_load", { abVariant: variant });
    return variant;
  } catch {
    return "A";
  }
}

export function useHeroVariant() {
  // Always start with "A" so server and client initial render match,
  // then switch to the stored/assigned variant after hydration.
  const [variant, setVariant] = useState<HeroVariant>("A");

  useEffect(() => {
    setVariant(getOrAssignVariant());
  }, []);

  const config = HERO_VARIANTS[variant];
  return { variant, ...config };
}
