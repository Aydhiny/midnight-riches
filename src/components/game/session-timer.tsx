"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

const REALITY_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function SessionTimer() {
  const [sessionStart] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [showRealityCheck, setShowRealityCheck] = useState(false);
  const [lastCheckAt, setLastCheckAt] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const totalElapsed = now - sessionStart;
      setElapsed(totalElapsed);

      // Trigger reality check every 30 minutes
      if (totalElapsed - lastCheckAt >= REALITY_CHECK_INTERVAL_MS) {
        setShowRealityCheck(true);
        setLastCheckAt(totalElapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStart, lastCheckAt]);

  const dismiss = useCallback(() => {
    setShowRealityCheck(false);
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds}s`;
  };

  return (
    <>
      {/* Session timer display */}
      <div className="text-xs text-purple-400">
        Session: {formatTime(elapsed)}
      </div>

      {/* Reality check modal */}
      {showRealityCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="mx-4 max-w-sm rounded-xl border border-purple-500/30 bg-purple-950 p-6 text-center shadow-2xl">
            <h3 className="text-xl font-bold text-yellow-400">
              Reality Check
            </h3>
            <p className="mt-3 text-purple-200">
              You have been playing for{" "}
              <span className="font-bold text-yellow-400">
                {formatTime(elapsed)}
              </span>
              .
            </p>
            <p className="mt-2 text-sm text-purple-300">
              Remember to play responsibly. Consider taking a break.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button variant="outline" onClick={dismiss}>
                Continue Playing
              </Button>
              <Button
                variant="ghost"
                className="text-purple-400"
                onClick={() => (window.location.href = "/settings")}
              >
                Set Limits
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
