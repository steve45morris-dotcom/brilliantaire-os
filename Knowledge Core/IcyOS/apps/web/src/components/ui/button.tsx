'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 min-h-[44px] rounded-xl font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ';
  const variants = {
    primary: 'bg-[#c9a84c] hover:brightness-110 text-[#080808]',
    secondary: 'bg-[#12131a] hover:bg-[#1e2030] text-[#d0ccc4] border border-[#1e2030]',
    accent: 'bg-cyan-500 hover:bg-cyan-600 text-[#080808]',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
