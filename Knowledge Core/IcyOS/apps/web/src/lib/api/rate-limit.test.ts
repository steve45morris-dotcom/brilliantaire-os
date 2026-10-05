import { describe, it, expect, vi } from 'vitest';
import {
  MemoryRateLimitStore,
  UpstashRateLimitStore,
  checkRateLimit,
  createRateLimitStore,
  getClientIp,
  isRateLimited,
  rateLimitResponse,
  resolveTier,
} from './rate-limit';

const rule = { limit: 3, windowMs: 60_000 };

/** A fake Upstash REST endpoint that runs the INCR/PEXPIRE script in memory. */
function fakeUpstash(opts: { fail?: boolean } = {}) {
  const keys = new Map<string, { count: number; expiresAt: number }>();
  const calls: unknown[][] = [];
  const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
    const command = JSON.parse(String(init?.body)) as unknown[];
    calls.push(command);
    if (opts.fail) return new Response('nope', { status: 503 });
    const [, , , key, windowMs] = command as [string, string, number, string, string];
    const now = Date.now();
    let entry = keys.get(key);
    if (!entry || entry.expiresAt <= now) entry = { count: 0, expiresAt: now + Number(windowMs) };
    entry.count += 1;
    keys.set(key, entry);
    return Response.json({ result: [entry.count, entry.expiresAt - now] });
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls, keys };
}

describe('Upstash rate limit store', () => {
  it('sends one atomic EVAL per increment with the prefixed key and window', async () => {
    const fake = fakeUpstash();
    const store = new UpstashRateLimitStore({ url: 'https://example.upstash.io/', token: 't', prefix: 'icy', fetchImpl: fake.fetchImpl });

    const first = await store.increment('ip:1.2.3.4', 60_000, Date.now());
    const second = await store.increment('ip:1.2.3.4', 60_000, Date.now());

    expect(first.count).toBe(1);
    expect(second.count).toBe(2);
    expect(fake.calls[0][0]).toBe('EVAL');
    expect(fake.calls[0][2]).toBe(1);
    expect(fake.calls[0][3]).toBe('icy:ip:1.2.3.4');
    expect(fake.calls[0][4]).toBe('60000');
    expect(fake.fetchImpl).toHaveBeenCalledWith('https://example.upstash.io', expect.objectContaining({ method: 'POST' }));
  });

  it('derives resetAt from the key TTL so every instance agrees on the window', async () => {
    const fake = fakeUpstash();
    const store = new UpstashRateLimitStore({ url: 'https://example.upstash.io', token: 't', fetchImpl: fake.fetchImpl });
    const now = Date.now();

    const result = await store.increment('user:a', 60_000, now);

    expect(result.resetAt).toBeGreaterThan(now + 59_000);
    expect(result.resetAt).toBeLessThanOrEqual(now + 60_000);
  });

  it('fails open when Upstash is unreachable', async () => {
    const fake = fakeUpstash({ fail: true });
    const store = new UpstashRateLimitStore({ url: 'https://example.upstash.io', token: 't', fetchImpl: fake.fetchImpl });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await checkRateLimit(store, 'ip:x', rule, 0);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });

  it('is chosen by the factory only when both Upstash variables are set', () => {
    expect(createRateLimitStore({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io', UPSTASH_REDIS_REST_TOKEN: 't' })).toBeInstanceOf(UpstashRateLimitStore);
    expect(createRateLimitStore({ UPSTASH_REDIS_REST_URL: 'https://x.upstash.io' })).toBeInstanceOf(MemoryRateLimitStore);
    expect(createRateLimitStore({})).toBeInstanceOf(MemoryRateLimitStore);
  });

  it('warns once in production when falling back to the memory store', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    createRateLimitStore({ NODE_ENV: 'production' });
    expect(warn).toHaveBeenCalledOnce();
    warn.mockClear();
    createRateLimitStore({ NODE_ENV: 'development' });
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('Rate Limiting', () => {
  it('should allow requests up to the limit and block the next', async () => {
    const store = new MemoryRateLimitStore();
    const now = 1_000_000;

    for (let i = 1; i <= 3; i++) {
      const result = await checkRateLimit(store, 'user:a', rule, now);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3 - i);
    }

    const blocked = await checkRateLimit(store, 'user:a', rule, now + 15_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBe(45);
  });

  it('should reset the counter once the window elapses', async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 4; i++) await checkRateLimit(store, 'user:a', rule, 0);

    const result = await checkRateLimit(store, 'user:a', rule, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('should count keys independently', async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 4; i++) await checkRateLimit(store, 'user:a', rule, 0);

    const other = await checkRateLimit(store, 'user:b', rule, 0);
    expect(other.allowed).toBe(true);
  });

  it('should stay bounded when the key cap is reached', async () => {
    const store = new MemoryRateLimitStore(2);
    await checkRateLimit(store, 'a', rule, 0);
    await checkRateLimit(store, 'b', rule, 0);
    await checkRateLimit(store, 'c', rule, 0);

    // 'a' was evicted, so it starts a fresh window.
    const result = await checkRateLimit(store, 'a', rule, 0);
    expect(result.remaining).toBe(2);
  });

  it('should classify routes into tiers', () => {
    expect(resolveTier('/api/inbox/sort', 'POST')).toBe('ai');
    expect(resolveTier('/api/projects', 'POST')).toBe('write');
    expect(resolveTier('/api/knowledge', 'GET')).toBe('read');
  });

  it('should only limit API routes and exempt health checks', () => {
    expect(isRateLimited('/api/projects')).toBe(true);
    expect(isRateLimited('/api/health')).toBe(false);
    expect(isRateLimited('/dashboard')).toBe(false);
  });

  it('should resolve the client IP from proxy headers', () => {
    expect(getClientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe('203.0.113.7');
    expect(getClientIp(new Headers({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
    expect(getClientIp(new Headers())).toBe('unknown');
  });

  it('should return a 429 envelope with retry headers', async () => {
    const response = rateLimitResponse({
      allowed: false,
      limit: 10,
      remaining: 0,
      resetAt: 120_000,
      retryAfterSeconds: 30,
    });
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('rate_limited');
  });
});
