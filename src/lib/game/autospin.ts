import type { AutoSpinConfig } from "@/types";

const MIN_SPIN_INTERVAL = 500;

export interface AutoSpinCallbacks {
  executeSpin: () => Promise<{ win: number; bonusTriggered: boolean }>;
  getBalance: () => number;
  getConfig: () => AutoSpinConfig | null;
  setConfig: (config: AutoSpinConfig | null) => void;
}

export class AutoSpinManager {
  private running = false;
  private paused = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private callbacks: AutoSpinCallbacks;

  constructor(callbacks: AutoSpinCallbacks) {
    this.callbacks = callbacks;
  }

  start(config: AutoSpinConfig): void {
    this.callbacks.setConfig(config);
    this.running = true;
    this.paused = false;
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.callbacks.setConfig(null);
  }

  pause(): void {
    this.paused = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  resume(): void {
    if (!this.running) return;
    this.paused = false;
    this.scheduleNext();
  }

  get isRunning(): boolean {
    return this.running;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  private scheduleNext(): void {
    if (!this.running || this.paused) return;

    this.timer = setTimeout(async () => {
      const config = this.callbacks.getConfig();
      if (!config || config.remainingSpins <= 0) {
        this.stop();
        return;
      }

      const balance = this.callbacks.getBalance();
      if (config.stopOnBalanceBelow > 0 && balance < config.stopOnBalanceBelow) {
        this.stop();
        return;
      }

      try {
        const result = await this.callbacks.executeSpin();

        const updated: AutoSpinConfig = {
          ...config,
          remainingSpins: config.remainingSpins - 1,
        };
        this.callbacks.setConfig(updated);

        if (updated.remainingSpins <= 0) {
          this.stop();
          return;
        }

        if (config.stopOnWin && result.win > 0) {
          this.stop();
          return;
        }

        if (config.stopOnWinAbove > 0 && result.win >= config.stopOnWinAbove) {
          this.stop();
          return;
        }

        if (config.stopOnBonus && result.bonusTriggered) {
          this.stop();
          return;
        }

        this.scheduleNext();
      } catch {
        this.stop();
      }
    }, MIN_SPIN_INTERVAL);
  }

  destroy(): void {
    this.stop();
  }
}
