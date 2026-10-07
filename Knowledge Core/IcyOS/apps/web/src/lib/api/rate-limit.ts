import { errorResponse } from './response';
import type { NextResponse } from 'next/server';

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window counter storage. The in-memory store below is per server
 * instance; a multi-instance deployment should supply a shared store
 * (e.g. Redis) implementing this interface.
 */
export interface RateLimitStore {
  increment(key: string, windowMs: number, now: number): Promise<{ count: number; resetAt: number }>;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, { count: number; resetAt: number }>();

  constructor(private maxKeys = 10_000) {}

  async increment(key: string, windowMs: number, now: number) {
    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (this.buckets.size >= this.maxKeys) this.prune(now);
      bucket = { count: 0, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
    }
    bucket.count += 1;
    return { count: bucket.count, resetAt: bucket.resetAt };
  }

  private prune(now: number) {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
    // Still full of live buckets: drop the oldest insertions rather than grow unbounded.
    const overflow = this.buckets.size - this.maxKeys + 1;
    if (overflow > 0) {
      const keys = this.buckets.keys();
      for (let i = 0; i < overflow; i++) this.buckets.delete(keys.next().value as string);
    }
  }
}

// Runs INCR and PEXPIRE as one atomic step, so two instances racing on the
// same key in the same window can't both start it.
const INCREMENT_SCRIPT =
  "local c = redis.call('INCR', KEYS[1]) " +
  "if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end " +
  "return {c, redis.call('PTTL', KEYS[1])}";

export interface UpstashConfig {
  url: string;
  token: string;
  /** Key prefix, so one database can serve more than one app. */
  prefix?: string;
  fetchImpl?: typeof fetch;
}

/**
 * Shared fixed-window counters in Upstash Redis over its REST API, so every
 * instance enforces the same limits. Uses plain fetch, which works in the
 * Edge middleware runtime without an SDK.
 *
 * A failed call fails open: the request is counted as the first in a fresh
 * window and the error is logged. For a single-operator app a Redis blip
 * should not block all traffic; the limits here guard cost and floods, not
 * access, which the auth checks do.
 */
export class UpstashRateLimitStore implements RateLimitStore {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;
  private readonly prefix: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: UpstashConfig) {
    this.endpoint = config.url.replace(/\/+$/, '');
    this.headers = { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' };
    this.prefix = config.prefix ?? 'rl';
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async increment(key: string, windowMs: number, now: number) {
    try {
      const res = await this.fetchImpl(this.endpoint, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(['EVAL', INCREMENT_SCRIPT, 1, `${this.prefix}:${key}`, String(windowMs)]),
      });
      if (!res.ok) throw new Error(`Upstash responded ${res.status}`);
      const body = (await res.json()) as { result?: unknown; error?: string };
      if (body.error || !Array.isArray(body.result)) throw new Error(body.error ?? 'Upstash returned no result');
      const [count, pttl] = body.result as [number, number];
      // PTTL is -1 only if the key somehow has no expiry; treat it as a fresh window.
      const resetAt = pttl > 0 ? now + pttl : now + windowMs;
      return { count, resetAt };
    } catch (err) {
      console.error('Rate limit store unavailable; allowing request:', (err as Error).message);
      return { count: 1, resetAt: now + windowMs };
    }
  }
}

/**
 * The store the middleware should use: Upstash when configured, otherwise
 * the per-instance memory store. Production without Upstash is logged once,
 * since the limits then only hold per instance.
 */
export function createRateLimitStore(env: Record<string, string | undefined> = process.env): RateLimitStore {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return new UpstashRateLimitStore({ url, token, prefix: env.RATE_LIMIT_PREFIX });
  if (env.NODE_ENV === 'production') {
    console.warn('UPSTASH_REDIS_REST_URL/TOKEN not set; rate limits are per instance only.');
  }
  return new MemoryRateLimitStore();
}

const MINUTE = 60_000;

export const RATE_LIMIT_RULES = {
  // Applied per client IP to every API request, before authentication.
  ip: { limit: 300, windowMs: MINUTE },
  // Applied per authenticated user, by route class.
  ai: { limit: 10, windowMs: MINUTE },
  write: { limit: 60, windowMs: MINUTE },
  read: { limit: 120, windowMs: MINUTE },
} satisfies Record<string, RateLimitRule>;

export type RateLimitTier = 'ai' | 'write' | 'read';

// Routes that invoke an AI provider and cost money per call.
const AI_ROUTES = ['/api/inbox/sort'];

// Health checks, and Stripe webhooks, which retry on 429 and arrive from shared IPs.
const EXEMPT_ROUTES = ['/api/health', '/api/billing/webhook'];

export function isRateLimited(pathname: string): boolean {
  return pathname.startsWith('/api/') && !EXEMPT_ROUTES.includes(pathname);
}

export function resolveTier(pathname: string, method: string): RateLimitTier {
  if (AI_ROUTES.includes(pathname)) return 'ai';
  return method === 'GET' || method === 'HEAD' ? 'read' : 'write';
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function checkRateLimit(
  store: RateLimitStore,
  key: string,
  rule: RateLimitRule,
  now = Date.now()
): Promise<RateLimitResult> {
  const { count, resetAt } = await store.increment(key, rule.windowMs, now);
  return {
    allowed: count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - count),
    resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)),
  };
}

export function applyRateLimitHeaders(response: NextResponse, result: RateLimitResult): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
  return response;
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const response = errorResponse(
    'rate_limited',
    'Too many requests. Please retry later.',
    { retry_after_seconds: result.retryAfterSeconds },
    429
  );
  response.headers.set('Retry-After', String(result.retryAfterSeconds));
  return applyRateLimitHeaders(response, result);
}
