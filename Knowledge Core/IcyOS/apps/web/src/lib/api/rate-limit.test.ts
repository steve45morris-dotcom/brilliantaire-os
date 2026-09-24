import { describe, it, expect } from 'vitest';
import {
  MemoryRateLimitStore,
  checkRateLimit,
  getClientIp,
  isRateLimited,
  rateLimitResponse,
  resolveTier,
} from './rate-limit';

const rule = { limit: 3, windowMs: 60_000 };

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
    expect(resolveTier('/api/briefings/generate', 'POST')).toBe('ai');
    expect(resolveTier('/api/timelines/regenerate', 'POST')).toBe('ai');
    expect(resolveTier('/api/missions/create', 'POST')).toBe('write');
    expect(resolveTier('/api/missions/create', 'GET')).toBe('read');
  });

  it('should only limit API routes and exempt health checks', () => {
    expect(isRateLimited('/api/missions/create')).toBe(true);
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
