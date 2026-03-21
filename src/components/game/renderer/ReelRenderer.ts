import { Container, Graphics, FillGradient, BlurFilter } from "pixi.js";
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
  private phase: "idle" | "accelerating" | "constant" | "anticipating" | "decelerating" | "snapping" = "idle";
  private elapsedTime = 0;
  private resolveStop: (() => void) | null = null;

  // Spring physics for bounce landing
  private snapVelocity = 0;

  // PixiJS blur filter applied to the scrolling strip
  private blurFilter: BlurFilter;

  // Anticipation overlay (red tint that appears on last reel)
  private anticipationOverlay: Graphics;
  private anticipationPhase = 0;

  constructor(config: ReelConfig) {
    this.config = config;
    this.container = new Container();
    this.container.x = config.x;
    this.container.y = config.y;

    const w = config.symbolSize;
    const totalH = config.rows * config.symbolSize;

    // ── 1. Chrome gradient reel background ─────────────────────────────────
    const chromeGrad = new FillGradient(0, 0, 0, totalH);
    chromeGrad.addColorStop(0,    0xccd9ec);
    chromeGrad.addColorStop(0.12, 0xa8c0dc);
    chromeGrad.addColorStop(0.30, 0x7498c0);
    chromeGrad.addColorStop(0.50, 0x4e7aa8);
    chromeGrad.addColorStop(0.70, 0x7498c0);
    chromeGrad.addColorStop(0.88, 0xa8c0dc);
    chromeGrad.addColorStop(1,    0xccd9ec);

    const chromeBg = new Graphics();
    chromeBg.rect(0, 0, w, totalH);
    chromeBg.fill(chromeGrad);
    this.container.addChild(chromeBg);

    // ── 2. Bright vertical highlight streak ─────────────────────────────────
    const highlight = new Graphics();
    highlight.rect(w * 0.07, 0, w * 0.07, totalH);
    highlight.fill({ color: 0xffffff, alpha: 0.28 });
    this.container.addChild(highlight);

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

    // Motion blur filter — strength driven by velocity in update()
    this.blurFilter = new BlurFilter({ strengthX: 0, strengthY: 8, quality: 4 });
    this.blurFilter.strength = 0;
    this.strip.filters = [this.blurFilter];

    this.container.addChild(this.strip);

    // ── 5. Row separator lines ──────────────────────────────────────────────
    for (let r = 1; r < config.rows; r++) {
      const sep = new Graphics();
      sep.rect(0, r * config.symbolSize - 1, w, 2);
      sep.fill({ color: 0x001030, alpha: 0.55 });
      this.container.addChild(sep);

      const sepLight = new Graphics();
      sepLight.rect(0, r * config.symbolSize + 1, w, 1);
      sepLight.fill({ color: 0xffffff, alpha: 0.12 });
      this.container.addChild(sepLight);
    }

    // ── 6. Edge vignettes (concave cylinder illusion) ───────────────────────
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

    // ── 7. Top & bottom vignettes ───────────────────────────────────────────
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

    // ── 8. Sheen lines ──────────────────────────────────────────────────────
    const sheenTop = new Graphics();
    sheenTop.rect(0, 0, w, 3);
    sheenTop.fill({ color: 0xffffff, alpha: 0.55 });
    this.container.addChild(sheenTop);

    const sheenTop2 = new Graphics();
    sheenTop2.rect(0, 3, w, 2);
    sheenTop2.fill({ color: 0xffffff, alpha: 0.18 });
    this.container.addChild(sheenTop2);

    const sheenBot = new Graphics();
    sheenBot.rect(0, totalH - 3, w, 3);
    sheenBot.fill({ color: 0xffffff, alpha: 0.28 });
    this.container.addChild(sheenBot);

    // ── 9. Outer border ─────────────────────────────────────────────────────
    const border = new Graphics();
    border.rect(0, 0, w, totalH);
    border.stroke({ color: 0x000010, alpha: 0.7, width: 1.5 });
    this.container.addChild(border);

    // ── 10. Anticipation overlay (hidden by default) ────────────────────────
    // A pulsing amber/red glow shown on the last reel when anticipation kicks in
    this.anticipationOverlay = new Graphics();
    this.anticipationOverlay.rect(0, 0, w, totalH);
    this.anticipationOverlay.fill({ color: 0xff6600, alpha: 0 });
    this.anticipationOverlay.alpha = 0;
    this.container.addChild(this.anticipationOverlay);
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
      this.snapVelocity = 0;
      this.anticipationOverlay.alpha = 0;
    });
  }

  stopSpin(finalSymbols: GameSymbol[], turbo: boolean, anticipation = false): void {
    if (turbo) {
      this.blurFilter.strength = 0;
      this.anticipationOverlay.alpha = 0;
      this.setSymbols(finalSymbols);
      this.strip.y = 0;
      this.spinning = false;
      this.phase = "idle";
      this.resolveStop?.();
      this.resolveStop = null;
      return;
    }

    // Anticipation: very slow deceleration to build tension
    this.phase = anticipation ? "anticipating" : "decelerating";
    this.elapsedTime = 0;

    // After deceleration period, place final symbols and enter spring-snap
    const decelerationDelay = anticipation ? 700 : 320;

    setTimeout(() => {
      this.setSymbols(finalSymbols);
      // Start slightly above final position for bounce effect
      this.strip.y = -(this.config.symbolSize * 0.18);
      this.snapVelocity = 0;
      this.phase = "snapping";
      this.anticipationOverlay.alpha = 0;
      this.elapsedTime = 0;
    }, decelerationDelay);
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
        // Blur ramps up with velocity (max ~7.5 at full speed)
        this.blurFilter.strength = this.velocity * 0.25;
        break;

      case "constant":
        this.strip.y += this.velocity;
        if (this.strip.y > this.config.symbolSize) {
          this.strip.y -= this.config.symbolSize;
        }
        this.blurFilter.strength = this.velocity * 0.25;
        break;

      case "anticipating":
        // Very slow deceleration — tension-building effect
        this.velocity = Math.max(5, this.velocity - delta * 0.12);
        this.strip.y += this.velocity;
        if (this.strip.y > this.config.symbolSize) {
          this.strip.y -= this.config.symbolSize;
        }
        this.blurFilter.strength = this.velocity * 0.15;
        // Pulse the amber anticipation overlay
        this.anticipationPhase += delta * 0.07;
        this.anticipationOverlay.alpha = 0.04 + Math.abs(Math.sin(this.anticipationPhase * Math.PI)) * 0.08;
        break;

      case "decelerating":
        this.velocity = Math.max(2, this.velocity - delta * 0.5);
        this.strip.y += this.velocity;
        if (this.strip.y > this.config.symbolSize) {
          this.strip.y -= this.config.symbolSize;
        }
        this.blurFilter.strength = this.velocity * 0.2;
        break;

      case "snapping": {
        // Spring physics: F = k*(target - pos), damped
        const springK  = 0.22;
        const damping  = 0.68;
        this.snapVelocity += (this.targetY - this.strip.y) * springK;
        this.snapVelocity *= damping;
        this.strip.y += this.snapVelocity;

        // Fade blur to zero quickly during snap
        if (this.blurFilter.strength > 0) {
          this.blurFilter.strength = Math.max(0, this.blurFilter.strength - delta * 0.8);
        }

        // Settle when displacement and velocity are tiny
        if (Math.abs(this.strip.y - this.targetY) < 0.25 && Math.abs(this.snapVelocity) < 0.15) {
          this.strip.y = this.targetY;
          this.blurFilter.strength = 0;
          this.spinning = false;
          this.phase = "idle";
          this.velocity = 0;
          this.snapVelocity = 0;
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
