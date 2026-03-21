import { Assets, Sprite, Container, Graphics, Text, Texture } from "pixi.js";
import type { GameSymbol } from "@/types";
const SYMBOL_IMAGE_MAP: Record<GameSymbol, string> = {
  cherry:     "/images/Cherry.png",
  lemon:      "/images/Lemon.png",
  orange:     "/images/Orange.png",
  grape:      "/images/Grape.png",
  watermelon: "/images/Watermelon.png",
  wild:       "/images/Wild.png",
  scatter:    "/images/Scatter.png",
  seven:      "/images/Seven.png",
  bar:        "/images/Bar.png",
};

const SYMBOL_COLORS: Record<GameSymbol, number> = {
  cherry: 0xdc2626, lemon: 0xfacc15, orange: 0xf97316,
  grape: 0x8b5cf6, watermelon: 0x10b981, wild: 0xf5c842,
  scatter: 0xec4899, seven: 0xef4444, bar: 0x94a3b8,
};

const textureCache = new Map<GameSymbol, Texture>();
let preloadPromise: Promise<void> | null = null;

export function resetTextureCache(): void {
  textureCache.clear();
  preloadPromise = null;
}

export async function preloadSymbolTextures(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  preloadPromise = (async () => {
    await Promise.all(
      (Object.entries(SYMBOL_IMAGE_MAP) as [GameSymbol, string][]).map(
        async ([symbol, path]) => {
          try {
            const tex = await Assets.load<Texture>(path);
            textureCache.set(symbol, tex);
          } catch {
          }
        }
      )
    );
  })();
  return preloadPromise;
}

export function createSymbolGraphic(symbol: GameSymbol, size: number): Container {
  const container = new Container();
  const pad = size * 0.06;
  const half = size / 2;
  const inner = size - pad * 2;
  const r = size * 0.14;

  const outerBezel = new Graphics();
  outerBezel.roundRect(pad - 2, pad - 2, inner + 4, inner + 4, r + 2);
  outerBezel.fill({ color: 0x2a3454, alpha: 0.45 });
  outerBezel.stroke({ color: 0x6b80a8, alpha: 0.30, width: 1 });
  container.addChild(outerBezel);

  const inset = new Graphics();
  inset.roundRect(pad, pad, inner, inner, r);
  inset.fill({ color: 0x040c22, alpha: 0.55 });
  container.addChild(inset);

  const shadowTop = new Graphics();
  shadowTop.roundRect(pad, pad, inner, 3, r);
  shadowTop.fill({ color: 0x000000, alpha: 0.5 });
  container.addChild(shadowTop);

  const shadowLeft = new Graphics();
  shadowLeft.roundRect(pad, pad, 3, inner, r);
  shadowLeft.fill({ color: 0x000000, alpha: 0.35 });
  container.addChild(shadowLeft);

  const highlightBot = new Graphics();
  highlightBot.roundRect(pad, pad + inner - 3, inner, 3, 0);
  highlightBot.fill({ color: 0xffffff, alpha: 0.08 });
  container.addChild(highlightBot);

  const highlightRight = new Graphics();
  highlightRight.roundRect(pad + inner - 3, pad, 3, inner, 0);
  highlightRight.fill({ color: 0xffffff, alpha: 0.06 });
  container.addChild(highlightRight);

  const shine = new Graphics();
  shine.roundRect(pad + 4, pad + 3, inner - 8, inner * 0.38, r - 2);
  shine.fill({ color: 0xffffff, alpha: 0.09 });
  container.addChild(shine);

  const botDark = new Graphics();
  botDark.roundRect(pad + 4, half + inner * 0.15, inner - 8, inner * 0.34, r - 4);
  botDark.fill({ color: 0x000020, alpha: 0.3 });
  container.addChild(botDark);

  const gold = new Graphics();
  gold.roundRect(pad, pad, inner, inner, r);
  gold.stroke({ color: 0xfbbf24, alpha: 0.18, width: 1 });
  container.addChild(gold);

  const tex = textureCache.get(symbol);
  if (tex) {
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.x = half;
    sprite.y = half;
    const fit = inner * 0.88;
    // Maintain natural aspect ratio — scale to fit within `fit × fit` without distortion
    const scale = Math.min(fit / tex.width, fit / tex.height);
    sprite.width  = tex.width  * scale;
    sprite.height = tex.height * scale;
    container.addChild(sprite);
  } else {
    _drawVector(container, symbol, size);
  }

  return container;
}

function _drawVector(container: Container, symbol: GameSymbol, size: number): void {
  const g = new Graphics();
  const half = size / 2;
  const padding = size * 0.1;
  const inner = size - padding * 2;

  switch (symbol) {
    case "cherry": {
      const r = inner * 0.2;
      g.circle(half - r * 0.8, half + r * 0.3, r); g.fill(SYMBOL_COLORS.cherry);
      g.circle(half + r * 0.8, half + r * 0.3, r); g.fill(SYMBOL_COLORS.cherry);
      g.moveTo(half - r * 0.4, half - r * 0.3);
      g.quadraticCurveTo(half, half - inner * 0.4, half + r * 0.4, half - r * 0.3);
      g.stroke({ color: 0x22c55e, width: 2 });
      break;
    }
    case "lemon": {
      g.ellipse(half, half, inner * 0.35, inner * 0.28); g.fill(SYMBOL_COLORS.lemon);
      g.circle(half + inner * 0.3, half - inner * 0.05, inner * 0.06); g.fill(0xeab308);
      break;
    }
    case "orange": {
      g.circle(half, half, inner * 0.3); g.fill(SYMBOL_COLORS.orange);
      g.ellipse(half + inner * 0.15, half - inner * 0.3, inner * 0.1, inner * 0.06); g.fill(0x22c55e);
      break;
    }
    case "grape": {
      const gr = inner * 0.1;
      for (const [ox, oy] of [[0,-gr],[-gr,0],[gr,0],[-gr*.5,gr],[gr*.5,gr],[0,gr*2]]) {
        g.circle(half + ox, half + oy, gr); g.fill(SYMBOL_COLORS.grape);
      }
      break;
    }
    case "watermelon": {
      g.arc(half, half + inner * 0.1, inner * 0.35, Math.PI, 0); g.fill(0x22c55e);
      g.arc(half, half + inner * 0.1, inner * 0.28, Math.PI, 0); g.fill(0xef4444);
      const seedR = inner * 0.025;
      [[-0.1,-0.02],[0.1,-0.02],[0,0.02]].forEach(([ox,oy]) => {
        g.circle(half + ox! * inner, half + oy! * inner, seedR); g.fill(0x1a1a1a);
      });
      break;
    }
    case "wild": {
      const pts: number[] = [];
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? inner * 0.35 : inner * 0.15;
        pts.push(half + Math.cos(angle) * radius, half + Math.sin(angle) * radius);
      }
      g.poly(pts); g.fill(SYMBOL_COLORS.wild); g.stroke({ color: 0xd97706, width: 2 });
      container.addChild(g);
      const label = new Text({ text: "WILD", style: { fontFamily: "Arial Black, Arial", fontSize: inner * 0.15, fill: 0xffffff, fontWeight: "bold" } });
      label.anchor.set(0.5); label.x = half; label.y = half + inner * 0.25;
      container.addChild(label);
      return;
    }
    case "scatter": {
      g.circle(half, half, inner * 0.3); g.fill(SYMBOL_COLORS.scatter);
      g.circle(half, half, inner * 0.2); g.fill(0xf472b6);
      g.circle(half, half, inner * 0.1); g.fill(0xfbcfe8);
      break;
    }
    case "seven": {
      const t = new Text({ text: "7", style: { fontFamily: "Arial Black, Arial", fontSize: inner * 0.6, fill: SYMBOL_COLORS.seven, fontWeight: "bold", dropShadow: { color: 0x000000, blur: 4, distance: 2, angle: Math.PI / 4 } } });
      t.anchor.set(0.5); t.x = half; t.y = half;
      container.addChild(t); return;
    }
    case "bar": {
      g.roundRect(padding + inner * 0.1, half - inner * 0.12, inner * 0.8, inner * 0.24, 4);
      g.fill(SYMBOL_COLORS.bar); g.stroke({ color: 0xfbbf24, width: 2 });
      const bt = new Text({ text: "BAR", style: { fontFamily: "Arial Black, Arial", fontSize: inner * 0.18, fill: 0xfbbf24, fontWeight: "bold" } });
      bt.anchor.set(0.5); bt.x = half; bt.y = half;
      container.addChild(g); container.addChild(bt); return;
    }
  }

  container.addChild(g);
}

export function getSymbolColor(symbol: GameSymbol): number {
  return SYMBOL_COLORS[symbol] ?? 0xffffff;
}
