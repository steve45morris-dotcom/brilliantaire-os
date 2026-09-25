import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const getUser = vi.fn();
const subscriptionLookup = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser },
    from: () => ({ select: () => ({ maybeSingle: subscriptionLookup }) }),
  }),
}));

const ACTIVE = { data: { status: 'active', trial_ends_at: null }, error: null };

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
    subscriptionLookup.mockReset();
    subscriptionLookup.mockResolvedValue(ACTIVE);
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

describe('Auth Middleware Subscription Gate', () => {
  const trialEnding = (offsetMs: number) => ({
    data: { status: 'trialing', trial_ends_at: new Date(Date.now() + offsetMs).toISOString() },
    error: null,
  });

  beforeEach(() => {
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: 'user-2' } } });
    subscriptionLookup.mockReset();
    delete process.env.BILLING_ENFORCEMENT;
  });

  it('should let users in during an active trial', async () => {
    const updateSession = await loadMiddleware();
    subscriptionLookup.mockResolvedValue(trialEnding(86_400_000));

    const response = await updateSession(new NextRequest('http://localhost/dashboard'));
    expect(response.status).toBe(200);
  });

  it('should send pages to /billing and return 402 from the API once the trial ends', async () => {
    const updateSession = await loadMiddleware();
    subscriptionLookup.mockResolvedValue(trialEnding(-1000));

    const page = await updateSession(new NextRequest('http://localhost/timeline?view=week'));
    expect(page.status).toBe(307);
    expect(page.headers.get('location')).toBe('http://localhost/billing');

    const api = await updateSession(apiRequest('/api/missions/create', '203.0.113.20'));
    expect(api.status).toBe(402);
    expect((await api.json()).error.code).toBe('payment_required');
  });

  it('should keep billing reachable and fail closed when the lookup errors', async () => {
    const updateSession = await loadMiddleware();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    subscriptionLookup.mockResolvedValue({ data: null, error: { message: 'relation does not exist' } });

    expect((await updateSession(new NextRequest('http://localhost/billing'))).status).toBe(200);
    expect((await updateSession(apiRequest('/api/billing/checkout', '203.0.113.21'))).status).toBe(200);
    expect((await updateSession(new NextRequest('http://localhost/dashboard'))).status).toBe(307);
  });

  it('should let the Stripe webhook through without a session or rate limit', async () => {
    const updateSession = await loadMiddleware();
    getUser.mockResolvedValue({ data: { user: null } });

    const response = await updateSession(apiRequest('/api/billing/webhook', '203.0.113.22'));
    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBeNull();
    expect(subscriptionLookup).not.toHaveBeenCalled();
  });

  it('should skip the gate when BILLING_ENFORCEMENT=off', async () => {
    const updateSession = await loadMiddleware();
    process.env.BILLING_ENFORCEMENT = 'off';
    subscriptionLookup.mockResolvedValue({ data: null, error: null });

    const response = await updateSession(new NextRequest('http://localhost/dashboard'));
    expect(response.status).toBe(200);
    delete process.env.BILLING_ENFORCEMENT;
  });
});
