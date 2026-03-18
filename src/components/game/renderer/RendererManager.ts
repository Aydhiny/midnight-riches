import { Application } from "pixi.js";
import type { SpinResult, WinEvaluation, CascadeStep, GameType, GameSymbol } from "@/types";
import { ReelRenderer } from "./ReelRenderer";
import { WinRenderer } from "./WinRenderer";
import { CabinetRenderer } from "./CabinetRenderer";
import { preloadSymbolTextures } from "./SymbolRenderer";

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
  private container: HTMLElement | null = null;
  private reelRenderers: ReelRenderer[] = [];
  private winRenderer: WinRenderer | null = null;
  private cabinetRenderer: CabinetRenderer | null = null;
  private currentConfig: RendererConfig | null = null;
  private gameType: GameType = "classic";
  private initialized = false;
  private turboMode = false;

  /**
   * Initialize PixiJS into a container div.
   * PixiJS creates its own <canvas> and appends it to `container`.
   * This avoids the "destroyed WebGL context reuse" bug from React Strict Mode.
   */
  async init(container: HTMLElement, gameType: GameType): Promise<void> {
    if (this.initialized && this.app) {
      await this.changeGame(gameType);
      return;
    }

    this.container = container;
    this.gameType = gameType;

    const gameConfig = GAME_CONFIGS[gameType];
    const padding = 40;
    const reelGap = 4;
    const width = gameConfig.reels * (gameConfig.symbolSize + reelGap) + padding * 2;
    const height = gameConfig.rows * gameConfig.symbolSize + padding * 2 + 60;

    this.currentConfig = { width, height, ...gameConfig };

    const app = new Application();
    this.app = app;

    // Do NOT pass a canvas — PixiJS creates and owns its own canvas element.
    await app.init({
      width,
      height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(window.devicePixelRatio, 2),
      autoDensity: true,
    });

    // If destroy() ran while we were awaiting, bail out
    if (this.app !== app) return;

    // Append PixiJS-owned canvas into our container div
    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    app.canvas.style.borderRadius = "8px";
    container.appendChild(app.canvas);

    // Pre-load PNG symbol textures (module-level cache — no-op after first load)
    await preloadSymbolTextures();
    if (this.app !== app) return;

    this.cabinetRenderer = new CabinetRenderer(width, height);
    this.app.stage.addChild(this.cabinetRenderer.container);

    this.winRenderer = new WinRenderer();
    this.createReels();

    // Populate initial symbols so canvas is not blank on first load
    const symbols: GameSymbol[] = ["cherry", "lemon", "orange", "grape", "watermelon", "seven", "bar"];
    for (const reel of this.reelRenderers) {
      const initialSymbols = Array.from(
        { length: this.currentConfig!.rows },
        () => symbols[Math.floor(Math.random() * symbols.length)]
      );
      reel.setSymbols(initialSymbols);
    }

    this.app.stage.addChild(this.winRenderer.container);

    this.app.ticker.add((ticker) => {
      const delta = ticker.deltaTime;
      for (const reel of this.reelRenderers) reel.update(delta);
      this.winRenderer?.update(delta);
      this.cabinetRenderer?.update(delta);
    });

    this.initialized = true;
  }

  async changeGame(gameType: GameType): Promise<void> {
    if (!this.app || !this.initialized) return;

    // Helper: yield to the browser so the loading overlay can paint
    const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

    this.gameType = gameType;

    const gameConfig = GAME_CONFIGS[gameType];
    const padding = 40;
    const reelGap = 4;
    const width = gameConfig.reels * (gameConfig.symbolSize + reelGap) + padding * 2;
    const height = gameConfig.rows * gameConfig.symbolSize + padding * 2 + 60;

    this.currentConfig = { width, height, ...gameConfig };

    // ── Phase 1: teardown (yield first so overlay renders) ──────────────────
    await raf();
    for (const reel of this.reelRenderers) {
      try { reel.destroy(); } catch { /* ignore */ }
    }
    this.reelRenderers = [];
    try { this.winRenderer?.destroy(); } catch { /* ignore */ }
    this.winRenderer = null;
    try { this.cabinetRenderer?.destroy(); } catch { /* ignore */ }
    this.cabinetRenderer = null;
    this.app.stage.removeChildren();

    // ── Phase 2: resize (yield so teardown GPU work flushes) ─────────────────
    await raf();
    this.app.renderer.resize(width, height);

    // ── Phase 3: rebuild cabinet + win renderer ───────────────────────────────
    await raf();
    this.cabinetRenderer = new CabinetRenderer(width, height);
    this.app.stage.addChild(this.cabinetRenderer.container);
    this.winRenderer = new WinRenderer();

    // ── Phase 4: create reels (most expensive — yield before + after) ─────────
    await raf();
    this.createReels();

    // ── Phase 5: populate initial symbols ────────────────────────────────────
    await raf();
    const symbols: GameSymbol[] = ["cherry", "lemon", "orange", "grape", "watermelon", "seven", "bar"];
    for (const reel of this.reelRenderers) {
      const initialSymbols = Array.from(
        { length: this.currentConfig!.rows },
        () => symbols[Math.floor(Math.random() * symbols.length)]
      );
      reel.setSymbols(initialSymbols);
    }
    this.app.stage.addChild(this.winRenderer.container);

    // Final paint flush
    await raf();
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
    if (!this.app && !this.initialized) return; // guard double-destroy

    for (const reel of this.reelRenderers) {
      try { reel.destroy(); } catch { /* ignore partial-init */ }
    }
    this.reelRenderers = [];

    try { this.winRenderer?.destroy(); } catch { /* ignore */ }
    this.winRenderer = null;

    try { this.cabinetRenderer?.destroy(); } catch { /* ignore */ }
    this.cabinetRenderer = null;

    // Remove PixiJS canvas from our container before destroying the app.
    // This prevents the "destroyed WebGL context" bug — each new init()
    // call creates a fresh Application with a brand-new <canvas>.
    try {
      if (this.app?.canvas && this.container?.contains(this.app.canvas)) {
        this.container.removeChild(this.app.canvas);
      }
    } catch { /* ignore */ }

    try {
      // destroy(true) removes the canvas element from the DOM as well (belt-and-suspenders)
      this.app?.destroy(true, { children: true });
    } catch { /* swallow: _cancelResize / resize observer not registered */ }

    this.app = null;
    this.container = null;
    this.initialized = false;
  }
}
