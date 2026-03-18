"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <Card className="max-w-md text-center">
        <CardContent className="p-8">
          <div className="text-6xl">💥</div>
          <h2 className="mt-4 text-2xl font-bold text-red-400">Something went wrong</h2>
          <p className="mt-2 text-sm text-purple-300/70">
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p className="mt-1 font-mono text-xs text-purple-500/50">
              Error ID: {error.digest}
            </p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={reset} variant="gold">
              Try again
            </Button>
            <Button onClick={() => (window.location.href = "/")} variant="outline">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
