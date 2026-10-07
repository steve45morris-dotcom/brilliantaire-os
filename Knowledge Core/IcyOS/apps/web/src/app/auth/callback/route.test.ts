import { describe, it, expect, vi, beforeEach } from 'vitest';

const exchangeCodeForSession = vi.fn();
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: () => [], set: () => {} }) }));
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { exchangeCodeForSession } }),
}));

const { GET } = await import('./route');

async function redirectFor(query: string): Promise<string | null> {
  const res = await GET(new Request(`https://app.example.com/auth/callback?code=abc${query}`));
  return res.headers.get('location');
}

describe('auth callback', () => {
  beforeEach(() => {
    exchangeCodeForSession.mockReset();
    exchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it('sends a signed-in user to the requested page on this site', async () => {
    await expect(redirectFor('&next=%2Fbilling%3Ftab%3Dplans')).resolves.toBe('https://app.example.com/billing?tab=plans');
  });

  it('defaults to the home page', async () => {
    await expect(redirectFor('')).resolves.toBe('https://app.example.com/');
  });

  it.each(['@evil.com', '//evil.com', '/\\evil.com', 'https://evil.com', 'evil.com'])(
    'never leaves the site for next=%s',
    async (next) => {
      await expect(redirectFor(`&next=${encodeURIComponent(next)}`)).resolves.toBe('https://app.example.com/');
    }
  );

  it('sends a failed sign-in back to login', async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error('expired') });
    await expect(redirectFor('&next=%2Fbilling')).resolves.toBe('https://app.example.com/login?error=auth_callback_failed');
  });
});
