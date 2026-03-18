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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const managerRef = useRef<RendererManager | null>(null);
    // Tracks whether init() has fully resolved at least once
    const initDoneRef = useRef(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dimensions, setDimensions] = useState(() => getDimensions(gameType));

    // ── Effect 1: create the RendererManager and run the one-time app.init() ──
    // Empty deps — runs exactly once on mount and cleans up on unmount.
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      let cancelled = false;
      const manager = new RendererManager();
      managerRef.current = manager;

      manager.init(canvas, gameType)
        .then(() => {
          if (!cancelled) {
            initDoneRef.current = true;
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("GameCanvas init error:", err);
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
        initDoneRef.current = false;
        manager.destroy();
        managerRef.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Effect 2: swap renderers in-place when gameType changes ──
    // Skips the very first render (init handles that) by guarding on initDoneRef.
    useEffect(() => {
      if (!initDoneRef.current) return;

      setIsLoading(true);
      setDimensions(getDimensions(gameType));

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
            console.error("GameCanvas changeGame error:", err);
            setIsLoading(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [gameType]);

    const playSpinAnimation = useCallback(async (result: SpinResult) => {
      await managerRef.current?.playSpinAnimation(result);
    }, []);

    const playWinAnimation = useCallback(async (wins: WinEvaluation) => {
      await managerRef.current?.playWinAnimation(wins);
    }, []);

    const playCascadeSequence = useCallback(async (cascades: CascadeStep[]) => {
      await managerRef.current?.playCascadeSequence(cascades);
    }, []);

    const setTurboMode = useCallback((turbo: boolean) => {
      managerRef.current?.setTurboMode(turbo);
    }, []);

    const setWinAmount = useCallback((amount: number) => {
      managerRef.current?.setWinAmount(amount);
    }, []);

    useImperativeHandle(ref, () => ({
      playSpinAnimation,
      playWinAnimation,
      playCascadeSequence,
      setTurboMode,
      setWinAmount,
    }), [playSpinAnimation, playWinAnimation, playCascadeSequence, setTurboMode, setWinAmount]);

    return (
      <div
        className="relative mx-auto"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <canvas
          ref={canvasRef}
          className="block rounded-lg"
          style={{ width: "100%", height: "100%" }}
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500/30 border-t-yellow-400" />
          </div>
        )}
      </div>
    );
  }
);
