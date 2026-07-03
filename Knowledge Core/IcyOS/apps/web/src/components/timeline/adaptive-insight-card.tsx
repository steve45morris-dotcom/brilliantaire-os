'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { AdaptiveMetadata } from '../../hooks/use-generate-daily-plan';
import { Brain } from 'lucide-react';

interface AdaptiveInsightCardProps {
  metadata: AdaptiveMetadata;
}

export function AdaptiveInsightCard({ metadata }: AdaptiveInsightCardProps) {
  return (
    <Card className="border-pink-900/40 bg-pink-950/5 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
        <div className="flex items-center gap-2">
          <Brain className="text-pink-500 h-5 w-5" />
          <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">
            Adaptive Planner Suggestions
          </span>
        </div>
        <Badge className="bg-pink-500/10 text-pink-500 border-pink-500/20">
          Confidence: {(metadata.confidence_score * 100).toFixed(0)}%
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Suggested Time Window</span>
          <span className="text-sm font-bold text-zinc-200">{metadata.recommended_time_window}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Protected Buffer Adaptation</span>
          <span className="text-sm font-bold text-zinc-200">{metadata.buffer_recommendation}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 border-t border-zinc-900/50">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Why Suggesting This?</span>
          <p className="text-xs text-zinc-300 leading-relaxed">{metadata.reason}</p>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-zinc-500 uppercase font-semibold">Historical Pattern Detected</span>
          <p className="text-xs text-zinc-400 italic leading-relaxed">{metadata.historical_pattern}</p>
        </div>
      </div>
    </Card>
  );
}
