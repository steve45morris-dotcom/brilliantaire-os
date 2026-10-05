'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function Breadcrumbs() {
  const pathname = usePathname() || '';
  const segments = pathname.split('/').filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-xs text-[#4a4d5a] font-medium select-none">
      <span>IcyOS</span>
      {segments.map((segment, idx) => (
        <React.Fragment key={idx}>
          <span>/</span>
          <span className="text-[#b8b4ac] capitalize">{segment}</span>
        </React.Fragment>
      ))}
    </div>
  );
}
