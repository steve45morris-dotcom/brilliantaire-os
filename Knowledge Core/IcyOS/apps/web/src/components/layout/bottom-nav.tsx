'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Calendar, Play, BarChart3, BookOpen, Settings, Terminal
} from 'lucide-react';

export const mobileNavItems: { href: string; label: string; name?: string; icon: typeof Inbox }[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/timeline', label: 'Plan', name: 'Timeline', icon: Calendar },
  { href: '/focus', label: 'Focus', icon: Play },
  { href: '/pjk', label: 'P.J.K.', icon: Terminal },
  { href: '/review', label: 'Review', icon: BarChart3 },
  { href: '/knowledge', label: 'Notes', name: 'Knowledge', icon: BookOpen },
  { href: '/settings', label: 'Config', name: 'Settings', icon: Settings },
];

/** A menu item is active on its page and the pages under it. */
export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="fixed bottom-0 inset-x-0 h-16 bg-[#08090e] border-t border-[#1e2030] flex md:hidden items-stretch px-1 z-40">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            aria-label={item.name}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors duration-200 ${
              active ? 'text-[#c9a84c]' : 'text-[#4a4d5a] hover:text-[#b8b4ac]'
            }`}
          >
            <Icon size={20} />
            <span className="truncate max-w-full">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
