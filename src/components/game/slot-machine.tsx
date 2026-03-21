"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { useGameStore } from "@/store/game-store";
import { useWalletStore } from "@/store/wallet-store";
import { gameSpinAction } from "@/server/actions/game";
import { checkAchievementsAction, updateDailyChallengeProgressAction } from "@/server/actions/achievements";
import { showAchievementToast, showChallengeCompleteToast } from "./achievement-toast";
import { GameCanvas, type GameCanvasHandle } from "./game-canvas";
import { GameSelector } from "./game-selector";
import { CabinetFrame } from "./cabinet-frame";
import { ControlPanel } from "./control-panel";
import { WinModal } from "./win-modal";
import { BonusModal } from "./bonus-modal";
import { GambleModal } from "./gamble-modal";

// ── Audio helpers ─────────────────────────────────────────────────────────────

function createAudio(src: string, volume = 0.5): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const audio = new Audio(src);
  audio.volume = volume;
  return audio;
}

function isSfxEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem("mr_sfx_enabled") !== "false";
}

let spinAudio:     HTMLAudioElement | null = null;
let jackpotAudio:  HTMLAudioElement | null = null;
let megaWinAudio:  HTMLAudioElement | null = null;
let superWinAudio: HTMLAudioElement | null = null;

function getSpinAudio() {
  if (!spinAudio) {
    spinAudio = createAudio("/sounds/slot-spin-2.mp3", 0.4);
    if (spinAudio) spinAudio.loop = true;
  }
  return spinAudio;
}
function getJackpotAudio() {
  if (!jackpotAudio) jackpotAudio = createAudio("/sounds/jackpot.mp3", 0.55);
  return jackpotAudio;
}
function getMegaWinAudio() {
  if (!megaWinAudio) megaWinAudio = createAudio("/sounds/mega-win.mp3", 0.55);
  return megaWinAudio;
}
function getSuperWinAudio() {
  if (!superWinAudio) superWinAudio = createAudio("/sounds/super-win.mp3", 0.5);
  return superWinAudio;
}

function playSound(audio: HTMLAudioElement | null) {
  if (!audio || !isSfxEnabled()) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}
function stopSound(audio: HTMLAudioElement | null) {
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
}

/** Stop every win sound so only one plays at a time. */
function stopAllWinSounds() {
  stopSound(jackpotAudio);
  stopSound(megaWinAudio);
  stopSound(superWinAudio);
}

/**
 * Play exactly one win sound based on win size.
 * Stops any currently playing win sound first.
 */
function playWinSound(totalWin: number) {
  if (!isSfxEnabled()) return;
  stopAllWinSounds();

  if (totalWin >= 200) {
    const j = getJackpotAudio();
    playSound(j);
    setTimeout(() => stopSound(j), 5000);
  } else if (totalWin >= 50) {
    const m = getMegaWinAudio();
    playSound(m);
    setTimeout(() => stopSound(m), 4000);
  } else if (totalWin >= 15) {
    const s = getSuperWinAudio();
    playSound(s);
    setTimeout(() => stopSound(s), 3000);
  }
}

// ── SlotMachine component ─────────────────────────────────────────────────────

export function SlotMachine() {
  const canvasRef        = useRef<GameCanvasHandle>(null);
  const autoSpinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    gameType,
    betPerLine,
    totalBet,
    spinState,
    bonus,
    autoSpin,
    turboMode,
    setSpinState,
    setLastResult,
    setLastWin,
    setBonus,
    setAutoSpin,
  } = useGameStore();

  const { balance, optimisticDeduct, syncFromServer } = useWalletStore();

  const [showWinModal,    setShowWinModal]    = useState(false);
  const [showBonusModal,  setShowBonusModal]  = useState(false);
  const [showGambleModal, setShowGambleModal] = useState(false);
  const [lastWinAmount,   setLastWinAmount]   = useState(0);

  useEffect(() => {
    canvasRef.current?.setTurboMode(turboMode);
  }, [turboMode]);

  // Stop all win sounds when a new spin starts so nothing bleeds into the next round
  const clearWinSounds = useCallback(() => {
    stopAllWinSounds();
  }, []);

  const executeSpin = useCallback(async () => {
    if (spinState !== "idle") return;
    if (!bonus.isActive && balance < totalBet) return;

    // Silence any lingering win sounds from previous spin
    clearWinSounds();

    setSpinState("pending");

    if (!bonus.isActive) {
      optimisticDeduct(totalBet);
    }

    const response = await gameSpinAction({
      gameType,
      betAmount: totalBet,
      betPerLine,
      bonus,
    });

    if (!response.success) {
      setSpinState("idle");
      syncFromServer(balance);
      return;
    }

    setSpinState("animating");
    setLastResult(response.result);
    setBonus(response.bonus);
    syncFromServer(response.balance);

    playSound(getSpinAudio());

    await canvasRef.current?.playSpinAnimation(response.result);

    stopSound(getSpinAudio());

    if (response.result.totalWin > 0 && response.result.wins) {
      canvasRef.current?.setWinAmount(response.result.totalWin);
      canvasRef.current?.flashWinGlow();
      await canvasRef.current?.playWinAnimation(response.result.wins);
    }

    if (response.result.cascades && response.result.cascades.length > 0) {
      await canvasRef.current?.playCascadeSequence(response.result.cascades);
    }

    setLastWin(response.result.wins ?? null);
    setLastWinAmount(response.result.totalWin);

    if (response.result.totalWin > 0) {
      playWinSound(response.result.totalWin);
    }

    // Modals only show when NOT in auto-spin — don't interrupt the run
    const isAutoSpinning = autoSpin !== null;

    if (response.result.totalWin >= totalBet * 10 && !isAutoSpinning) {
      setShowWinModal(true);
    }

    // Gamble: only outside bonus free spins and outside auto-spin
    if (response.result.totalWin > 0 && !bonus.isActive && !isAutoSpinning) {
      setShowGambleModal(true);
    }

    // Bonus modal only outside auto-spin (auto-spin continues through free spins seamlessly)
    if (response.result.bonusTriggered && !bonus.isActive && !isAutoSpinning) {
      setShowBonusModal(true);
    }

    setSpinState("result");

    Promise.all([
      checkAchievementsAction({
        totalWin:       response.result.totalWin,
        betAmount:      totalBet,
        bonusTriggered: response.result.bonusTriggered,
        jackpotWin:     response.jackpotWin,
        gameType,
      }),
      updateDailyChallengeProgressAction({
        won:            response.result.totalWin > 0,
        bonusTriggered: response.result.bonusTriggered,
        creditsWon:     response.result.totalWin,
        gameType,
      }),
    ]).then(([achievementResult, challengeResult]) => {
      for (const achievement of achievementResult.newAchievements) {
        showAchievementToast(achievement);
      }
      if (challengeResult.completedChallenges.length > 0) {
        showChallengeCompleteToast("Daily Challenge", 50);
      }
    }).catch(() => {});

    setTimeout(() => {
      setSpinState("idle");
    }, 500);
  }, [
    spinState,
    bonus,
    autoSpin,
    balance,
    totalBet,
    gameType,
    betPerLine,
    clearWinSounds,
    optimisticDeduct,
    syncFromServer,
    setSpinState,
    setLastResult,
    setLastWin,
    setBonus,
  ]);

  // ── Spacebar hotkey ───────────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      e.preventDefault();
      executeSpin();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [executeSpin]);

  // ── Auto-spin driver ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!autoSpin || spinState !== "idle") return;

    if (autoSpin.remainingSpins <= 0) {
      setAutoSpin(null);
      return;
    }

    if (autoSpin.stopOnBalanceBelow > 0 && balance < autoSpin.stopOnBalanceBelow) {
      setAutoSpin(null);
      return;
    }

    if (autoSpin.stopOnWinAbove > 0 && lastWinAmount >= autoSpin.stopOnWinAbove) {
      setAutoSpin(null);
      return;
    }

    // Note: stopOnBonus is intentionally NOT checked here — spins continue
    // through free-spin bonus rounds without interruption.

    autoSpinTimerRef.current = setTimeout(() => {
      setAutoSpin({
        ...autoSpin,
        remainingSpins: autoSpin.remainingSpins - 1,
      });
      executeSpin();
    }, 500);

    return () => {
      if (autoSpinTimerRef.current) clearTimeout(autoSpinTimerRef.current);
    };
  }, [autoSpin, spinState, balance, lastWinAmount, executeSpin, setAutoSpin]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-2xl mx-auto">
      <GameSelector />
      <CabinetFrame>
        <GameCanvas ref={canvasRef} gameType={gameType} />
      </CabinetFrame>
      <ControlPanel onSpin={executeSpin} disabled={spinState !== "idle"} />
      <WinModal
        amount={lastWinAmount}
        betAmount={totalBet}
        isVisible={showWinModal}
        onClose={() => setShowWinModal(false)}
      />
      <BonusModal
        bonus={bonus}
        isVisible={showBonusModal}
        onStart={() => setShowBonusModal(false)}
      />
      <GambleModal
        winAmount={lastWinAmount}
        isVisible={showGambleModal && !showWinModal && !showBonusModal}
        onClose={() => setShowGambleModal(false)}
      />
    </div>
  );
}
