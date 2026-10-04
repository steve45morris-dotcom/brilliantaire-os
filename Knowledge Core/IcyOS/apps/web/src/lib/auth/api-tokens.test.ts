import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { NextRequest } from 'next/server';
import { ACCESS_JWT_TTL_SECONDS, expiresAt, generateToken, hashToken, signAccessJwt } from './api-tokens';
import { TOKEN_PATTERN, acceptsApiToken, bearerToken } from './token-routes';

const ID = '00000000-0000-4000-8000-000000000001';

// vi.mock factories run before the rest of the file, so their state is hoisted too.
const { getUser, sessionDb, resolve, subscription, createClient } = vi.hoisted(() => {
  const getUser = vi.fn();
  return { getUser, sessionDb: { auth: { getUser } }, resolve: vi.fn(), subscription: vi.fn(), createClient: vi.fn() };
});
vi.mock('./supabase-server', () => ({ createServerSupabaseClient: async () => sessionDb }));
vi.mock('../billing/server', () => ({ getServiceDb: () => ({ rpc: resolve }) }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => {
    createClient(...args);
    return { from: () => ({ select: () => ({ maybeSingle: subscription }) }) };
  },
}));

describe('token material', () => {
  it('generates unguessable tokens and keeps only a SHA-256 hash and a short prefix', () => {
    const a = generateToken();
    const b = generateToken();

    expect(a.token).toMatch(TOKEN_PATTERN);
    expect(a.token).not.toBe(b.token);
    expect(a.hash).toBe(createHash('sha256').update(a.token).digest('hex'));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.prefix).toBe(a.token.slice(0, 12));
    expect(a.prefix).toMatch(/^icy_[A-Za-z0-9_-]{4,12}$/); // what create_api_token() accepts
    expect(hashToken(a.token)).toBe(a.hash);
  });

  it('signs a short-lived Supabase access JWT for the token owner', () => {
    const jwt = signAccessJwt('auth-1', 'secret', 1_000);
    const [header, payload, signature] = jwt.split('.');

    expect(JSON.parse(Buffer.from(header, 'base64url').toString())).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(JSON.parse(Buffer.from(payload, 'base64url').toString())).toEqual({
      sub: 'auth-1',
      role: 'authenticated',
      aud: 'authenticated',
      iss: 'icyos-api-token',
      iat: 1_000,
      exp: 1_000 + ACCESS_JWT_TTL_SECONDS,
    });
    expect(signature).toBe(createHmac('sha256', 'secret').update(`${header}.${payload}`).digest('base64url'));
  });

  it('computes expiry dates, or none', () => {
    expect(expiresAt(30, Date.parse('2026-10-04T00:00:00Z'))).toBe('2026-11-03T00:00:00.000Z');
    expect(expiresAt(null)).toBeNull();
  });
});

describe('which requests can use a token', () => {
  it('reads only "Bearer icy_…" authorization headers', () => {
    const h = (value: string) => new Headers({ authorization: value });
    expect(bearerToken(h('Bearer icy_abc'))).toBe('icy_abc');
    expect(bearerToken(h('bearer   icy_abc '))).toBe('icy_abc');
    expect(bearerToken(h('Bearer eyJhbGciOi.supabase.jwt'))).toBeNull();
    expect(bearerToken(h('Basic icy_abc'))).toBeNull();
    expect(bearerToken(new Headers())).toBeNull();
  });

  it('allows the work routes and nothing else', () => {
    for (const path of [
      '/api/workspace',
      '/api/projects',
      `/api/projects/${ID}`,
      `/api/projects/${ID}/missions`,
      `/api/missions/${ID}`,
      `/api/missions/${ID}/steps`,
      `/api/actions/${ID}`,
      '/api/actions/complete',
    ]) {
      expect(acceptsApiToken(path), path).toBe(true);
    }
    for (const path of [
      '/api/tokens',
      `/api/tokens/${ID}`,
      '/api/onboarding',
      '/api/billing/checkout',
      '/api/billing/portal',
      '/api/knowledge/not-a-note',
      `/api/knowledge/${ID}/extra`,
      `/api/projects/${ID}/missions/extra`,
      '/api/workspace/',
      '/dashboard',
    ]) {
      expect(acceptsApiToken(path), path).toBe(false);
    }
  });
});

describe('authenticateRequest', () => {
  const TOKEN = generateToken().token;
  const req = (path: string, token?: string) =>
    new NextRequest(`http://localhost${path}`, token ? { headers: { authorization: `Bearer ${token}` } } : undefined);
  let authenticateRequest: typeof import('./request-auth').authenticateRequest;

  beforeEach(async () => {
    vi.stubEnv('SUPABASE_JWT_SECRET', 'jwt-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://db.example.com');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('BILLING_ENFORCEMENT', '');
    getUser.mockReset().mockResolvedValue({ data: { user: { id: 'session-user' } } });
    resolve.mockReset().mockResolvedValue({ data: [{ token_id: 'tok-1', auth_id: 'token-owner' }], error: null });
    subscription.mockReset().mockResolvedValue({ data: { status: 'active', trial_ends_at: null }, error: null });
    createClient.mockReset();
    authenticateRequest = (await import('./request-auth')).authenticateRequest;
  });

  afterEach(() => vi.unstubAllEnvs());

  it('uses the browser session when there is no token', async () => {
    const auth = await authenticateRequest(req('/api/workspace'));
    expect(auth).toMatchObject({ authUserId: 'session-user', via: 'session', db: sessionDb });

    getUser.mockResolvedValue({ data: { user: null } });
    expect(((await authenticateRequest(req('/api/workspace'))) as Response).status).toBe(401);
  });

  it('acts as the token owner through a Supabase client carrying a signed JWT', async () => {
    const auth = await authenticateRequest(req('/api/workspace', TOKEN));

    expect(auth).toMatchObject({ authUserId: 'token-owner', via: 'token' });
    expect(resolve).toHaveBeenCalledWith('resolve_api_token', { token_hash: hashToken(TOKEN) });
    const [url, key, options] = createClient.mock.calls[0];
    expect([url, key]).toEqual(['https://db.example.com', 'anon']);
    const jwt = (options as any).global.headers.Authorization.replace('Bearer ', '');
    const [header, payload, signature] = jwt.split('.');
    expect(JSON.parse(Buffer.from(payload, 'base64url').toString()).sub).toBe('token-owner');
    expect(signature).toBe(createHmac('sha256', 'jwt-secret').update(`${header}.${payload}`).digest('base64url'));
    expect(getUser).not.toHaveBeenCalled();
  });

  it('rejects tokens on other routes, malformed tokens and unknown, revoked or expired tokens', async () => {
    expect(((await authenticateRequest(req('/api/tokens', TOKEN))) as Response).status).toBe(403);
    expect(((await authenticateRequest(req('/api/workspace', 'icy_short'))) as Response).status).toBe(401);
    resolve.mockResolvedValue({ data: [], error: null });
    const response = (await authenticateRequest(req('/api/workspace', TOKEN))) as Response;
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe('invalid_token');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('applies the subscription gate to token requests', async () => {
    subscription.mockResolvedValue({ data: { status: 'canceled', trial_ends_at: null }, error: null });
    expect(((await authenticateRequest(req('/api/workspace', TOKEN))) as Response).status).toBe(402);

    vi.stubEnv('BILLING_ENFORCEMENT', 'off');
    expect(await authenticateRequest(req('/api/workspace', TOKEN))).toMatchObject({ via: 'token' });
  });

  it('returns 503 without leaking details when tokens are not configured', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('SUPABASE_JWT_SECRET', '');
    const response = (await authenticateRequest(req('/api/workspace', TOKEN))) as Response;
    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('SUPABASE_JWT_SECRET');
    expect(resolve).not.toHaveBeenCalled();
  });
});
