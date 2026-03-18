import { Container, Graphics } from "pixi.js";
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

    this.mask = new Graphics();
    this.mask.rect(0, 0, config.symbolSize, config.rows * config.symbolSize);
    this.mask.fill(0xffffff);
    this.container.addChild(this.mask);

    this.strip = new Container();
    this.strip.mask = this.mask;
    this.container.addChild(this.strip);
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
