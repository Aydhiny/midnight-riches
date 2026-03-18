"use client";

import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback } from "react";
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

export const GameCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(
  function GameCanvas({ gameType }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const managerRef = useRef<RendererManager | null>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const manager = new RendererManager();
      managerRef.current = manager;

      manager.init(canvas, gameType).catch(console.error);

      return () => {
        manager.destroy();
        managerRef.current = null;
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
      <canvas
        ref={canvasRef}
        className="mx-auto block rounded-lg"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    );
  }
);
