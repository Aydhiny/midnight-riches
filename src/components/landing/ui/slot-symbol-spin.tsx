"use client";

import { useEffect, useRef } from "react";

const SYMBOLS = ["🍒", "🍋", "🍊", "🍇", "🍉", "⭐", "💎", "7️⃣", "🎰"];

interface SlotSymbolSpinProps {
  size?: number;
  speed?: number;
}

export function SlotSymbolSpin({ size = 48, speed = 1500 }: SlotSymbolSpinProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const symbolHeight = size;
    const totalHeight = SYMBOLS.length * symbolHeight;
    let offset = 0;

    ctx.font = `${size * 0.7}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let lastTime = 0;

    function draw(time: number) {
      if (!ctx) return;
      const delta = lastTime ? time - lastTime : 16;
      lastTime = time;

      offset = (offset + (delta / speed) * totalHeight) % totalHeight;

      ctx.clearRect(0, 0, size, size);

      for (let i = -1; i <= 1; i++) {
        const y = (i * symbolHeight - offset + totalHeight) % totalHeight;
        if (y > -symbolHeight && y < size + symbolHeight) {
          const idx = Math.floor(
            ((y + offset) / symbolHeight) % SYMBOLS.length
          );
          const safeIdx = ((idx % SYMBOLS.length) + SYMBOLS.length) % SYMBOLS.length;
          ctx.fillText(SYMBOLS[safeIdx], size / 2, y + symbolHeight / 2);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafRef.current);
  }, [size, speed]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size }}
      className="rounded-lg"
    />
  );
}
