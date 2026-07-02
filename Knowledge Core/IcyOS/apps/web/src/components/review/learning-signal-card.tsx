'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { StructuredSignal } from '../../hooks/use-reflection';

export function LearningSignalCard({ signals }: { signals: StructuredSignal }) {
  return (
    <Card className="flex flex-col gap-4 border-zinc-900 bg-zinc-950/40">
      <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
        Extracted Learning Signals
      </span>
      
      <div className="grid grid-cols-2 gap-4 border-b border-zinc-900 pb-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase">Focus Mood</span>
          <span className="text-sm font-bold text-zinc-200 capitalize">{signals.mood}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase">Energy Weight</span>
          <span className="text-sm font-bold text-zinc-200">{signals.energy} / 5</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {signals.wins.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Wins</span>
            <div className="flex flex-wrap gap-1.5">
              {signals.wins.map((w, i) => (
                <Badge key={i} className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                  {w}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {signals.blockers.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-pink-500 font-semibold uppercase tracking-wider">Blockers</span>
            <div className="flex flex-wrap gap-1.5">
              {signals.blockers.map((b, i) => (
                <Badge key={i} className="bg-pink-500/10 text-pink-500 border-pink-500/20">
                  {b}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {signals.lessons.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider">Lessons</span>
            <div className="flex flex-wrap gap-1.5">
              {signals.lessons.map((l, i) => (
                <Badge key={i} className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  {l}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
