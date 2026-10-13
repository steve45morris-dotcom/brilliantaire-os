// Every script must be able to start under this package's module system.
//
// package.json says "type": "module", so scripts run as ES modules, where the
// CommonJS globals do not exist: `__dirname` and `__filename` are undefined,
// and `require` is not a function. The typecheck does not catch either,
// because @types/node declares them, so a script with one of them in it
// passes CI and then crashes the moment the Safe Command Router runs it.
// Three registered commands did exactly that (October 2026 audit).
//
// This is a static check rather than an import, because most scripts run
// their main() on load and write files.

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFiles(rel));
    else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) out.push(rel);
  }
  return out;
}

const files = [...tsFiles('scripts'), ...tsFiles('tools'), ...tsFiles('config')];

describe('scripts start as ES modules', () => {
  it('covers the script folders', () => {
    expect(files.length).toBeGreaterThan(300);
  });

  it('never reads __dirname or __filename without defining it from import.meta.url', () => {
    const bad = files.filter(f => {
      const src = fs.readFileSync(path.join(root, f), 'utf-8');
      return /\b__(dirname|filename)\b/.test(src) && !/fileURLToPath\(import\.meta\.url\)/.test(src);
    });
    expect(bad).toEqual([]);
  });

  it('never calls require() without createRequire', () => {
    const bad = files.filter(f => {
      const src = fs.readFileSync(path.join(root, f), 'utf-8');
      return /(^|[^.\w])require\(/m.test(src) && !/createRequire/.test(src);
    });
    expect(bad).toEqual([]);
  });
});
