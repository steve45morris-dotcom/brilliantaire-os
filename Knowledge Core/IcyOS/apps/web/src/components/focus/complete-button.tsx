'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

interface CompleteButtonProps {
  onComplete: () => void;
  loading: boolean;
}

export function CompleteButton({ onComplete, loading }: CompleteButtonProps) {
  return (
    <Button onClick={onComplete} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
      {loading && <Spinner className="h-4 w-4 text-white" />}
      <span>Complete Session</span>
    </Button>
  );
}
