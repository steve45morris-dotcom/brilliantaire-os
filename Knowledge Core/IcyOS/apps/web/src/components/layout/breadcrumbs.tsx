'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function Breadcrumbs() {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);

  return (
    <div className="font-tactical flex items-center gap-2 text-[10px] tracking-[0.18em] select-none min-w-0">
      <span className="text-[#c9a84c] font-semibold">ICYOS</span>
      {segments.map((segment, idx) => {
        const last = idx === segments.length - 1;
        return (
          <React.Fragment key={idx}>
            <span className="text-[#2a2d3a]">//</span>
            <span className={`truncate ${last ? 'text-[#e0dcd2]' : 'text-[#6b6e7a]'}`}>{segment.replace(/-/g, ' ').toUpperCase()}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}
