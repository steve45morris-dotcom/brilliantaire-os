'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent';
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = 'px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-200 ';
  const variants = {
    primary: 'bg-pink-600 hover:bg-pink-700 text-white',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100',
    accent: 'bg-cyan-500 hover:bg-cyan-600 text-zinc-950',
  };
  
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
