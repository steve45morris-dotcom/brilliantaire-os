'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

interface SkipButtonProps {
  onSkip: () => void;
  loading: boolean;
}

export function SkipButton({ onSkip, loading }: SkipButtonProps) {
  return (
    <Button onClick={onSkip} disabled={loading} className="bg-zinc-900 hover:bg-zinc-950 border border-zinc-800 text-zinc-500 flex items-center gap-2">
      {loading && <Spinner className="h-4 w-4 text-zinc-500" />}
      <span>Skip Mission</span>
    </Button>
  );
}
