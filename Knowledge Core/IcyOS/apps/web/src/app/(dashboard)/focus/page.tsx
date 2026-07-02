'use client';

import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

export default function FocusPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Focus</h1>
          <p className="text-zinc-500 text-sm">Execution sessions and target sprints trackers.</p>
        </div>
        <Badge>Placeholder</Badge>
      </div>
      <Card className="border-dashed border-zinc-800 bg-zinc-950/20 py-20 flex flex-col items-center justify-center gap-2">
        <span className="text-sm font-semibold text-zinc-400">Section Content Pipeline Ready</span>
        <span className="text-xs text-zinc-600">Awaiting database model connections</span>
      </Card>
    </div>
  );
}
