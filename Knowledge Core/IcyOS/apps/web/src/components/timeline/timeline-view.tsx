'use client';

import React from 'react';
import { TimelineBlock } from './timeline-block';
import { TimelineBlockData } from '../../hooks/use-generate-daily-plan';

interface TimelineViewProps {
  blocks: TimelineBlockData[];
}

export function TimelineView({ blocks }: TimelineViewProps) {
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block) => (
        <TimelineBlock key={block.id} block={block} />
      ))}
    </div>
  );
}
