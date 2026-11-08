'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Inbox, LayoutDashboard, MoreHorizontal, Play } from 'lucide-react';
import { isActive } from '../layout/bottom-nav';
import s from './daylight.module.css';

// The existing routes, grouped: seven up front, the rest under More.
const PRIMARY = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/timeline', label: 'Timeline' },
  { href: '/focus', label: 'Focus' },
  { href: '/review', label: 'Review' },
  { href: '/knowledge', label: 'Knowledge' },
  { href: '/pjk', label: 'P.J.K.' },
];
const MORE = [
  { href: '/status', label: 'Status' },
  { href: '/audit-log', label: 'Audit log' },
  { href: '/billing', label: 'Billing' },
  { href: '/legal', label: 'Legal' },
  { href: '/settings', label: 'Settings' },
];
const PHONE = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/focus', label: 'Focus', icon: Play },
  { href: '/review', label: 'Review', icon: BarChart3 },
];

/** Closes a popover on outside click or Escape. */
export function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);
  return ref;
}

function MoreMenu({ items, align, up = false, children }: { items: typeof MORE; align: 'left' | 'right'; up?: boolean; children: (open: boolean, toggle: () => void) => React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  return (
    <div ref={ref} className={s.moreWrap}>
      {children(open, () => setOpen((o) => !o))}
      {open && (
        <div role="menu" className={`${s.menu} ${align === 'right' ? s.menuRight : ''} ${up ? s.menuUp : ''}`}>
          {items.map((item) => (
            <Link key={item.href} href={item.href} role="menuitem" className={s.menuItem} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function DaylightTopBar({ soundOn, onToggleSound }: { soundOn: boolean; onToggleSound: () => void }) {
  const pathname = usePathname();
  return (
    <header className={s.top}>
      <Link href="/dashboard" className={s.brand} aria-label="IcyOS home">
        <span className={s.mark}>IC</span>
        IcyOS
      </Link>
      <nav aria-label="Primary" className={s.tabs}>
        {PRIMARY.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? 'page' : undefined}
            className={`${s.tab} ${isActive(pathname, item.href) ? s.tabOn : ''}`}
          >
            {item.label}
          </Link>
        ))}
        <MoreMenu items={MORE} align="left">
          {(open, toggle) => (
            <button type="button" className={s.tab} aria-haspopup="menu" aria-expanded={open} onClick={toggle} style={{ border: 0, background: 'transparent' }}>
              More ▾
            </button>
          )}
        </MoreMenu>
      </nav>
      <div className={s.right}>
        <button
          type="button"
          aria-pressed={soundOn}
          onClick={onToggleSound}
          className={`${s.sound} ${soundOn ? s.soundOn : ''}`}
        >
          <span className={s.soundDot} aria-hidden />
          {soundOn ? 'Sound on' : 'Sound off'}
        </button>
        <span className={s.userName}>Commander</span>
        <span className={s.avatar} aria-hidden>
          A
        </span>
      </div>
    </header>
  );
}

export function DaylightBottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={s.bnav}>
      {PHONE.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          aria-current={isActive(pathname, href) ? 'page' : undefined}
          className={`${s.bnavItem} ${isActive(pathname, href) ? s.bnavOn : ''}`}
        >
          <Icon size={18} aria-hidden />
          {label}
        </Link>
      ))}
      <MoreMenu items={[...PRIMARY.filter((i) => !PHONE.some((p) => p.href === i.href)), ...MORE]} align="right" up>
        {(open, toggle) => (
          <button type="button" className={s.bnavItem} aria-haspopup="menu" aria-expanded={open} onClick={toggle} style={{ width: '100%', height: '100%' }}>
            <MoreHorizontal size={18} aria-hidden />
            More
          </button>
        )}
      </MoreMenu>
    </nav>
  );
}
