import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// With the app under src/, Next.js only loads src/middleware.ts. A middleware.ts
// next to package.json is silently ignored: from #4 until October 2026 it sat
// there and login, rate limiting, the subscription gate and onboarding never ran.
describe('middleware location', () => {
  it('lives where Next.js loads it', () => {
    expect(existsSync(resolve(__dirname, 'middleware.ts'))).toBe(true);
    expect(existsSync(resolve(__dirname, '../middleware.ts'))).toBe(false);
  });
});
