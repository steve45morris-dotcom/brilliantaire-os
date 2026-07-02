'use client';

import { Breadcrumbs } from './breadcrumbs';
import { Search, Bell } from 'lucide-react';

export function TopNav() {
  return (
    <header className="h-16 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <Breadcrumbs />
      <div className="flex items-center gap-4">
        {/* Command Palette Placeholder */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Search commands... (⌘K)"
            className="pl-9 pr-4 py-1.5 bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-md focus:outline-none focus:border-zinc-700 w-56"
            disabled
          />
        </div>
        
        {/* Notifications Placeholder */}
        <button className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-pink-500 rounded-full" />
        </button>

        {/* User Menu Placeholder */}
        <button className="flex items-center gap-2 p-1 text-zinc-400 hover:text-zinc-200 transition-colors" aria-label="User Profile">
          <div className="h-7 w-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
            A
          </div>
        </button>
      </div>
    </header>
  );
}
