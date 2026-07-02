'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Inbox, Calendar, Play, Settings 
} from 'lucide-react';

const mobileNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/timeline', label: 'Timeline', icon: Calendar },
  { href: '/focus', label: 'Focus', icon: Play },
  { href: '/settings', label: 'Config', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 h-16 bg-zinc-950 border-t border-zinc-900 flex md:hidden items-center justify-around px-4 z-40">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors duration-200 ${
              active ? 'text-pink-500' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
