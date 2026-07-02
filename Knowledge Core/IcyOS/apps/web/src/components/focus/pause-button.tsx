'use client';

import React from 'react';
import { Button } from '../ui/button';

export function PauseButton({ onPause }: { onPause: () => void }) {
  return (
    <Button onClick={onPause} className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-950 text-zinc-300">
      Pause Session
    </Button>
  );
}
