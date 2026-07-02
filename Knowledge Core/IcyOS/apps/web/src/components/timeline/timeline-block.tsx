'use client';

import React from 'react';
import { Badge } from '../ui/badge';
import { formatTimeRange } from '../../lib/timeline/format';
import { TimelineBlockData } from '../../hooks/use-generate-daily-plan';

interface TimelineBlockProps {
  block: TimelineBlockData;
}

export function TimelineBlock({ block }: TimelineBlockProps) {
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'focus': return 'text-pink-500 border-pink-500/20 bg-pink-500/10';
      case 'buffer': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
      case 'break': return 'text-teal-500 border-teal-500/20 bg-teal-500/10';
      default: return 'text-zinc-500 border-zinc-500/20 bg-zinc-500/10';
    }
  };

  return (
    <div className="flex gap-4 p-4 border border-zinc-900 bg-zinc-950/40 rounded-lg items-center justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-100">{block.title}</span>
          <Badge className={`text-[10px] py-0.5 ${getModeColor(block.mode)}`}>
            {block.mode}
          </Badge>
        </div>
        <span className="text-xs text-zinc-500">
          {formatTimeRange(block.startTime, block.endTime)}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-zinc-400 capitalize">{block.status}</span>
        {block.confidence !== undefined && (
          <span className="text-[10px] text-zinc-600 font-mono">
            Conf: {(block.confidence * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}
