'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

interface RegenerateButtonProps {
  onRegenerate: () => void;
  loading: boolean;
  disabled: boolean;
}

export function RegenerateButton({ onRegenerate, loading, disabled }: RegenerateButtonProps) {
  return (
    <Button
      onClick={onRegenerate}
      disabled={loading || disabled}
      className="bg-zinc-900 hover:bg-zinc-950 border border-zinc-800 text-zinc-400 flex items-center gap-2"
    >
      {loading && <Spinner className="h-4 w-4 text-white" />}
      <span>Regenerate</span>
    </Button>
  );
}
