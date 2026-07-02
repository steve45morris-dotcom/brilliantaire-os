'use client';

import React from 'react';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';

interface ApproveButtonProps {
  onApprove: () => void;
  loading: boolean;
  disabled: boolean;
}

export function ApproveButton({ onApprove, loading, disabled }: ApproveButtonProps) {
  return (
    <Button
      onClick={onApprove}
      disabled={loading || disabled}
      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
    >
      {loading && <Spinner className="h-4 w-4 text-white" />}
      <span>Approve Timeline</span>
    </Button>
  );
}
