import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const getUser = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));

async function loadMiddleware() {
  vi.resetModules();
  return (await import('./middleware')).updateSession;
}

function apiRequest(path: string, ip: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  });
}

describe('Auth Middleware Rate Limiting', () => {
  beforeEach(() => {
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  it('should throttle AI generation routes per user', async () => {
    const updateSession = await loadMiddleware();

    for (let i = 0; i < 10; i++) {
      const response = await updateSession(apiRequest('/api/briefings/generate', '203.0.113.1'));
      expect(response.status).toBe(200);
    }

    const blocked = await updateSession(apiRequest('/api/briefings/generate', '203.0.113.1'));
    expect(blocked.status).toBe(429);

    // Other tiers keep their own budget.
    const write = await updateSession(apiRequest('/api/missions/create', '203.0.113.1'));
    expect(write.status).toBe(200);
    expect(write.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('should block an IP flood before calling Supabase', async () => {
    const updateSession = await loadMiddleware();
    getUser.mockResolvedValue({ data: { user: null } });

    for (let i = 0; i < 300; i++) {
      await updateSession(apiRequest('/api/missions/create', '198.51.100.9'));
    }
    const callsBefore = getUser.mock.calls.length;

    const blocked = await updateSession(apiRequest('/api/missions/create', '198.51.100.9'));
    expect(blocked.status).toBe(429);
    expect(getUser.mock.calls.length).toBe(callsBefore);
  });

  it('should not rate limit page routes', async () => {
    const updateSession = await loadMiddleware();
    const request = new NextRequest('http://localhost/dashboard');
    const response = await updateSession(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBeNull();
  });
});
