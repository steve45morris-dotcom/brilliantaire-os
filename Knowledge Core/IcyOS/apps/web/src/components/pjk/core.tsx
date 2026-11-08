'use client';

import { useEffect, useRef } from 'react';

export type CoreState = 'offline' | 'idle' | 'listening' | 'thinking' | 'speaking';

// The P.J.K. core: a sphere of points with three orbit rings, projected in
// perspective on a 2D canvas (no 3D library). It turns toward the pointer and
// changes with what P.J.K. is doing: dim when offline, acid yellow while
// listening, fast and scattered while thinking, pulsing while it replies.
const RED_ORANGE = [255, 69, 0];
const ACID = [228, 255, 26];
const SNOW = [255, 250, 250];
const POINTS = 720;

interface P3 {
  x: number;
  y: number;
  z: number;
}

/** Evenly spread points on a unit sphere (Fibonacci lattice). */
function sphere(n: number): P3[] {
  const out: P3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    out.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
  }
  return out;
}

function ring(n: number, radius: number, tiltX: number, tiltZ: number): P3[] {
  const out: P3[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let x = Math.cos(a) * radius;
    let y = 0;
    let z = Math.sin(a) * radius;
    [y, z] = [y * Math.cos(tiltX) - z * Math.sin(tiltX), y * Math.sin(tiltX) + z * Math.cos(tiltX)];
    [x, y] = [x * Math.cos(tiltZ) - y * Math.sin(tiltZ), x * Math.sin(tiltZ) + y * Math.cos(tiltZ)];
    out.push({ x, y, z });
  }
  return out;
}

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export function PjkCore({ state }: { state: CoreState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext('2d');
    if (!el || !ctx) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dots = sphere(POINTS);
    const seeds = dots.map((_, i) => Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453));
    const rings = [ring(140, 1.45, 1.2, 0.3), ring(120, 1.7, -0.9, -0.5), ring(100, 1.95, 0.25, 1.1)];
    let raf = 0;
    let w = 0;
    let h = 0;
    let rotY = 0;
    let rotX = 0.35;
    let tiltX = 0;
    let tiltY = 0;
    let energy = 0; // eases toward the target for the current state
    let pulse = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tiltY = ((e.clientX - r.left) / r.width - 0.5) * 0.8;
      tiltX = ((e.clientY - r.top) / r.height - 0.5) * 0.6;
    };
    window.addEventListener('pointermove', onPointer);

    const draw = (time: number) => {
      const s = stateRef.current;
      const target = { offline: 0.1, idle: 0.35, listening: 0.6, thinking: 1, speaking: 0.75 }[s];
      energy += (target - energy) * 0.05;
      if (!reduce) rotY += 0.002 + energy * 0.014;
      rotX += (0.35 + tiltX - rotX) * 0.04;
      const yaw = rotY + tiltY;
      // Reduced motion holds the core still but keeps the state colours.
      pulse = reduce ? 0 : s === 'speaking' ? (time / 520) % 1 : s === 'listening' ? 0.5 + Math.sin(time / 260) * 0.5 : 0;

      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.22;
      const tint = s === 'listening' ? ACID : RED_ORANGE;

      // Glow behind the core.
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, scale * 2.2);
      const glow = s === 'offline' ? SNOW : tint;
      g.addColorStop(0, `rgba(${glow.join(',')},${0.16 + energy * 0.22})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const project = (p: P3, k: number) => {
        const x1 = p.x * k * cosY - p.z * k * sinY;
        const z1 = p.x * k * sinY + p.z * k * cosY;
        const y1 = p.y * k * cosX - z1 * sinX;
        const z2 = p.y * k * sinX + z1 * cosX;
        // Camera 5 units back: enough depth to read as 3D without near points blowing up.
        const persp = 5 / (5 + z2);
        return { x: cx + x1 * scale * persp, y: cy + y1 * scale * persp, depth: (1 - z2) / 2, persp };
      };

      // Sphere: points scatter outward while thinking; a wave runs across it while speaking.
      for (let i = 0; i < dots.length; i++) {
        const p = dots[i];
        const jitter = s === 'thinking' && !reduce ? Math.sin(time / 140 + seeds[i] * 40) * 0.12 * energy : 0;
        const wave = s === 'speaking' ? Math.max(0, 1 - Math.abs(((p.y + 1) / 2) - pulse) * 6) * 0.18 : 0;
        const breathe = 1 + (reduce ? 0 : Math.sin(time / 900) * 0.02) + jitter + wave + (s === 'listening' ? pulse * 0.05 : 0);
        const q = project(p, breathe);
        const front = Math.max(0, Math.min(1, q.depth));
        const col = s === 'offline' ? SNOW : mix(tint, s === 'listening' ? SNOW : ACID, front * front);
        const a = (s === 'offline' ? 0.12 : 0.18) + front * (s === 'offline' ? 0.25 : 0.75);
        ctx.fillStyle = `rgba(${col.join(',')},${a})`;
        const size = (0.6 + front * 1.6) * q.persp;
        ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size);
      }

      // Rings: red-orange behind, acid yellow in front.
      rings.forEach((r, ri) => {
        const spin = (reduce ? 0 : time) / (2600 + ri * 900) * (ri % 2 ? -1 : 1) * (0.4 + energy);
        for (let i = 0; i < r.length; i++) {
          const a0 = spin;
          const p = r[i];
          const rp = { x: p.x * Math.cos(a0) - p.z * Math.sin(a0), y: p.y, z: p.x * Math.sin(a0) + p.z * Math.cos(a0) };
          const q = project(rp, 1);
          const front = Math.max(0, Math.min(1, q.depth));
          const col = s === 'offline' ? SNOW : mix(RED_ORANGE, ACID, front);
          ctx.fillStyle = `rgba(${col.join(',')},${(s === 'offline' ? 0.08 : 0.15) + front * 0.55 * (0.4 + energy)})`;
          const size = (0.8 + front * 1.4) * q.persp;
          ctx.fillRect(q.x - size / 2, q.y - size / 2, size, size);
        }
      });

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
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvas} aria-hidden style={{ width: '100%', height: '100%', display: 'block' }} />;
}
