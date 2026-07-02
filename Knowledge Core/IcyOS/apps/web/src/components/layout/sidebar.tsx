'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Inbox, Calendar, Play, BarChart3, BookOpen, Settings 
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/timeline', label: 'Timeline', icon: Calendar },
  { href: '/focus', label: 'Focus', icon: Play },
  { href: '/review', label: 'Review', icon: BarChart3 },
  { href: '/knowledge', label: 'Knowledge', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-900 hidden md:flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-zinc-900">
        <span className="text-lg font-bold text-zinc-100 uppercase tracking-widest">IcyOS</span>
      </div>
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-semibold transition-colors duration-200 ${
                active 
                  ? 'bg-pink-600 text-white' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-zinc-900 text-xs text-zinc-600 select-none text-center">
        v1.0.0 | I build before burning.
      </div>
    </aside>
  );
}
