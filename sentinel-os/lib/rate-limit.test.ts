import { describe, it, expect } from "vitest";
import {
  MemoryRateLimitStore,
  checkRateLimit,
  getClientIp,
  isRateLimited,
  rateLimitResponse,
  resolveTier,
} from "./rate-limit";

const rule = { limit: 3, windowMs: 60_000 };

describe("Sentinel OS rate limiting", () => {
  it("allows requests up to the limit and blocks the next", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 1; i <= 3; i++) {
      const result = await checkRateLimit(store, "user:a", rule, 0);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3 - i);
    }

    const blocked = await checkRateLimit(store, "user:a", rule, 15_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(45);
  });

  it("resets once the window elapses and counts keys independently", async () => {
    const store = new MemoryRateLimitStore();
    for (let i = 0; i < 4; i++) await checkRateLimit(store, "user:a", rule, 0);

    expect((await checkRateLimit(store, "user:b", rule, 0)).allowed).toBe(true);
    expect((await checkRateLimit(store, "user:a", rule, 60_000)).remaining).toBe(2);
  });

  it("stays bounded when the key cap is reached", async () => {
    const store = new MemoryRateLimitStore(2);
    await checkRateLimit(store, "a", rule, 0);
    await checkRateLimit(store, "b", rule, 0);
    await checkRateLimit(store, "c", rule, 0);

    // "a" was evicted, so it starts a fresh window.
    expect((await checkRateLimit(store, "a", rule, 0)).remaining).toBe(2);
  });

  it("puts money and provisioning mutations in the sensitive tier", () => {
    expect(resolveTier("/api/mesh/billing", "POST")).toBe("sensitive");
    expect(resolveTier("/api/mesh/settle", "POST")).toBe("sensitive");
    expect(resolveTier("/api/mesh/provision", "POST")).toBe("sensitive");
    expect(resolveTier("/api/mesh/consensus", "POST")).toBe("write");
    expect(resolveTier("/api/mesh/billing", "GET")).toBe("read");
  });

  it("only limits API routes", () => {
    expect(isRateLimited("/api/mesh/billing")).toBe(true);
    expect(isRateLimited("/governance")).toBe(false);
    expect(isRateLimited("/login")).toBe(false);
  });

  it("resolves the client IP from proxy headers", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
    expect(getClientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2");
    expect(getClientIp(new Headers())).toBe("unknown");
  });

  it("returns a 429 in the sentinel response format with retry headers", async () => {
    const response = rateLimitResponse({ allowed: false, limit: 10, remaining: 0, resetAt: 120_000, retryAfterSeconds: 30 });

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(await response.json()).toEqual({ ok: false, error: "Too many requests. Please retry later.", retryAfterSeconds: 30 });
  });
});
