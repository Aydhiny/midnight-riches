import { Application } from "pixi.js";
import type { SpinResult, WinEvaluation, CascadeStep, GameType } from "@/types";
import { ReelRenderer } from "./ReelRenderer";
import { WinRenderer } from "./WinRenderer";
import { CabinetRenderer } from "./CabinetRenderer";

interface RendererConfig {
  width: number;
  height: number;
  symbolSize: number;
  reels: number;
  rows: number;
}

const GAME_CONFIGS: Record<GameType, Omit<RendererConfig, "width" | "height">> = {
  classic: { symbolSize: 100, reels: 3, rows: 3 },
  "five-reel": { symbolSize: 80, reels: 5, rows: 3 },
  cascade: { symbolSize: 64, reels: 5, rows: 5 },
  megaways: { symbolSize: 48, reels: 6, rows: 7 },
};

export class RendererManager {
  private app: Application | null = null;
  private reelRenderers: ReelRenderer[] = [];
  private winRenderer: WinRenderer | null = null;
  private cabinetRenderer: CabinetRenderer | null = null;
  private currentConfig: RendererConfig | null = null;
  private gameType: GameType = "classic";
  private initialized = false;
  private turboMode = false;

  async init(canvas: HTMLCanvasElement, gameType: GameType): Promise<void> {
    if (this.initialized && this.gameType === gameType) return;

    this.destroy();
    this.gameType = gameType;

    const gameConfig = GAME_CONFIGS[gameType];
    const padding = 40;
    const reelGap = 4;
    const width = gameConfig.reels * (gameConfig.symbolSize + reelGap) + padding * 2;
    const height = gameConfig.rows * gameConfig.symbolSize + padding * 2 + 60;

    this.currentConfig = {
      width,
      height,
      ...gameConfig,
    };

    this.app = new Application();
    await this.app.init({
      canvas,
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    this.cabinetRenderer = new CabinetRenderer(width, height);
    this.app.stage.addChild(this.cabinetRenderer.container);

    this.winRenderer = new WinRenderer();
    this.createReels();

    this.app.stage.addChild(this.winRenderer.container);

    this.app.ticker.add((ticker) => {
      const delta = ticker.deltaTime;
      for (const reel of this.reelRenderers) {
        reel.update(delta);
      }
      this.winRenderer?.update(delta);
      this.cabinetRenderer?.update(delta);
    });

    this.initialized = true;
  }

  private createReels(): void {
    if (!this.currentConfig || !this.app) return;
    const { reels, rows, symbolSize } = this.currentConfig;
    const reelGap = 4;
    const totalWidth = reels * (symbolSize + reelGap);
    const startX = (this.currentConfig.width - totalWidth) / 2;
    const startY = 40;

    for (let i = 0; i < reels; i++) {
      const reel = new ReelRenderer({
        reelIndex: i,
        rows,
        symbolSize,
        x: startX + i * (symbolSize + reelGap),
        y: startY,
      });
      this.reelRenderers.push(reel);
      this.app.stage.addChild(reel.container);
    }
  }

  setTurboMode(turbo: boolean): void {
    this.turboMode = turbo;
  }

  async playSpinAnimation(result: SpinResult): Promise<void> {
    if (!this.reelRenderers.length) return;
    this.winRenderer?.clear();

    const promises = this.reelRenderers.map((reel) =>
      reel.startSpin(this.turboMode)
    );

    const reelStopDelay = this.turboMode ? 0 : 200;

    for (let i = 0; i < this.reelRenderers.length; i++) {
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          const symbols = result.reels[i] ?? [];
          this.reelRenderers[i].stopSpin(symbols, this.turboMode);
          resolve();
        }, i * reelStopDelay);
      });
    }

    await Promise.all(promises);
  }

  async playWinAnimation(wins: WinEvaluation): Promise<void> {
    if (!this.winRenderer || !this.currentConfig) return;
    const { symbolSize, reels } = this.currentConfig;
    const reelGap = 4;
    const totalWidth = reels * (symbolSize + reelGap);
    const offsetX = (this.currentConfig.width - totalWidth) / 2;
    const offsetY = 40;

    const betAmount = 1;
    const bigWinThreshold = betAmount * 10;

    if (wins.totalWin >= bigWinThreshold) {
      await this.winRenderer.playBigWin(
        wins.totalWin,
        this.currentConfig.width,
        this.currentConfig.height
      );
    } else {
      await this.winRenderer.playWinAnimation(wins, symbolSize, offsetX, offsetY);
    }
  }

  async playCascadeSequence(cascades: CascadeStep[]): Promise<void> {
    if (!this.winRenderer || !this.currentConfig) return;
    const { symbolSize, reels } = this.currentConfig;
    const reelGap = 4;
    const totalWidth = reels * (symbolSize + reelGap);
    const offsetX = (this.currentConfig.width - totalWidth) / 2;
    const offsetY = 40;

    for (const step of cascades) {
      for (let i = 0; i < this.reelRenderers.length; i++) {
        if (step.grid[i]) {
          this.reelRenderers[i].setSymbols(step.grid[i]);
        }
      }

      if (step.removedPositions.length > 0) {
        this.winRenderer.playCascadeExplosion(
          step.removedPositions,
          symbolSize,
          offsetX,
          offsetY
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  setWinAmount(amount: number): void {
    this.cabinetRenderer?.setWinAmount(amount);
  }

  getCanvasSize(): { width: number; height: number } {
    const config = this.currentConfig ?? { width: 400, height: 400 };
    return { width: config.width, height: config.height };
  }

  destroy(): void {
    for (const reel of this.reelRenderers) {
      reel.destroy();
    }
    this.reelRenderers = [];
    this.winRenderer?.destroy();
    this.winRenderer = null;
    this.cabinetRenderer?.destroy();
    this.cabinetRenderer = null;
    this.app?.destroy();
    this.app = null;
    this.initialized = false;
  }
}
