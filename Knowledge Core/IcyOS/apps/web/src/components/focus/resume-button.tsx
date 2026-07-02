'use client';

import React from 'react';
import { Button } from '../ui/button';

export function ResumeButton({ onResume }: { onResume: () => void }) {
  return (
    <Button onClick={onResume} className="bg-pink-600 hover:bg-pink-700 text-white">
      Resume Session
    </Button>
  );
}
