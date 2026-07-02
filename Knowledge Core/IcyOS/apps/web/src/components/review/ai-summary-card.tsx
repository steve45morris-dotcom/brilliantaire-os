'use client';

import React from 'react';
import { Card } from '../ui/card';

export function AiSummaryCard({ summary }: { summary: string }) {
  return (
    <Card className="border-pink-900/40 bg-pink-950/5 flex flex-col gap-2">
      <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">
        AI Reflection Synthesis
      </span>
      <p className="text-sm text-zinc-300 leading-relaxed">{summary}</p>
    </Card>
  );
}
