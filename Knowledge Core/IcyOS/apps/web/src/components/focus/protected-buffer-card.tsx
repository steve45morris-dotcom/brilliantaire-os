'use client';

import React from 'react';
import { Card } from '../ui/card';
import { formatDuration } from './session-timer';

export function ProtectedBufferCard({ bufferLeft }: { bufferLeft: number }) {
  return (
    <Card className="border-amber-900/40 bg-amber-950/5 p-4 flex justify-between items-center">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-amber-500">Protected Buffer</span>
        <span className="text-xs text-zinc-500">Auto-consumed during session overruns.</span>
      </div>
      <span className="text-xl font-bold font-mono text-amber-500">
        {formatDuration(bufferLeft)}
      </span>
    </Card>
  );
}
