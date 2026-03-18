"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback, useState } from "react";
import { RendererManager } from "./renderer";
import type { GameType, SpinResult, WinEvaluation, CascadeStep } from "@/types";

export interface GameCanvasHandle {
  playSpinAnimation: (result: SpinResult) => Promise<void>;
  playWinAnimation: (wins: WinEvaluation) => Promise<void>;
  playCascadeSequence: (cascades: CascadeStep[]) => Promise<void>;
  setTurboMode: (turbo: boolean) => void;
  setWinAmount: (amount: number) => void;
}

interface GameCanvasProps {
  gameType: GameType;
}

function getDimensions(gameType: GameType): { width: number; height: number } {
  switch (gameType) {
    case "classic":   return { width: 392, height: 380 };
    case "five-reel": return { width: 472, height: 340 };
    case "cascade":   return { width: 396, height: 420 };
    case "megaways":  return { width: 420, height: 436 };
  }
}

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ gameType }, ref) {
    // Container div — PixiJS appends its own <canvas> here.
    // We never reuse the same <canvas> element across inits, which avoids
    // the "WebGL context already destroyed" bug in React Strict Mode.
    const containerRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<RendererManager | null>(null);
    const initDoneRef = useRef(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dimensions, setDimensions] = useState(() => getDimensions(gameType));

    // ── Effect 1: one-time PixiJS init ──────────────────────────────────────
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      let cancelled = false;
      const manager = new RendererManager();
      managerRef.current = manager;

      manager.init(container, gameType)
        .then(() => {
          if (!cancelled) {
            initDoneRef.current = true;
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("[GameCanvas] init error:", err);
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
        initDoneRef.current = false;
        manager.destroy();
        if (managerRef.current === manager) managerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Effect 2: swap game type without recreating WebGL context ───────────
    useEffect(() => {
      if (!initDoneRef.current) return;

      setIsLoading(true);

      let cancelled = false;
      const manager = managerRef.current;
      if (!manager) return;

      manager.changeGame(gameType)
        .then(() => {
          if (!cancelled) {
            setDimensions(getDimensions(gameType));
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("[GameCanvas] changeGame error:", err);
            setIsLoading(false);
          }
        });

      return () => { cancelled = true; };
    }, [gameType]);

    const playSpinAnimation  = useCallback(async (r: SpinResult)     => { await managerRef.current?.playSpinAnimation(r); },  []);
    const playWinAnimation   = useCallback(async (w: WinEvaluation)  => { await managerRef.current?.playWinAnimation(w); },   []);
    const playCascadeSequence = useCallback(async (c: CascadeStep[]) => { await managerRef.current?.playCascadeSequence(c); }, []);
    const setTurboMode       = useCallback((t: boolean)              => { managerRef.current?.setTurboMode(t); },              []);
    const setWinAmount       = useCallback((a: number)               => { managerRef.current?.setWinAmount(a); },              []);

    useImperativeHandle(ref, () => ({
      playSpinAnimation, playWinAnimation, playCascadeSequence, setTurboMode, setWinAmount,
    }), [playSpinAnimation, playWinAnimation, playCascadeSequence, setTurboMode, setWinAmount]);

    return (
      <div
        className="relative mx-auto"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* PixiJS appends its canvas here — no shared <canvas> element */}
        <div
          ref={containerRef}
          className="h-full w-full rounded-lg overflow-hidden"
        />
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-black/70 backdrop-blur-sm gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
            <span className="text-xs text-white/40 tracking-widest uppercase animate-pulse">Loading…</span>
          </div>
        )}
      </div>
    );
  }
);
