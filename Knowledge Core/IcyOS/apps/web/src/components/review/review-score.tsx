'use client';

import React from 'react';

interface ReviewScoreProps {
  score: number;
  onChange: (val: number) => void;
}

export function ReviewScore({ score, onChange }: ReviewScoreProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
        Session Rating
      </span>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((val) => (
          <button
            key={val}
            onClick={() => onChange(val)}
            type="button"
            className={`h-10 w-10 rounded-md font-bold text-sm transition-all duration-200 border ${
              score === val
                ? 'bg-pink-600 border-pink-500 text-white shadow-lg shadow-pink-600/20'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
}
