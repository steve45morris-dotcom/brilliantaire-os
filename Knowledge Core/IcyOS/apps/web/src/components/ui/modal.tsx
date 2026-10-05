'use client';

import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12131a] border border-[#1e2030] rounded-xl max-w-lg w-full p-6 relative">
        <h3 className="text-lg font-semibold text-[#d0ccc4] mb-4">{title}</h3>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#4a4d5a] hover:text-[#d0ccc4]"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
