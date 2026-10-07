import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('IcyOS client ↔ token-routes contract', () => {
  const clientSrc = fs.readFileSync(path.join(root, 'tools/icyos-client.ts'), 'utf8');
  const routesSrc = fs.readFileSync(
    path.join(root, 'Knowledge Core/IcyOS/apps/web/src/lib/auth/token-routes.ts'),
    'utf8',
  );

  it('TOKEN_PREFIX in token-routes is icy_', () => {
    expect(routesSrc).toContain("TOKEN_PREFIX = 'icy_'");
  });

  it('client sends Bearer icy_ in Authorization header', () => {
    expect(clientSrc).toContain("'Authorization': `Bearer ${this.token}`");
  });

  it('client calls every token-enabled route', () => {
    const endpoints = [
      '/api/workspace',
      '/api/projects',
      '/api/missions/',
      '/api/actions/complete',
    ];
    for (const ep of endpoints) {
      expect(clientSrc).toContain(ep);
    }
  });

  it('client unwraps the ApiEnvelope.data pattern', () => {
    expect(clientSrc).toContain('envelope.data');
  });
});

describe('pjk-icyos-bridge reads local files', () => {
  it('NEXT_ACTIONS.md exists and has Do Now / Do Next', () => {
    const md = fs.readFileSync(path.join(root, 'NEXT_ACTIONS.md'), 'utf8');
    expect(md).toMatch(/^## Do Now/m);
    expect(md).toMatch(/^## Do Next/m);
  });

  it('SYSTEM_STATUS.md exists and has Current Phase', () => {
    const md = fs.readFileSync(path.join(root, 'SYSTEM_STATUS.md'), 'utf8');
    expect(md).toMatch(/Current Phase:/);
  });
});
