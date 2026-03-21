import { Container, Graphics, Text } from "pixi.js";
import type { WinEvaluation, WinLine } from "@/types";

interface HaloEntry {
  halo: Graphics;
  shimmer: Graphics;
  baseAlpha: number;
}

export class WinRenderer {
  readonly container: Container;
  private lineGraphics: Graphics;
  private pulseContainers: Container[] = [];
  private animationFrame = 0;
  private active = false;

  // Animated win symbol halos
  private halos: HaloEntry[] = [];
  private haloPhase = 0;

  constructor() {
    this.container = new Container();
    this.lineGraphics = new Graphics();
    this.container.addChild(this.lineGraphics);
  }

  async playWinAnimation(
    wins: WinEvaluation,
    symbolSize: number,
    offsetX: number,
    offsetY: number,
    canvasWidth?: number
  ): Promise<void> {
    this.clear();
    this.active = true;
    this.halos = [];
    this.haloPhase = 0;

    for (const line of wins.lines) {
      this.drawPayline(line, symbolSize, offsetX, offsetY);
    }

    if (wins.totalWin > 0) {
      this.showWinAmount(wins.totalWin, offsetX, offsetY, symbolSize, canvasWidth);
    }

    await this.animatePulse(900);
    this.active = false;
  }

  async playBigWin(amount: number, canvasWidth: number, canvasHeight: number): Promise<void> {
    this.clear();
    this.active = true;

    const cx = canvasWidth  / 2;
    const cy = canvasHeight / 2;

    // ── Full-screen gold flash ───────────────────────────────────────────────
    const flash = new Graphics();
    flash.circle(cx, cy, Math.max(canvasWidth, canvasHeight) * 1.2);
    flash.fill({ color: 0xffd700, alpha: 0.0 });
    this.container.addChild(flash);

    // Animate flash alpha (quick burst then fade)
    let flashPhase = 0;
    const flashTicker = setInterval(() => {
      flashPhase += 0.15;
      flash.alpha = Math.max(0, Math.sin(flashPhase) * 0.18);
      if (flashPhase > Math.PI * 2) clearInterval(flashTicker);
    }, 16);

    // ── Animated particles ────────────────────────────────────────────────────
    const particles = new Container();
    this.container.addChild(particles);

    const COLORS = [0xffd700, 0xfbbf24, 0xf59e0b, 0xffffff, 0xfde68a, 0xec4899, 0xa855f7, 0x34d399];
    const particleData: {
      gfx: Graphics;
      vx: number;
      vy: number;
      spin: number;
      life: number;
    }[] = [];

    for (let i = 0; i < 90; i++) {
      const p = new Graphics();
      const r = 2.5 + Math.random() * 5;
      // Alternate between circles and small rects for variety
      if (i % 3 === 0) {
        p.roundRect(-r, -r * 0.4, r * 2, r * 0.8, 1);
      } else {
        p.circle(0, 0, r);
      }
      p.fill(COLORS[Math.floor(Math.random() * COLORS.length)]);

      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      const vx    = Math.cos(angle) * speed;
      const vy    = Math.sin(angle) * speed - 4; // upward bias

      p.x = cx + (Math.random() - 0.5) * 80;
      p.y = cy + (Math.random() - 0.5) * 80;
      p.alpha = 1;

      particles.addChild(p);
      particleData.push({ gfx: p, vx, vy, spin: (Math.random() - 0.5) * 0.3, life: 1 });
    }

    // Animate particles via requestAnimationFrame
    const animateParticles = () => {
      let alive = false;
      for (const pd of particleData) {
        if (pd.life <= 0) continue;
        pd.gfx.x += pd.vx;
        pd.gfx.y += pd.vy;
        pd.vy     += 0.18; // gravity
        pd.gfx.rotation += pd.spin;
        pd.life   -= 0.012;
        pd.gfx.alpha = Math.max(0, pd.life);
        alive = true;
      }
      if (alive) requestAnimationFrame(animateParticles);
    };
    requestAnimationFrame(animateParticles);

    // ── Win label with scale-in animation ────────────────────────────────────
    const label = this.createWinLabel(amount, canvasWidth, canvasHeight);
    this.container.addChild(label);

    // Spring scale-in
    let labelScale = 0.3;
    let labelScaleVel = 0;
    const scaleTicker = setInterval(() => {
      labelScaleVel += (1 - labelScale) * 0.35;
      labelScaleVel *= 0.65;
      labelScale    += labelScaleVel;
      label.scale.set(labelScale);
      if (Math.abs(labelScale - 1) < 0.005 && Math.abs(labelScaleVel) < 0.005) {
        label.scale.set(1);
        clearInterval(scaleTicker);
      }
    }, 16);

    // Animate label gentle float
    let labelPhase = 0;
    const floatTicker = setInterval(() => {
      labelPhase += 0.04;
      label.y = cy + Math.sin(labelPhase) * 4; // offset from center
    }, 16);

    const duration = amount >= 200 ? 3000 : 2400;
    await this.animatePulse(duration);

    clearInterval(flashTicker);
    clearInterval(floatTicker);
    clearInterval(scaleTicker);

    try { flash.destroy(); }   catch { /* ok */ }
    try { particles.destroy({ children: true }); } catch { /* ok */ }
    try { label.destroy(); }   catch { /* ok */ }

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

      for (let i = 0; i < 10; i++) {
        const particle = new Graphics();
        const r = 2 + Math.random() * 4;
        const color = i % 2 === 0 ? 0xfbbf24 : 0xfde68a;
        particle.circle(0, 0, r);
        particle.fill(color);
        particle.x = x;
        particle.y = y;
        particle.alpha = 1;
        this.container.addChild(particle);

        const angle = (i / 10) * Math.PI * 2;
        const speed = 2.5 + Math.random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        let frame = 0;
        const animate = () => {
          frame++;
          particle.x += vx;
          particle.y += vy + frame * 0.12;
          particle.alpha -= 0.028;
          particle.scale.set(Math.max(0.1, 1 - frame * 0.025));
          if (particle.alpha > 0 && frame < 35) {
            requestAnimationFrame(animate);
          } else {
            try { particle.destroy(); } catch { /* ok */ }
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

      // Outer glow halo (animated in update())
      const halo = new Graphics();
      halo.roundRect(cx + pad, cy + pad, symbolSize - pad * 2, symbolSize - pad * 2, symbolSize * 0.1);
      halo.fill({ color: 0xffd700, alpha: 0.22 });
      halo.stroke({ color: 0xffd700, alpha: 0.9, width: 2.5 });
      this.container.addChild(halo);

      // Inner shimmer
      const shimmer = new Graphics();
      shimmer.roundRect(cx + pad + 3, cy + pad + 3, symbolSize - pad * 2 - 6, (symbolSize - pad * 2) * 0.38, symbolSize * 0.07);
      shimmer.fill({ color: 0xffffff, alpha: 0.20 });
      this.container.addChild(shimmer);

      this.halos.push({ halo, shimmer, baseAlpha: 0.22 });
    }

    // Payline connecting line
    const outline = new Graphics();
    outline.setStrokeStyle({ width: 6, color: 0x000000, alpha: 0.45 });
    const points = line.positions.map(([col, row]) => ({
      x: offsetX + col * symbolSize + symbolSize / 2,
      y: offsetY + row * symbolSize + symbolSize / 2,
    }));
    if (points.length > 0) {
      outline.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) outline.lineTo(points[i].x, points[i].y);
      outline.stroke();
    }

    const glow = new Graphics();
    glow.setStrokeStyle({ width: 3, color: 0xffd700, alpha: 1 });
    if (points.length > 0) {
      glow.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) glow.lineTo(points[i].x, points[i].y);
      glow.stroke();
    }

    // Bright inner line
    const inner = new Graphics();
    inner.setStrokeStyle({ width: 1.5, color: 0xffffff, alpha: 0.6 });
    if (points.length > 0) {
      inner.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) inner.lineTo(points[i].x, points[i].y);
      inner.stroke();
    }

    this.container.addChild(outline);
    this.container.addChild(glow);
    this.container.addChild(inner);
  }

  private showWinAmount(
    amount: number,
    offsetX: number,
    _offsetY: number,
    symbolSize: number,
    canvasWidth?: number
  ): void {
    const text = new Text({
      text: `+${amount.toFixed(2)} cr`,
      style: {
        fontFamily: "Arial Black",
        fontSize: symbolSize * 0.42,
        fill: 0xfbbf24,
        fontWeight: "bold",
        dropShadow: {
          color: 0x000000,
          blur: 6,
          distance: 2,
        },
      },
    });
    text.anchor.set(0.5);
    text.x = canvasWidth != null ? canvasWidth / 2 : offsetX + symbolSize * 2.5;
    text.y = symbolSize * 0.28;
    this.container.addChild(text);
  }

  private createWinLabel(amount: number, width: number, height: number): Container {
    const container = new Container();
    container.x = width / 2;
    container.y = height / 2;

    // Drop shadow bg
    const shadow = new Graphics();
    shadow.roundRect(-164, -52, 328, 104, 20);
    shadow.fill({ color: 0x000000, alpha: 0.65 });
    shadow.x = 3; shadow.y = 5;
    container.addChild(shadow);

    // Main pill bg with gradient border
    const bg = new Graphics();
    bg.roundRect(-160, -50, 320, 100, 18);
    bg.fill({ color: 0x0d0520, alpha: 0.92 });
    bg.stroke({ color: 0xfbbf24, alpha: 0.9, width: 2.5 });
    container.addChild(bg);

    // Gold inner glow ring
    const glowRing = new Graphics();
    glowRing.roundRect(-155, -45, 310, 90, 15);
    glowRing.stroke({ color: 0xfde68a, alpha: 0.35, width: 4 });
    container.addChild(glowRing);

    const tier = amount >= 500 ? "🏆 JACKPOT!" : amount >= 200 ? "💎 MEGA WIN!" : amount >= 50 ? "⭐ SUPER WIN!" : "🎉 BIG WIN!";

    const tierText = new Text({
      text: tier,
      style: {
        fontFamily: "Arial Black",
        fontSize: 22,
        fill: 0xfde68a,
        fontWeight: "bold",
        align: "center",
        dropShadow: { color: 0xff8800, blur: 8, distance: 0, angle: 0 },
      },
    });
    tierText.anchor.set(0.5);
    tierText.y = -16;
    container.addChild(tierText);

    const amountText = new Text({
      text: `${amount.toFixed(2)} cr`,
      style: {
        fontFamily: "Arial Black",
        fontSize: 34,
        fill: 0xffffff,
        fontWeight: "bold",
        align: "center",
        dropShadow: { color: 0x000000, blur: 4, distance: 2, angle: Math.PI / 4 },
      },
    });
    amountText.anchor.set(0.5);
    amountText.y = 20;
    container.addChild(amountText);

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

  update(delta: number): void {
    if (!this.active) return;
    this.animationFrame++;

    // Animate pulsing halos on winning symbols
    if (this.halos.length > 0) {
      this.haloPhase += delta * 0.07;
      const pulse = 0.5 + Math.sin(this.haloPhase * Math.PI * 2) * 0.5; // 0..1
      for (const entry of this.halos) {
        entry.halo.alpha   = 0.55 + pulse * 0.45;
        entry.shimmer.alpha = 0.1 + pulse * 0.25;

        // Gentle scale pulse
        const scale = 1 + pulse * 0.025;
        entry.halo.scale.set(scale);
      }
    }
  }

  clear(): void {
    this.container.removeChildren();
    this.lineGraphics = new Graphics();
    this.container.addChild(this.lineGraphics);
    this.pulseContainers = [];
    this.halos = [];
    this.haloPhase = 0;
    this.active = false;
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
