import { Container, Graphics, FillGradient } from "pixi.js";
import type { GameSymbol } from "@/types";
import { createSymbolGraphic } from "./SymbolRenderer";

interface ReelConfig {
  reelIndex: number;
  rows: number;
  symbolSize: number;
  x: number;
  y: number;
}

export class ReelRenderer {
  readonly container: Container;
  private strip: Container;
  private mask: Graphics;
  private config: ReelConfig;
  private currentSymbols: GameSymbol[] = [];
  private spinning = false;
  private velocity = 0;
  private targetY = 0;
  private phase: "idle" | "accelerating" | "constant" | "decelerating" | "snapping" = "idle";
  private elapsedTime = 0;
  private resolveStop: (() => void) | null = null;

  constructor(config: ReelConfig) {
    this.config = config;
    this.container = new Container();
    this.container.x = config.x;
    this.container.y = config.y;

    const w = config.symbolSize;
    const totalH = config.rows * config.symbolSize;

    // ── 1. Chrome gradient reel background ─────────────────────────────────
    // Mimics the metallic silver/chrome drum of a real slot machine
    const chromeGrad = new FillGradient(0, 0, 0, totalH);
    chromeGrad.addColorStop(0,    0xccd9ec);  // bright silver-blue top
    chromeGrad.addColorStop(0.12, 0xa8c0dc);
    chromeGrad.addColorStop(0.30, 0x7498c0);
    chromeGrad.addColorStop(0.50, 0x4e7aa8);  // darker at center (concave drum illusion)
    chromeGrad.addColorStop(0.70, 0x7498c0);
    chromeGrad.addColorStop(0.88, 0xa8c0dc);
    chromeGrad.addColorStop(1,    0xccd9ec);  // bright silver-blue bottom

    const chromeBg = new Graphics();
    chromeBg.rect(0, 0, w, totalH);
    chromeBg.fill(chromeGrad);
    this.container.addChild(chromeBg);

    // ── 2. Bright vertical highlight streak (left-of-center glint) ─────────
    const highlightGrad = new FillGradient(0, 0, w * 0.35, 0);
    highlightGrad.addColorStop(0,    0xffffff);
    highlightGrad.addColorStop(0.4,  0xffffff);
    highlightGrad.addColorStop(1,    0xccd9ec);

    const highlight = new Graphics();
    highlight.rect(w * 0.07, 0, w * 0.07, totalH);
    highlight.fill({ color: 0xffffff, alpha: 0.28 });
    this.container.addChild(highlight);

    // Thinner secondary glint
    const highlight2 = new Graphics();
    highlight2.rect(w * 0.18, 0, w * 0.025, totalH);
    highlight2.fill({ color: 0xffffff, alpha: 0.12 });
    this.container.addChild(highlight2);

    // ── 3. Mask for symbol strip ────────────────────────────────────────────
    this.mask = new Graphics();
    this.mask.rect(0, 0, w, totalH);
    this.mask.fill(0xffffff);
    this.container.addChild(this.mask);

    // ── 4. Symbol strip (masked — scrolls during spin) ──────────────────────
    this.strip = new Container();
    this.strip.mask = this.mask;
    this.container.addChild(this.strip);

    // ── 5. Row separator lines (on top of strip, don't scroll) ─────────────
    for (let r = 1; r < config.rows; r++) {
      const sep = new Graphics();
      sep.rect(0, r * config.symbolSize - 1, w, 2);
      sep.fill({ color: 0x001030, alpha: 0.55 });
      this.container.addChild(sep);

      // subtle lighter line on top of separator for emboss look
      const sepLight = new Graphics();
      sepLight.rect(0, r * config.symbolSize + 1, w, 1);
      sepLight.fill({ color: 0xffffff, alpha: 0.12 });
      this.container.addChild(sepLight);
    }

    // ── 6. Left edge vignette — stacked rects to simulate gradient alpha ────
    //    (creates the concave cylinder / drum depth illusion)
    const edgeSteps = 6;
    const edgeMaxW = w * 0.24;
    for (let s = 0; s < edgeSteps; s++) {
      const ew = edgeMaxW * (1 - s / edgeSteps);
      const ea = 0.62 * (1 - s / edgeSteps);

      const le = new Graphics();
      le.rect(0, 0, ew, totalH);
      le.fill({ color: 0x000820, alpha: ea });
      this.container.addChild(le);

      const re = new Graphics();
      re.rect(w - ew, 0, ew, totalH);
      re.fill({ color: 0x000820, alpha: ea });
      this.container.addChild(re);
    }

    // ── 7. Top & bottom vignettes (depth / drum curvature) ─────────────────
    const vigH = config.symbolSize * 0.32;
    const vigSteps = 5;
    for (let s = 0; s < vigSteps; s++) {
      const vh = vigH * (1 - s / vigSteps);
      const va = 0.7 * (1 - s / vigSteps);

      const tv = new Graphics();
      tv.rect(0, 0, w, vh);
      tv.fill({ color: 0x000820, alpha: va });
      this.container.addChild(tv);

      const bv = new Graphics();
      bv.rect(0, totalH - vh, w, vh);
      bv.fill({ color: 0x000820, alpha: va });
      this.container.addChild(bv);
    }

    // ── 8. Top chrome sheen line (bright reflection at very top) ────────────
    const sheenTop = new Graphics();
    sheenTop.rect(0, 0, w, 3);
    sheenTop.fill({ color: 0xffffff, alpha: 0.55 });
    this.container.addChild(sheenTop);

    const sheenTop2 = new Graphics();
    sheenTop2.rect(0, 3, w, 2);
    sheenTop2.fill({ color: 0xffffff, alpha: 0.18 });
    this.container.addChild(sheenTop2);

    // ── 9. Bottom sheen ─────────────────────────────────────────────────────
    const sheenBot = new Graphics();
    sheenBot.rect(0, totalH - 3, w, 3);
    sheenBot.fill({ color: 0xffffff, alpha: 0.28 });
    this.container.addChild(sheenBot);

    // ── 10. Outer border — thin dark line around the reel column ────────────
    const border = new Graphics();
    border.rect(0, 0, w, totalH);
    border.stroke({ color: 0x000010, alpha: 0.7, width: 1.5 });
    this.container.addChild(border);
  }

  setSymbols(symbols: GameSymbol[]): void {
    this.currentSymbols = symbols;
    this.strip.removeChildren();
    this.strip.y = 0;

    for (let i = 0; i < symbols.length; i++) {
      const symbolContainer = createSymbolGraphic(symbols[i], this.config.symbolSize);
      symbolContainer.y = i * this.config.symbolSize;
      this.strip.addChild(symbolContainer);
    }
  }

  startSpin(turbo: boolean): Promise<void> {
    return new Promise((resolve) => {
      this.resolveStop = resolve;
      this.spinning = true;
      this.phase = turbo ? "constant" : "accelerating";
      this.velocity = turbo ? 30 : 0;
      this.elapsedTime = 0;
    });
  }

  stopSpin(finalSymbols: GameSymbol[], turbo: boolean): void {
    if (turbo) {
      this.setSymbols(finalSymbols);
      this.strip.y = 0;
      this.spinning = false;
      this.phase = "idle";
      this.resolveStop?.();
      this.resolveStop = null;
      return;
    }

    this.phase = "decelerating";
    this.elapsedTime = 0;

    setTimeout(() => {
      this.setSymbols(finalSymbols);
      this.strip.y = -10;
      this.phase = "snapping";
      this.elapsedTime = 0;
    }, 300);
  }

  update(delta: number): void {
    if (!this.spinning) return;

    this.elapsedTime += delta;

    switch (this.phase) {
      case "accelerating":
        this.velocity = Math.min(30, this.velocity + delta * 0.8);
        this.strip.y += this.velocity;
        if (this.strip.y > this.config.symbolSize) {
          this.strip.y -= this.config.symbolSize;
        }
        break;
      case "constant":
        this.strip.y += this.velocity;
        if (this.strip.y > this.config.symbolSize) {
          this.strip.y -= this.config.symbolSize;
        }
        break;
      case "decelerating":
        this.velocity = Math.max(2, this.velocity - delta * 0.5);
        this.strip.y += this.velocity;
        if (this.strip.y > this.config.symbolSize) {
          this.strip.y -= this.config.symbolSize;
        }
        break;
      case "snapping": {
        const snapSpeed = 0.15;
        this.strip.y += (this.targetY - this.strip.y) * snapSpeed;
        if (Math.abs(this.strip.y - this.targetY) < 0.5) {
          this.strip.y = this.targetY;
          this.spinning = false;
          this.phase = "idle";
          this.velocity = 0;
          this.resolveStop?.();
          this.resolveStop = null;
        }
        break;
      }
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
