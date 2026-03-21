import { Container, Graphics, Text } from "pixi.js";

// LED color palette — cycles through these for the perimeter lights
const LED_COLORS = [0xfbbf24, 0xf59e0b, 0xec4899, 0xa855f7, 0x7c3aed, 0x10b981];

export class CabinetRenderer {
  readonly container: Container;
  private frame: Graphics;
  private ledContainer: Container;
  private winCounter: Text;
  private ledPhase = 0;
  private targetWinDisplay = 0;
  private currentWinDisplay = 0;

  constructor(width: number, height: number) {
    this.container = new Container();

    // ── Background fill (transparent canvas needs nothing here, but we add
    //    a very subtle dark vignette behind the whole stage) ─────────────────
    const stageBg = new Graphics();
    stageBg.rect(-20, -20, width + 40, height + 40);
    stageBg.fill({ color: 0x04010f, alpha: 0.0 }); // fully transparent — canvas bg is already set
    this.container.addChild(stageBg);

    // ── Chrome frame ───────────────────────────────────────────────────────
    this.frame = new Graphics();
    this.drawFrame(width, height);
    this.container.addChild(this.frame);

    // ── LED perimeter lights ───────────────────────────────────────────────
    this.ledContainer = new Container();
    this.createLEDs(width, height);
    this.container.addChild(this.ledContainer);

    // ── Win counter text ───────────────────────────────────────────────────
    this.winCounter = new Text({
      text: "",
      style: {
        fontFamily: "Arial Black, Arial",
        fontSize: 22,
        fill: 0xfbbf24,
        fontWeight: "bold",
        dropShadow: {
          color: 0xff8800,
          blur: 12,
          distance: 0,
          angle: 0,
        },
      },
    });
    this.winCounter.anchor.set(0.5, 0);
    this.winCounter.x = width / 2;
    this.winCounter.y = height - 36;
    this.container.addChild(this.winCounter);
  }

  private drawFrame(width: number, height: number): void {
    // ── Layer 1: Outer dark shadow/glow ring ────────────────────────────────
    this.frame.roundRect(-14, -14, width + 28, height + 28, 20);
    this.frame.stroke({ color: 0x000000, alpha: 0.8, width: 6 });

    // ── Layer 2: Chrome outer border ────────────────────────────────────────
    this.frame.roundRect(-10, -10, width + 20, height + 20, 18);
    this.frame.stroke({ color: 0x8aaccE, alpha: 0.9, width: 4 });

    // ── Layer 3: Bright chrome highlight (top-left)  ─────────────────────
    this.frame.roundRect(-10, -10, width + 20, height + 20, 18);
    this.frame.stroke({ color: 0xdde8f5, alpha: 0.55, width: 1.5 });

    // ── Layer 4: Inner violet glow ring ─────────────────────────────────────
    this.frame.roundRect(-5, -5, width + 10, height + 10, 14);
    this.frame.stroke({ color: 0x7c3aed, alpha: 0.7, width: 3 });

    // ── Layer 5: Innermost bright violet accent ──────────────────────────────
    this.frame.roundRect(-2, -2, width + 4, height + 4, 12);
    this.frame.stroke({ color: 0xa78bfa, alpha: 0.5, width: 1 });

    // ── Corner chrome accents (decorative squares) ───────────────────────────
    const cornerSize = 14;
    const corners = [
      { x: -14, y: -14 },
      { x: width - cornerSize + 14, y: -14 },
      { x: -14, y: height - cornerSize + 14 },
      { x: width - cornerSize + 14, y: height - cornerSize + 14 },
    ];
    for (const { x, y } of corners) {
      this.frame.roundRect(x, y, cornerSize, cornerSize, 3);
      this.frame.fill({ color: 0xfbbf24, alpha: 0.8 });
      this.frame.stroke({ color: 0xffffff, alpha: 0.5, width: 1 });
    }
  }

  private createLEDs(width: number, height: number): void {
    // Denser LED count for more impressive look
    const ledSpacing = 12;
    const perimeter = (width + height) * 2;
    const ledCount = Math.floor(perimeter / ledSpacing);

    for (let i = 0; i < ledCount; i++) {
      const t = i / ledCount;
      const pos = t * perimeter;
      let x: number, y: number;

      if (pos < width) {
        x = pos; y = -11;
      } else if (pos < width + height) {
        x = width + 11; y = pos - width;
      } else if (pos < width * 2 + height) {
        x = width - (pos - width - height); y = height + 11;
      } else {
        x = -11; y = height - (pos - width * 2 - height);
      }

      const colorIdx = i % LED_COLORS.length;
      const led = new Graphics();
      // Outer glow circle
      led.circle(0, 0, 4.5);
      led.fill({ color: LED_COLORS[colorIdx], alpha: 0.25 });
      // Inner bright dot
      led.circle(0, 0, 2.5);
      led.fill({ color: LED_COLORS[colorIdx], alpha: 0.9 });
      led.x = x;
      led.y = y;
      led.alpha = 0.4;
      this.ledContainer.addChild(led);
    }
  }

  setWinAmount(amount: number): void {
    this.targetWinDisplay = amount;
  }

  update(delta: number): void {
    // Animate LEDs in a running-light pattern
    this.ledPhase += delta * 0.04;
    const leds = this.ledContainer.children;
    for (let i = 0; i < leds.length; i++) {
      const phase = (i / leds.length + this.ledPhase) % 1;
      // Sine wave pulse: 0.2 dim → 1.0 bright
      leds[i].alpha = 0.2 + Math.sin(phase * Math.PI * 2) * 0.8;
    }

    // Animate win counter rolling up
    if (this.currentWinDisplay !== this.targetWinDisplay) {
      const diff = this.targetWinDisplay - this.currentWinDisplay;
      const step = Math.max(0.01, Math.abs(diff) * 0.1);
      if (Math.abs(diff) < step) {
        this.currentWinDisplay = this.targetWinDisplay;
      } else {
        this.currentWinDisplay += Math.sign(diff) * step;
      }
      this.winCounter.text = this.currentWinDisplay > 0
        ? `✦ WIN ${this.currentWinDisplay.toFixed(2)} cr ✦`
        : "";
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
