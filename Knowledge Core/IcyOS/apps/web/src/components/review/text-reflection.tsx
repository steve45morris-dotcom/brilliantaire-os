'use client';

import React from 'react';

interface TextReflectionProps {
  text: string;
  onChange: (val: string) => void;
  disabled: boolean;
}

export function TextReflection({ text, onChange, disabled }: TextReflectionProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
        Written Reflection Notes
      </span>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="How did it go? Any blockers or lessons learned? (e.g. Completed page schemas, but ran into Vitest mock warnings)"
        disabled={disabled}
        className="w-full h-24 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-pink-500 transition-colors resize-none"
      />
    </div>
  );
}
