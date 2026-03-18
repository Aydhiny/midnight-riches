"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Game error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16">
      <Card className="max-w-md text-center">
        <CardContent className="p-8">
          <div className="text-5xl">🎰</div>
          <h2 className="mt-4 text-xl font-bold text-red-400">Game Error</h2>
          <p className="mt-2 text-sm text-purple-300/70">
            The slot machine encountered an issue. Your balance is safe.
          </p>
          <Button onClick={reset} variant="gold" className="mt-6">
            Restart Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
