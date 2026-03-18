"use client";

import { createContext, useContext, useMemo } from "react";
import type { ISoundManager } from "@/types";
import { NoopSoundManager } from "./index";

const SoundContext = createContext<ISoundManager>(new NoopSoundManager());

export function SoundProvider({
  manager,
  children,
}: {
  manager?: ISoundManager;
  children: React.ReactNode;
}) {
  const soundManager = useMemo(() => manager ?? new NoopSoundManager(), [manager]);

  return (
    <SoundContext.Provider value={soundManager}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSoundManager(): ISoundManager {
  return useContext(SoundContext);
}
