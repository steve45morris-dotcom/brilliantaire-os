'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Inbox, Calendar, Play, BarChart3, BookOpen, Settings, CreditCard, Activity, ClipboardList, Scale, Terminal
} from 'lucide-react';
import { isActive } from './bottom-nav';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', short: 'OPS', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', short: 'INBOX', icon: Inbox },
  { href: '/timeline', label: 'Timeline', short: 'PLAN', icon: Calendar },
  { href: '/focus', label: 'Focus', short: 'FOCUS', icon: Play },
  { href: '/review', label: 'Review', short: 'REVIEW', icon: BarChart3 },
  { href: '/knowledge', label: 'Knowledge', short: 'NOTES', icon: BookOpen },
  { href: '/pjk', label: 'P.J.K.', short: 'P.J.K.', icon: Terminal },
  { href: '/status', label: 'Status', short: 'STATUS', icon: Activity },
  { href: '/audit-log', label: 'Audit Log', short: 'LEDGER', icon: ClipboardList },
  { href: '/billing', label: 'Billing', short: 'BILLING', icon: CreditCard },
  { href: '/legal', label: 'Legal', short: 'LEGAL', icon: Scale },
  { href: '/settings', label: 'Settings', short: 'CONFIG', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Primary"
      className="w-[76px] hidden md:flex flex-col h-screen sticky top-0 shrink-0 relative"
      style={{ background: 'linear-gradient(180deg, #0a0b10 0%, #08090e 100%)', borderRight: '1px solid #1e2030' }}
    >
      <span aria-hidden className="absolute top-0 bottom-0 right-0 w-px" style={{ background: 'linear-gradient(180deg, rgba(201,168,76,0.35), transparent 30%, transparent 70%, rgba(201,168,76,0.2))' }} />

      {/* Mark */}
      <Link href="/dashboard" aria-label="IcyOS home" className="h-14 flex items-center justify-center border-b border-[#1e2030] group">
        <span
          className="w-9 h-9 rounded-md flex items-center justify-center text-[#c9a84c] font-bold text-[15px] tracking-[0.05em] transition-all group-hover:shadow-[0_0_18px_rgba(201,168,76,0.35)]"
          style={{ fontFamily: "'Cormorant Garamond', serif", background: 'rgba(201,168,76,0.08)', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.35)' }}
        >
          IC
        </span>
      </Link>

      {/* Rail */}
      <nav className="flex-1 flex flex-col items-stretch py-3 gap-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-current={active ? 'page' : undefined}
              className="group relative mx-2 flex flex-col items-center justify-center gap-1 h-[52px] rounded-md transition-all"
              style={{
                color: active ? '#c9a84c' : '#6b6e7a',
                background: active ? 'rgba(201,168,76,0.09)' : 'transparent',
                boxShadow: active ? 'inset 0 0 0 1px rgba(201,168,76,0.3), 0 0 16px rgba(201,168,76,0.08)' : 'none',
              }}
            >
              {active && <span aria-hidden className="absolute left-[-9px] top-3 bottom-3 w-[2px] rounded-full bg-[#c9a84c]" style={{ boxShadow: '0 0 8px rgba(201,168,76,0.8)' }} />}
              {!active && <span aria-hidden className="pointer-events-none absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(201,168,76,0.05)', boxShadow: 'inset 0 0 0 1px rgba(201,168,76,0.15)' }} />}
              <Icon size={18} className="relative transition-colors group-hover:text-[#d0ccc4]" style={active ? { color: '#c9a84c' } : undefined} />
              <span className="relative font-tactical text-[8px] tracking-[0.14em] leading-none transition-colors group-hover:text-[#b8b4ac]" style={{ color: active ? '#c9a84c' : '#4a4d5a' }}>
                {item.short}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#1e2030] py-3 flex flex-col items-center gap-1.5 select-none" title="v1.0.0 | I build before burning.">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 hud-pulse-green" style={{ boxShadow: '0 0 6px rgba(52,211,153,0.8)' }} />
        <span className="font-tactical text-[8px] tracking-[0.18em] text-[#4a4d5a]">V1.0</span>
      </div>
    </aside>
  );
}
