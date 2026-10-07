import { describe, it, expect, vi } from 'vitest';
import { Breadcrumbs } from './breadcrumbs';
import { mobileNavItems, isActive } from './bottom-nav';
import React from 'react';

// Mock pathnames
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/inbox',
}));

describe('AppShell Layout & Nav Primitives', () => {
  it('should compile breadcrumbs structure components', () => {
    expect(Breadcrumbs).toBeDefined();
  });

  it('puts every page on the phone menu, with Billing reached from Settings', () => {
    expect(mobileNavItems.map((i) => i.href)).toEqual(['/dashboard', '/inbox', '/timeline', '/focus', '/pjk', '/review', '/knowledge', '/settings']);
  });

  it('marks a menu item active on its page and pages under it only', () => {
    expect(isActive('/review', '/review')).toBe(true);
    expect(isActive('/settings/tokens', '/settings')).toBe(true);
    expect(isActive('/reviewer', '/review')).toBe(false);
  });
});
