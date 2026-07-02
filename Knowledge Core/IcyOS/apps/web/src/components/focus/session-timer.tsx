'use client';

import React from 'react';

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function SessionTimer({ timeLeft }: { timeLeft: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[64px] font-bold font-mono tracking-tighter text-zinc-100 select-none">
        {formatDuration(timeLeft)}
      </span>
      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
        Time Remaining
      </span>
    </div>
  );
}
