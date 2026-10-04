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
const AI_ROUTES = ['/api/briefings/generate', '/api/timelines/generate', '/api/timelines/regenerate'];

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
