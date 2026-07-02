'use client';

import React from 'react';
import { Card } from '../ui/card';

export function TimelineEmptyState() {
  return (
    <Card className="border-dashed border-zinc-800 bg-zinc-950/20 py-16 flex flex-col items-center justify-center gap-2 text-center">
      <span className="text-sm font-semibold text-zinc-400">No Plan Generated Yet</span>
      <span className="text-xs text-zinc-600">Click Generate Daily Plan to request task coordinates schedule</span>
    </Card>
  );
}
