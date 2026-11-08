'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Sound, tilt and clock for the Daylight dashboard. Everything here is
// decorative: it never gates an action, and it switches off for reduced motion.

const SOUND_KEY = 'icyos:sound';

export type SoundKind = 'tap' | 'low' | 'high' | 'drum';

function tone(ctx: AudioContext, type: OscillatorType, from: number, to: number, ms: number, gain: number) {
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + ms / 1000);
  amp.gain.setValueAtTime(gain, t);
  amp.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + ms / 1000 + 0.02);
}

function noise(ctx: AudioContext, ms: number, freq: number, gain: number) {
  const t = ctx.currentTime;
  const len = Math.max(1, Math.floor((ctx.sampleRate * ms) / 1000));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const band = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  src.buffer = buffer;
  band.type = 'bandpass';
  band.frequency.value = freq;
  amp.gain.setValueAtTime(gain, t);
  src.connect(band).connect(amp).connect(ctx.destination);
  src.start(t);
}

/** Synthesised UI clicks. On by default; the choice is remembered. Audio starts on the first click only. */
export function useSound() {
  const [on, setOn] = useState(true);
  const ctx = useRef<AudioContext | null>(null);

  useEffect(() => {
    setOn(window.localStorage.getItem(SOUND_KEY) !== 'off');
  }, []);

  const toggle = useCallback(() => {
    setOn((prev) => {
      window.localStorage.setItem(SOUND_KEY, prev ? 'off' : 'on');
      return !prev;
    });
  }, []);

  const play = useCallback(
    (kind: SoundKind) => {
      if (!on || typeof window === 'undefined' || !('AudioContext' in window)) return;
      ctx.current ??= new AudioContext();
      const c = ctx.current;
      if (c.state === 'suspended') void c.resume();
      if (kind === 'low') tone(c, 'sine', 140, 80, 140, 0.12);
      else if (kind === 'high') tone(c, 'sine', 1500, 1700, 45, 0.05);
      else if (kind === 'drum') tone(c, 'triangle', 260, 150, 190, 0.14);
      else {
        noise(c, 30, 1800, 0.05);
        tone(c, 'sine', 1200, 1100, 25, 0.03);
      }
    },
    [on]
  );

  /** Root-level pointerdown handler: `data-snd` picks the sound, other controls tap. */
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-snd],button,a,select,input[type="checkbox"]');
      if (!el) return;
      play((el.dataset.snd as SoundKind | undefined) ?? 'tap');
    },
    [play]
  );

  return { on, toggle, onPointerDown };
}

function prefersStill(): boolean {
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !window.matchMedia('(hover: hover) and (pointer: fine)').matches
  );
}

/** Pointer handlers that tilt a card toward the cursor (max 3.2°). Leaving restores the resting tilt. */
export const tiltHandlers = {
  onPointerMove(e: React.PointerEvent<HTMLElement>) {
    if (prefersStill()) return;
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--ry', `${((x - 0.5) * 6.4).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - y) * 3.2).toFixed(2)}deg`);
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
  },
  onPointerLeave(e: React.PointerEvent<HTMLElement>) {
    for (const v of ['--rx', '--ry', '--mx', '--my']) e.currentTarget.style.removeProperty(v);
  },
};

/** The device clock, ticking each second. Null until mounted so server and client markup match. */
export function useClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}
