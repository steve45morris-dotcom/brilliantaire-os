import { describe, it, expect, vi } from 'vitest';
import { Breadcrumbs } from './breadcrumbs';
import React from 'react';

// Mock pathnames
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/inbox',
}));

describe('AppShell Layout & Nav Primitives', () => {
  it('should compile breadcrumbs structure components', () => {
    expect(Breadcrumbs).toBeDefined();
  });
});
