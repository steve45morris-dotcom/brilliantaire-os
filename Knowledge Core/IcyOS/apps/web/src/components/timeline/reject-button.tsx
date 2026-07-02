'use client';

import React from 'react';
import { Button } from '../ui/button';

interface RejectButtonProps {
  onReject: () => void;
  disabled: boolean;
}

export function RejectButton({ onReject, disabled }: RejectButtonProps) {
  return (
    <Button
      onClick={onReject}
      disabled={disabled}
      className="bg-zinc-800 hover:bg-zinc-900 border border-zinc-700 text-zinc-300"
    >
      Reject
    </Button>
  );
}
