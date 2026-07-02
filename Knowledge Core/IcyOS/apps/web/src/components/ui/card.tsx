'use client';

import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 bg-zinc-900 border border-zinc-800 rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );
}
