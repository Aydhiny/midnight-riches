import { Container, Graphics, Text } from "pixi.js";
import type { WinEvaluation, WinLine } from "@/types";

export class WinRenderer {
  readonly container: Container;
  private lineGraphics: Graphics;
  private pulseContainers: Container[] = [];
  private animationFrame = 0;
  private active = false;

  constructor() {
    this.container = new Container();
    this.lineGraphics = new Graphics();
    this.container.addChild(this.lineGraphics);
  }

  async playWinAnimation(
    wins: WinEvaluation,
    symbolSize: number,
    offsetX: number,
    offsetY: number
  ): Promise<void> {
    this.clear();
    this.active = true;

    for (const line of wins.lines) {
      this.drawPayline(line, symbolSize, offsetX, offsetY);
    }

    if (wins.totalWin > 0) {
      this.showWinAmount(wins.totalWin, offsetX, offsetY, symbolSize);
    }

    await this.animatePulse(800);
    this.active = false;
  }

  async playBigWin(amount: number, canvasWidth: number, canvasHeight: number): Promise<void> {
    this.clear();
    this.active = true;

    const flash = new Graphics();
    flash.circle(canvasWidth / 2, canvasHeight / 2, Math.max(canvasWidth, canvasHeight));
    flash.fill({ color: 0xffd700, alpha: 0.12 });
    this.container.addChild(flash);

    const particles = new Container();
    this.container.addChild(particles);

    const colors = [0xffd700, 0xfbbf24, 0xf59e0b, 0xffffff, 0xfde68a];
    for (let i = 0; i < 70; i++) {
      const p = new Graphics();
      const r = 2 + Math.random() * 5;
      p.circle(0, 0, r);
      p.fill(colors[Math.floor(Math.random() * colors.length)]);
      p.x = canvasWidth / 2 + (Math.random() - 0.5) * canvasWidth * 1.1;
      p.y = canvasHeight / 2 + (Math.random() - 0.5) * canvasHeight * 1.1;
      p.alpha = 0.9;
      particles.addChild(p);
    }

    const label = this.createWinLabel(amount, canvasWidth, canvasHeight);
    this.container.addChild(label);

    await this.animatePulse(2200);
    particles.destroy({ children: true });
    try { flash.destroy(); } catch { /* ok */ }
    label.destroy();
    this.active = false;
  }

  playCascadeExplosion(
    positions: [number, number][],
    symbolSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    for (const [col, row] of positions) {
      const x = offsetX + col * symbolSize + symbolSize / 2;
      const y = offsetY + row * symbolSize + symbolSize / 2;

      for (let i = 0; i < 8; i++) {
        const particle = new Graphics();
        particle.circle(0, 0, 3);
        particle.fill(0xfbbf24);
        particle.x = x;
        particle.y = y;
        particle.alpha = 1;
        this.container.addChild(particle);

        const angle = (i / 8) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        let frame = 0;
        const animate = () => {
          frame++;
          particle.x += vx;
          particle.y += vy + frame * 0.1;
          particle.alpha -= 0.03;
          if (particle.alpha > 0 && frame < 30) {
            requestAnimationFrame(animate);
          } else {
            particle.destroy();
          }
        };
        requestAnimationFrame(animate);
      }
    }
  }

  private drawPayline(
    line: WinLine,
    symbolSize: number,
    offsetX: number,
    offsetY: number
  ): void {
    const pad = symbolSize * 0.05;

    for (const [col, row] of line.positions) {
      const cx = offsetX + col * symbolSize;
      const cy = offsetY + row * symbolSize;

      const halo = new Graphics();
      halo.roundRect(cx + pad, cy + pad, symbolSize - pad * 2, symbolSize - pad * 2, symbolSize * 0.1);
      halo.fill({ color: 0xffd700, alpha: 0.18 });
      halo.stroke({ color: 0xffd700, alpha: 0.85, width: 2.5 });
      this.container.addChild(halo);

      const shimmer = new Graphics();
      shimmer.roundRect(cx + pad + 3, cy + pad + 3, symbolSize - pad * 2 - 6, (symbolSize - pad * 2) * 0.4, symbolSize * 0.07);
      shimmer.fill({ color: 0xffffff, alpha: 0.15 });
      this.container.addChild(shimmer);
    }

    const g = new Graphics();
    g.setStrokeStyle({ width: 5, color: 0x000000, alpha: 0.4 });
    const points = line.positions.map(([col, row]) => ({
      x: offsetX + col * symbolSize + symbolSize / 2,
      y: offsetY + row * symbolSize + symbolSize / 2,
    }));
    if (points.length > 0) {
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.stroke();
    }
    g.setStrokeStyle({ width: 3, color: 0xffd700 });
    if (points.length > 0) {
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.stroke();
    }
    this.container.addChild(g);
  }

  private showWinAmount(
    amount: number,
    offsetX: number,
    _offsetY: number,
    symbolSize: number
  ): void {
    const text = new Text({
      text: `+$${amount.toFixed(2)}`,
      style: {
        fontFamily: "Arial Black",
        fontSize: symbolSize * 0.4,
        fill: 0xfbbf24,
        fontWeight: "bold",
        dropShadow: {
          color: 0x000000,
          blur: 4,
          distance: 2,
        },
      },
    });
    text.anchor.set(0.5);
    text.x = offsetX + symbolSize * 2.5;
    text.y = symbolSize * 0.3;
    this.container.addChild(text);
  }

  private createWinLabel(amount: number, width: number, height: number): Container {
    const container = new Container();
    const bg = new Graphics();
    bg.roundRect(-150, -40, 300, 80, 16);
    bg.fill({ color: 0x000000, alpha: 0.7 });
    bg.x = width / 2;
    bg.y = height / 2;
    container.addChild(bg);

    const tier = amount >= 100 ? "MEGA WIN!" : amount >= 50 ? "SUPER WIN!" : "BIG WIN!";
    const text = new Text({
      text: `${tier}\n$${amount.toFixed(2)}`,
      style: {
        fontFamily: "Arial Black",
        fontSize: 28,
        fill: 0xfbbf24,
        fontWeight: "bold",
        align: "center",
      },
    });
    text.anchor.set(0.5);
    text.x = width / 2;
    text.y = height / 2;
    container.addChild(text);

    return container;
  }

  private animatePulse(durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.lineGraphics.clear();
        resolve();
      }, durationMs);
    });
  }

  update(_delta: number): void {
    if (!this.active) return;
    this.animationFrame++;
  }

  clear(): void {
    this.container.removeChildren();
    this.lineGraphics = new Graphics();
    this.container.addChild(this.lineGraphics);
    this.pulseContainers = [];
    this.active = false;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
