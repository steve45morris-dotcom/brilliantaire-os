'use client';

import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-6 bg-[#12131a] border border-[#1e2030] rounded-xl shadow-md ${className}`}>
      {children}
    </div>
  );
}
