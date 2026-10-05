'use client';

import { Breadcrumbs } from './breadcrumbs';
import { Search, Bell } from 'lucide-react';

export function TopNav() {
  return (
    <header className="h-16 border-b border-[#1e2030] bg-[#08090e]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      <Breadcrumbs />
      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-2.5 text-[#4a4d5a]" size={16} />
          <input
            type="text"
            placeholder="Search commands... (⌘K)"
            className="pl-9 pr-4 py-1.5 bg-[#12131a] border border-[#1e2030] text-xs text-[#b8b4ac] rounded-md focus:outline-none focus:border-[#c9a84c]/40 w-56"
            disabled
          />
        </div>

        <button className="p-2 text-[#4a4d5a] hover:text-[#d0ccc4] transition-colors relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-[#c9a84c] rounded-full" />
        </button>

        <button className="flex items-center gap-2 p-1 text-[#4a4d5a] hover:text-[#d0ccc4] transition-colors" aria-label="User Profile">
          <div className="h-7 w-7 rounded-full bg-[#12131a] border border-[#1e2030] flex items-center justify-center text-xs font-bold text-[#c9a84c]">
            A
          </div>
        </button>
      </div>
    </header>
  );
}
