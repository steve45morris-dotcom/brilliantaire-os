'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Calendar, Play, BarChart3, BookOpen, Settings
} from 'lucide-react';

// Every page the sidebar has, except Billing, which is linked from Settings
// to keep the bar readable on narrow phones. Labels are short enough for a
// 320px screen; `name` is the page's full name, for screen readers.
export const mobileNavItems: { href: string; label: string; name?: string; icon: typeof Inbox }[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/timeline', label: 'Plan', name: 'Timeline', icon: Calendar },
  { href: '/focus', label: 'Focus', icon: Play },
  { href: '/review', label: 'Review', icon: BarChart3 },
  { href: '/knowledge', label: 'Notes', name: 'Knowledge', icon: BookOpen },
  { href: '/settings', label: 'Config', name: 'Settings', icon: Settings },
];

/** A menu item is active on its page and the pages under it. */
export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="fixed bottom-0 inset-x-0 h-16 bg-zinc-950 border-t border-zinc-900 flex md:hidden items-stretch px-1 z-40">
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
              active ? 'text-pink-500' : 'text-zinc-500 hover:text-zinc-300'
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
