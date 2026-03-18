"use client";

import { useCallback, useRef } from "react";

type SoundType = "spin" | "win" | "bigWin" | "bonusTrigger" | "click" | "reelStop";

interface UseSoundOptions {
  volume?: number;
  enabled?: boolean;
}

export function useSound(options: UseSoundOptions = {}) {
  const { volume = 0.5, enabled = true } = options;
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const play = useCallback(
    (_type: SoundType) => {
      if (!enabled) return;

      try {
        const ctx = getContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        gainNode.gain.value = volume * 0.1;
        oscillator.frequency.value = 440;
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.05);
      } catch {
        // silently fail
      }
    },
    [enabled, volume, getContext]
  );

  return { play };
}
