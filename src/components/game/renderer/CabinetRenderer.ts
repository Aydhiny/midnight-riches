import { Container, Graphics, Text } from "pixi.js";

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

    this.frame = new Graphics();
    this.drawFrame(width, height);
    this.container.addChild(this.frame);

    this.ledContainer = new Container();
    this.createLEDs(width, height);
    this.container.addChild(this.ledContainer);

    this.winCounter = new Text({
      text: "",
      style: {
        fontFamily: "Arial Black",
        fontSize: 24,
        fill: 0xfbbf24,
        fontWeight: "bold",
      },
    });
    this.winCounter.anchor.set(0.5, 0);
    this.winCounter.x = width / 2;
    this.winCounter.y = height - 40;
    this.container.addChild(this.winCounter);
  }

  private drawFrame(width: number, height: number): void {
    this.frame.roundRect(-10, -10, width + 20, height + 20, 16);
    this.frame.stroke({ color: 0x6b21a8, width: 4 });
    this.frame.roundRect(-6, -6, width + 12, height + 12, 14);
    this.frame.stroke({ color: 0x9333ea, width: 2 });
  }

  private createLEDs(width: number, height: number): void {
    const ledCount = Math.floor((width + height) * 2 / 15);
    const perimeter = (width + height) * 2;

    for (let i = 0; i < ledCount; i++) {
      const t = i / ledCount;
      const pos = t * perimeter;
      let x: number, y: number;

      if (pos < width) {
        x = pos;
        y = -8;
      } else if (pos < width + height) {
        x = width + 8;
        y = pos - width;
      } else if (pos < width * 2 + height) {
        x = width - (pos - width - height);
        y = height + 8;
      } else {
        x = -8;
        y = height - (pos - width * 2 - height);
      }

      const led = new Graphics();
      led.circle(0, 0, 3);
      led.fill(0xfbbf24);
      led.x = x;
      led.y = y;
      led.alpha = 0.3;
      this.ledContainer.addChild(led);
    }
  }

  setWinAmount(amount: number): void {
    this.targetWinDisplay = amount;
  }

  update(delta: number): void {
    this.ledPhase += delta * 0.05;
    const leds = this.ledContainer.children;
    for (let i = 0; i < leds.length; i++) {
      const phase = (i / leds.length + this.ledPhase) % 1;
      leds[i].alpha = 0.3 + Math.sin(phase * Math.PI * 2) * 0.7;
    }

    if (this.currentWinDisplay !== this.targetWinDisplay) {
      const diff = this.targetWinDisplay - this.currentWinDisplay;
      const step = Math.max(0.01, Math.abs(diff) * 0.1);
      if (Math.abs(diff) < step) {
        this.currentWinDisplay = this.targetWinDisplay;
      } else {
        this.currentWinDisplay += Math.sign(diff) * step;
      }
      this.winCounter.text = this.currentWinDisplay > 0
        ? `WIN: $${this.currentWinDisplay.toFixed(2)}`
        : "";
    }
  }

  destroy(): void {
    this.container.destroy({ children: true });
  }
}
