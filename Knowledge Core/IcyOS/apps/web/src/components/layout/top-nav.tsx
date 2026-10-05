'use client';

import { Breadcrumbs } from './breadcrumbs';
import { Search, Bell } from 'lucide-react';

export function TopNav() {
  return (
    <header
      className="relative h-14 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md"
      style={{ background: 'rgba(8,9,14,0.82)', borderBottom: '1px solid #1e2030' }}
    >
      <span aria-hidden className="absolute left-0 right-0 bottom-[-1px] h-px" style={{ background: 'linear-gradient(90deg, rgba(201,168,76,0.4), transparent 40%, transparent 60%, rgba(201,168,76,0.15))' }} />

      <Breadcrumbs />

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden sm:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a4d5a] pointer-events-none" size={13} />
          <input
            type="text"
            placeholder="Search commands"
            aria-label="Search commands"
            className="font-tactical pl-8 pr-14 h-9 w-60 bg-[#0a0b10] border border-[#1e2030] text-[11px] tracking-[0.06em] text-[#b8b4ac] placeholder:text-[#4a4d5a] rounded-md focus:outline-none focus:border-[#c9a84c]/40 disabled:opacity-70 transition-colors"
            disabled
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-tactical text-[9px] tracking-[0.12em] text-[#4a4d5a] px-1.5 py-[2px] rounded-[3px] border border-[#1e2030] bg-[#08090e]">
            ⌘K
          </span>
        </div>

        <button
          type="button"
          className="relative w-9 h-9 flex items-center justify-center rounded-md text-[#6b6e7a] hover:text-[#d0ccc4] hover:bg-[#12131a] transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-[#c9a84c] rounded-full hud-pulse-gold" />
        </button>

        <button type="button" className="flex items-center gap-2 pl-1 pr-1 h-9 rounded-md hover:bg-[#12131a] transition-colors" aria-label="User Profile">
          <span
            className="h-7 w-7 rounded-full flex items-center justify-center font-tactical text-[11px] font-bold text-[#c9a84c]"
            style={{ background: 'rgba(201,168,76,0.08)', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.4), 0 0 10px rgba(201,168,76,0.15)' }}
          >
            A
          </span>
          <span className="hidden lg:flex flex-col items-start leading-none">
            <span className="font-tactical text-[9px] tracking-[0.16em] text-[#4a4d5a]">OPERATOR</span>
            <span className="text-[12px] font-semibold text-[#d0ccc4] mt-0.5">Commander</span>
          </span>
        </button>
      </div>
    </header>
  );
}
