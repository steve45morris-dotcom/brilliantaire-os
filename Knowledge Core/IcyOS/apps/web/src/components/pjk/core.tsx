'use client';

import { useEffect, useRef } from 'react';

export type CoreState = 'offline' | 'idle' | 'listening' | 'thinking' | 'speaking';

// The P.J.K. Reactor: a torus of plasma particles inside rotating HUD rings, drawn in
// perspective on a 2D canvas (no 3D library), full screen behind the console. It turns
// toward the pointer and shows what P.J.K. is doing: dim when offline, acid yellow while
// listening, lightning while thinking, shock waves while it replies. Motion trails come
// from painting the ember background at partial opacity each frame.
const EMBER = '14,4,2';
const PARTICLES = 1800;

export function PjkReactor({ state }: { state: CoreState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const parts = Array.from({ length: PARTICLES }, () => ({ u: Math.random() * 6.283, v: Math.random() * 6.283, s: 0.0025 + Math.random() * 0.004, k: Math.random() }));
    let raf = 0;
    let w = 0;
    let h = 0;
    let ry = 0;
    let energy = 0.3;
    let mx = 0;
    let my = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgb(${EMBER})`;
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const onMove = (e: PointerEvent) => {
      mx = e.clientX / window.innerWidth - 0.5;
      my = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('pointermove', onMove);

    const draw = (now: number) => {
      const phase = stateRef.current;
      const offline = phase === 'offline';
      const target = { offline: 0.12, idle: 0.3, listening: 0.55, thinking: 1, speaking: 0.7 }[phase];
      energy += (target - energy) * 0.04;
      const t = reduce ? 0 : now;
      if (!reduce) ry += 0.003 + energy * 0.01;

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = reduce ? `rgb(${EMBER})` : `rgba(${EMBER},0.3)`;
      ctx.fillRect(0, 0, w, h);
      const narrow = w < 900;
      const cx = w / 2;
      const cy = h * (narrow ? 0.3 : 0.44);
      // Sized so the outer ring stays on screen and clear of the docked console.
      const R = Math.min(w, h) * (narrow ? 0.16 : 0.15);
      const tilt = 1.12 + my * 0.5;
      const yaw = ry + mx * 0.6;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const cyw = Math.cos(yaw);
      const syw = Math.sin(yaw);

      // Core glow.
      const pulse = phase === 'speaking' && !reduce ? 1 + Math.sin(t / 120) * 0.08 : 1;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.3 * pulse);
      g.addColorStop(0, offline ? 'rgba(255,250,250,0.35)' : 'rgba(255,250,250,0.95)');
      g.addColorStop(0.18, offline ? 'rgba(255,250,250,0.12)' : phase === 'listening' ? 'rgba(228,255,26,0.8)' : 'rgba(255,140,40,0.8)');
      g.addColorStop(0.5, offline ? 'rgba(255,250,250,0.04)' : 'rgba(255,69,0,0.28)');
      g.addColorStop(1, 'rgba(255,69,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.3 * pulse, 0, 6.283);
      ctx.fill();

      // Plasma torus.
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts) {
        if (!reduce) p.u += p.s * (1 + energy * 3);
        const minor = 0.36 * (1 + (phase === 'thinking' && !reduce ? Math.sin(t / 90 + p.k * 30) * 0.35 : 0));
        const ring = 1 + minor * Math.cos(p.v);
        const x = ring * Math.cos(p.u);
        const y = minor * Math.sin(p.v);
        const z = ring * Math.sin(p.u);
        const y1 = y * ct - z * st;
        const z1 = y * st + z * ct;
        const x2 = x * cyw - z1 * syw;
        const z2 = x * syw + z1 * cyw;
        const per = 4 / (4 + z2);
        const front = Math.max(0, Math.min(1, (1 - z2) / 2));
        const col = offline ? '255,250,250' : phase === 'listening' ? (front > 0.6 ? '228,255,26' : '255,250,250') : front > 0.72 ? '228,255,26' : front > 0.4 ? '255,120,30' : '255,69,0';
        ctx.fillStyle = `rgba(${col},${offline ? 0.06 + front * 0.22 : 0.18 + front * 0.6})`;
        const sz = (0.8 + front * 1.8) * per;
        ctx.fillRect(cx + x2 * R * 1.6 * per - sz / 2, cy + y1 * R * 1.6 * per - sz / 2, sz, sz);
      }

      // HUD rings with ticks; each carries a moving arc.
      ctx.globalCompositeOperation = 'source-over';
      const rings: [number, number, number][] = [
        [2.05, 0.0004, 72],
        [2.3, -0.00028, 120],
        [2.55, 0.00018, 48],
      ];
      rings.forEach(([k, sp, n], ri) => {
        const rr = R * k;
        const a0 = t * sp * (1 + energy);
        ctx.strokeStyle = 'rgba(255,250,250,0.16)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, 6.283);
        ctx.stroke();
        for (let i = 0; i < n; i++) {
          const a = a0 + (i / n) * 6.283;
          const major = i % 6 === 0;
          const len = major ? 10 : 4;
          ctx.strokeStyle = major ? (offline ? 'rgba(255,250,250,0.35)' : 'rgba(255,69,0,0.8)') : 'rgba(255,250,250,0.28)';
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
          ctx.lineTo(cx + Math.cos(a) * (rr + len), cy + Math.sin(a) * (rr + len));
          ctx.stroke();
        }
        if (!offline) {
          ctx.strokeStyle = ri === 1 ? '#E4FF1A' : '#FF4500';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(cx, cy, rr - 5, a0 * 3, a0 * 3 + 0.9 + energy);
          ctx.stroke();
        }
      });

      if (!reduce && phase === 'thinking') {
        // Lightning from the core out to the first ring.
        ctx.strokeStyle = 'rgba(228,255,26,0.85)';
        ctx.lineWidth = 1.4;
        ctx.shadowColor = '#E4FF1A';
        ctx.shadowBlur = 12;
        for (let b = 0; b < 3; b++) {
          const a = Math.random() * 6.283;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          for (let s = 1; s <= 8; s++) {
            const r = R * 2.05 * (s / 8);
            ctx.lineTo(cx + Math.cos(a) * r + (Math.random() - 0.5) * 26, cy + Math.sin(a) * r + (Math.random() - 0.5) * 26);
          }
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }
      if (!reduce && phase === 'speaking') {
        for (let k = 0; k < 3; k++) {
          const f = (t / 900 + k / 3) % 1;
          ctx.strokeStyle = `rgba(255,69,0,${(1 - f) * 0.6})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, R * (1.1 + f * 1.6), 0, 6.283);
          ctx.stroke();
        }
      }
      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />;
}
