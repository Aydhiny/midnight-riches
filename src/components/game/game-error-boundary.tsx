"use client";

import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string | null;
}

/**
 * Error boundary that wraps the PixiJS SlotMachine component.
 *
 * PixiJS can throw synchronous errors during rendering (e.g. WebGL context
 * loss, destroyed-object access) that would otherwise crash the entire page.
 * This boundary catches those errors, shows a friendly recovery UI, and lets
 * the user reload the game canvas without a full page refresh.
 */
export class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // Log for observability — swap for your logger/Sentry call if needed
    console.error("[GameErrorBoundary] PixiJS crash caught:", error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-red-500/20 bg-red-900/10 p-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              Game Engine Error
            </h2>
            <p className="max-w-xs text-sm text-[var(--text-muted)]">
              The slot machine ran into a problem. Your balance and progress are
              safe — click below to reload the game.
            </p>
            {process.env.NODE_ENV === "development" && this.state.errorMessage && (
              <p className="mt-2 rounded bg-red-900/30 px-3 py-1.5 font-mono text-xs text-red-300">
                {this.state.errorMessage}
              </p>
            )}
          </div>

          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Game
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
