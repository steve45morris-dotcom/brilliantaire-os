'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

interface GeneratePlanButtonProps {
  onGenerate: () => void;
  loading: boolean;
}

export function GeneratePlanButton({ onGenerate, loading }: GeneratePlanButtonProps) {
  return (
    <Button onClick={onGenerate} disabled={loading} className="flex items-center gap-2">
      {loading && <Spinner className="h-4 w-4 text-white" />}
      <span>{loading ? 'Generating Plan...' : 'Generate Daily Plan'}</span>
    </Button>
  );
}
