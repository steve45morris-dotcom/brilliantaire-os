'use client';

import React from 'react';

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`px-4 py-2 min-h-[44px] bg-[#0e0f16] border border-[#1e2030] rounded-xl text-base text-[#d0ccc4] focus:outline-none focus:border-[#c9a84c]/40 transition-colors ${className}`}
      {...props}
    />
  );
}
