'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ';
  const variants = {
    primary: 'bg-pink-600 hover:bg-pink-700 text-white',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
    accent: 'bg-cyan-500 hover:bg-cyan-600 text-zinc-950',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
