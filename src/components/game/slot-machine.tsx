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

// ─── Sound helpers ────────────────────────────────────────────────────────────
function createAudio(src: string, volume = 0.5): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  const audio = new Audio(src);
  audio.volume = volume;
  return audio;
}

/** Returns true when SFX is not explicitly disabled in localStorage */
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

/**
 * Play the correct win stinger based on totalWin amount and auto-stop it.
 *  > 100  → mega-win.mp3 (stops after 4 s)
 *  > 25   → super-win.mp3 (stops after 3 s)
 *  any win→ (no extra sound; jackpot.mp3 only triggers via WinModal path)
 */
function playWinSound(totalWin: number, totalBet: number) {
  if (!isSfxEnabled()) return;

  if (totalWin > 100) {
    // Mega win — also play jackpot stab for the biggest tier
    const mega = getMegaWinAudio();
    const jackpot = getJackpotAudio();
    playSound(mega);
    playSound(jackpot);
    setTimeout(() => stopSound(mega),    4000);
    setTimeout(() => stopSound(jackpot), 4000);
  } else if (totalWin > 25) {
    const sup = getSuperWinAudio();
    playSound(sup);
    setTimeout(() => stopSound(sup), 3000);
  }
  // Small wins produce no extra stinger (spin sound already finished)
}
// ─────────────────────────────────────────────────────────────────────────────

export function SlotMachine() {
  const canvasRef          = useRef<GameCanvasHandle>(null);
  const autoSpinTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const [showWinModal,   setShowWinModal]   = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [lastWinAmount,  setLastWinAmount]  = useState(0);

  useEffect(() => {
    canvasRef.current?.setTurboMode(turboMode);
  }, [turboMode]);

  const executeSpin = useCallback(async () => {
    if (spinState !== "idle") return;
    if (!bonus.isActive && balance < totalBet) return;

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

    // Play spin sound (looping) immediately before animation starts
    playSound(getSpinAudio());

    await canvasRef.current?.playSpinAnimation(response.result);

    // Stop spin sound as soon as animation ends
    stopSound(getSpinAudio());

    if (response.result.totalWin > 0 && response.result.wins) {
      canvasRef.current?.setWinAmount(response.result.totalWin);
      await canvasRef.current?.playWinAnimation(response.result.wins);
    }

    if (response.result.cascades && response.result.cascades.length > 0) {
      await canvasRef.current?.playCascadeSequence(response.result.cascades);
    }

    setLastWin(response.result.wins ?? null);
    setLastWinAmount(response.result.totalWin);

    // ── Win sounds (tiered) ───────────────────────────────────────────────
    if (response.result.totalWin > 0) {
      playWinSound(response.result.totalWin, totalBet);
    }

    // Show big-win modal for wins >= 10× bet (unchanged threshold)
    if (response.result.totalWin >= totalBet * 10) {
      setShowWinModal(true);
    }

    if (response.result.bonusTriggered && !bonus.isActive) {
      setShowBonusModal(true);
    }

    setSpinState("result");

    // Non-blocking achievement + challenge checks
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
    }).catch(() => {}); // Silent fail — non-critical path

    setTimeout(() => {
      setSpinState("idle");
    }, 500);
  }, [
    spinState,
    bonus,
    balance,
    totalBet,
    gameType,
    betPerLine,
    optimisticDeduct,
    syncFromServer,
    setSpinState,
    setLastResult,
    setLastWin,
    setBonus,
  ]);

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

    if (autoSpin.stopOnBonus && bonus.isActive) {
      setAutoSpin(null);
      return;
    }

    autoSpinTimerRef.current = setTimeout(() => {
      setAutoSpin({
        ...autoSpin,
        remainingSpins: autoSpin.remainingSpins - 1,
      });
      executeSpin();
    }, 500);

    return () => {
      if (autoSpinTimerRef.current) {
        clearTimeout(autoSpinTimerRef.current);
      }
    };
  }, [autoSpin, spinState, balance, lastWinAmount, bonus.isActive, executeSpin, setAutoSpin]);

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-lg mx-auto">
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
    </div>
  );
}
