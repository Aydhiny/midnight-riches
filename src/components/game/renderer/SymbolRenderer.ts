import { Graphics, Text, Container } from "pixi.js";
import type { GameSymbol } from "@/types";

const SYMBOL_COLORS: Record<GameSymbol, number> = {
  cherry: 0xdc2626,
  lemon: 0xfacc15,
  orange: 0xf97316,
  grape: 0x8b5cf6,
  watermelon: 0x10b981,
  wild: 0xf5c842,
  scatter: 0xec4899,
  seven: 0xef4444,
  bar: 0x94a3b8,
};

export function createSymbolGraphic(symbol: GameSymbol, size: number): Container {
  const container = new Container();
  const g = new Graphics();
  const half = size / 2;
  const padding = size * 0.1;
  const inner = size - padding * 2;

  switch (symbol) {
    case "cherry": {
      const r = inner * 0.2;
      g.circle(half - r * 0.8, half + r * 0.3, r);
      g.fill(SYMBOL_COLORS.cherry);
      g.circle(half + r * 0.8, half + r * 0.3, r);
      g.fill(SYMBOL_COLORS.cherry);
      g.moveTo(half - r * 0.4, half - r * 0.3);
      g.quadraticCurveTo(half, half - inner * 0.4, half + r * 0.4, half - r * 0.3);
      g.stroke({ color: 0x22c55e, width: 2 });
      break;
    }
    case "lemon": {
      g.ellipse(half, half, inner * 0.35, inner * 0.28);
      g.fill(SYMBOL_COLORS.lemon);
      g.circle(half + inner * 0.3, half - inner * 0.05, inner * 0.06);
      g.fill(0xeab308);
      break;
    }
    case "orange": {
      g.circle(half, half, inner * 0.3);
      g.fill(SYMBOL_COLORS.orange);
      g.ellipse(half + inner * 0.15, half - inner * 0.3, inner * 0.1, inner * 0.06);
      g.fill(0x22c55e);
      break;
    }
    case "grape": {
      const gr = inner * 0.1;
      const offsets = [
        [0, -gr], [-gr, 0], [gr, 0],
        [-gr * 0.5, gr], [gr * 0.5, gr],
        [0, gr * 2],
      ];
      for (const [ox, oy] of offsets) {
        g.circle(half + ox, half + oy, gr);
        g.fill(SYMBOL_COLORS.grape);
      }
      break;
    }
    case "watermelon": {
      g.arc(half, half + inner * 0.1, inner * 0.35, Math.PI, 0);
      g.fill(0x22c55e);
      g.arc(half, half + inner * 0.1, inner * 0.28, Math.PI, 0);
      g.fill(0xef4444);
      const seedR = inner * 0.025;
      g.circle(half - inner * 0.1, half - inner * 0.02, seedR);
      g.fill(0x1a1a1a);
      g.circle(half + inner * 0.1, half - inner * 0.02, seedR);
      g.fill(0x1a1a1a);
      g.circle(half, half + inner * 0.02, seedR);
      g.fill(0x1a1a1a);
      break;
    }
    case "wild": {
      const points: number[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? inner * 0.35 : inner * 0.15;
        points.push(half + Math.cos(angle) * radius);
        points.push(half + Math.sin(angle) * radius);
      }
      g.poly(points);
      g.fill(SYMBOL_COLORS.wild);
      g.stroke({ color: 0xd97706, width: 2 });
      break;
    }
    case "scatter": {
      g.circle(half, half, inner * 0.3);
      g.fill(SYMBOL_COLORS.scatter);
      g.circle(half, half, inner * 0.2);
      g.fill(0xf472b6);
      g.circle(half, half, inner * 0.1);
      g.fill(0xfbcfe8);
      break;
    }
    case "seven": {
      const t = new Text({
        text: "7",
        style: {
          fontFamily: "Arial Black, Arial",
          fontSize: inner * 0.6,
          fill: SYMBOL_COLORS.seven,
          fontWeight: "bold",
          dropShadow: {
            color: 0x000000,
            blur: 4,
            distance: 2,
            angle: Math.PI / 4,
          },
        },
      });
      t.anchor.set(0.5);
      t.x = half;
      t.y = half;
      container.addChild(t);
      return container;
    }
    case "bar": {
      g.roundRect(padding + inner * 0.1, half - inner * 0.12, inner * 0.8, inner * 0.24, 4);
      g.fill(SYMBOL_COLORS.bar);
      g.stroke({ color: 0xfbbf24, width: 2 });
      const t = new Text({
        text: "BAR",
        style: {
          fontFamily: "Arial Black, Arial",
          fontSize: inner * 0.18,
          fill: 0xfbbf24,
          fontWeight: "bold",
        },
      });
      t.anchor.set(0.5);
      t.x = half;
      t.y = half;
      container.addChild(g);
      container.addChild(t);
      return container;
    }
  }

  container.addChild(g);

  if (symbol === "wild") {
    const label = new Text({
      text: "WILD",
      style: {
        fontFamily: "Arial Black, Arial",
        fontSize: inner * 0.15,
        fill: 0xffffff,
        fontWeight: "bold",
      },
    });
    label.anchor.set(0.5);
    label.x = half;
    label.y = half + inner * 0.25;
    container.addChild(label);
  }

  return container;
}

export function getSymbolColor(symbol: GameSymbol): number {
  return SYMBOL_COLORS[symbol] ?? 0xffffff;
}
