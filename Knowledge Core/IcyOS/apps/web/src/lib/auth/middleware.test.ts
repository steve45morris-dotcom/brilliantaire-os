import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const getUser = vi.fn();
const subscriptionLookup = vi.fn();
const workspaceLookup = vi.fn();
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { getUser },
    from: (table: string) =>
      table === 'subscriptions'
        ? { select: () => ({ maybeSingle: subscriptionLookup }) }
        : { select: () => ({ limit: () => ({ maybeSingle: workspaceLookup }) }) },
  }),
}));

beforeEach(() => {
  workspaceLookup.mockReset();
  workspaceLookup.mockResolvedValue({ data: { id: 'ws-1' }, error: null });
});

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
      const response = await updateSession(apiRequest('/api/inbox/sort', '203.0.113.1'));
      expect(response.status).toBe(200);
    }

    const blocked = await updateSession(apiRequest('/api/inbox/sort', '203.0.113.1'));
    expect(blocked.status).toBe(429);

    // Other tiers keep their own budget.
    const write = await updateSession(apiRequest('/api/projects', '203.0.113.1'));
    expect(write.status).toBe(200);
    expect(write.headers.get('X-RateLimit-Limit')).toBe('60');
  });

  it('should block an IP flood before calling Supabase', async () => {
    const updateSession = await loadMiddleware();
    getUser.mockResolvedValue({ data: { user: null } });

    for (let i = 0; i < 300; i++) {
      await updateSession(apiRequest('/api/projects', '198.51.100.9'));
    }
    const callsBefore = getUser.mock.calls.length;

    const blocked = await updateSession(apiRequest('/api/projects', '198.51.100.9'));
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

    const api = await updateSession(apiRequest('/api/projects', '203.0.113.20'));
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

  it('should serve the Terms and Privacy Policy to signed-out and locked-out users', async () => {
    const updateSession = await loadMiddleware();
    getUser.mockResolvedValue({ data: { user: null } });
    for (const path of ['/terms', '/privacy']) {
      expect((await updateSession(new NextRequest(`http://localhost${path}`))).status).toBe(200);
    }

    getUser.mockResolvedValue({ data: { user: { id: 'user-3' } } });
    subscriptionLookup.mockResolvedValue(trialEnding(-1000));
    expect((await updateSession(new NextRequest('http://localhost/terms'))).status).toBe(200);
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

describe('Auth Middleware First Run', () => {
  const page = (path: string, cookie?: string) =>
    new NextRequest(`http://localhost${path}`, cookie ? { headers: { cookie } } : undefined);

  beforeEach(() => {
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: { id: 'user-4' } } });
    subscriptionLookup.mockReset();
    subscriptionLookup.mockResolvedValue(ACTIVE);
  });

  it('should send a user without a workspace to /onboarding', async () => {
    const updateSession = await loadMiddleware();
    workspaceLookup.mockResolvedValue({ data: null, error: null });

    for (const path of ['/', '/dashboard', '/timeline']) {
      const response = await updateSession(page(path));
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/onboarding');
    }
  });

  it('should leave onboarding, billing, legal pages and the API reachable before setup', async () => {
    const updateSession = await loadMiddleware();
    workspaceLookup.mockResolvedValue({ data: null, error: null });

    for (const path of ['/onboarding', '/billing', '/terms', '/privacy']) {
      expect((await updateSession(page(path))).status).toBe(200);
    }
    expect((await updateSession(apiRequest('/api/onboarding', '203.0.113.40'))).status).toBe(200);
    expect(workspaceLookup).not.toHaveBeenCalled();
  });

  it('should remember a set-up user in a cookie and skip the lookup next time', async () => {
    const updateSession = await loadMiddleware();

    const first = await updateSession(page('/dashboard'));
    expect(first.status).toBe(200);
    expect(first.cookies.get('icyos_onboarded')?.value).toBe('user-4');
    expect(workspaceLookup).toHaveBeenCalledTimes(1);

    expect((await updateSession(page('/dashboard', 'icyos_onboarded=user-4'))).status).toBe(200);
    expect(workspaceLookup).toHaveBeenCalledTimes(1);
  });

  it('should check again when a different account signs in on the same browser', async () => {
    const updateSession = await loadMiddleware();
    workspaceLookup.mockResolvedValue({ data: null, error: null });

    const response = await updateSession(page('/dashboard', 'icyos_onboarded=someone-else'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/onboarding');
  });

  it('should let the request through when the workspace lookup fails', async () => {
    const updateSession = await loadMiddleware();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    workspaceLookup.mockResolvedValue({ data: null, error: { message: 'timeout' } });

    const response = await updateSession(page('/dashboard'));
    expect(response.status).toBe(200);
    expect(response.cookies.get('icyos_onboarded')).toBeUndefined();
  });

  it('should send a locked-out user to billing before onboarding', async () => {
    const updateSession = await loadMiddleware();
    subscriptionLookup.mockResolvedValue({ data: { status: 'canceled', trial_ends_at: null }, error: null });
    workspaceLookup.mockResolvedValue({ data: null, error: null });

    const response = await updateSession(page('/dashboard'));
    expect(response.headers.get('location')).toBe('http://localhost/billing');
  });
});

describe('Auth Middleware Personal Access Tokens', () => {
  const TOKEN = 'icy_' + 'a'.repeat(43);
  const OTHER = 'icy_' + 'b'.repeat(43);
  const tokenRequest = (path: string, token: string, ip: string, method = 'GET') =>
    new NextRequest(`http://localhost${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'x-forwarded-for': ip },
    });

  beforeEach(() => {
    getUser.mockReset();
    getUser.mockResolvedValue({ data: { user: null } });
    subscriptionLookup.mockReset();
  });

  it('passes token requests on work routes to the route without a session', async () => {
    const updateSession = await loadMiddleware();
    const response = await updateSession(tokenRequest('/api/workspace', TOKEN, '203.0.113.50'));

    expect(response.status).toBe(200);
    expect(response.headers.get('X-RateLimit-Limit')).toBe('120');
    expect(getUser).not.toHaveBeenCalled();
    expect(subscriptionLookup).not.toHaveBeenCalled();
  });

  it('treats a token on any other route like a signed-out request', async () => {
    const updateSession = await loadMiddleware();
    for (const path of ['/api/tokens', '/api/billing/checkout', '/api/onboarding', '/dashboard']) {
      const response = await updateSession(tokenRequest(path, TOKEN, '203.0.113.51', 'POST'));
      expect(response.status, path).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost/login');
    }
  });

  it('rate limits each token separately', async () => {
    const updateSession = await loadMiddleware();
    for (let i = 0; i < 60; i++) {
      await updateSession(tokenRequest('/api/projects', TOKEN, '203.0.113.52', 'POST'));
    }
    expect((await updateSession(tokenRequest('/api/projects', TOKEN, '203.0.113.52', 'POST'))).status).toBe(429);
    expect((await updateSession(tokenRequest('/api/projects', OTHER, '203.0.113.52', 'POST'))).status).toBe(200);
  });
});
