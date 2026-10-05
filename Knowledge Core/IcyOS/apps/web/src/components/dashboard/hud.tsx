'use client';

import { useEffect, useRef, useState } from 'react';

export const GOLD = '#c9a84c';
export const GREEN = '#34d399';

export function CornerBrackets({ color = 'rgba(201,168,76,0.45)', size = 14 }: { color?: string; size?: number }) {
  const base: React.CSSProperties = { position: 'absolute', width: size, height: size, pointerEvents: 'none' };
  const b = `1px solid ${color}`;
  return (
    <>
      <span aria-hidden style={{ ...base, top: 0, left: 0, borderTop: b, borderLeft: b }} />
      <span aria-hidden style={{ ...base, top: 0, right: 0, borderTop: b, borderRight: b }} />
      <span aria-hidden style={{ ...base, bottom: 0, left: 0, borderBottom: b, borderLeft: b }} />
      <span aria-hidden style={{ ...base, bottom: 0, right: 0, borderBottom: b, borderRight: b }} />
    </>
  );
}

export function SegmentBar({
  done,
  total,
  color = GOLD,
  height = 4,
  maxSegments = 40,
}: {
  done: number;
  total: number;
  color?: string;
  height?: number;
  maxSegments?: number;
}) {
  if (total <= 0) return <div className="w-full rounded-sm bg-[#1e2030]/60" style={{ height }} />;
  if (total > maxSegments) {
    return (
      <div className="w-full rounded-sm bg-[#1e2030] overflow-hidden" style={{ height }}>
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${(done / total) * 100}%`, background: color, boxShadow: `0 0 6px ${color}66` }}
        />
      </div>
    );
  }
  return (
    <div className="flex w-full gap-px" style={{ height }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-[1px] transition-colors duration-300"
          style={{ background: i < done ? color : '#1e2030', boxShadow: i < done ? `0 0 4px ${color}66` : 'none' }}
        />
      ))}
    </div>
  );
}

export function MiniGauge({
  done,
  total,
  size = 36,
  stroke = 2.5,
  showValue = true,
}: {
  done: number;
  total: number;
  size?: number;
  stroke?: number;
  showValue?: boolean;
}) {
  const pct = total > 0 ? done / total : 0;
  const complete = total > 0 && done >= total;
  const color = complete ? GREEN : GOLD;
  const r = 15;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#1e2030" strokeWidth={stroke} />
        <circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
          className="transition-all duration-700"
          style={{ filter: pct > 0 ? `drop-shadow(0 0 3px ${color}99)` : 'none' }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-tactical font-semibold text-[#b8b4ac]" style={{ fontSize: size * 0.26 }}>
            {total > 0 ? Math.round(pct * 100) : '—'}
          </span>
        </div>
      )}
    </div>
  );
}

export function useCountUp(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      current.current = next;
      setValue(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute -inset-6 md:-inset-8 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(201,168,76,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.045) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 20%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 55% at 50% 0%, black 20%, transparent 80%)',
        }}
      />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 55% 35% at 50% 0%, rgba(201,168,76,0.09), transparent 70%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(8,9,14,0.9), transparent 70%)' }} />
    </div>
  );
}

export function TacButton({
  variant = 'gold',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'gold' | 'ghost' | 'danger' }) {
  const base = 'font-tactical inline-flex items-center justify-center gap-1.5 px-3.5 min-h-[38px] rounded-md text-[11px] tracking-[0.14em] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed';
  const styles: Record<string, React.CSSProperties> = {
    gold: { background: 'linear-gradient(180deg, #dcc878, #c9a84c)', color: '#08090e', boxShadow: '0 0 20px rgba(201,168,76,0.3), inset 0 1px 0 rgba(255,255,255,0.3)' },
    ghost: { background: 'rgba(201,168,76,0.06)', color: '#c9a84c', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.35)' },
    danger: { background: 'rgba(239,68,68,0.08)', color: '#f87171', boxShadow: 'inset 0 0 0 1px rgba(239,68,68,0.35)' },
  };
  return (
    <button className={`${base} ${className}`} style={styles[variant]} {...props}>
      {children}
    </button>
  );
}

export function PageHeader({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <span className="font-tactical text-[10px] tracking-[0.3em] text-[#6b6e7a]">
          <span className="text-[#c9a84c]">//</span> {eyebrow}
        </span>
        <h1
          className="text-3xl sm:text-[2.6rem] font-bold tracking-tight leading-none"
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            background: 'linear-gradient(135deg, #e8e4da 0%, #c9a84c 70%, #a8872e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </h1>
      </div>
      {aside}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-tactical text-[10px] tracking-[0.24em] text-[#4a4d5a]">{children}</span>
      <span className="flex-1 h-px bg-gradient-to-r from-[#1e2030] to-transparent" />
    </div>
  );
}

export function SystemClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now ? now.toLocaleTimeString('en-GB', { hour12: false }) : '--:--:--';
  const date = now
    ? now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : '—';
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="font-tactical text-xl font-semibold tabular-nums text-[#d0ccc4] tracking-wider">{time}</span>
      <span className="font-tactical text-[10px] tracking-[0.18em] text-[#4a4d5a]">{date}</span>
    </div>
  );
}
