'use client';

import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export function InboxResultCard({ result }: { result: string }) {
  return (
    <Card className="flex flex-col gap-4 border-pink-900 bg-pink-950/10">
      <div className="flex justify-between items-center">
        <span className="text-sm font-bold text-zinc-100">Ingested Result</span>
        <Badge className="bg-pink-600/20 text-pink-500 border-pink-500/20">Success</Badge>
      </div>
      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{result}</p>
    </Card>
  );
}
