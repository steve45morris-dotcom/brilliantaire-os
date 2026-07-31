import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

function walk(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return full.endsWith('.ts') && !full.endsWith('.test.ts') ? [full] : [];
  });
}

describe('orchestrator/ never uses shell-interpreted execution', () => {
  it('contains no exec(, shell: true, bash -lc, or sh -c anywhere under orchestrator/', () => {
    const files = walk(path.resolve('orchestrator'));
    const offenders: string[] = [];
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf-8');
      if (/\bexec\(/.test(content) || /shell:\s*true/.test(content) || /bash -lc/.test(content) || /\bsh -c\b/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});
