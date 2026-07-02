'use client';

import React from 'react';
import { Badge } from '../ui/badge';
import { TimelineStatus } from '../../hooks/use-timeline-approval';

export function TimelineStatusPill({ status }: { status: TimelineStatus }) {
  const getStatusStyle = (s: TimelineStatus) => {
    switch (s) {
      case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'locked': return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'generated': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <Badge className={`capitalize ${getStatusStyle(status)}`}>
      {status}
    </Badge>
  );
}
