'use client';

import { useEffect, useRef } from 'react';
import s from './daylight.module.css';

// The glass theme's backdrop: four soft blobs of red, gold, rose and cream drifting on
// white. A 96×60 canvas, blurred and stretched by CSS, so it costs almost nothing.
// It holds still under reduced motion and pauses while the tab is hidden.
const BLOBS: [number, number, number, string][] = [
  [0.18, 0.28, 0.55, '179,18,43'],
  [0.82, 0.22, 0.5, '201,162,39'],
  [0.66, 0.86, 0.55, '240,128,110'],
  [0.12, 0.84, 0.45, '247,226,170'],
];

function paint(ctx: CanvasRenderingContext2D, t: number) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 96, 60);
  BLOBS.forEach(([bx, by, br, rgb], i) => {
    const x = (bx + Math.sin(t * 0.0004 * (i + 1) + i) * 0.12) * 96;
    const y = (by + Math.cos(t * 0.0003 * (i + 2) + i) * 0.12) * 60;
    const g = ctx.createRadialGradient(x, y, 0, x, y, br * 80);
    g.addColorStop(0, `rgba(${rgb},0.55)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 96, 60);
  });
}

export function Aurora() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    paint(ctx, 0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const loop = (now: number) => {
      if (!document.hidden) paint(ctx, now);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} className={s.aurora} width={96} height={60} aria-hidden />;
}
